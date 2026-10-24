#!/bin/bash
cd "$(dirname "$0")"
venv/bin/python -m pip install chatterbox-tts
echo "Done! Restart Voice Studio and choose Chatterbox."
