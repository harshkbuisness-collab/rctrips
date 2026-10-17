"""Plan builder for v5 reels: write a whole plan in ~25 lines of Python instead of hand-written JSON.

Used for videos 46-105. Import it from a builder file (see examples/plan-builder-example.py):

    import sys; sys.path.insert(0, "<skill>/scripts")
    from plan_lib import *
    make(name, title, caption_keywords, caption_bottom_phrases, [scenes...], [extra sfx], problem_at, close_at)

Scenes:
    auto(id, start, backdrop, [beats...], tr="whip"|"zoom", shakes=[...], hook=True for the first scene)
        backdrop: "none" (clips) | "red" | "green" | "yellow" | "grid" (plans, use tr="zoom") | "rays"
    b(at, TEXT, look="giant"|"echo"|"marquee", c=B|R|G|Y, img=hero_id or clip=clip_id, rate=..,
      tape=.., strike_=.., impact_=True, glow_=(anchor, color), edge_=color, size=.., y=.., prop=.., pos=..)
        one beat = one picture + one big word, lasting until the next beat
    cta(problem_img, problem_at, tape_text, echo_text, echo_at="Because", send="Send this to")
        the standard ending scene (SEND THIS, problem pose + red tape, closing echo)
Times are phrases from the script: "phrase", "phrase#2", "phrase-0.1", "start+0.6".
make() adds the scene whooshes, the problem laugh and the closing bell, and writes <out>/<name>.json.
Always run check_plan.py and make_video.py check on the result.
"""
import json
B = "#111111"; R = "#E3262E"; G = "#2FD94E"; Y = "#FFD23F"


def _sz(t, big=230):
    n = len(t)
    return big if n <= 5 else 210 if n <= 7 else 190 if n <= 9 else 165 if n <= 11 else 150


def _w(d, at, until):
    if at: d["at"] = at
    if until: d["until"] = until
    return d


def giant(t, at=None, until=None, c=B, y=0.19, size=None):
    return _w({"type": "text", "text": t, "look": "giant", "behind": True, "x": 0.5, "y": y, "size": size or _sz(t),
               "color": c, "align": "center", "maxWidth": 1, "animation": "letters", "untype": False, "tilt": 0}, at, until)


def echo(t, at=None, until=None, c=G, y=0.27, size=None):
    return _w({"type": "text", "text": t, "look": "echo", "behind": True, "x": 0.5, "y": y, "size": size or min(250, _sz(t, 260)),
               "color": c, "align": "center", "maxWidth": 1, "animation": "none", "untype": False, "tilt": 0}, at, until)


def marquee(t, at=None, until=None, c=B, y=0.28, size=230, speed=400):
    return _w({"type": "text", "text": t, "look": "marquee", "behind": True, "x": 0.5, "y": y, "size": size, "color": c,
               "align": "center", "maxWidth": 1, "animation": "none", "untype": False, "tilt": 0, "speed": speed}, at, until)


def tape(t, at=None, until=None, box=Y, y=0.74):
    return _w({"type": "text", "text": t, "look": "tape", "boxColor": box, "y": y, "size": 84, "tilt": -8, "speed": 240,
               "behind": False}, at, until)


def strike(t, at, until=None, strike_at=None, y=0.62, size=130):
    return _w({"type": "text", "text": t, "font": "display", "x": 0.5, "y": y, "size": size, "align": "center", "color": B,
               "animation": "none", "untype": False, "strike": strike_at or f"{at}+0.25"}, at, until)


def img(a, at=None, until=None, enter="whip", pos=None, **kw):
    d = _w({"type": "image", "asset": a, "shadow": True, "enter": enter}, at, until)
    if pos == "stand": d.update(width=0.8, y=0.66)       # standing H under a giant word at y 0.19
    if pos == "lying": d.update(width=0.82, y=0.56)      # floor poses
    if pos == "tall": d.update(width=0.72, y=0.62)       # hanging / bar poses
    d.update(kw)
    return d


def poses(frames, at=None, until=None, pos=None):
    d = _w({"type": "poses", "shadow": True, "crossfade": 0, "enter": "whip",
            "frames": [{"asset": a, "at": t} for a, t in frames]}, at, until)
    if pos == "lying": d.update(width=0.82, y=0.56)
    if pos == "tall": d.update(width=0.72, y=0.62)
    if pos == "stand": d.update(width=0.8, y=0.66)
    return d


