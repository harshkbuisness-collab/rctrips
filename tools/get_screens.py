"""Take every SCREEN screenshot of a script in one run.

Usage: python3 tools/get_screens.py scripts/dayNN_x.md videos/<slug>
Output: <slug>/02_assets/screens/sNN.png and screens.json (file, source, url, highlight box, ok/error).
Already saved screenshots are skipped. HTML pages: real headless Chromium through $HTTPS_PROXY; the page is
scrolled to the quoted highlight text and that text's box is stored (fractions) for the yellow highlighter.
PDFs: downloaded, the page holding the quote is rendered with pdftoppm.
"""
import json, os, re, subprocess, sys, tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "sheet"))
import parse_script

W, H = 1600, 1000
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium")


def cues(script):
    out = []
    for i, ln in enumerate(parse_script.parse(script)["lines"]):
        for c in filter(None, ln["screen"].split("\n")):
            parts = [p.strip() for p in c.split("|")]
            if len(parts) >= 2 and parts[1].startswith("http"):
                out.append({"line": i, "source": parts[0], "url": parts[1], "what": " | ".join(parts[2:])})
    for n, c in enumerate(out, 1):
        c["file"] = f"s{n:02d}.png"
    return out


def quote(what):
    """Text to look for on the page: the first quoted phrase, or nothing."""
    m = re.search(r'["“]([^"”]{6,120})["”]', what)
    return m.group(1).strip() if m else ""


PDFS = {}


def get_pdf(ctx, c, path):
    pdf = PDFS.get(c["url"])
    if not pdf:
        r = ctx.request.get(c["url"], timeout=60000)
        if not r.ok:
            raise RuntimeError(f"HTTP {r.status}")
        pdf = os.path.join(tempfile.mkdtemp(), "f.pdf")
        open(pdf, "wb").write(r.body())
        PDFS[c["url"]] = pdf
    page, q = 1, quote(c["what"]).lower()
    if q:
        txt = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
        for n, pg in enumerate(txt.split("\f"), 1):
            if q[:40] in re.sub(r"\s+", " ", pg).lower():
                page = n
                break
    subprocess.run(["pdftoppm", "-png", "-r", "110", "-f", str(page), "-l", str(page), "-singlefile",
                    pdf, path[:-4]], check=True)
    return None, page


def get_html(ctx, c, path):
    pg = ctx.new_page()
    try:
        pg.goto(c["url"], wait_until="domcontentloaded", timeout=45000)
        pg.wait_for_timeout(2500)
        for sel in ("button:has-text('Accept')", "button:has-text('I agree')", "button:has-text('Got it')"):
            try:
                pg.click(sel, timeout=800)
            except Exception:
                pass
        box, q = None, quote(c["what"])
        if q:
            loc = pg.get_by_text(q[:60], exact=False).first
            try:
                loc.scroll_into_view_if_needed(timeout=3000)
                pg.evaluate("window.scrollBy(0, -window.innerHeight * 0.3)")
                pg.wait_for_timeout(400)
                b = loc.bounding_box()
                if b:
                    box = [round(max(0, b["x"] / W - 0.01), 3), round(max(0, b["y"] / H - 0.01), 3),
                           round(min(1, (b["x"] + b["width"]) / W + 0.01), 3),
                           round(min(1, (b["y"] + b["height"]) / H + 0.01), 3)]
            except Exception:
                pass
        pg.screenshot(path=path)
        return box, None
    finally:
        pg.close()


def main(script, vdir):
    out = os.path.join(vdir, "02_assets", "screens")
    os.makedirs(out, exist_ok=True)
    meta_p = os.path.join(out, "screens.json")
    old = {m["file"]: m for m in json.load(open(meta_p))} if os.path.exists(meta_p) else {}
    cs = cues(script)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
        browser = p.chromium.launch(executable_path=CHROME, proxy={"server": proxy} if proxy else None)
        ctx = browser.new_context(viewport={"width": W, "height": H}, accept_downloads=True)
        for c in cs:
            path = os.path.join(out, c["file"])
            if os.path.exists(path) and old.get(c["file"], {}).get("url") == c["url"]:
                c.update({k: old[c["file"]].get(k) for k in ("box", "ok", "page")})
                continue
            try:
                if c["url"].lower().split("?")[0].endswith(".pdf"):
                    c["box"], c["page"] = get_pdf(ctx, c, path)
                else:
                    c["box"], c["page"] = get_html(ctx, c, path)
                c["ok"] = True
            except Exception as e:
                c["ok"], c["error"] = False, str(e).splitlines()[0][:200]
                if os.path.exists(path):
                    os.remove(path)
            print(("ok  " if c["ok"] else "FAIL"), c["file"], c["url"], c.get("error", ""))
        browser.close()
    json.dump(cs, open(meta_p, "w"), indent=1)
    bad = [c for c in cs if not c.get("ok")]
    print(f"{len(cs) - len(bad)}/{len(cs)} screenshots saved in {out}")
    return bad


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
