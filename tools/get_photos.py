"""Free real photos for a script: the real people, companies, places and events it names, from Wikimedia Commons.

Usage: python3 tools/get_photos.py scripts/dayNN_x.md videos/<slug>
Output: <slug>/02_assets/screens/p_<name>.jpg|png and photos.json ([{name, title, file, page}]).
Only images stored on Wikimedia Commons (free licences) are used; non-free logos on English Wikipedia are skipped.
Fictional story characters (names in the THREAD line) are skipped. Already downloaded photos are kept.
"""
import json, os, re, sys, urllib.parse, urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "sheet"))
import parse_script

UA = {"User-Agent": "doodle-finance-videos/1.0 (educational YouTube explainer; contact via GitHub)"}
SKIP = set("""The A An And But So Or If In On At By For From To Of With Now Then When While After Before Here There
This That These Those It Its He She They We You I Our Your Their His Her Not No Yes Why How What Who Which Where
Every Each Some Many Most More One Two Three First Second Third Next Last Today Imagine Picture Meet Think Let
January February March April May June July August September October November December Monday Tuesday Wednesday
Thursday Friday Saturday Sunday Mr Mrs Ms Dr Chapter Step Part Quick Read Remember""".split())
SINGLE_SKIP = SKIP | set("America American Americans York Street States United Standard Wall Jeff Star Wars Model "
                         "South North East West Federal Reserve Treasury Congress".split())


def candidates(script):
    d = parse_script.parse(script)
    raw = open(script, encoding="utf-8").read()
    thread = re.search(r"^THREAD:\s*(.*)$", raw, re.M)
    fiction = set(re.findall(r"\b[A-Z][a-z]+\b", thread.group(1).split(",")[0])) if thread else set()   # "Thomas Walsh, a refiner..."
    text = "\n".join(l["text"] for l in d["lines"])
    tok = r"[A-Z](?:[a-z&'-]+|\.)"
    multi = re.findall(rf"\b({tok}(?:[ ](?:of |the |and |& |de )?{tok}){{1,3}})", text)
    single = re.findall(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{3,})\b", text, re.M)
    out, seen = [], set()
    singles = [w for w in set(single) if single.count(w) >= 3 and w not in SINGLE_SKIP
               and not any(w in m.split() for m in multi if len(m.split()) > 1 and m.split()[-1] == w and m.split()[0] not in SKIP)]
    multi = [m for m in multi if not re.search(r"\b(Star Wars|Model|United States|North America|South America)\b", m)]
    title = [w for w in re.findall(r"\b[A-Z][A-Za-z]{3,}\b", d.get("title", ""))
             if w not in SINGLE_SKIP and len(re.findall(r"[a-z,] " + w + r"\b", text)) >= 2][:1]   # a real name, not "Crash"
    for name in ["?" + w for w in title] + multi + ["?" + w for w in singles]:   # the title's subject first     # "?" = find the best page by search (e.g. Rockefeller)
        name = re.sub(r"^(The|A|An|But|And|So|In|On|When|After|President|Senator)\s+", "", name)
        name = re.sub(r"'s$", "", name).strip(" .,'")
        words = name.lstrip("?").split()
        if not words or words[0] in SKIP or all(w in SKIP for w in words) or set(words) & fiction:
            continue
        if name.lstrip("?").lower() in ("america", "world war", "united states", "europe", "china", "mainland china", "japan"):
            continue                                 # a flag or a general page is not evidence
        if name.lower() not in seen:
            seen.add(name.lower())
            out.append(name)
    return out[:30]


def fetch(url, tries=4):
    """GET with a polite pause and retries when Wikipedia says 'too many requests' (429)."""
    import time, urllib.error
    for k in range(tries):
        time.sleep(0.6)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and k < tries - 1:
                time.sleep(min(30, int(e.headers.get("retry-after") or 5)))
                continue
            return None
        except Exception:
            return None
    return None


CONTEXT = ""          # the script's text, to pick the right page among search results


def lookup(name):
    if name.startswith("?"):                         # a surname alone: ask Wikipedia's search for the best page
        q = "https://en.wikipedia.org/w/rest.php/v1/search/page?limit=3&q=" + urllib.parse.quote(name[1:])
        raw = fetch(q)
        pages = json.loads(raw).get("pages", []) if raw else []
        pages.sort(key=lambda p: p["title"] not in CONTEXT)          # prefer a page the script itself names
        for p in pages:
            words = re.sub(r"\s*\(.*\)", "", p["title"]).split()
            if not all(w in CONTEXT for w in words):     # "Jake" must not become "Jake Gyllenhaal"
                continue
            r = lookup(p["key"])                     # first of the top 3 results that has a free photo
            if r:
                return r
        return None
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(name.replace(" ", "_"))
    raw = fetch(url)
    if not raw:
        return None
    j = json.loads(raw)
    if j.get("type") != "standard":
        return None
    img = (j.get("thumbnail") or {}).get("source", "")
    if "/commons/" not in img:                      # free images only
        return None
    img = img.split("?")[0]
    return {"title": j.get("title", name), "img": [re.sub(r"/(\d+)px-", "/800px-", img), img], "page": j.get("content_urls", {}).get("desktop", {}).get("page", ""),
            "desc": j.get("description", "")}


def main(script, vdir):
    out = os.path.join(vdir, "02_assets", "screens")
    os.makedirs(out, exist_ok=True)
    meta_p = os.path.join(out, "photos.json")
    old = {p["name"]: p for p in json.load(open(meta_p))} if os.path.exists(meta_p) else {}
    global CONTEXT
    CONTEXT = open(script, encoding="utf-8").read()
    photos = []
    for name in candidates(script):
        if name in old and os.path.exists(os.path.join(out, old[name]["file"])):
            photos.append(old[name])
            continue
        info = lookup(name)
        if not info:
            continue
        ext = ".png" if info["img"][1].lower().endswith(".png") else ".jpg"
        fname = "p_" + re.sub(r"[^a-z0-9]+", "_", name.lstrip("?").lower()).strip("_")[:40] + ext
        for u in info["img"]:                       # 800 px if it exists, else the normal thumbnail
            data = fetch(u, tries=2)
            if data and len(data) > 2000:
                open(os.path.join(out, fname), "wb").write(data)
                break
        if not os.path.exists(os.path.join(out, fname)):
            continue
        photos.append({"name": name.lstrip("?"), "title": info["title"], "file": fname, "page": info["page"], "desc": info["desc"]})
    json.dump(photos, open(meta_p, "w"), indent=1)
    print(f"{len(photos)} free photos for {os.path.basename(script)}: " + ", ".join(p["name"] for p in photos))
    return photos


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
