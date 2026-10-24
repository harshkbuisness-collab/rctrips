# Script style guide (v2, owner rules from 18 Oct 2026)

These rules apply to every script from Day 2 onward.

## 1. Voice
- **The owner records or generates the voice and gives it to us.** We never generate the final voice.
- So the spoken text must be clean and easy to read aloud: no symbols the reader has to translate ("$38T" → "thirty-eight trillion dollars"), no brackets, no markdown inside spoken lines.
- Optional emotion tags at the start of a line, only these: `[calm]` `[serious]` `[sarcastic]` `[dramatic]` `[excited]`. Mostly `[calm]`.

## 2. Simple storytelling, unbroken flow
- Tell it like a calm friend telling a true story. Simple words (8th-grade level), short sentences, one idea per sentence.
- **One thread through the whole video:** follow one person, one dollar, one company or one question from the first line to the last. Come back to it in every chapter.
- **No shock tactics.** No "you won't believe", no random jokes, no sudden topic jumps, no fake drama. Small gentle humour is fine only if it comes from the story itself.
- **Every chapter ends with a bridge** that makes the viewer want the next part ("But the bank had a secret of its own.").
- Open loops are allowed, but always pay them off.
- Explain every term the first time with an everyday example (one sentence).
- Start in the story within the first 10 seconds. No "Hey guys, welcome back".
- End with a calm takeaway plus one line that leads to the next video. No hard sell.

## 3. Length and pace
- About 2,000–2,200 spoken words (about 14 minutes at 150 words per minute).
- 6–8 chapters.

## 4. Evidence (the more, the better)
- A real screenshot or archive photo in the first 15 seconds.
- Then about one every 30–40 seconds: **at least 20 `SCREEN` cues per script**.
- Trusted sources only: government sites (.gov), central banks, court and SEC filings, company filings and investor-relations pages, major newspapers' own pages, Wikimedia Commons public-domain archive photos.
- Each SCREEN cue names the exact page (URL) and what to highlight.

## 5. Visual notes: something changes every 1–2 seconds
- Every spoken line gets a `> VISUAL:` note describing several small changes in order: who enters, from which side, what appears next.
- Characters and props should **enter with motion** (slide in from the left or right, drop in from the top, walk in), not all be there at once.
- Scenes build up over several lines. Frames are full: small characters, several items.
- Use only images from `library/ASSET_LIST.txt` (by code, e.g. `A15`, `C02`, `E09`) plus real screenshots/photos. **No new drawings.**

## 6. File format (must match exactly; the sheet and video builder read it)

```
# Day NN: <Working title>
TITLES: <option 1> | <option 2> | <option 3>
THUMBNAIL: <2-4 word text> — <what the picture shows>
THREAD: <the one person/thing we follow>

## CHAPTER 1: <Name>
[calm] <spoken line, 1-3 sentences>
> VISUAL: <A15 slides in from the right; then E09 drops in…>
> SCREEN: <Source name> | <URL> | <what to highlight>
<next spoken line>
> VISUAL: …

## CHAPTER 2: <Name>
…

## SOURCES
- <claim> — <source name> — <URL>
```

- A spoken line is any line that is not a heading, not `>` and not in SOURCES.
- `> SCREEN:` is optional per line but needed at least 20 times per script.

## Casual Finance structure (owner, 24 Oct 2026: write like this, no made-up people)
From research/10 (Dumping Ground, 17.4 min, 3,305 words) and research/01 (SpaceX IPO):
1. 0:00 hook: ONE real chart or number, made concrete by comparisons ("worth more than Coca-Cola, McDonald's, Disney... combined"), on screen as evidence.
2. ONE question the video answers ("Are they worth it?" / "Who is buying it?"). Personal stakes with "you": "the answer is you... your 401k".
3. Twist: "the better question is a lot simpler" / "most people say X... both are wrong". Hold the answer back (open loop).
4. Named chapters (chalkboard cards). Each chapter = real history step by step, with dates, names, laws, filings:
   "In 1997 Amazon filed..." -> headline / document card with the exact sentence highlighted.
5. A light joke or speech bubble every 20-40 s (sarcastic aside), never fiction.
6. Pay off the question with the evidence; recap; callback to the opening chart; a strong last line.
Never: "Meet Linda", invented families, imagined neighbors, a fictional person followed through the video.
