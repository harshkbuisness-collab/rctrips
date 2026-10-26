@echo off
cd /d "%~dp0"
echo Installing Voice Studio (one time, needs internet, about 2 minutes)...
where py >nul 2>nul
if %errorlevel%==0 (
  py -3.12 -m venv venv 2>nul || py -3.11 -m venv venv 2>nul || py -3 -m venv venv
) else (
  python -m venv venv
)
if not exist venv\Scripts\python.exe (
  echo Python was not found. Install Python 3.12 from https://www.python.org/downloads/
  echo and tick "Add python.exe to PATH". Then run this file again.
  pause
  exit /b 1
)
venv\Scripts\python -m pip install --upgrade pip
venv\Scripts\python -m pip install -r requirements.txt
where ffmpeg >nul 2>nul || winget install -e --id Gyan.FFmpeg
echo.
echo Done! Now double-click 2_START_windows.bat (restart the computer once if ffmpeg was just installed)
pause
