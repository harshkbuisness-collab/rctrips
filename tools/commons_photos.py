"""Real historical photos from Wikimedia Commons by search words (all Commons files are free to reuse).

Usage: python3 tools/commons_photos.py videos/<slug> "key=search words" ["key=search words" ...]
Saves 02_assets/screens/h_<key>.jpg and adds {key, title, file, page} to commons.json. Existing files are kept.
"""
import json, os, re, sys, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from get_photos import fetch

API = "https://commons.wikimedia.org/w/api.php?"


def find(q):
    url = API + urllib.parse.urlencode({"action": "query", "generator": "search", "gsrnamespace": 6, "gsrsearch": q,
                                        "gsrlimit": 5, "prop": "imageinfo", "iiprop": "url|size|mime",
                                        "iiurlwidth": 1400, "format": "json"})
    raw = fetch(url)
    pages = sorted((json.loads(raw).get("query", {}).get("pages", {}) if raw else {}).values(), key=lambda p: p.get("index", 99))
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") in ("image/jpeg", "image/png", "image/gif", "image/tiff") and ii.get("width", 0) >= 500:
            return {"title": p["title"][5:].rsplit(".", 1)[0], "img": ii.get("thumburl") or ii["url"],
                    "page": ii.get("descriptionurl", "")}
    return None


def main(vdir, pairs):
    out = os.path.join(vdir, "02_assets", "screens")
    os.makedirs(out, exist_ok=True)
    meta_p = os.path.join(out, "commons.json")
    meta = {m["key"]: m for m in json.load(open(meta_p))} if os.path.exists(meta_p) else {}
    for pair in pairs:
        key, _, q = pair.partition("=")
        f = f"h_{key}.jpg"
        if key in meta and os.path.exists(os.path.join(out, f)):
            continue
        r = find(q)
        data = fetch(r["img"]) if r else None
        if not data or len(data) < 5000:
            print("no photo:", key, q)
            continue
        from PIL import Image
        import io
        Image.open(io.BytesIO(data)).convert("RGB").save(os.path.join(out, f), quality=90)
        meta[key] = {"key": key, "title": r["title"], "file": f, "page": r["page"]}
        print("ok", key, "->", r["title"][:70])
    json.dump(list(meta.values()), open(meta_p, "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
