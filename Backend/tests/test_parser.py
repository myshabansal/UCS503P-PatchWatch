from app.services.parser import clean_version, parse_package_json_content


def test_clean_version():
    assert clean_version("^4.17.15") == "4.17.15"
    assert clean_version("~1.2") == "1.2.0"
    assert clean_version(">=2") == "2.0.0"
    assert clean_version("*") is None
    assert clean_version("latest") is None
    assert clean_version("git+https://github.com/x/y.git") is None


def test_parse_includes_dev():
    deps = parse_package_json_content(
        '{"dependencies": {"a": "^1.0.0"}, "devDependencies": {"b": "2.0.0"}}'
    )
    assert {d["name"] for d in deps} == {"a", "b"}
    assert next(d for d in deps if d["name"] == "b")["dev"] is True
