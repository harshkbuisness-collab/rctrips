#!/bin/sh
# Start Reel Engine on macOS / Linux.
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js 20+ from https://nodejs.org"; exit 1; }
PY=$(command -v python3 || command -v python) || { echo "Install Python 3.11"; exit 1; }
[ -d node_modules ] || npm install
[ -f .cache/python-ok ] || { "$PY" -m pip install -r requirements.txt && mkdir -p .cache && touch .cache/python-ok; }
[ -f .cache/sync-ok ] || { "$PY" -m pip install --only-binary=:all: "pocketsphinx>=5.0.4" && touch .cache/sync-ok; }  # voiceover sync
[ -f .cache/kokoro-ok ] || { "$PY" -m pip install kokoro-onnx soundfile && mkdir -p .cache && touch .cache/kokoro-ok; }  # AI voice
( sleep 8; (command -v open >/dev/null && open http://localhost:3000) || xdg-open http://localhost:3000 ) >/dev/null 2>&1 &
npm start
