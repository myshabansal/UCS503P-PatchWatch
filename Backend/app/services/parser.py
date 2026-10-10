import json
import re

DEP_SECTIONS = {"dependencies": False, "devDependencies": True}  # section -> is_dev
_VERSION_RE = re.compile(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?(-[0-9A-Za-z.\-]+)?")


def clean_version(spec: str) -> str | None:
    """
    Turn an npm version spec into one concrete version OSV can look up.
    '^4.17.15' -> '4.17.15', '~1.2' -> '1.2.0', '*' / 'latest' / git urls -> None.
    Note: for ranges this is the *minimum* version the range allows, which is
    a reasonable approximation without a lockfile.
    """
    if not isinstance(spec, str):
        return None
    if spec.startswith(("git", "http", "file:", "link:", "workspace:")):
        return None
    m = _VERSION_RE.search(spec)
    if not m:
        return None
    major, minor, patch, pre = m.groups()
    return f"{major}.{minor or 0}.{patch or 0}{pre or ''}"


def parse_package_json_content(text: str) -> list[dict]:
    """Parse package.json text. Raises json.JSONDecodeError on bad JSON."""
    data = json.loads(text)
    if not isinstance(data, dict):
        raise json.JSONDecodeError("package.json must be an object", text, 0)

    deps = []
    for section, is_dev in DEP_SECTIONS.items():
        for name, spec in (data.get(section) or {}).items():
            deps.append(
                {
                    "name": name,
                    "spec": spec,                  # raw, e.g. "^4.16.0"
                    "version": clean_version(spec),  # usable, or None
                    "dev": is_dev,
                }
            )
    return deps


def parse_package_json(path: str) -> list[dict]:
    """Parse a package.json file on disk. Raises FileNotFoundError if missing."""
    with open(path, "r", encoding="utf-8") as f:
        return parse_package_json_content(f.read())
