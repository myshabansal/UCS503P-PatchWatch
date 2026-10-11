"""Dashboard endpoints.

These return JSON in exactly the shape the React frontend's TypeScript types
expect (camelCase, string ids), so the pages need no changes beyond swapping
the mock service for these calls.
"""
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.api.v1.projects import get_user_project
from app.database import get_db
from app.models import Project, Scan, ScanStatus, User
from app.services.risk import (
    SEVERITY_RANK,
    dependency_risk_score,
    risk_category,
    scan_risk_score,
    ui_severity,
    update_status,
)

router = APIRouter()


def _enum(v: Any) -> str:
    return v.value if hasattr(v, "value") else str(v)


def _scan_score(scan: Scan) -> int:
    return scan_risk_score(
        scan.critical_vulns, scan.high_vulns, scan.medium_vulns, scan.low_vulns, scan.outdated_deps
    )


def _latest_completed(db: Session, project_id: int):
    return (
        db.query(Scan)
        .filter(Scan.project_id == project_id, Scan.status == ScanStatus.COMPLETED)
        .order_by(Scan.id.desc())
        .first()
    )


def _project_card(db: Session, project: Project) -> dict:
    scan = _latest_completed(db, project.id)
    score = _scan_score(scan) if scan else 0
    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "riskScore": score,
        "riskCategory": risk_category(score),
        "lastScanAt": (scan.completed_at or scan.created_at).isoformat() if scan else None,
    }


@router.get("/dashboard/projects")
def dashboard_projects(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
) -> Any:
    projects = (
        db.query(Project).filter(Project.owner_id == current_user.id).order_by(Project.id.desc()).all()
    )
    return [_project_card(db, p) for p in projects]


@router.get("/dashboard/projects/{project_id}")
def dashboard_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    project = get_user_project(project_id, current_user, db)
    card = _project_card(db, project)
    scan = _latest_completed(db, project_id)

    dependencies, fixes = [], []
    summary = {
        "totalDependencies": 0,
        "vulnerableDependencies": 0,
        "criticalCount": 0,
        "highCount": 0,
        "outdatedCount": 0,
        "licenseWarnings": 0,  # license data is not collected yet
    }

    if scan:
        summary.update(
            totalDependencies=scan.total_deps,
            vulnerableDependencies=scan.vulnerable_deps,
            criticalCount=scan.critical_vulns,
            highCount=scan.high_vulns,
            outdatedCount=scan.outdated_deps,
        )
        for dep in scan.dependencies:
            sevs = [_enum(v.severity) for v in dep.vulnerabilities]
            top = max(sevs, key=lambda s: SEVERITY_RANK.get(s, 0)) if sevs else None
            dependencies.append(
                {
                    "id": str(dep.id),
                    "name": dep.package_name,
                    "version": dep.installed_version,
                    "latestVersion": dep.latest_version,
                    "ecosystem": dep.ecosystem,
                    "status": update_status(dep.installed_version, dep.latest_version, dep.is_outdated),
                    "vulnerabilityCount": len(sevs),
                    "highestSeverity": ui_severity(top) if top else None,
                    "license": "Unknown",
                    "licenseStatus": "unknown",
                    "riskScore": dependency_risk_score(sevs, dep.is_outdated),
                }
            )
            for rec in dep.recommendations:
                prio = _enum(rec.priority)
                if prio in ("critical", "high", "medium"):
                    fixes.append((SEVERITY_RANK[prio], dep.package_name, rec, prio))
        dependencies.sort(key=lambda d: d["riskScore"], reverse=True)

    fixes.sort(key=lambda t: t[0], reverse=True)
    priority_fixes = [
        {
            "id": f"fix-{rec.id}",
            "dependencyName": name,
            "reason": f"{rec.reasoning} Update to {rec.recommended_version}.",
            "severity": ui_severity(prio),
        }
        for _, name, rec, prio in fixes[:5]
    ]

    history_scans = (
        db.query(Scan)
        .filter(Scan.project_id == project_id, Scan.status == ScanStatus.COMPLETED)
        .order_by(Scan.id.asc())
        .all()
    )
    scan_history = [
        {
            "scanNumber": i + 1,
            "date": (s.completed_at or s.created_at).date().isoformat(),
            "riskScore": _scan_score(s),
        }
        for i, s in enumerate(history_scans)
    ]

    return {
        "project": card,
        "summary": summary,
        "priorityFixes": priority_fixes,
        "dependencies": dependencies,
        "scanHistory": scan_history,
    }
