#!/bin/bash
cd "$(dirname "$0")"
echo "Drag your video into this window and press Enter:"
read -r V
python3 analyze_video.py "${V//\\/}"
