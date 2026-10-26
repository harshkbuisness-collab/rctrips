"""Download the Kokoro offline voice model (about 340 MB) into tools/voice_studio/kokoro/."""
import os, urllib.request

BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kokoro")
os.makedirs(DIR, exist_ok=True)
for name in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
    path = os.path.join(DIR, name)
    if os.path.exists(path):
        print("already there:", name)
        continue
    print("downloading", name, "...", flush=True)
    urllib.request.urlretrieve(BASE + name, path + ".part")
    os.replace(path + ".part", path)
print("Done. Restart Voice Studio and choose 'Kokoro (offline, free)'.")
