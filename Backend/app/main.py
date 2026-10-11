import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Finding, Scan
from app.services.parser import parse_package_json, parse_package_json_content
from app.services.vuln_checker import check_all_dependencies

BASE_DIR = Path(__file__).resolve().parent.parent  # the backend/ folder
SAMPLE_FILE = BASE_DIR / "sample_package.json"
MAX_UPLOAD_BYTES = 1_000_000


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # creates tables on first run
    yield


app = FastAPI(
    title="PatchWatch API",
    description="Software Dependency Risk Dashboard",
    version="0.2.0",
    lifespan=lifespan,
)

# Lets the HTML/JS frontend (opened from file:// or another port) call this API.
# Fine for development; restrict origins before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def serialize_scan(scan: Scan, include_findings: bool = True) -> dict:
    data = {
        "id": scan.id,
        "filename": scan.filename,
        "created_at": scan.created_at.isoformat(),
        "total_deps": scan.total_deps,
        "skipped_deps": scan.skipped_deps,
        "vulnerable_deps": scan.vulnerable_deps,
        "severity_counts": {
            "critical": scan.critical,
            "high": scan.high,
            "medium": scan.medium,
            "low": scan.low,
        },
    }
    if include_findings:
        data["findings"] = [
            {
                "package": f.package,
                "version": f.version,
                "id": f.vuln_id,
                "summary": f.summary,
                "severity": f.severity,
                "fixed_versions": [v for v in f.fixed_versions.split(",") if v],
                "aliases": [a for a in f.aliases.split(",") if a],
            }
            for f in scan.findings
        ]
    return data


@app.get("/")
def root():
    return {"message": "PatchWatch API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/scan")
def scan_sample():
    """Parser-only sanity check using the bundled sample_package.json."""
    try:
        dependencies = parse_package_json(str(SAMPLE_FILE))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="sample_package.json not found")
    return {"count": len(dependencies), "dependencies": dependencies}


@app.post("/scan")
async def scan_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload package.json -> parse -> check OSV.dev -> save to DB -> return result."""
    if not (file.filename or "").endswith(".json"):
        raise HTTPException(status_code=400, detail="File must be a .json file")

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 1 MB)")

    try:
        dependencies = parse_package_json_content(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid package.json")

    results = await check_all_dependencies(dependencies)

    scan = Scan(
        filename=file.filename, total_deps=len(results),
        skipped_deps=0, vulnerable_deps=0, critical=0, high=0, medium=0, low=0,
    )
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for r in results:
        if r["status"] == "skipped":
            scan.skipped_deps += 1
        if r["status"] == "vulnerable":
            scan.vulnerable_deps += 1
        for v in r["vulnerabilities"]:
            if v["severity"] in counts:
                counts[v["severity"]] += 1
            scan.findings.append(
                Finding(
                    package=r["name"],
                    version=r["version"],
                    vuln_id=v["id"],
                    summary=v["summary"],
                    severity=v["severity"],
                    fixed_versions=",".join(v["fixed_versions"]),
                    aliases=",".join(v["aliases"]),
                )
            )

    scan.critical, scan.high = counts["CRITICAL"], counts["HIGH"]
    scan.medium, scan.low = counts["MEDIUM"], counts["LOW"]

    db.add(scan)
    db.commit()
    db.refresh(scan)

    out = serialize_scan(scan)
    out["errors"] = [
        {"package": r["name"], "error": r["error"]}
        for r in results
        if r["status"] in ("error", "skipped")
    ]
    return out


@app.get("/scans")
def list_scans(db: Session = Depends(get_db)):
    scans = db.scalars(select(Scan).order_by(Scan.id.desc())).all()
    return [serialize_scan(s, include_findings=False) for s in scans]


@app.get("/scans/{scan_id}")
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return serialize_scan(scan)


@app.delete("/scans/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(scan)
    db.commit()
    return {"deleted": scan_id}


@app.get("/stats")
def stats(db: Session = Depends(get_db)):
    """Numbers for the dashboard cards, taken from the latest scan."""
    latest = db.scalars(select(Scan).order_by(Scan.id.desc())).first()
    if not latest:
        return {"has_data": False}
    return {"has_data": True, **serialize_scan(latest, include_findings=False)}
