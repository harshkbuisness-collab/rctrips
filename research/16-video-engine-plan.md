# Plan: Casual Finance-style motion (owner, 25 Oct 2026)

Problem: one screenshot stays 15-20 s; the same library drawings repeat; the screen feels still. 0 impressions on 3 videos.

## New look (every 2 s something new)
1. Evidence shot: the page slides up from the bottom -> camera zooms into the exact highlighted line -> yellow marker
   sweeps across it -> the small narrator at the edge points an arrow at it. Then a cut to the next thing.
2. One page = several shots: each highlighted line on a page is its own zoom shot, timed to the word that proves it.
3. More evidence: about 60-80 evidence shots per 10-min video (now 34): news headlines, FRED charts (line draws itself),
   report tables, official quotes. Every shot matches the sentence being spoken.
4. Between evidence: typed text (key phrase types on screen), numbers counting up, simple doodle scenes made for THIS video.
5. Transitions: slide/whoosh, paper swipe, quick zoom cut. SFX: pop, whoosh, marker squeak, cash register. Music about -24 dB.
6. Never the same drawing twice in a row; max 3 uses of one drawing per video.

## Assets
- Library drawings are too few and too generic -> per video about 15-20 new doodles from `tools/asset_prompts.py`
  (owner makes them in Flow, saves to library/custom/dayNN/).

## Steps
1. Build the engine (doc zoom shots, typing text, SFX, transitions) in make_video.py.
2. Make a 60-second test of day08 -> owner approves.
3. Then full videos.
