"""Find exact quotable sentences on real pages (for SCREEN lines).
Usage: python3 tools/page_text.py URL "keyword1" "keyword2" ...   -> prints the page title and sentences with the keywords.
Fetched with curl (goes through the proxy)."""
import html, re, sys, urllib.request

url, keys = sys.argv[1], [k.lower() for k in sys.argv[2:]]
import subprocess
r = subprocess.run(["curl", "-sSL", "--max-time", "90", "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
                    "-w", "\n%{http_code}", url], capture_output=True, text=True, errors="ignore")
raw, code = r.stdout.rsplit("\n", 1) if "\n" in r.stdout else (r.stdout, "000")
if code != "200":
    print("ERROR", url, code, r.stderr[:100]); sys.exit(1)
t = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S)
raw = re.sub(r"(?s)<(script|style|sup)[^>]*>.*?</\1>", " ", raw)
txt = html.unescape(re.sub(r"<[^>]+>", " ", raw))
txt = re.sub(r"\s+", " ", txt)
print("OK", url, "|", html.unescape(t.group(1).strip()) if t else "", "| chars", len(txt))
seen = 0
for s in re.split(r"(?<=[.!?])\s+", txt):
    if any(k in s.lower() for k in keys) and 20 < len(s) < 400:
        print(" -", s.strip()); seen += 1
        if seen >= 12: break
