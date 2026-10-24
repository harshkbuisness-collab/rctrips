#!/bin/bash
cd "$(dirname "$0")"
venv/bin/python -m pip install kokoro-onnx && venv/bin/python download_kokoro.py
