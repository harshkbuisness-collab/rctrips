@echo off
cd /d "%~dp0"
echo Installing the cloned-voice model (Chatterbox, about 10 minutes, a few GB)...
where nvidia-smi >nul 2>nul
if %errorlevel%==0 venv\Scripts\python -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
venv\Scripts\python -m pip install chatterbox-tts
echo Done! Restart Voice Studio and choose Chatterbox.
pause
