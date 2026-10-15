#!/usr/bin/env bash
# One-time setup for the FreeStack video engine (Python deps + checks).
set -e
pip install -q faster-whisper soundfile numpy 2>&1 | grep -v -i "warning" || true
command -v ffmpeg >/dev/null || { echo "ffmpeg is missing"; exit 1; }
NODE_PATH="${NODE_PATH:-$(npm root -g)}" node -e "require('playwright')" 2>/dev/null \
  || { echo "Installing playwright (uses the preinstalled Chromium)"; npm install -g playwright@1 >/dev/null; }
python3 -I -c "import faster_whisper, soundfile, numpy" && echo "FreeStack engine ready."
