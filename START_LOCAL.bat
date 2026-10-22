@echo off
setlocal
cd /d "%~dp0"
title AI Reel Generator v1.9.3 - Local Mode

echo ==============================================
echo   AI REEL GENERATOR - LOCAL MODE
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First local run: installing packages...
  call npm install
  if errorlevel 1 goto :fail
)

if not exist ".env.local" (
  echo Creating LOCAL-ONLY login settings...
  > ".env.local" echo TOOL_USERNAME=local
  >> ".env.local" echo TOOL_PASSWORD=local
  echo.
  echo Local login created:
  echo   Username: local
  echo   Password: local
  echo These values are only stored in this extracted folder.
  echo.
)

set LOCAL_TOOL_MODE=1
echo Starting local tool at http://127.0.0.1:3000
start "" cmd /c "timeout /t 5 /nobreak ^>nul ^& start http://127.0.0.1:3000"
call npm run dev
exit /b %errorlevel%

:fail
echo.
echo LOCAL START FAILED.
pause
exit /b 1
