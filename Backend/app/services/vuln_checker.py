import httpx

OSV_API_URL = "https://api.osv.dev/v1/query"


async def check_package_vulnerabilities(name: str, version: str) -> dict:
    """
    Query OSV.dev for known vulnerabilities affecting a specific
    npm package version. Returns a dict summarizing findings.
    """
    payload = {
        "version": version,
        "package": {
            "name": name,
            "ecosystem": "npm"
        }
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(OSV_API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as e:
            return {
                "name": name,
                "version": version,
                "error": f"Failed to query OSV: {str(e)}",
                "vulnerabilities": []
            }

    vulns = data.get("vulns", [])

    findings = []
    for v in vulns:
        findings.append({
            "id": v.get("id"),
            "summary": v.get("summary", "No summary available"),
            "severity": v.get("severity", []),
            "aliases": v.get("aliases", [])
        })

    return {
        "name": name,
        "version": version,
        "vulnerable": len(findings) > 0,
        "vulnerabilities": findings
    }


async def check_all_dependencies(dependencies: list[dict]) -> list[dict]:
    """
    Takes the list of {name, version} dicts from parse_package_json
    and checks each one against OSV.dev.
    """
    results = []
    for dep in dependencies:
        result = await check_package_vulnerabilities(dep["name"], dep["version"])
        results.append(result)
    return results
