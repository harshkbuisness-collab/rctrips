@echo off
REM Drag a video file onto this file.
python "%~dp0analyze_video.py" "%~1"
echo.
echo Open the folder next to your video ending in _analysis and paste REPORT.md into Claude.
pause
