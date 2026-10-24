@echo off
cd /d "%~dp0"
venv\Scripts\python -m pip install kokoro-onnx
venv\Scripts\python download_kokoro.py
pause
