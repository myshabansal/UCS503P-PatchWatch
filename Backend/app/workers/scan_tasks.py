import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from celery import Task
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import SessionLocal
from app.models import (
    Scan, ScanStatus, Dependency, DependencyType, 
    Vulnerability, Recommendation, RecommendationPriority
)
from app.services.parser import (
    parse_package_json_content, 
    parse_requirements_txt_content,
    ParsedDependency
)
from app.integrations.osv_client import osv_client
from app.integrations.npm_client import NPMClient
from app.integrations.pypi_client import PyPIClient
from app.workers.celery_app import celery_app


class DatabaseTask(Task):
    """Base task that provides database session management."""
    
    def __init__(self):
        self._db = None
    
    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db
    
    def __call__(self, *args, **kwargs):
        try:
            return super().__call__(*args, **kwargs)
        finally:
            if self._db:
                self._db.close()
                self._db = None


@celery_app.task(bind=True, base=DatabaseTask)
def process_scan(self, scan_id: int, file_content: str, filename: str) -> Dict[str, Any]:
    """
    Process a dependency scan asynchronously.
    
    Args:
        scan_id: The scan ID to process
        file_content: Content of the uploaded file
        filename: Name of the uploaded file
    
    Returns:
        Dictionary with scan results
    """
    # Get scan from database
    scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise ValueError(f"Scan {scan_id} not found")
    
    try:
        # Update scan status
        scan.status = ScanStatus.RUNNING
        scan.started_at = datetime.now(timezone.utc)
        scan.task_id = self.request.id
        self.db.commit()
        
        # Parse dependencies based on file type
        if filename and filename.endswith('.json'):
            dependencies = parse_package_json_content(file_content)
        elif filename and (filename.endswith('.txt') or 'requirements' in filename.lower()):
            dependencies = parse_requirements_txt_content(file_content)
        else:
            raise ValueError(f"Unsupported file type: {filename}")
        
        if not dependencies:
            raise ValueError("No dependencies found in the file")
        
        # Process dependencies
        results = []
        
        # Step 1: Get latest versions from registries
        npm_deps = [dep for dep in dependencies if dep.ecosystem == "npm"]
        pypi_deps = [dep for dep in dependencies if dep.ecosystem == "pypi"]
        
        npm_client = NPMClient()
        pypi_client = PyPIClient()
        
        # Get latest versions
        latest_versions = {}
        if npm_deps:
            npm_versions = asyncio.run(npm_client.batch_get_latest_versions([dep.name for dep in npm_deps]))
            latest_versions.update(npm_versions)
        
        if pypi_deps:
            pypi_versions = asyncio.run(pypi_client.batch_get_latest_versions([dep.name for dep in pypi_deps]))
            latest_versions.update(pypi_versions)
        
        # Step 2: Check vulnerabilities
        vuln_check_deps = []
        for dep in dependencies:
            vuln_check_deps.append({
                "name": dep.name,
                "version": dep.resolved_version,
                "ecosystem": dep.ecosystem
            })
        
        vuln_results = asyncio.run(osv_client.batch_check_vulnerabilities(vuln_check_deps))
        
        # Step 3: Create dependency records
        for i, dep in enumerate(dependencies):
            latest_version = latest_versions.get(dep.name)
            vuln_result = vuln_results[i] if i < len(vuln_results) else {}
            
            # Determine if dependency is outdated
            is_outdated = False
            if dep.resolved_version and latest_version:
                try:
                    from app.services.parser import compare_versions
                    is_outdated = compare_versions(dep.resolved_version, latest_version) < 0
                except Exception:
                    is_outdated = dep.resolved_version != latest_version
            
            # Create dependency record
            db_dep = Dependency(
                scan_id=scan_id,
                package_name=dep.name,
                ecosystem=dep.ecosystem,
                installed_version=dep.resolved_version or "unknown",
                declared_constraint=dep.declared_constraint,
                latest_version=latest_version,
                dependency_type=DependencyType.DIRECT if not dep.is_dev else DependencyType.DIRECT,
                is_outdated=is_outdated
            )
            
            self.db.add(db_dep)
            self.db.flush()  # Get the ID
            
            # Process vulnerabilities
            vulnerabilities = vuln_result.get("vulnerabilities", [])
            for vuln in vulnerabilities:
                db_vuln = Vulnerability(
                    dependency_id=db_dep.id,
                    advisory_id=vuln["id"],
                    ecosystem=dep.ecosystem,
                    package_name=dep.name,
                    summary=vuln["summary"],
                    description=vuln.get("description", ""),
                    severity=vuln["severity"].lower(),
                    affected_versions=json.dumps(vuln.get("affected_versions", [])),
                    fixed_versions=json.dumps(vuln.get("fixed_versions", [])),
                    aliases=json.dumps(vuln.get("aliases", [])),
                    references=json.dumps(vuln.get("references", []))
                )
                self.db.add(db_vuln)
            
            # Generate recommendations
            recommendation = generate_recommendation(
                dep, latest_version, vulnerabilities, is_outdated
            )
            
            if recommendation:
                db_rec = Recommendation(
                    dependency_id=db_dep.id,
                    recommended_version=recommendation["version"],
                    priority=recommendation["priority"],
                    reasoning=recommendation["reasoning"],
                    fixes_vulnerabilities=recommendation["fixes_vulnerabilities"],
                    vulnerability_count=len(vulnerabilities),
                    is_breaking_change=recommendation.get("is_breaking_change"),
                    evidence=json.dumps(recommendation.get("evidence", {}))
                )
                self.db.add(db_rec)
            
            results.append({
                "package_name": dep.name,
                "ecosystem": dep.ecosystem,
                "installed_version": dep.resolved_version,
                "latest_version": latest_version,
                "is_outdated": is_outdated,
                "vulnerabilities": len(vulnerabilities),
                "status": vuln_result.get("status", "unknown")
            })
        
        # Update scan summary
        scan.total_deps = len(dependencies)
        scan.direct_deps = len([d for d in dependencies if not d.is_dev])
        scan.transitive_deps = len([d for d in dependencies if d.is_dev])
        scan.outdated_deps = len([r for r in results if r["is_outdated"]])
        
        # Count vulnerabilities by severity
        vulnerability_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        scan.vulnerable_deps = 0
        
        for vuln_result in vuln_results:
            if vuln_result.get("vulnerabilities"):
                scan.vulnerable_deps += 1
                for vuln in vuln_result["vulnerabilities"]:
                    severity = vuln["severity"].lower()
                    if severity in vulnerability_counts:
                        vulnerability_counts[severity] += 1
        
        scan.critical_vulns = vulnerability_counts["critical"]
        scan.high_vulns = vulnerability_counts["high"]
        scan.medium_vulns = vulnerability_counts["medium"]
        scan.low_vulns = vulnerability_counts["low"]
        
        # Mark scan as completed
        scan.status = ScanStatus.COMPLETED
        scan.completed_at = datetime.now(timezone.utc)
        
        self.db.commit()
        
        return {
            "scan_id": scan_id,
            "status": "completed",
            "total_deps": scan.total_deps,
            "vulnerable_deps": scan.vulnerable_deps,
            "critical_vulns": scan.critical_vulns,
            "high_vulns": scan.high_vulns,
            "results": results
        }
        
    except Exception as e:
        # Mark scan as failed
        scan.status = ScanStatus.FAILED
        scan.error_message = str(e)
        scan.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        
        raise self.retry(exc=e, countdown=60, max_retries=3)


