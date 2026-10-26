"""Browser test of the whole page with real Edge voices (needs internet and Playwright).

Start the app first (python -m studio --port 7880 --no-browser), then:  python tests/test_ui.py [out_dir]
Checks: voices load, a sample plays, speed slider, file upload + pasted scripts, bulk run with
per-script and overall progress, playback controls, Download all.
"""
import os, sys, time
from playwright.sync_api import sync_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
SCRIPTS = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scripts")
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None, args=["--no-proxy-server"])
    pg = b.new_page(viewport={"width": 1200, "height": 1700})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://127.0.0.1:7880/")
    pg.wait_for_selector(".voice", timeout=30000)
    pg.fill("#filter", "en-US")
    pg.click('[data-play="en-US-AndrewNeural"]')
    pg.wait_for_function("document.querySelector('#sampleMsg').textContent.startsWith('Playing')", timeout=60000)
    print("sample:", pg.inner_text("#sampleMsg"))
    pg.fill("#speed", "1.15")
    pg.dispatch_event("#speed", "input")
    files = sorted(os.path.join(SCRIPTS, f) for f in os.listdir(SCRIPTS) if f.startswith(("day05", "day06")))
    pg.set_input_files("#files", files)
    pg.fill("#box", "This is a short test script for the box.\n---\nAnd this one will be the second.")
    pg.dispatch_event("#box", "input")
    pg.fill("#atOnce", "4")
    pg.click("#generate")
    t = time.time()
    pg.wait_for_selector(".chip.running", timeout=30000)
    time.sleep(4)
    pg.screenshot(path=os.path.join(OUT, "ui_running.png"))
    pg.wait_for_function("document.querySelector('#count').textContent.startsWith('4 / 4')", timeout=600000)
    print("all done in", round(time.time() - t), "s; zip enabled:", not pg.is_disabled("#zipBtn"), "| page errors:", errs)
    print(pg.inner_text("#statusLine"), "|", pg.inner_text("#eta"), "| players:", pg.locator("#items audio").count())
    pg.screenshot(path=os.path.join(OUT, "ui_done.png"))
    b.close()
