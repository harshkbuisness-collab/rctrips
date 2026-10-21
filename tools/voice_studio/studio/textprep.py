"""Getting clean spoken text out of what the user pastes or uploads.

- A channel script (scripts/dayNN_*.md, with "## CHAPTER", "> VISUAL:" and "> SCREEN:" lines) keeps only
  the spoken lines; headings, notes and the SOURCES list are dropped. Its name becomes "dayNN".
- Plain text is used as it is.
- Several scripts in one box are separated by a line with only --- (three dashes).
- Emotion tags like [calm] are removed (most voices would read them out loud).
"""
import re

TAG = re.compile(r"\[(?:calm|serious|sarcastic|dramatic|excited|neutral|pause)\]\s*", re.I)
META = re.compile(r"^(TITLES|THUMBNAIL|THREAD|NOTE|NOTES)\s*:", re.I)


def spoken_text(raw):
    """Spoken words only, one paragraph per spoken line."""
    out, keep = [], True
    is_script = bool(re.search(r"^>\s*(VISUAL|SCREEN)\s*:", raw, re.M | re.I))
    for line in raw.replace("\r", "").split("\n"):
        s = line.strip()
        if not s:
            continue
        if is_script:
            if re.match(r"^#+\s*SOURCES", s, re.I):
                keep = False
            if not keep or s.startswith(("#", ">", "-", "|")) or META.match(s):
                continue
        s = TAG.sub("", s)
        s = re.sub(r"[*_`]+", "", s).strip()
        if s:
            out.append(s)
    return "\n".join(out)


def script_name(raw, fallback):
    m = re.search(r"^#\s*Day\s*0*(\d{1,2})\b", raw, re.M | re.I)
    if m:
        return f"day{int(m.group(1)):02d}"
    return re.sub(r"[^A-Za-z0-9_-]+", "_", fallback).strip("_")[:60] or "script"


def split_box(raw):
    """Scripts typed or pasted in one box, separated by a line of ---."""
    parts = [p.strip() for p in re.split(r"^\s*-{3,}\s*$", raw.replace("\r", ""), flags=re.M)]
    return [p for p in parts if p]


def chunks(text, max_chars):
    """Split long text at sentence ends (then commas) into pieces no longer than max_chars."""
    sents = re.split(r"(?<=[.!?…])\s+|\n+", text)
    out, cur = [], ""
    for s in filter(None, (x.strip() for x in sents)):
        while len(s) > max_chars:                       # one very long sentence: cut at a comma or space
            cut = s.rfind(", ", 0, max_chars)
            cut = cut + 1 if cut > max_chars // 3 else (s.rfind(" ", 0, max_chars) if " " in s[:max_chars] else max_chars)
            piece, s = s[:cut].strip(), s[cut:].strip()
            if cur:
                out.append(cur)
                cur = ""
            out.append(piece)
        if cur and len(cur) + 1 + len(s) > max_chars:
            out.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        out.append(cur)
    return out
