@echo off
REM Double-click to choose video(s), or drag videos onto this file. Makes one picture per scene + ALL_SCENES.jpg
where py >nul 2>nul && (py "%~dp0scene_frames.py" %*) || (python "%~dp0scene_frames.py" %*)
pause
