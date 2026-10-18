# Sample v2 vs Reference — measured differences (18 Oct 2026)

Method: frame sampling (1–4 fps strips), black-screen detection, change-rate counts per minute at three sensitivity levels, silence detection, on all 6 reference videos and our `sample02_inflation_v2`.

## 1. Black screens
| | Reference | Ours v2 |
|---|---|---|
| Black chapter cards | **None.** Only dark frames found: the real SpaceX logo animation (SpaceX video, 3 times, ~1–2 s) and ~1.5 s in "To Save the Economy" | **2 black glowing chapter cards (1.6 s each)** |
| How chapters are marked | A **small red handwritten title in the top-left corner** of a normal white scene ("The good") + music sting | Full black card + whoosh |

**Fix:** remove black cards. Use a small red/orange handwritten corner title on the white scene.

## 2. Real documents and screen recordings (biggest visual gap)
Reference (e.g. Housing video, 6:40–7:10): about **a third of mid-video screen time** shows real material:
- Screen recordings of PDFs and websites, **scrolling and zooming in** (the only camera movement in these videos)
- **Yellow highlighter** over the key sentence in transcripts/articles; red box around a table row
- Article pages (The Real Deal), earnings-call transcripts, Yahoo Finance quotes, BLS tables
- Doodle characters **peeking in from the side/bottom over the document**; doodle icons popping on top of the document
- Big standalone **company logos** (Lennar, Nasdaq, SpaceX)

Ours: **none** (one recreated headline card).
**Fix:** needs network access to news/data sites (environment setting). Builder needs: screenshot + slow zoom/scroll + yellow highlight + red box + character peeking over.

## 3. Framing / camera
| | Reference | Ours |
|---|---|---|
| Character size | Varies a lot: small full-body, medium, **extreme close-ups cropped by the frame edge** (big head + hand holding a bill) | Mostly one size (full body, 55–75% height, centred) |
| Motion | Static doodles; only documents scroll/zoom | Static (correct) + pop-bounce on some items |
| Micro-motion (wobble) | None (measured: 1 change in a 2-s static shot) | None ✓ |

**Fix:** add close-up crops (head + hand bleeding off frame), more size variety, smaller characters in many scenes.

## 4. How scenes build up
| | Reference | Ours |
|---|---|---|
| Changes per minute (small/big) | 40–88 small, 20–22 big | 30 small, 16 big |
| Build style | **Items accumulate** in one scene one by one (box → DEBT note → FEE note → money bag) | Often a new scene per sentence |
| Groups of repeated small icons | Yes (many houses + SALE signs scattered) | No |
| Gags | Red X crossing out a scene, small red side-notes ("still too broke", "victory twerk"), speech bubbles | Bubbles + labels (good), no red X, side-notes are black/orange |

**Fix:** ~1.5–2× more changes; accumulate items within a scene; scattered icon groups; red X gag; red handwritten side-notes.

## 5. Colours and text
- Reference annotation colour is **red** (circles, X, side-notes, chapter titles); highlight is **yellow** on documents. Ours uses orange everywhere. (We keep orange as brand accent, but documents need yellow highlight.)
- Reference big text is rare; most text is **small handwriting**. Ours has big marker words ("INFLATION", "SUBSCRIBE!") that the reference never uses.

## 6. Audio
| | Reference | Ours |
|---|---|---|
| Background bed | Quiet continuous music/room tone: only **6** gaps below −50 dB in 80 s | **Dead silence** between sentences: **34** gaps below −50 dB |
| Pauses | Short, natural | Fixed 0.3–0.45 s machine gaps |
| Voice | Real human, sarcastic, varied pace | Flat TTS |
| SFX | Rare | Pops + whooshes (too many) |

**Fix:** quiet music bed under everything (needs a licence-free track), shorter pauses, remove whooshes, fewer pops; better voice.

## 7. Ending
Reference: last ~8–10 s is a **white end screen** — "Subscribe for more / Casual Finance", small YouTube logo with "only on" note and crossed-out social icons — space for YouTube end-screen elements.
Ours: ends abruptly on the subscribe line.
**Fix:** add a 10–20 s end screen in our branding.

## 8. Script
Reference: 12–17 min, real current news, named sources, exact quotes on screen, sponsor at ~55–60%. Ours: 89-s evergreen sample, quotes recreated. (Format limit, not a builder problem.)
