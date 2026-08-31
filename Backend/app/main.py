from fastapi import FastAPI

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
