@echo off
echo Stopping PatchWatch servers...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping backend (PID %%p)...
    taskkill /F /PID %%p >nul 2>&1
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Stopping frontend (PID %%p)...
    taskkill /F /PID %%p >nul 2>&1
)

echo Done. You can close the backend/frontend terminal windows too.
pause
