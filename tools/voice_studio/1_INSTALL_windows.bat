@echo off
cd /d "%~dp0"
echo Installing Voice Studio (one time, needs internet, about 10 minutes)...
where py >nul 2>nul
if %errorlevel%==0 (
  py -3.11 -m venv venv 2>nul || py -3.12 -m venv venv 2>nul || py -3 -m venv venv
) else (
  python -m venv venv
)
if not exist venv\Scripts\python.exe (
  echo.
  echo Python was not found. Install Python 3.11 from https://www.python.org/downloads/
  echo and tick "Add python.exe to PATH" during setup. Then run this file again.
  pause
  exit /b 1
)
venv\Scripts\python -m pip install --upgrade pip
where nvidia-smi >nul 2>nul
if %errorlevel%==0 (
  echo NVIDIA graphics card found: installing the fast version.
  venv\Scripts\python -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
)
venv\Scripts\python -m pip install chatterbox-tts soundfile
echo.
echo Done! Now double-click 2_START_windows.bat
pause
