# FreeStack AI: Reel engine (skill)

Turns a voiceover into a finished 1080×1920 Reel in the FreeStack AI style: mascot, Paid vs Free cards, tool demos, GitHub star zoom, word-synced captions, sound effects and background music.

Send Claude the voiceover and say "make the FreeStack video". `SKILL.md` has the full workflow.

By hand (from any working directory):
```bash
SKILL_DIR=/path/to/freestack-video
bash "$SKILL_DIR/engine/setup.sh"
mkdir -p projects/my-video && cp voiceover.wav projects/my-video/
cp "$SKILL_DIR/examples/5-paid-ai-tools/scenes.json" projects/my-video/   # then edit it
python3 -I "$SKILL_DIR/engine/build.py" transcribe projects/my-video
python3 -I "$SKILL_DIR/engine/build.py" build      projects/my-video
```
