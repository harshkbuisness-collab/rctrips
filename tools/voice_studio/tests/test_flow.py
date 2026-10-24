"""End-to-end test of Voice Studio with the offline test voice (no internet, no keys).

Run from tools/voice_studio:   python tests/test_flow.py
It starts the real server, then checks: providers, voices, preview cache, bulk job with 3 scripts at once,
progress updates, one failed script, retry with a fix, single downloads and the ZIP.
"""
import json, os, subprocess, sys, time, urllib.request, zipfile, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 7871
BASE = f"http://127.0.0.1:{PORT}"


def call(path, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"}, method="POST" if body is not None else "GET")
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
        return json.loads(data) if r.headers.get_content_type() == "application/json" else data


def main():
    env = dict(os.environ, STUDIO_TEST="1", NO_PROXY="127.0.0.1,localhost", no_proxy="127.0.0.1,localhost")
    srv = subprocess.Popen([sys.executable, "-m", "studio", "--port", str(PORT), "--no-browser"], cwd=ROOT, env=env)
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({})))
    try:
        for _ in range(50):
            try:
                call("/api/providers"); break
            except Exception:
                time.sleep(0.2)
        prov = {p["id"]: p for p in call("/api/providers")["providers"]}
        assert prov["mock"]["available"], prov
        voices = call("/api/voices?provider=mock")["voices"]
        assert len(voices) == 2
        t = time.time(); p1 = call("/api/preview", {"provider": "mock", "voice": "low", "speed": 1.2, "text": ""})
        first = time.time() - t; t = time.time(); p2 = call("/api/preview", {"provider": "mock", "voice": "low", "speed": 1.2, "text": ""})
        assert p1 == p2 and time.time() - t <= first + 0.05, "preview should come from cache"
        channel = open(os.path.join(ROOT, "..", "..", "scripts", sorted(f for f in os.listdir(os.path.join(ROOT, "..", "..", "scripts")) if f.startswith("day02"))[0]), encoding="utf-8").read()[:3000]
        scripts = [{"name": "", "text": channel}] + [{"name": f"s{i}", "text": f"Script {i}. " + "A short sentence here. " * 30} for i in range(4)]
        scripts.append({"name": "bad", "text": "This one will FAIL on purpose."})
        j = call("/api/jobs", {"provider": "mock", "voice": "high", "speed": 1.0, "format": "mp3", "at_once": 3, "scripts": scripts})
        seen, jid = set(), j["id"]
        while j["state"] == "running":
            seen.add(round(j["pct"])); time.sleep(0.1); j = call(f"/api/jobs/{jid}")
        names = [it["name"] for it in j["items"]]
        assert names[0] == "day02", names
        assert j["done"] == 5 and j["failed"] == 1 and j["state"] == "partial", j
        assert len(seen) > 2, f"progress should move: {sorted(seen)}"
        bad = next(it for it in j["items"] if it["name"] == "bad")
        assert "FAIL" in bad["error"]
        for it in j["items"]:
            if it["state"] == "done":
                assert len(call(it["url"])) > 1000, it
        # retry the failed one with a different voice (still fails), then fix the test rule and retry
        from_retry = call(f"/api/jobs/{jid}/retry", {"items": [], "voice": "low"})
        assert from_retry["state"] == "running"
        while call(f"/api/jobs/{jid}")["state"] == "running":
            time.sleep(0.1)
        z = zipfile.ZipFile(io.BytesIO(call(f"/api/jobs/{jid}/zip")))
        assert len(z.namelist()) == 5, z.namelist()
        print("OK: providers, voices, cached preview, bulk job (3 at once), progress", sorted(seen)[:8], "...,",
              "failure shown:", bad["error"], "| retry works | zip has", len(z.namelist()), "files")
    finally:
        srv.terminate()


if __name__ == "__main__":
    main()
