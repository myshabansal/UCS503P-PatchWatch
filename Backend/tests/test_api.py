import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main
from app.database import Base, get_db


@pytest.fixture()
def client(monkeypatch):
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    async def fake_check(deps):
        return [
            {
                "name": d["name"], "version": d["version"], "spec": d["spec"], "dev": d["dev"],
                "status": "vulnerable",
                "vulnerabilities": [{"id": "GHSA-test", "summary": "bad", "severity": "HIGH",
                                     "fixed_versions": ["9.9.9"], "aliases": ["CVE-0000-0001"]}],
            }
            for d in deps
        ]

    monkeypatch.setattr(main, "check_all_dependencies", fake_check)
    main.app.dependency_overrides[get_db] = override_db
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def test_scan_saves_and_lists(client):
    body = b'{"dependencies": {"lodash": "4.17.15"}}'
    r = client.post("/scan", files={"file": ("package.json", body, "application/json")})
    assert r.status_code == 200
    assert r.json()["severity_counts"]["high"] == 1

    assert len(client.get("/scans").json()) == 1
    assert client.get("/scans/1").json()["findings"][0]["fixed_versions"] == ["9.9.9"]
    assert client.get("/stats").json()["vulnerable_deps"] == 1
    assert client.delete("/scans/1").status_code == 200
    assert client.get("/scans/1").status_code == 404


def test_bad_json_rejected(client):
    r = client.post("/scan", files={"file": ("package.json", b"not json", "application/json")})
    assert r.status_code == 400
