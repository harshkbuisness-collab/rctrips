@echo off
rem Double-click to start Reel Engine on Windows.
cd /d "%~dp0"
where node >nul 2>nul || (echo. & echo Node.js is missing. Install Node.js 20 or newer from https://nodejs.org and run this again. & pause & exit /b 1)
where python >nul 2>nul || (echo. & echo Python is missing. Install Python 3.11 from https://www.python.org - tick "Add python.exe to PATH" - and run this again. & pause & exit /b 1)
if not exist .cache mkdir .cache
rem (re)install when node_modules is missing or an update changed package.json
set NEED_INSTALL=
if not exist node_modules set NEED_INSTALL=1
if not exist .cache\package.json set NEED_INSTALL=1
if exist .cache\package.json fc /b package.json .cache\package.json >nul 2>nul || set NEED_INSTALL=1
if defined NEED_INSTALL (
  echo Installing the tool. This takes a few minutes the first time and after an update...
  call npm install || (echo. & echo npm install failed. Send a screenshot of this window. & pause & exit /b 1)
  copy /y package.json .cache\package.json >nul
)
if not exist .cache\python-ok (
  echo Installing Python helpers...
  python -m pip install --disable-pip-version-check pillow numpy scipy && echo ok> .cache\python-ok
  if not exist .cache\python-ok echo WARNING: Python helpers did not install. Adding images will not work. Send a screenshot of this window.
)
rem voiceover sync (pocketsphinx): any version that has a ready package for this Python (3.9 - 3.13)
if not exist .cache\sync-ok (
  python -m pip install --disable-pip-version-check --only-binary=:all: "pocketsphinx>=5.0.4" && echo ok> .cache\sync-ok
  if not exist .cache\sync-ok echo NOTE: the voiceover sync helper did not install ^(it needs Python 3.9 - 3.13^). AI voices still sync, uploaded voiceovers need an SRT file.
)
if not exist .cache\mediapipe-ok (
  python -m pip install --disable-pip-version-check mediapipe==0.10.14 && echo ok> .cache\mediapipe-ok
  if not exist .cache\mediapipe-ok echo NOTE: mediapipe needs Python 3.9 - 3.12. Without it new images get no body points - everything else works.
)
if not exist .cache\kokoro-ok (
  python -m pip install --disable-pip-version-check kokoro-onnx soundfile && echo ok> .cache\kokoro-ok
  if not exist .cache\kokoro-ok echo NOTE: the AI voice did not install. Uploading your own voiceover still works.
)
rem open the browser only once the tool answers
start "" powershell -NoProfile -WindowStyle Hidden -Command "$t = Get-Date; while (((Get-Date) - $t).TotalMinutes -lt 10) { try { Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/status -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep 2 } }; if (((Get-Date) - $t).TotalMinutes -lt 10) { Start-Process http://localhost:3000 }"
echo Starting Reel Engine... keep this window open while you use the tool.
call npm start
echo.
echo Reel Engine stopped. If you see an error above, send a screenshot of this window.
pause
