# PatchWatch

A software dependency security & health dashboard — upload a `package.json`,
PatchWatch parses its dependencies, checks each one against the
[OSV.dev](https://osv.dev) vulnerability database, and shows you what's
risky.

---

## Run it (Windows)

1. Make sure **Python 3.10+** and **Node.js 18+** are installed (`python --version`, `node --version` in a terminal — if either command isn't found, install from python.org / nodejs.org first).
2. Double-click **`start.bat`** in this folder.
3. Two terminal windows open (backend + frontend) and your browser opens automatically to **http://localhost:5173** after a few seconds.
4. When you're done, close the two terminal windows, or run **`stop.bat`**.

First run takes 1–2 minutes (installing dependencies). Every run after that is a few seconds.

## Run it (Mac/Linux)

```bash
./start.sh     # starts both servers, opens the browser
./stop.sh      # stops both servers
```

---

## Demo script (for presenting)

1. **Register** a new account (this part is UI-only for now — see "What's real" below) → you land on an empty **Projects** page.
2. Click **New project**, name it e.g. `demo-app`, create it → you're taken to the upload page.
3. Drag in **`backend/sample_package.json`** (included in this folder) — it has a couple of deliberately old packages (`lodash@4.17.15`, `minimist@1.2.0`) so the scan actually finds something.
4. Click **Run scan** — this is a *real* network call: your FastAPI backend parses the file and queries the live OSV.dev API for each dependency, right now, not canned data.
5. You land on the **Dashboard**: risk score gauge, severity-coded dependency table, priority fixes, scan-history chart.
6. Click **Rescan** to show it can re-check a project; click **Projects** in the sidebar to show multiple projects tracked at once.

**Have a backup ready:** OSV.dev needs real internet access. Test this tonight on the wifi/network you'll actually present on. If it's blocked, the scan still runs end-to-end and returns a graceful "0 vulnerabilities found" result rather than crashing — mention that your error-handling covers API failures (see `backend/app/services/vuln_checker.py`), which is true either way.

---

## What's real vs. what's mocked

Built by a 3-person team in phases — be upfront about this if asked, it shows you understand your own architecture:

| Feature | Status |
|---|---|
| Upload → parse → OSV.dev scan → store → display | **Real.** Live network call to OSV.dev, real SQLite persistence. |
| Scan history, dependency table, severity badges | **Real data**, driven by the actual scan response. |
| Login / Register / multiple Projects | **Mocked in the browser** (`localStorage`) — the backend doesn't have user accounts or a Projects table yet. This was a deliberate scope call so the frontend team could build ahead of the backend. |
| Risk score (0–100) | Computed **client-side** from the real severity counts — the backend doesn't have a risk-scoring engine yet. |
| License analysis, outdated-version detection, dependency graph | **Not built yet** — shown as "—" rather than faked. |
| `package-lock.json` / `requirements.txt` support | Not built yet — backend currently only parses `package.json`. |

If your teacher asks "is this real or a mockup" — the vulnerability scanning is 100% real and live; the project/user management layer is intentionally stubbed for this milestone.

---

## Architecture (for Q&A)

```
frontend/   React + Vite + TypeScript + Tailwind, talks to the backend via Axios
backend/    FastAPI + SQLAlchemy + SQLite, queries OSV.dev for vulnerability data
```

- `backend/app/main.py` — API routes (`/scan`, `/scans`, `/stats`, `/health`)
- `backend/app/services/parser.py` — turns `package.json` into a dependency list
- `backend/app/services/vuln_checker.py` — queries OSV.dev concurrently, normalizes severities
- `backend/app/models.py` — `Scan` and `Finding` SQLAlchemy models
- `frontend/src/utils/mapScanToDashboard.ts` — maps a real scan response onto the dashboard UI
- `frontend/src/services/scanApi.ts` — the real API calls
- `frontend/src/services/mockData.ts` / `authService.ts` — the mocked layers, clearly commented as such

---

## Troubleshooting

- **"Port already in use"** → run `stop.bat` (or `stop.sh`) first, then `start.bat` again.
- **Scan returns 0 vulnerabilities for everything** → either the packages really are clean, or OSV.dev isn't reachable (check internet / firewall). The backend terminal window will show the real error if the OSV call failed.
- **Blank page at localhost:5173** → the frontend terminal window is still installing dependencies on first run; wait for "ready in Xms" to appear, then refresh.
- **Backend terminal shows an import error** → re-run `start.bat`; it reinstalls dependencies into `backend/.venv` every time, so a half-finished install usually self-heals on a second run.
