"""Read a script written in the format of research/07-script-style-guide.md."""
import re

TAG = re.compile(r"^\[(\w+)\]\s*")


def parse(path):
    d = {"day": None, "title": "", "titles": "", "thumbnail": "", "thread": "", "lines": [], "sources": []}
    chap, in_src = "", False
    for raw in open(path, encoding="utf-8"):
        l = raw.strip()
        if not l or l == "---":
            continue
        m = re.match(r"^#\s*Day\s*(\d+)\s*[:\-–]\s*(.*)$", l)
        if m:
            d["day"], d["title"] = int(m.group(1)), m.group(2).strip()
            continue
        for k in ("TITLES", "THUMBNAIL", "THREAD"):
            if l.upper().startswith(k + ":"):
                d[k.lower()] = l.split(":", 1)[1].strip()
                break
        else:
            if l.startswith("## "):
                in_src = l[3:].strip().upper().startswith("SOURCES")
                chap = l[3:].strip()
                continue
            if in_src:
                d["sources"].append(l.lstrip("-* ").strip())
                continue
            if l.startswith(">"):
                body = l.lstrip("> ").strip()
                if d["lines"]:
                    key = "screen" if body.upper().startswith("SCREEN") else "visual"
                    body = body.split(":", 1)[1].strip() if ":" in body[:8] else body
                    cur = d["lines"][-1]
                    cur[key] = (cur[key] + "\n" + body).strip()
                continue
            if l.startswith("#"):
                continue
            tag = ""
            m = TAG.match(l)
            if m:
                tag, l = m.group(1), l[m.end():]
            d["lines"].append({"chap": chap, "tag": tag, "text": re.sub(r"\*+|`", "", l), "visual": "", "screen": ""})
    d["words"] = sum(len(x["text"].split()) for x in d["lines"])
    d["screens"] = sum(x["screen"].count("\n") + 1 for x in d["lines"] if x["screen"])
    return d


def voice_text(d):
    """Whole script as one quoted block for Voice Studio; a tag is written only when it changes."""
    out, last = [], None
    for x in d["lines"]:
        t = x["tag"] or last or "calm"
        out.append((f"[{t}] " if t != last else "") + x["text"])
        last = t
    return '"' + " ".join(out).replace('"', "'") + '"'
