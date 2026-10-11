"""Risk scoring and classification helpers used by the dashboard endpoints.

Scores are heuristics (the proposal explicitly says "heuristic-based, not ML"):
each vulnerability adds weight by severity, outdated packages add a little,
and the total is capped at 100.
"""
from typing import Optional

from packaging import version

SEVERITY_WEIGHT = {"critical": 25, "high": 10, "medium": 4, "low": 1, "unknown": 2}
SEVERITY_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1, "unknown": 0}


def risk_category(score: int) -> str:
    if score >= 70:
        return "Critical"
    if score >= 45:
        return "High"
    if score >= 20:
        return "Moderate"
    return "Low"


def scan_risk_score(critical: int, high: int, medium: int, low: int, outdated: int) -> int:
    raw = critical * 25 + high * 10 + medium * 4 + low * 1 + outdated * 0.5
    return int(min(100, round(raw)))


def dependency_risk_score(severities: list[str], is_outdated: bool) -> int:
    raw = sum(SEVERITY_WEIGHT.get(s, 2) for s in severities) + (5 if is_outdated else 0)
    return int(min(100, raw))


def ui_severity(value: str) -> str:
    """Backend uses 'medium'; the frontend badge uses 'moderate'. Unknown -> low."""
    value = (value or "").lower()
    if value == "medium":
        return "moderate"
    if value in ("critical", "high", "low"):
        return value
    return "low"


def update_status(installed: Optional[str], latest: Optional[str], is_outdated: bool) -> str:
    """Classify an available update as patch / minor / major (per the proposal)."""
    if not is_outdated or not installed or not latest:
        return "up-to-date"
    try:
        a, b = version.parse(installed), version.parse(latest)
    except version.InvalidVersion:
        return "patch"
    if b.major > a.major:
        return "major"
    if b.minor > a.minor:
        return "minor"
    return "patch"
