@echo off
REM Double-click to choose a video, or drag a video onto this file.
where py >nul 2>nul && (py "%~dp0analyze_video.py" %*) || (python "%~dp0analyze_video.py" %*)
pause
