#!/bin/bash
# Double-click to choose video(s). Makes one picture per scene + ALL_SCENES.jpg
cd "$(dirname "$0")"
python3 scene_frames.py "$@"
