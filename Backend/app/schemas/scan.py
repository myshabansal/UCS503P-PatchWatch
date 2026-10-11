from typing import Optional, List
from pydantic import BaseModel

from app.models import ScanStatus
from app.schemas.dependency import DependencyWithVulnerabilities


class ScanCreate(BaseModel):
    filename: Optional[str] = None


class ScanResponse(BaseModel):
    id: int
    project_id: int
    status: ScanStatus
    filename: Optional[str]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    total_deps: int
    direct_deps: int
    transitive_deps: int
    outdated_deps: int
    vulnerable_deps: int
    critical_vulns: int
    high_vulns: int
    medium_vulns: int
    low_vulns: int
    error_message: Optional[str]
    task_id: Optional[str]
    
    class Config:
        from_attributes = True


class ScanSummary(BaseModel):
    id: int
    status: ScanStatus
    created_at: str
    total_deps: int
    vulnerable_deps: int
    critical_vulns: int
    high_vulns: int
    
    class Config:
        from_attributes = True


class ScanResults(BaseModel):
    scan: ScanResponse
    dependencies: List[DependencyWithVulnerabilities]
    
    class Config:
        from_attributes = True