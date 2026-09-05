from fastapi import FastAPI, HTTPException
from app.services.parser import parse_package_json

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
def scan():
    try:
        dependencies = parse_package_json("sample_package.json")
        return {
            "count": len(dependencies),
            "dependencies": dependencies
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="sample_package.json not found")
