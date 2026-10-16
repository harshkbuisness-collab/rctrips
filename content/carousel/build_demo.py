import sys
S = [
 ("cover", dict(kicker="Google Photos ka free alternative", title="Immich: apni photos,<br>apna <mark>cloud</mark>", sub="Setup guide, step by step. Save kar lo, kaam aayega.", chips=["Free & open source", "AI search", "Auto backup", "No monthly plan"])),
 ("list", dict(tag="Kya hai", head="Immich kya karta hai?", items=[
    ("Auto backup", "Phone ki saari photos aur videos automatic tumhare apne computer ya server pe."),
    ("AI search", "Likho <u>beach</u>, <u>dog</u> ya <u>cake</u>, aur woh photos turant saamne."),
    ("Face albums", "Chehre pehchaan ke har insaan ka album khud banata hai."),
    ("Sharing", "Family ke saath albums share karo, Google Photos jaisa.")],
   note="<b>Seedhi baat:</b> photos tumhare paas rehti hain. Na storage plan, na monthly bill.")),
 ("table", dict(tag="Comparison", head="Google Photos vs Immich", rows=[("Storage", "15 GB free, phir monthly plan", "Jitni tumhari hard disk"), ("Data kahan", "Google ke server", "Tumhare apne device pe"), ("AI search", "Haan", "Haan (local AI)"), ("Kharcha", "Har mahine", "&#8377;0 software")],
   note="<b>Catch:</b> server tumhe khud chalana hota hai. Next slide pe dekho kya chahiye.")),
 ("list", dict(tag="Requirements", head="Shuru karne se pehle", items=[
    ("Ek computer jo on rahe", "Purana laptop, mini PC ya NAS. Ye tumhara photo server banega."),
    ("RAM aur CPU", "Kam se kam <u>6 GB RAM</u> aur 2 cores. 8 GB + 4 cores better."),
    ("Docker", "Linux, Mac, ya Windows (WSL2 ke saath) pe Docker install."),
    ("Storage", "Photos ke hisaab se badi hard disk.")],
   note="<b>Tip:</b> sab kuch ek hi WiFi pe ho toh setup sabse aasaan.")),
 ("steps", dict(tag="Setup", head="Install: 4 steps", items=[
    ("Folder banao", "<code>mkdir immich && cd immich</code>"),
    ("2 files download karo", "<code>docker-compose.yml</code> aur <code>example.env</code> (rename to <code>.env</code>), Immich ki GitHub releases se."),
    (".env edit karo", "<code>UPLOAD_LOCATION</code> (photos kahan) aur <code>DB_PASSWORD</code> set karo."),
    ("Start karo", "<code>docker compose up -d</code>, phir browser mein <code>http://IP:2283</code>")],
   note="<b>Exact commands:</b> immich.app ke official docs mein. Wahi follow karo.")),
 ("steps", dict(tag="Phone", head="Phone se connect karo", items=[
    ("Admin account banao", "Pehli baar website khologe toh account banane ko bolega."),
    ("App install karo", "Play Store / App Store se <u>Immich</u> app."),
    ("Server URL daalo", "Wahi <code>http://IP:2283</code> aur login."),
    ("Backup on karo", "Albums chuno, backup ON. Ho gaya!")],
   note="<b>Pehla backup</b> time leta hai. Phone ko charging aur WiFi pe chhod do.")),
 ("cta", dict(head="Kaam ka laga?", lines=["<mark>Save</mark> kar lo, setup ke time kaam aayega", "Us dost ko bhejo jiska <u>storage full</u> hai", "Roz ek naya free AI tool &#8594; <b>@freestack.ai</b>"], kw="PHOTOS", kwline="Link chahiye? Comment karo")),
]
N = len(S)
CSS = """
*{margin:0;padding:0;box-sizing:border-box}
body{background:#888}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:Kalam,cursive;color:#1a1a1a;
 background:#fbfaf5;background-image:linear-gradient(#e4e4ea 1.5px,transparent 1.5px),linear-gradient(90deg,#e4e4ea 1.5px,transparent 1.5px);background-size:36px 36px}
.a{position:absolute}
.stamp{right:44px;top:40px;display:flex;align-items:center;gap:14px;background:#fff;border:3px solid #111;border-radius:14px;padding:10px 18px 10px 10px;transform:rotate(2deg);box-shadow:5px 5px 0 #111}
.stamp img{width:74px;height:74px}
.stamp b{font:700 30px Kalam;display:block;line-height:1}.stamp i{font:400 22px Kalam;color:#c62828;font-style:normal}
.tag{left:60px;top:58px;font:700 26px Kalam;color:#c62828;border-bottom:3px dashed #c62828}
h1{font-family:Caveat,cursive;font-weight:700;font-size:96px;line-height:1;color:#111}
h2{font-family:Caveat,cursive;font-weight:700;font-size:84px;line-height:1;color:#111;display:inline-block;position:relative}
.sq{display:block;height:20px;margin-top:6px;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20'><path d='M0 10 Q10 0 20 10 T40 10' fill='none' stroke='%23d32f2f' stroke-width='5'/></svg>") repeat-x}
mark{background:linear-gradient(transparent 35%,#FFE500 35%,#FFE500 92%,transparent 92%);color:inherit;padding:0 6px}
u{text-decoration:none;background:linear-gradient(transparent 70%,#FFE500 70%)}
code{font:700 26px 'Courier New',monospace;background:#111;color:#FFE500;padding:2px 10px;border-radius:6px}
.item{display:flex;gap:26px;margin-bottom:38px}
.num{flex:none;width:62px;height:62px;border-radius:50%;background:#111;color:#FFE500;font:700 36px Kalam;display:flex;align-items:center;justify-content:center;margin-top:4px}
.it b{font:700 42px Kalam;display:block;line-height:1.15}
.it p{font:400 32px/1.35 Kalam;color:#b71c1c;margin-top:6px}
.note{left:60px;right:60px;bottom:130px;border:3px dashed #3b3b8f;border-radius:18px;padding:22px 28px;font:400 30px/1.35 Kalam;background:#fff}
.foot{left:60px;right:60px;bottom:48px;display:flex;align-items:center;justify-content:space-between;font:700 34px Caveat;color:#c62828}
.dots{display:flex;gap:10px}.dots i{width:16px;height:16px;border-radius:50%;border:3px solid #111}.dots i.on{background:#111}
.cnt{color:#555;font:400 28px Kalam}
table{width:100%;border-collapse:collapse;font:400 30px/1.3 Kalam;background:#fff}
td,th{border:3px solid #111;padding:16px 18px;text-align:left;vertical-align:top}
th{font:700 32px Kalam;background:#FFE500}
td:first-child{font-weight:700}td:last-child{color:#1b5e20;font-weight:700}
.chip{display:inline-block;font:700 30px Kalam;border:3px solid #111;border-radius:40px;padding:6px 22px;margin:0 12px 14px 0;background:#fff}
"""
def foot(i):
    dots = "".join(f'<i class="{"on" if k==i else ""}"></i>' for k in range(N))
    right = "Swipe &#8594;" if i < N-1 else ""
    return f'<div class="a foot"><div class="dots">{dots}</div><span class="cnt">{i+1}/{N}</span><span>{right}</span></div>'
