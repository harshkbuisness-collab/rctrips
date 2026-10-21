#!/bin/bash
cd "$(dirname "$0")"
python3 -m venv venv && venv/bin/python -m pip install --upgrade pip && venv/bin/python -m pip install -r requirements.txt
command -v ffmpeg >/dev/null || echo "Also install ffmpeg: brew install ffmpeg"
echo "Done! Now double-click 2_START_mac.command"
