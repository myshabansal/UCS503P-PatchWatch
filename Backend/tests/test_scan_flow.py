"""End-to-end scan flow with the network mocked (OSV + npm) and Celery run inline."""
import io

import pytest

from app.workers import scan_tasks
from app.workers.celery_app import celery_app

PKG = b'{"dependencies": {"lodash": "4.17.15", "express": "^4.18.0"}, "devDependencies": {"jest": "27.0.6"}}'


@pytest.fixture(autouse=True)
def eager_celery_and_fake_network(monkeypatch):
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

    async def fake_latest(self, names):
        return {"lodash": "4.17.21", "express": "4.18.0", "jest": "29.7.0"}

    async def fake_osv(deps, max_concurrent=None):
        out = []
        for d in deps:
            vulns = []
            if d["name"] == "lodash":
                vulns = [{
                    "id": "GHSA-test-1", "summary": "Prototype pollution", "description": "",
                    "severity": "CRITICAL", "fixed_versions": ["4.17.21"],
                    "affected_versions": [], "aliases": ["CVE-2021-0001"], "references": [],
                }]
            out.append({"name": d["name"], "version": d["version"], "ecosystem": "npm",
                        "status": "vulnerable" if vulns else "safe",
                        "vulnerabilities": vulns, "error": None})
        return out

    # In production the task runs in a separate Celery worker process. Here we run it
    # inline in a thread, because asyncio.run() inside the task can't nest in the API's loop.
    from concurrent.futures import ThreadPoolExecutor
    from types import SimpleNamespace

    def run_inline(scan_id, content, filename):
        with ThreadPoolExecutor(1) as ex:
            res = ex.submit(lambda: scan_tasks.process_scan.apply(args=(scan_id, content, filename))).result()
        res.get()  # re-raise task errors
        return SimpleNamespace(id="inline-task")

    monkeypatch.setattr("app.api.v1.scans.process_scan.delay", run_inline)
    monkeypatch.setattr(scan_tasks.NPMClient, "batch_get_latest_versions", fake_latest)
    monkeypatch.setattr(scan_tasks.osv_client, "batch_check_vulnerabilities", fake_osv)
    yield
    celery_app.conf.task_always_eager = False


def test_full_scan_and_dashboard(client, auth_headers):
    pid = client.post("/api/v1/projects/", json={"name": "demo"}, headers=auth_headers).json()["id"]

    r = client.post(
        f"/api/v1/projects/{pid}/scans",
        files={"file": ("package.json", io.BytesIO(PKG), "application/json")},
        headers=auth_headers,
    )
    assert r.status_code == 202, r.text
    scan_id = r.json()["id"]

    scan = client.get(f"/api/v1/scans/{scan_id}", headers=auth_headers).json()
    assert scan["status"] == "completed", scan
    assert scan["total_deps"] == 3 and scan["critical_vulns"] == 1

    results = client.get(f"/api/v1/scans/{scan_id}/results", headers=auth_headers)
    assert results.status_code == 200, results.text

    dash = client.get(f"/api/v1/dashboard/projects/{pid}", headers=auth_headers).json()
    assert dash["summary"]["criticalCount"] == 1
    assert dash["dependencies"][0]["name"] == "lodash"
    assert dash["dependencies"][0]["highestSeverity"] == "critical"
    assert dash["priorityFixes"][0]["dependencyName"] == "lodash"
    assert dash["project"]["riskCategory"] in ("Moderate", "High", "Critical")
    assert len(dash["scanHistory"]) == 1

    cards = client.get("/api/v1/dashboard/projects", headers=auth_headers).json()
    assert cards[0]["id"] == str(pid)


def test_project_without_scans_is_empty(client, auth_headers):
    pid = client.post("/api/v1/projects/", json={"name": "empty"}, headers=auth_headers).json()["id"]
    dash = client.get(f"/api/v1/dashboard/projects/{pid}", headers=auth_headers).json()
    assert dash["dependencies"] == [] and dash["project"]["lastScanAt"] is None