STANDING_CLIPS = {"clip_squat", "clip_hammer_curl", "clip_hammer_curl_dumbbells", "clip_lateral_raise",
                  "clip_bulgarian_split_squat", "clip_chair_dip", "clip_dead_hang"}


def clip(a, at=None, until=None, rate=1.0, enter="whip"):
    if a in STANDING_CLIPS:
        geo = {"width": 0.66, "y": 0.62}
    elif a == "clip_inverted_row":
        geo = {"width": 1.0, "y": 0.64}   # the bar sits high in this clip: words go above it at y 0.17
    else:
        geo = {"width": 1.0, "y": 0.58}
    return _w({"type": "video", "asset": a, **geo, "rate": rate, "enter": enter}, at, until)


def impact(at): return {"type": "pulse", "kind": "impact", "at": at, "duration": 0.2}
def edge(at, c=R): return {"type": "pulse", "kind": "edge", "color": c, "at": at}
def speed(at): return {"type": "speed", "at": at}
def glow(anchor, at=None, until=None, c=G): return _w({"type": "glow", "anchor": anchor, "color": c}, at, until)


BD = {"none": ("none", None), "red": ("spotlight", R), "green": ("spotlight", G), "yellow": ("spotlight", Y),
      "rays": ("rays", Y), "grid": ("grid", "#B0B6BE")}


def scene(id, start, bd, layers, tr="whip", shakes=None):
    b, c = BD[bd]
    s = {"id": id, "start": start}
    if tr == "whip": s["transition"] = {"type": "whip", "duration": 0.32}
    elif tr == "zoom": s["transition"] = {"type": "zoomBlur", "duration": 0.45}
    s["backdrop"] = b
    if c: s["backdropColor"] = c
    if bd == "grid": s["backdropOpacity"] = 0.6
    if shakes: s["shakes"] = [{"at": a} for a in shakes]
    s["layers"] = layers
    return s


def cta(problem_img, problem_at, tape_text, echo_text, echo_at="Because", send="Send this to", extra_img=None):
    """Standard ending: SEND THIS + pointing H + phone, the problem pose + red tape, closing echo of the hook."""
    L = [giant("SEND THIS", send, problem_at, size=190),
         img("hero_point_viewer", send, problem_at),
         {"type": "image", "asset": "prop_phone", "at": send, "until": problem_at, "x": 0.8, "y": 0.4, "width": 0.18,
          "motion": {"type": "pulse"}},
         img(problem_img, problem_at, echo_at),
         tape(tape_text, problem_at, echo_at, box=R, y=0.72),
         echo(echo_text, echo_at, c=R, size=min(200, _sz(echo_text, 220))),
         img(extra_img or "hero_what", echo_at)]
    return scene("cta", f"{send}-0.1", "rays", L)


def plan(title, keywords, bottom, scenes, sfx, path):
    p = {"title": title, "progressBar": True,
         "captions": {"mode": "word", "keywords": keywords, "bottom": [bottom]},
         "scenes": scenes, "sfx": [{"at": a, "src": s} for a, s in sfx]}
    json.dump(p, open(path, "w"), indent=1, ensure_ascii=False)


# ---------------------------------------------------------------- beat helper (one picture + one big word per beat)
LYING = {"hero_plank", "hero_pushup_top", "hero_pushup_top_v2", "hero_pushup_top_v3", "hero_pushup_top_v4", "hero_pushup_mid",
         "hero_cobra_stretch", "hero_cobra_stretch_v2", "hero_glute_bridge_down", "hero_glute_bridge_up", "hero_leg_raise_down",
         "hero_leg_raise_up", "hero_mountain_a", "hero_mountain_b", "hero_sleeping", "hero_lying_topdown",
         "hero_lying_topdown_hands_head", "hero_reverse_crunch", "hero_bear_crawl", "hero_pike_top", "hero_pike_top_v2",
         "hero_pike_bottom", "hero_pike_wrong",  "hero_pushup_leg_raise", "hero_childs_pose"}