def generate_recommendation(
    dep: ParsedDependency,
    latest_version: Optional[str],
    vulnerabilities: List[Dict[str, Any]],
    is_outdated: bool
) -> Optional[Dict[str, Any]]:
    """Generate update recommendation for a dependency."""
    
    if not dep.resolved_version:
        return None
    
    # Determine recommendation priority and version
    has_vulnerabilities = bool(vulnerabilities)
    critical_vulns = [v for v in vulnerabilities if v["severity"].upper() == "CRITICAL"]
    high_vulns = [v for v in vulnerabilities if v["severity"].upper() == "HIGH"]
    
    # Find best fixed version
    fixed_versions = set()
    for vuln in vulnerabilities:
        fixed_versions.update(vuln.get("fixed_versions", []))
    
    if critical_vulns:
        priority = RecommendationPriority.CRITICAL
        recommended_version = latest_version or dep.resolved_version
        reasoning = f"Critical vulnerabilities found. Immediate update required."
    elif high_vulns:
        priority = RecommendationPriority.HIGH
        recommended_version = latest_version or dep.resolved_version
        reasoning = f"High severity vulnerabilities found. Update recommended."
    elif has_vulnerabilities:
        priority = RecommendationPriority.MEDIUM
        recommended_version = latest_version or dep.resolved_version
        reasoning = f"Security vulnerabilities found. Update recommended."
    elif is_outdated and latest_version:
        priority = RecommendationPriority.LOW
        recommended_version = latest_version
        reasoning = f"Package is outdated. Consider updating for latest features and bug fixes."
    else:
        # Up to date and no vulnerabilities
        return None
    
    # Check if update might be breaking
    is_breaking_change = None
    if dep.resolved_version and recommended_version:
        try:
            from packaging import version
            current = version.parse(dep.resolved_version)
            recommended = version.parse(recommended_version)
            is_breaking_change = current.major != recommended.major
        except Exception:
            is_breaking_change = None
    
    return {
        "version": recommended_version,
        "priority": priority,
        "reasoning": reasoning,
        "fixes_vulnerabilities": has_vulnerabilities,
        "is_breaking_change": is_breaking_change,
        "evidence": {
            "vulnerabilities_count": len(vulnerabilities),
            "critical_count": len(critical_vulns),
            "high_count": len(high_vulns),
            "fixed_versions": list(fixed_versions),
            "is_outdated": is_outdated,
        }
    }