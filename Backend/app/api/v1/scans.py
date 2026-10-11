from typing import Any, List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.api.v1.projects import get_user_project
from app.core.config import settings
from app.core.exceptions import http_400_bad_request, http_404_not_found
from app.database import get_db
from app.models import User, Project, Scan, ScanStatus
from app.schemas.scan import ScanResponse, ScanSummary, ScanResults
from app.workers.scan_tasks import process_scan

router = APIRouter()


@router.post("/projects/{project_id}/scans", response_model=ScanResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_scan(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a new scan for a project by uploading a dependency file.
    """
    # Verify project ownership
    project = get_user_project(project_id, current_user, db)
    
    # Validate file
    if not file.filename:
        raise http_400_bad_request("File name is required")
    
    file_extension = "." + file.filename.split(".")[-1] if "." in file.filename else ""
    if file_extension not in settings.allowed_file_extensions:
        raise http_400_bad_request(
            f"File type not supported. Allowed extensions: {', '.join(settings.allowed_file_extensions)}"
        )
    
    # Read file content
    file_content = await file.read()
    if len(file_content) > settings.max_upload_size:
        raise http_400_bad_request(f"File too large. Maximum size: {settings.max_upload_size} bytes")
    
    try:
        content_str = file_content.decode("utf-8")
    except UnicodeDecodeError:
        raise http_400_bad_request("File must be valid UTF-8 text")
    
    # Create scan record
    scan = Scan(
        project_id=project_id,
        status=ScanStatus.QUEUED,
        filename=file.filename,
    )
    
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Queue scan task
    task = process_scan.delay(scan.id, content_str, file.filename)
    
    # Update scan with task ID
    scan.task_id = task.id
    db.commit()
    
    return ScanResponse(
        id=scan.id,
        project_id=scan.project_id,
        status=scan.status,
        filename=scan.filename,
        created_at=scan.created_at.isoformat(),
        started_at=scan.started_at.isoformat() if scan.started_at else None,
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_deps=scan.total_deps,
        direct_deps=scan.direct_deps,
        transitive_deps=scan.transitive_deps,
        outdated_deps=scan.outdated_deps,
        vulnerable_deps=scan.vulnerable_deps,
        critical_vulns=scan.critical_vulns,
        high_vulns=scan.high_vulns,
        medium_vulns=scan.medium_vulns,
        low_vulns=scan.low_vulns,
        error_message=scan.error_message,
        task_id=scan.task_id,
    )


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get scan details.
    """
    # Get scan and verify ownership through project
    scan = db.query(Scan).join(Project).filter(
        Scan.id == scan_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise http_404_not_found("Scan not found")
    
    return ScanResponse(
        id=scan.id,
        project_id=scan.project_id,
        status=scan.status,
        filename=scan.filename,
        created_at=scan.created_at.isoformat(),
        started_at=scan.started_at.isoformat() if scan.started_at else None,
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_deps=scan.total_deps,
        direct_deps=scan.direct_deps,
        transitive_deps=scan.transitive_deps,
        outdated_deps=scan.outdated_deps,
        vulnerable_deps=scan.vulnerable_deps,
        critical_vulns=scan.critical_vulns,
        high_vulns=scan.high_vulns,
        medium_vulns=scan.medium_vulns,
        low_vulns=scan.low_vulns,
        error_message=scan.error_message,
        task_id=scan.task_id,
    )


@router.get("/scans/{scan_id}/results", response_model=ScanResults)
def get_scan_results(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get detailed scan results including dependencies and vulnerabilities.
    """
    # Get scan and verify ownership
    scan = db.query(Scan).join(Project).filter(
        Scan.id == scan_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise http_404_not_found("Scan not found")
    
    # Get scan response
    scan_response = ScanResponse(
        id=scan.id,
        project_id=scan.project_id,
        status=scan.status,
        filename=scan.filename,
        created_at=scan.created_at.isoformat(),
        started_at=scan.started_at.isoformat() if scan.started_at else None,
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_deps=scan.total_deps,
        direct_deps=scan.direct_deps,
        transitive_deps=scan.transitive_deps,
        outdated_deps=scan.outdated_deps,
        vulnerable_deps=scan.vulnerable_deps,
        critical_vulns=scan.critical_vulns,
        high_vulns=scan.high_vulns,
        medium_vulns=scan.medium_vulns,
        low_vulns=scan.low_vulns,
        error_message=scan.error_message,
        task_id=scan.task_id,
    )
    
    # Get dependencies with vulnerabilities and recommendations
    from app.schemas.dependency import DependencyWithVulnerabilities, VulnerabilityResponse, RecommendationResponse
    
    dependencies = []
    for dep in scan.dependencies:
        vulnerabilities = [
            VulnerabilityResponse(
                id=vuln.id,
                advisory_id=vuln.advisory_id,
                ecosystem=vuln.ecosystem,
                package_name=vuln.package_name,
                summary=vuln.summary,
                description=vuln.description,
                severity=vuln.severity,
                affected_versions=vuln.affected_versions,
                fixed_versions=vuln.fixed_versions,
                aliases=vuln.aliases,
                references=vuln.references,
                published_date=vuln.published_date.isoformat() if vuln.published_date else None,
                modified_date=vuln.modified_date.isoformat() if vuln.modified_date else None,
                detected_at=vuln.detected_at.isoformat(),
            )
            for vuln in dep.vulnerabilities
        ]
        
        recommendations = [
            RecommendationResponse(
                id=rec.id,
                recommended_version=rec.recommended_version,
                priority=rec.priority,
                reasoning=rec.reasoning,
                fixes_vulnerabilities=rec.fixes_vulnerabilities,
                vulnerability_count=rec.vulnerability_count,
                is_breaking_change=rec.is_breaking_change,
                evidence=rec.evidence,
                created_at=rec.created_at.isoformat(),
            )
            for rec in dep.recommendations
        ]
        
        dep_with_vulns = DependencyWithVulnerabilities(
            id=dep.id,
            scan_id=dep.scan_id,
            package_name=dep.package_name,
            ecosystem=dep.ecosystem,
            installed_version=dep.installed_version,
            declared_constraint=dep.declared_constraint,
            latest_version=dep.latest_version,
            dependency_type=dep.dependency_type,
            is_outdated=dep.is_outdated,
            created_at=dep.created_at.isoformat(),
            vulnerabilities=vulnerabilities,
            recommendations=recommendations,
        )
        
        dependencies.append(dep_with_vulns)
    
    return ScanResults(
        scan=scan_response,
        dependencies=dependencies,
    )


@router.get("/projects/{project_id}/scans", response_model=List[ScanSummary])
def list_project_scans(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    List all scans for a project.
    """
    # Verify project ownership
    project = get_user_project(project_id, current_user, db)
    
    scans = db.query(Scan).filter(Scan.project_id == project_id).order_by(Scan.created_at.desc()).all()
    
    return [
        ScanSummary(
            id=scan.id,
            status=scan.status,
            created_at=scan.created_at.isoformat(),
            total_deps=scan.total_deps,
            vulnerable_deps=scan.vulnerable_deps,
            critical_vulns=scan.critical_vulns,
            high_vulns=scan.high_vulns,
        )
        for scan in scans
    ]


@router.delete("/scans/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a scan.
    """
    # Get scan and verify ownership
    scan = db.query(Scan).join(Project).filter(
        Scan.id == scan_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise http_404_not_found("Scan not found")
    
    # TODO: Cancel running task if still in progress
    
    db.delete(scan)
    db.commit()