TALL = {"hero_pullup_hang", "hero_pullup_top", "hero_handstand", "hero_dip_top", "hero_dip_bottom", "hero_look_up_bar"}


def b(at, text=None, look="giant", c=B, img=None, clip=None, rate=1.0, tape=None, tapec=Y, impact_=False, glow_=None,
      strike_=None, edge_=None, size=None, y=None, prop=None, extra=None, pos=None):
    return dict(at=at, text=text, look=look, c=c, img=img, clip=clip, rate=rate, tape=tape, tapec=tapec, impact=impact_,
                glow=glow_, strike=strike_, edge=edge_, size=size, y=y, prop=prop, extra=extra or [], pos=pos)


def auto(id, start, bd, beats, tr="whip", shakes=None, hook=False):
    L = []
    if hook: L += [speed("start"), edge("start+0.6", G), speed("start+1.0")]   # 4+ changes in the first 3 s
    for i, x in enumerate(beats):
        at = x["at"]; until = beats[i + 1]["at"] if i + 1 < len(beats) else None
        first = hook and i == 0
        ty = None  # where the big word goes
        if x["clip"]:
            prev = next((l for l in reversed(L) if l.get("type") == "video"), None)
            if prev and prev["asset"] == x["clip"] and prev["rate"] == x["rate"] and prev.get("until") == at:
                if until: prev["until"] = until       # same clip, same speed: keep it playing
                else: prev.pop("until", None)
            else:
                L.append(clip(x["clip"], at, until, rate=x["rate"], enter="cut" if first else "whip"))
            ty = 0.17 if x["clip"] == "clip_inverted_row" else 0.19 if x["clip"] in STANDING_CLIPS else 0.28
        if x["img"]:
            a = x["img"]; pos = x["pos"]
            if pos is None:
                pos = "lying" if a in LYING else "tall" if a in TALL else ("stand" if x["look"] == "giant" and x["text"] else None)
            L.append(img(a, at, until, enter="cut" if first and not x["clip"] else "whip", pos=pos))
            if ty is None: ty = 0.3 if pos == "lying" else 0.19 if pos == "tall" else None
        if x["text"]:
            lk = x["look"]; y = x["y"]
            if lk == "giant":
                L.append(giant(x["text"], at, until, c=x["c"], y=y or ty or 0.19, size=x["size"]))
            elif lk == "echo":
                L.append(echo(x["text"], at, until, c=x["c"], y=y or ty or 0.27, size=x["size"]))
            elif lk == "marquee":
                L.append(marquee(x["text"], at, until, c=x["c"], y=y or ty or 0.28))
        if x["tape"]: L.append(tape(x["tape"], at, until, box=x["tapec"]))
        if x["strike"]: L.append(strike(x["strike"], at, until, strike_at=f"{at}+0.35"))
        if x["glow"]: L.append(glow(x["glow"][0], at, until, c=x["glow"][1]))
        if x["impact"]: L.append(impact(at))
        if x["edge"]: L.append(edge(at, x["edge"]))
        if x["prop"]:
            L.append(_w({"type": "image", "asset": x["prop"], "x": 0.8, "y": 0.4, "width": 0.2,
                         "motion": {"type": "pulse"}}, at, until))
        L.extend(x["extra"])
    return scene(id, start, bd, L, tr=None if hook else tr, shakes=shakes)


SCENE_SFX = ["sfx_whoosh_swipe", "sfx_whoosh_fast", "sfx_whoosh_soft", "sfx_swish", "sfx_whoosh_short"]


def make(name, title, keywords, bottom, scenes, extras, problem_at, close_at, out="work/"):
    sfx = [("start", "sfx_whoosh_big")]
    k = 0
    for sc in scenes[1:]:
        if sc["id"] == "cta": sfx.append((sc["start"], "sfx_whoosh_big")); continue
        sfx.append((sc["start"], "sfx_level_start" if sc["id"] in ("fix", "do") else SCENE_SFX[k % len(SCENE_SFX)])); k += 1
    sfx += extras + [(problem_at, "sfx_crying_laugh"), (close_at, "sfx_gold_bell")]
    plan(title, keywords, bottom, scenes, sfx, out + name + ".json")
