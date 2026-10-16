# Example

`05-glute-bridge-v5.json` + `.txt`: the approved v5 "animation" look (owner: "ye sahi hai").
Copy its structure, never its phrases. Run it end to end to test a fresh setup:

    python3 scripts/make_video.py video --tool <ReelEngine> --script examples/05-glute-bridge-v5.txt \
      --plan examples/05-glute-bridge-v5.json --name test
