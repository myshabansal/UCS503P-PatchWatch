# PatchWatch backend

## What's here

A working vulnerability-scan slice, built by the backend team:

- `POST /scan` — upload `package.json`, parses dependencies, queries [OSV.dev](https://osv.dev)
  for each one, stores the scan + findings in SQLite, returns the result
- `GET /scans` / `GET /scans/{id}` / `DELETE /scans/{id}` — scan history
- `GET /stats` — latest scan's summary numbers
- `GET /health` — liveness check

**Not built yet** (the frontend currently mocks these):
- Auth (no `/auth/register` or `/auth/login`)
- Projects (every scan is global — not tied to a user or project)
- `package-lock.json` / `requirements.txt` parsing (only `package.json`)
- License analysis, outdated-version detection, the 0–100 risk score, dependency graph

## Run it

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then open `http://localhost:8000/docs` for the interactive API docs, or
`http://localhost:8000/health` for a quick check.

Data is stored in `backend/patchwatch.db` (SQLite — created automatically on
first run). Delete that file to reset.

## Test

```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

## Try a scan manually

```bash
curl -X POST http://localhost:8000/scan -F "file=@sample_package.json"
```

This queries the real OSV.dev API over the network, so it needs outbound
internet access to return real vulnerability findings.
