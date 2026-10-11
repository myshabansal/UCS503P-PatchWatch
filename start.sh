#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "  PatchWatch - starting backend + frontend"
echo "============================================"
echo

cd "$DIR/backend"
if [ ! -d .venv ]; then
    echo "[1/4] Creating Python virtual environment..."
    python3 -m venv .venv
else
    echo "[1/4] Virtual environment already exists, skipping."
fi

echo "[2/4] Installing backend dependencies..."
source .venv/bin/activate
pip install -q -r requirements.txt

echo "[3/4] Starting backend (FastAPI) on http://localhost:8000 ..."
rm -f patchwatch.db.lock 2>/dev/null || true
nohup uvicorn app.main:app --reload --port 8000 > /tmp/patchwatch-backend.log 2>&1 &
BACKEND_PID=$!
disown
echo "$BACKEND_PID" > /tmp/patchwatch-backend.pid

cd "$DIR/frontend"
if [ ! -d node_modules ]; then
    echo "[4/4] Installing frontend dependencies (first run only, takes a minute)..."
    npm install
else
    echo "[4/4] Frontend dependencies already installed, skipping."
fi

echo
echo "Starting frontend (Vite) on http://localhost:5173 ..."
nohup npm run dev -- --port 5173 > /tmp/patchwatch-frontend.log 2>&1 &
FRONTEND_PID=$!
disown
echo "$FRONTEND_PID" > /tmp/patchwatch-frontend.pid

echo
echo "============================================"
echo "  Both servers are starting."
echo "  Backend log:  /tmp/patchwatch-backend.log"
echo "  Frontend log: /tmp/patchwatch-frontend.log"
echo "  Open: http://localhost:5173"
echo "  Run ./stop.sh to stop both."
echo "============================================"

sleep 5
if command -v open >/dev/null 2>&1; then
    open http://localhost:5173
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:5173
fi
