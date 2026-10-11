from typing import Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api.deps import get_current_active_user
from app.core.exceptions import http_404_not_found
from app.database import get_db
from app.models import User, Project, Dependency, Vulnerability
from app.schemas.dependency import (
    DependencyWithVulnerabilities,
    VulnerabilityResponse,
    RecommendationResponse,
    DependencyUpdate,
)

router = APIRouter()


@router.get("/projects/{project_id}/dependencies", response_model=List[DependencyWithVulnerabilities])
def get_project_dependencies(
    project_id: int,
    ecosystem: str = Query(None, description="Filter by ecosystem (npm, pypi, etc.)"),
    outdated_only: bool = Query(False, description="Show only outdated dependencies"),
    vulnerable_only: bool = Query(False, description="Show only vulnerable dependencies"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all dependencies for a project's latest scan.
    """
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise http_404_not_found("Project not found")
    
    # Get the latest completed scan for the project
    from app.models import Scan, ScanStatus
    latest_scan = db.query(Scan).filter(
        Scan.project_id == project_id,
        Scan.status == ScanStatus.COMPLETED
    ).order_by(Scan.completed_at.desc()).first()
    
    if not latest_scan:
        return []
    
    # Build query for dependencies
    query = db.query(Dependency).filter(Dependency.scan_id == latest_scan.id)
    
    if ecosystem:
        query = query.filter(Dependency.ecosystem == ecosystem)
    
    if outdated_only:
        query = query.filter(Dependency.is_outdated == True)
    
    if vulnerable_only:
        # Join with vulnerabilities to filter only vulnerable dependencies
        query = query.join(Vulnerability).distinct()
    
    dependencies = query.all()
    
    # Convert to response format with vulnerabilities and recommendations
    result = []
    for dep in dependencies:
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
        
        result.append(dep_with_vulns)
    
    return result


@router.get("/projects/{project_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
def get_project_vulnerabilities(
    project_id: int,
    severity: str = Query(None, description="Filter by severity (critical, high, medium, low)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all vulnerabilities for a project's latest scan.
    """
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise http_404_not_found("Project not found")
    
    # Get the latest completed scan for the project
    from app.models import Scan, ScanStatus
    latest_scan = db.query(Scan).filter(
        Scan.project_id == project_id,
        Scan.status == ScanStatus.COMPLETED
    ).order_by(Scan.completed_at.desc()).first()
    
    if not latest_scan:
        return []
    
    # Build query for vulnerabilities
    query = db.query(Vulnerability).join(Dependency).filter(
        Dependency.scan_id == latest_scan.id
    )
    
    if severity:
        query = query.filter(Vulnerability.severity == severity.lower())
    
    vulnerabilities = query.order_by(
        Vulnerability.severity.desc(),
        Vulnerability.detected_at.desc()
    ).all()
    
    return [
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
        for vuln in vulnerabilities
    ]


@router.get("/dependencies/{dependency_id}/updates", response_model=List[DependencyUpdate])
def get_dependency_updates(
    dependency_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get update recommendations for a specific dependency.
    """
    # Get dependency and verify ownership through project
    dependency = db.query(Dependency).join(
        Dependency.scan
    ).join(
        Dependency.scan.has(Scan.project)
    ).join(
        Dependency.scan.has(Scan.project.has(Project.owner))
    ).filter(
        Dependency.id == dependency_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not dependency:
        raise http_404_not_found("Dependency not found")
    
    # Get recommendations for this dependency
    recommendations = dependency.recommendations
    
    updates = []
    for rec in recommendations:
        update = DependencyUpdate(
            package_name=dependency.package_name,
            current_version=dependency.installed_version,
            recommended_version=rec.recommended_version,
            priority=rec.priority,
            reasoning=rec.reasoning,
            fixes_vulnerabilities=rec.fixes_vulnerabilities,
        )
        updates.append(update)
    
    return updates


@router.get("/projects/{project_id}/risk-summary")
def get_project_summary(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get project summary with dependency and vulnerability statistics.
    """
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise http_404_not_found("Project not found")
    
    # Get the latest completed scan
    from app.models import Scan, ScanStatus
    latest_scan = db.query(Scan).filter(
        Scan.project_id == project_id,
        Scan.status == ScanStatus.COMPLETED
    ).order_by(Scan.completed_at.desc()).first()
    
    if not latest_scan:
        return {
            "project_id": project_id,
            "project_name": project.name,
            "has_data": False,
            "message": "No completed scans found for this project"
        }
    
    # Count dependencies by ecosystem
    from sqlalchemy import func
    ecosystem_stats = db.query(
        Dependency.ecosystem,
        func.count(Dependency.id).label("count")
    ).filter(
        Dependency.scan_id == latest_scan.id
    ).group_by(Dependency.ecosystem).all()
    
    # Get top vulnerable packages
    vulnerable_packages = db.query(
        Dependency.package_name,
        Dependency.ecosystem,
        func.count(Vulnerability.id).label("vuln_count")
    ).join(Vulnerability).filter(
        Dependency.scan_id == latest_scan.id
    ).group_by(
        Dependency.package_name,
        Dependency.ecosystem
    ).order_by(
        func.count(Vulnerability.id).desc()
    ).limit(10).all()
    
    # Get severity distribution
    severity_stats = db.query(
        Vulnerability.severity,
        func.count(Vulnerability.id).label("count")
    ).join(Dependency).filter(
        Dependency.scan_id == latest_scan.id
    ).group_by(Vulnerability.severity).all()
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "has_data": True,
        "scan_id": latest_scan.id,
        "scan_date": latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
        "total_dependencies": latest_scan.total_deps,
        "direct_dependencies": latest_scan.direct_deps,
        "outdated_dependencies": latest_scan.outdated_deps,
        "vulnerable_dependencies": latest_scan.vulnerable_deps,
        "vulnerability_counts": {
            "critical": latest_scan.critical_vulns,
            "high": latest_scan.high_vulns,
            "medium": latest_scan.medium_vulns,
            "low": latest_scan.low_vulns,
        },
        "ecosystem_breakdown": {stat.ecosystem: stat.count for stat in ecosystem_stats},
        "top_vulnerable_packages": [
            {
                "package_name": pkg.package_name,
                "ecosystem": pkg.ecosystem,
                "vulnerability_count": pkg.vuln_count
            }
            for pkg in vulnerable_packages
        ],
        "severity_distribution": {stat.severity: stat.count for stat in severity_stats},
    }