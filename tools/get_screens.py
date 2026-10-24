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
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/131.0.0.0 Safari/537.36")


def cues(script):
    out = []
    for i, ln in enumerate(parse_script.parse(script)["lines"]):
        for c in filter(None, ln["screen"].split("\n")):
            parts = [p.strip() for p in c.split("|")]
            if len(parts) >= 2 and parts[1].startswith("http"):
                out.append({"line": i, "source": parts[0], "url": parts[1], "what": " | ".join(parts[2:]),
                            "said": ln["text"]})
    for n, c in enumerate(out, 1):
        c["file"] = f"s{n:02d}.png"
    return out


def photo_cues(script, vdir):
    """More evidence: the Wikipedia page of every real person, company or place the script names (found by
    get_photos.py), shown at a later mention, scrolled to the paragraph that matches what is being said.
    Off unless PHOTO_PAGES=1 (owner, 24 Oct 2026: a highlight must prove the spoken line)."""
    pp = os.path.join(vdir, "02_assets", "screens", "photos.json")
    if os.environ.get("PHOTO_PAGES") != "1" or not os.path.exists(pp):
        return []
    lines = parse_script.parse(script)["lines"]
    out, n0, pages = [], len(cues(script)), set()
    for ph in json.load(open(pp)):
        if not ph.get("page") or ph["page"] in pages:
            continue
        pages.add(ph["page"])
        hits = [i for i, ln in enumerate(lines) if re.search(r"\b" + re.escape(ph["name"].split()[-1]) + r"\b", ln["text"])
                and not ln["screen"].strip()]
        if len(hits) >= 2:                          # first mention shows the photo, a later one shows the page
            i = hits[1]
            out.append({"line": i, "source": f"Wikipedia – {ph['title']}", "url": ph["page"], "what": "",
                        "said": lines[i]["text"]})
    for k, c in enumerate(out, n0 + 1):
        c["file"] = f"s{k:02d}.png"
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


BLOCKED = ("security verification", "just a moment", "verify you are human", "access denied", "captcha",
           "page not found", "404 not found", "are you a robot", "enable javascript and cookies",
           "does not have an article with this exact name")
USED = {}          # url -> page blocks already shown, so a page used again shows a different part

FIND_BLOCKS = """() => [...document.querySelectorAll('p, li, td, h1, h2, h3, blockquote, figcaption')]
  .map((e, i) => { e.setAttribute('data-gs', i); const r = e.getBoundingClientRect();
    return [i, (e.innerText || '').trim().slice(0, 400), r.width * r.height]; })
  .filter(b => b[1].length > 30 && b[2] > 0)"""


def best_block(pg, c):
    """When the quote isn't on the page: the unused text block that best matches the quote and the spoken line."""
    words = lambda t: {w for w in re.findall(r"[a-z0-9]{4,}", t.lower())}
    want = words(c["what"]) | words(c.get("said", ""))
    used = USED.setdefault(c["url"], set())
    blocks = [b for b in pg.evaluate(FIND_BLOCKS) if b[0] not in used]
    if not blocks:
        used.clear()
        blocks = pg.evaluate(FIND_BLOCKS)
    if not blocks:
        return None
    b = max(blocks, key=lambda b: len(want & words(b[1])))
    used.add(b[0])
    return pg.locator(f"[data-gs='{b[0]}']").first


QUOTE_BOX = """([el, q]) => {
    // the exact quote inside the element (not the whole paragraph): walk its text, map the quote back to nodes
    const nodes = [], norm = [], map = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach((n, k) => { for (let i = 0; i < n.data.length; i++) {
        const ch = /\\s/.test(n.data[i]) ? ' ' : n.data[i].toLowerCase();
        if (ch === ' ' && norm[norm.length - 1] === ' ') continue;
        norm.push(ch); map.push([k, i]); } });
    const at = norm.join('').indexOf(q.toLowerCase().replace(/\\s+/g, ' '));
    if (at < 0) return null;
    const a = map[at], b = map[at + q.replace(/\\s+/g, ' ').length - 1];
    const r = document.createRange();
    r.setStart(nodes[a[0]], a[1]); r.setEnd(nodes[b[0]], b[1] + 1);
    const rs = [...r.getClientRects()].filter(x => x.width > 1);
    if (!rs.length) return null;
    return {x: Math.min(...rs.map(x => x.left)), y: Math.min(...rs.map(x => x.top)),
            x1: Math.max(...rs.map(x => x.right)), y1: Math.max(...rs.map(x => x.bottom))};
}"""
CLOSE = ("button:has-text('Accept')", "button:has-text('I agree')", "button:has-text('Got it')",
         "text=No thanks", "button:has-text('No Thanks')", "button[aria-label='Close']", "[aria-label='close']")


def get_html(ctx, c, path):
    pg = ctx.new_page()
    try:
        pg.goto(c["url"], wait_until="domcontentloaded", timeout=45000)
        pg.wait_for_timeout(2500)
        body = pg.evaluate("document.body ? document.body.innerText.slice(0, 3000) : ''").lower()
        if len(body) < 200 or any(w in body for w in BLOCKED):
            raise RuntimeError("blocked or empty page (security check / captcha / not found)")
        pg.wait_for_timeout(1500)                    # survey / cookie pop-ups come late; close them all
        for sel in CLOSE:
            try:
                pg.click(sel, timeout=600)
            except Exception:
                pass
        pg.keyboard.press("Escape")
        box, q = None, quote(c["what"])
        loc = None
        if q:
            loc = pg.get_by_text(q[:60], exact=False).first
            try:
                if not loc.count() or q in USED.setdefault(c["url"] + "#q", set()):
                    loc = None
                USED[c["url"] + "#q"].add(q)
            except Exception:
                loc = None
        if loc is None and not q:              # a quoted line must be found exactly, never a look-alike paragraph
            try:
                loc = best_block(pg, c)
            except Exception:
                loc = None
        elif loc is None:
            print("  quote not found on the page:", q[:70])
        if loc is not None:
            try:
                loc.scroll_into_view_if_needed(timeout=3000)
                pg.evaluate("window.scrollBy(0, -window.innerHeight * 0.3)")
                pg.wait_for_timeout(400)
                b = loc.bounding_box()
                e = pg.evaluate(QUOTE_BOX, [loc.element_handle(), q]) if q else None
                if e:
                    b = {"x": e["x"], "y": e["y"], "width": e["x1"] - e["x"], "height": e["y1"] - e["y"]}
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
    cs = cues(script) + photo_cues(script, vdir)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
        browser = p.chromium.launch(executable_path=CHROME, args=["--disable-blink-features=AutomationControlled"], proxy={"server": proxy} if proxy else None)
        ctx = browser.new_context(viewport={"width": W, "height": H}, accept_downloads=True, user_agent=UA,
                                  locale="en-US")
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
