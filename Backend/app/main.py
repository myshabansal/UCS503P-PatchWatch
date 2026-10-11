from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import PatchWatchException
from app.database import Base, engine

# Import API routers
from app.api.v1 import auth, projects, scans, dependencies, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Create database tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="PatchWatch API",
    description="Software Dependency Risk Dashboard - Monitor dependencies, detect vulnerabilities, and get actionable update recommendations",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(PatchWatchException)
async def patchwatch_exception_handler(request, exc: PatchWatchException):
    """Handle custom PatchWatch exceptions."""
    return JSONResponse(
        status_code=400,
        content={
            "detail": exc.message,
            "type": exc.__class__.__name__,
            "context": exc.details
        }
    )


@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    """Handle ValueError exceptions."""
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


# Health check endpoints
@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "PatchWatch API is running",
        "version": "2.0.0",
        "docs_url": "/docs",
        "status": "healthy"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "database": "connected"
    }


@app.get("/health/db")
def health_db():
    """Database connectivity check (used by the frontend status pill)."""
    from sqlalchemy import text
    from app.database import engine
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:  # noqa: BLE001
        return {"status": "error", "database": "unreachable", "detail": str(e)}


# API v1 routes
API_V1_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(projects.router, prefix=f"{API_V1_PREFIX}/projects", tags=["Projects"])
app.include_router(scans.router, prefix=f"{API_V1_PREFIX}", tags=["Scans"])
app.include_router(dashboard.router, prefix=f"{API_V1_PREFIX}", tags=["Dashboard"])
app.include_router(dependencies.router, prefix=f"{API_V1_PREFIX}", tags=["Dependencies", "Vulnerabilities"])


# Legacy endpoints for backward compatibility
@app.get("/api/scan")
def legacy_scan_sample():
    """Legacy endpoint - redirects to new API structure."""
    raise HTTPException(
        status_code=301,
        detail="This endpoint has moved. Please use the new project-based API at /api/v1/projects/{project_id}/scans"
    )


@app.post("/scan")
def legacy_scan_upload():
    """Legacy endpoint - redirects to new API structure."""
    raise HTTPException(
        status_code=301,
        detail="This endpoint has moved. Please use the new project-based API at /api/v1/projects/{project_id}/scans"
    )


@app.get("/scans")
def legacy_list_scans():
    """Legacy endpoint - redirects to new API structure."""
    raise HTTPException(
        status_code=301,
        detail="This endpoint has moved. Please use the new project-based API at /api/v1/projects/{project_id}/scans"
    )


@app.get("/stats")
def legacy_stats():
    """Legacy endpoint - redirects to new API structure."""
    raise HTTPException(
        status_code=301,
        detail="This endpoint has moved. Please use the new project-based API at /api/v1/projects/{project_id}/summary"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
