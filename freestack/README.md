# FreeStack AI: Reel engine

Turns a voiceover into a finished 1080×1920 Reel in the FreeStack AI style: mascot, Paid vs Free cards, tool demos, GitHub star zoom, word-synced captions, sound effects and background music.

**With Claude Code:** send the voiceover and say "make the FreeStack video". The `freestack-video` skill (`.claude/skills/freestack-video/SKILL.md`) runs the whole process.

**By hand:**
```bash
bash freestack/engine/setup.sh
mkdir -p freestack/projects/my-video && cp voiceover.wav freestack/projects/my-video/
cp freestack/projects/5-paid-ai-tools/scenes.json freestack/projects/my-video/   # then edit it
python3 -I freestack/engine/build.py transcribe freestack/projects/my-video
python3 -I freestack/engine/build.py build      freestack/projects/my-video
```

Folders: `engine/` (code), `mascot/` (character clips and poses), `brand/` (logo, brand kit), `projects/` (one folder per video).
