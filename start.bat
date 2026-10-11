@echo off
setlocal

echo ============================================
echo   PatchWatch - starting backend + frontend
echo ============================================
echo.

cd /d "%~dp0backend"

if not exist .venv (
    echo [1/4] Creating Python virtual environment...
    python -m venv .venv
) else (
    echo [1/4] Virtual environment already exists, skipping.
)

echo [2/4] Installing backend dependencies...
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo [3/4] Starting backend (FastAPI) on http://localhost:8000 ...
start "PatchWatch Backend" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

cd /d "%~dp0frontend"

if not exist node_modules (
    echo [4/4] Installing frontend dependencies (first run only, takes a minute)...
    call npm install
) else (
    echo [4/4] Frontend dependencies already installed, skipping.
)

echo.
echo Starting frontend (Vite) on http://localhost:5173 ...
start "PatchWatch Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Both servers are starting in new windows.
echo   Give them ~5-10 seconds, then open:
echo   http://localhost:5173
echo ============================================
echo.

timeout /t 6 /nobreak >nul
start http://localhost:5173

pause
