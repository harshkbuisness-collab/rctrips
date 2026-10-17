"""Plan builder example: two real videos (46 lovehandles, 47 wallsit) written with scripts/plan_lib.py.
Run from the project folder:  python3 <skill>/examples/plan-builder-example.py   -> work/lovehandles.json, work/wallsit.json
Then check each plan with check_plan.py and make_video.py check. Copy the structure, never the phrases."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
from plan_lib import *
os.makedirs("work", exist_ok=True)


make("lovehandles", "Love handles won't leave? Stop doing side crunches",
     ["love", "handles", "crunches", "fat", "spot", "planks", "elbow", "hips", "thirty", "deficit", "walks", "side"],
     ["You can't burn fat", "Send this to"], [
    auto("hook", "start", "none", [
        b("start", "LOVE HANDLES", "marquee", clip="clip_side_plank"),
        b("They're still there", "STILL THERE", "echo", c=R, img="hero_measuring_waist", impact_=True, size=200),
    ], hook=True, shakes=["They're still there"]),
    auto("truth", "You can't burn fat-0.1", "red", [
        b("You can't burn fat", None, img="hero_stop_palm", strike_="ONE SPOT"),
        b("Love handles shrink", "BODY FAT", c=G, img="hero_measuring_waist"),
    ]),
    auto("do", "But side planks make-0.1", "none", [
        b("But side planks make", "SIDE PLANKS", clip="clip_side_plank"),
        b("Lie on your side", "ELBOW UNDER", clip="clip_side_plank"),
        b("and lift your hips", "HIPS UP", c=G, clip="clip_side_plank"),
        b("Hold thirty seconds", "30 SEC EACH", "echo", clip="clip_side_plank", size=190),
    ]),
    auto("plan", "Pair it with-0.1", "grid", [
        b("Pair it with", "DEFICIT", c=G, img="hero_grocery_bag"),
        b("and daily walks", "WALK DAILY", "echo", c=G, img="hero_walking", size=190),
    ], tr="zoom"),
    cta("hero_facepalm", "doing side crunches", "SIDE CRUNCHES", "CRUNCHES...", echo_at="Because you do"),
], [("They're still there", "sfx_hammer"), ("You can't burn fat", "sfx_get_out"), ("Love handles shrink", "sfx_ding"),
    ("and lift your hips", "sfx_whip"), ("Hold thirty seconds", "sfx_counter"), ("and daily walks", "sfx_running")],
    "doing side crunches", "Because you do")

make("wallsit", "How long can you hold a wall sit?",
     ["wall", "sit", "legs", "strong", "ninety", "weak", "average", "minutes", "holds", "five", "comment", "time"],
     ["This simple test", "Comment your time"], [
    auto("hook", "start", "none", [
        b("start", "WALL SIT • WALL SIT", "marquee", clip="clip_squat", rate=0.5),
        b("can you hold#1", "HOW LONG?", "echo", img="hero_check_watch", impact_=True),
    ], hook=True, shakes=["can you hold#1"]),
    auto("test", "This simple test-0.1", "green", [
        b("This simple test", "THE TEST", img="hero_clipboard"),
        b("how strong your legs", "LEG STRENGTH", c=G, img="hero_squat_mid"),
    ]),
    auto("how", "Back flat against-0.1", "yellow", [
        b("Back flat against", "BACK FLAT", img="hero_lean_wall"),
        b("Slide down until", "90°", img="hero_squat_mid", size=300),
    ]),
    auto("levels", "Under thirty seconds-0.1", "grid", [
        b("Under thirty seconds", "WEAK", c=R, img="hero_beginner"),
        b("Thirty to sixty", "AVERAGE", img="hero_shrug"),
        b("One to two minutes", "STRONG", c=G, img="hero_double_biceps"),
        b("Over two minutes", "VERY STRONG", c=G, img="hero_victory", impact_=True),
    ], tr="zoom"),
    auto("improve", "To improve, do three-0.1", "green", [
        b("To improve, do three", "3 HOLDS A DAY", img="hero_count_3", size=150),
        b("and add five seconds", "+5 SEC", "echo", c=G, img="hero_thumbs_up"),
        b("Comment your time", "COMMENT", img="hero_point_viewer"),
    ]),
    cta("hero_smirk", "who says his legs", "SAYS HE'S STRONG", "WALL SIT...", echo_at="Because how long", send="And send this to"),
], [("can you hold#1", "sfx_hammer"), ("how strong your legs", "sfx_ding"), ("Slide down until", "sfx_stretch"),
    ("Thirty to sixty", "sfx_click"), ("Over two minutes", "sfx_lion_roar"), ("and add five seconds", "sfx_coin"),
    ("Comment your time", "sfx_notification")],
    "who says his legs", "Because how long")

