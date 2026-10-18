#!/bin/bash
cd "$(dirname "$0")"
echo "Installing Voice Studio (one time, needs internet, about 10 minutes)..."
PY=$(command -v python3.11 || command -v python3.12 || command -v python3)
if [ -z "$PY" ]; then echo "Install Python 3.11 from https://www.python.org/downloads/ and run this again."; read; exit 1; fi
"$PY" -m venv venv && venv/bin/python -m pip install --upgrade pip && venv/bin/python -m pip install chatterbox-tts soundfile
echo; echo "Done! Now double-click 2_START_mac.command"; read
