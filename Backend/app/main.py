from fastapi import FastAPI, HTTPException, UploadFile, File
import json
import tempfile

from app.services.parser import parse_package_json
from app.services.vuln_checker import check_all_dependencies

app = FastAPI(
    title="PatchWatch API",
    description="Software Dependency Risk Dashboard",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "PatchWatch API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/api/scan")
def scan_sample():
    """
    Quick test endpoint: parses the bundled sample_package.json
    (no vulnerability check, just parsing) — useful for verifying
    parser.py works.
    """
    try:
        dependencies = parse_package_json("sample_package.json")
        return {
            "count": len(dependencies),
            "dependencies": dependencies
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="sample_package.json not found")


@app.post("/scan")
async def scan_upload(file: UploadFile = File(...)):
    """
    Real scan endpoint: accepts an uploaded package.json,
    parses dependencies, and checks each against OSV.dev
    for known vulnerabilities.
    """
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="File must be a .json file")

    content = await file.read()

    try:
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".json", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        dependencies = parse_package_json(tmp_path)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    results = await check_all_dependencies(dependencies)
    total_vulnerable = sum(1 for r in results if r.get("vulnerable"))

    return {
        "total_dependencies": len(dependencies),
        "vulnerable_count": total_vulnerable,
        "results": results
    }
