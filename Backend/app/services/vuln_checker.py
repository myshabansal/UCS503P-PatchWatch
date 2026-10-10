import asyncio

import httpx

OSV_API_URL = "https://api.osv.dev/v1/query"
SEVERITY_ORDER = ["UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
MAX_CONCURRENT = 10


def _severity(vuln: dict) -> str:
    """GitHub advisories carry a plain label in database_specific.severity."""
    label = str(vuln.get("database_specific", {}).get("severity", "")).upper()
    if label == "MODERATE":
        label = "MEDIUM"
    return label if label in SEVERITY_ORDER else "UNKNOWN"


def _fixed_versions(vuln: dict, package: str) -> list[str]:
    fixed = set()
    for affected in vuln.get("affected", []):
        if affected.get("package", {}).get("name") != package:
            continue
        for rng in affected.get("ranges", []):
            for event in rng.get("events", []):
                if "fixed" in event:
                    fixed.add(event["fixed"])
    return sorted(fixed)


async def _check_one(client: httpx.AsyncClient, sem: asyncio.Semaphore, dep: dict) -> dict:
    name, version = dep["name"], dep["version"]
    base = {"name": name, "version": version, "spec": dep.get("spec"), "dev": dep.get("dev", False)}

    if not version:
        return {**base, "status": "skipped", "vulnerabilities": [],
                "error": "Version could not be resolved (e.g. '*', 'latest', git URL)"}

    payload = {"version": version, "package": {"name": name, "ecosystem": "npm"}}
    async with sem:
        try:
            resp = await client.post(OSV_API_URL, json=payload)
            resp.raise_for_status()
            vulns = resp.json().get("vulns", [])
        except httpx.HTTPError as e:
            return {**base, "status": "error", "vulnerabilities": [],
                    "error": f"OSV query failed: {e}"}

    findings = [
        {
            "id": v.get("id"),
            "summary": v.get("summary") or "No summary available",
            "severity": _severity(v),
            "fixed_versions": _fixed_versions(v, name),
            "aliases": v.get("aliases", []),
        }
        for v in vulns
    ]
    return {**base, "status": "vulnerable" if findings else "ok", "vulnerabilities": findings}


async def check_all_dependencies(dependencies: list[dict]) -> list[dict]:
    """Check every dependency against OSV.dev concurrently."""
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    async with httpx.AsyncClient(timeout=15.0) as client:
        return await asyncio.gather(*(_check_one(client, sem, d) for d in dependencies))
