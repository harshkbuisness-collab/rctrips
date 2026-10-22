@echo off
setlocal
cd /d "%~dp0"
title AI Reel Generator v1.9.3 - Deploy to Vercel Production

echo ==============================================
echo   AI REEL GENERATOR - VERCEL PRODUCTION
echo ==============================================
echo.
echo This deploys the CURRENT folder to the Vercel
echo project linked to this folder.
echo.

where vercel >nul 2>nul
if errorlevel 1 (
  echo Vercel CLI is not installed. Installing it once...
  call npm install -g vercel
  if errorlevel 1 goto :fail
)

if not exist ".vercel\project.json" (
  echo.
  echo This folder is not linked to a Vercel project yet.
  echo Select your EXISTING Vercel project in the next step.
  echo Do NOT create a new project unless you actually want one.
  echo.
  call vercel link
  if errorlevel 1 goto :fail
)

echo.
echo Running exactly:
echo   vercel --prod --force
echo.
call vercel --prod --force
if errorlevel 1 goto :fail

echo.
echo ==============================================
echo   PRODUCTION DEPLOYMENT FINISHED
echo ==============================================
echo.
echo The existing linked Vercel project has been updated.
echo No project name is hard-coded in this launcher.
echo.
pause
exit /b 0

:fail
echo.
echo ==============================================
echo   DEPLOYMENT FAILED
echo ==============================================
echo.
echo Your previous live deployment remains available.
echo Read the Vercel error above and try again.
echo.
pause
exit /b 1
