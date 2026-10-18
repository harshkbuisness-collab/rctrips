# Sample v2 vs Reference: deep comparison (18 Oct 2026, revised)

**Method:**
- All 6 reference videos sampled at 1 frame per 10 s across the whole video, plus dense 1–4 fps strips at chosen moments.
- Black-screen detection.
- Change rate per minute, at three sensitivity levels.
- Cut/fade detection.
- Audio: loudness percentiles and a spectral "flatness" test (noise vs tonal sound) in the pauses and at section breaks.

## A. In the reference but missing in ours

| # | Item | Evidence | Fix needs |
|---|---|---|---|
| 1 | **Real documents and screenshots on about 40–50% of screen time**: article pages, PDFs in a viewer, earnings-call transcripts, government/agency tables, stock-quote pages, data charts from banks | Whole-video samples: about 45 of 104 frames ("Dumping Ground") and about 40 of 80 ("To Save the Economy") show real material | Network access to news and data sites |
| 2 | **Highlighter on documents**: mostly yellow, some green, blue or pink; red box around table rows | Seen in almost every document scene | Builder feature |
| 3 | **Narrator explaining over the document**: small at the right or bottom edge, pointing with a stick or arm, or at a desk with a laptop | Very frequent | Builder feature (we have the poses) |
| 4 | **Real photos and video clips**: people (CEOs, a former Fed chair), interview clips inside a TV or laptop frame, YouTube clips | Several per video | Network access; fair-use care |
| 5 | **Company logos** shown big on their own, or several logos together | Many per video | Network access, or official press kits |
| 6 | **Section titles as small red or black handwriting, top-left** ("The good", "Way 1", "Startup", "Asymmetric bet") | All videos | Builder change |
| 7 | **Short music sting (about 1–2 s) only at section changes and logo moments**; tonal audio measured at 260–261 s in the SpaceX video | Transcripts also mark "[music]" only at those points | One licence-free sting |
| 8 | **Natural room tone**: pauses are about −52 to −62 dB of noise, never true silence | Measured flatness 0.7–0.9 = noise, not music | Add a faint noise floor |
| 9 | **Sponsor segment**: product screenshots, QR code, and a **thin yellow progress line along the bottom** of the frame during the whole sponsor read | Seen in "Dumping Ground" (Bilt) and "To Save the Economy" (Odoo) | Only when we have sponsors |
| 10 | **End screen**: about 10 s of white card, "Subscribe for more / Casual Finance", a box for the next-video end-screen element, social handles | Seen in the SpaceX video and "To Save the Economy" | Builder feature |
| 11 | **Extreme close-ups** (head and hand cut off by the frame edge) and varied character sizes | Many | Builder feature (crop) |
| 12 | **Scenes that build up**: items added one by one to the same scene; groups of small icons (many houses or money bags) | Many | Beat-sheet practice |
| 13 | **Big red X** crossing out a scene; red hand-drawn arrows and circles on charts | Several | Builder feature |
| 14 | **Occasional big red marker text** for shock numbers ("$5.9 QUADRILLION", "NUMBERS BIG AF", "15x!!!"), and "SUBSCRIBE!" in black marker once | Rare (1–3 per video) | Already supported (make it red/black, rarely) |
| 15 | Real data charts with annotations: hand-drawn arrows, "up 57%", red circles | Many | Network access + builder |
| 16 | Real human voice with personality | All | Paid voice or own recording |

## B. In ours but not in the reference (remove or change)

| # | Item in ours | Reference | Action |
|---|---|---|---|
| 1 | **Black glowing chapter cards** | None; only the real SpaceX logo clip is dark | Remove |
| 2 | **Bounce pop-in animation** | Things just appear (hard cut); 144 of 148 cuts measured as hard cuts | Remove bounce, except very rarely |
| 3 | **Pop sounds and whooshes** | Almost no sound effects | Remove |
| 4 | **Dead digital silence between sentences** (−180 dB) | Room noise in every pause | Add a faint noise floor and shorter pauses |
| 5 | **Big orange marker words** ("INFLATION") | Big text is rare and red/black | Mostly small handwriting |
| 6 | **Orange used for everything** (labels, arrows, circles) | Red for annotations, yellow for highlights | Red annotations, yellow highlights, orange only as a small brand touch |
| 7 | **Colourful, detailed props** (Penny with shading, full-colour carts) | Simpler, flatter, fewer colours | Acceptable as our own look, but prefer simpler items |
| 8 | **Every sentence is a fresh scene** | Scenes build up over several sentences | Build up more |
| 9 | Chart drawn by us with no source line | Usually a real chart screenshot with its source visible | Add a source line; use real charts when possible |

## C. Already matching
- White background, stick figures, speech bubbles, labels with arrows
- Speaking speed (~155 words/min)
- No background music bed
- Hard cuts, no wobble/micro-motion
- Line chart building as it's spoken; bar comparisons
- Loudness around −14 to −15 LUFS
- 24 fps

## D. Corrections to the earlier report
- **There is NO background music bed** (you were right). The quiet sound in their pauses is microphone room noise. Music appears only as short stings at section breaks and logo moments.
- Real-document screen time is **about 40–50%**, not about a third.
