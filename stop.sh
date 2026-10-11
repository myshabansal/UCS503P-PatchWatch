#!/usr/bin/env bash
# Stops the servers started by start.sh
for f in /tmp/patchwatch-backend.pid /tmp/patchwatch-frontend.pid; do
    if [ -f "$f" ]; then
        pid="$(cat "$f")"
        if kill "$pid" 2>/dev/null; then
            echo "Stopped process $pid ($f)"
        fi
        rm -f "$f"
    fi
done

# npm/vite spawn child processes that can outlive the PID above — clean those
# up by pattern too, so a re-run of start.sh doesn't hit "port already in use".
pkill -f "uvicorn app.main:app" 2>/dev/null && echo "Stopped lingering backend process(es)"
pkill -f "vite --port 5173" 2>/dev/null && echo "Stopped lingering frontend process(es)"

echo "Done."
