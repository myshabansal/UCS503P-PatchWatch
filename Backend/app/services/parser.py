import json


def parse_package_json(file_path: str):
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    dependencies = data.get("dependencies", {})

    result = []

    for name, version in dependencies.items():
        result.append({
            "name": name,
            "version": version
        })

    return result
