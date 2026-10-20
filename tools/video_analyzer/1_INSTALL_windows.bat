@echo off
where py >nul 2>nul && (py -m pip install numpy pillow faster-whisper) || (python -m pip install numpy pillow faster-whisper)
where ffmpeg >nul 2>nul || winget install -e --id Gyan.FFmpeg
echo.
echo Done! If ffmpeg was just installed, restart the computer once.
pause
