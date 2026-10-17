# Examples

`05-glute-bridge-v5.json` + `.txt`: the approved v5 "animation" look (owner: "ye sahi hai").
Copy its structure, never its phrases. Run it end to end to test a fresh setup:

    python3 scripts/make_video.py video --script examples/05-glute-bridge-v5.txt \
      --plan examples/05-glute-bridge-v5.json --name test

`plan-builder-example.py`: videos 46 (lovehandles) and 47 (wallsit) written with `scripts/plan_lib.py`.
Running it from the project folder writes `work/lovehandles.json` and `work/wallsit.json`, identical to the
`.json` files here. Their scripts are `lovehandles.txt` and `wallsit.txt`.
