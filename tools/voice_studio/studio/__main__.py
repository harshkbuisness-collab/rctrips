"""Start Voice Studio:  python -m studio  [--port 7860] [--host 127.0.0.1] [--no-browser]"""
import argparse, threading, webbrowser

import uvicorn

ap = argparse.ArgumentParser()
ap.add_argument("--port", type=int, default=7860)
ap.add_argument("--host", default="127.0.0.1", help="use 0.0.0.0 to open it from other devices on your network")
ap.add_argument("--no-browser", action="store_true")
a = ap.parse_args()
url = f"http://{'localhost' if a.host in ('127.0.0.1', '0.0.0.0') else a.host}:{a.port}"
print(f"\nVoice Studio is running at {url}  (close this window to stop it)\n", flush=True)
if not a.no_browser:
    threading.Timer(1.5, lambda: webbrowser.open(url)).start()
uvicorn.run("studio.server:app", host=a.host, port=a.port, log_level="warning")