stamp = '<div class="a stamp"><img src="stamp.png"><div><b>FreeStack AI</b><i>@freestack.ai</i></div></div>'
def head(d, top=170):
    return f'<div class="a" style="left:60px;right:60px;top:{top}px"><h2>{d["head"]}<span class="sq"></span></h2></div>'
out = []
for i, (k, d) in enumerate(S):
    h = ""
    if k == "cover":
        chips = "".join(f'<span class="chip">{c}</span>' for c in d["chips"])
        h = f'''<div class="a" style="left:60px;top:70px;font:700 34px Kalam;color:#c62828">&#9998; {d["kicker"]}</div>
<img class="a" src="stamp.png" style="right:60px;top:260px;width:250px;transform:rotate(6deg);filter:drop-shadow(6px 6px 0 #111)">
<div class="a" style="left:60px;right:60px;top:560px"><h1>{d["title"]}</h1><span class="sq" style="width:520px"></span></div>
<div class="a" style="left:60px;right:120px;top:830px;font:400 38px/1.35 Kalam;color:#b71c1c">{d["sub"]}</div>
<div class="a" style="left:60px;right:60px;top:960px">{chips}</div>
<div class="a" style="left:60px;right:60px;top:1160px;border-top:4px solid #111"></div>'''
        h += foot(i).replace("Swipe &#8594;", "Swipe to learn &#8594;")
    elif k in ("list", "steps"):
        items = "".join(f'<div class="item"><div class="num">{n+1}</div><div class="it"><b>{t}</b><p>{p}</p></div></div>' for n, (t, p) in enumerate(d["items"]))
        h = f'{stamp}<div class="a tag">&#9733; {d["tag"]}</div>{head(d)}<div class="a" style="left:60px;right:60px;top:340px">{items}</div><div class="a note">{d["note"]}</div>{foot(i)}'
    elif k == "table":
        rows = "".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in d["rows"])
        h = f'{stamp}<div class="a tag">&#9733; {d["tag"]}</div>{head(d)}<div class="a" style="left:60px;right:60px;top:360px"><table><tr><th></th><th>Google Photos</th><th>Immich</th></tr>{rows}</table></div><div class="a note">{d["note"]}</div>{foot(i)}'
    elif k == "cta":
        lines = "".join(f'<div class="item"><div class="num">&#10003;</div><div class="it"><b style="font-weight:400">{l}</b></div></div>' for l in d["lines"])
        h = f'''{stamp}<div class="a" style="left:60px;right:60px;top:200px"><h1 style="font-size:120px">{d["head"]}</h1><span class="sq" style="width:560px"></span></div>
<div class="a" style="left:60px;right:60px;top:440px">{lines}</div>
<div class="a" style="left:60px;right:60px;top:860px;text-align:center;border:4px solid #111;border-radius:24px;background:#fff;padding:30px;box-shadow:10px 10px 0 #FFE500">
 <div style="font:700 44px Kalam;color:#c62828">{d["kwline"]}</div><div style="font:700 130px Caveat;line-height:1.1"><mark>&quot;{d["kw"]}&quot;</mark></div></div>{foot(i)}'''
    out.append(f'<div class="s" id="s{i+1}">{h}</div>')
html = f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Kalam:wght@400;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{"".join(out)}<script>document.fonts.ready.then(()=>document.body.dataset.ready=1)</script></body></html>'''
open(sys.argv[1] + "/carousel.html", "w").write(html)
print(N)
