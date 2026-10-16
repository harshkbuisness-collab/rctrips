import sys; sys.path.insert(0, sys.argv[1]); from data import C, D
CSS = """
*{margin:0;padding:0;box-sizing:border-box}body{background:#777}
.c{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:Inter}
.a{position:absolute}.anton{font-family:Anton;text-transform:uppercase;line-height:.95}
.cx{left:0;right:0;text-align:center}
.fit{display:inline-block;white-space:nowrap;transform-origin:50% 50%;width:max-content}
.lf{transform-origin:0 50%}
.out{color:#fff;text-shadow:6px 0 #111,-6px 0 #111,0 6px #111,0 -6px #111,4px 4px #111,-4px -4px #111,4px -4px #111,-4px 4px #111,16px 16px 0 #111}
.hy{background:#FFE500;color:#111;padding:6px 28px 0;display:inline-block;box-shadow:14px 14px 0 #111;border:6px solid #111}
.day{display:inline-block;font:400 46px Anton;background:#111;color:#FFE500;padding:8px 26px;border-radius:14px;letter-spacing:.02em;border:4px solid #fff}
.rays{position:absolute;inset:-400px;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,.13) 0 7deg,transparent 7deg 14deg)}
.dots{position:absolute;inset:0;background:radial-gradient(rgba(0,0,0,.16) 2.4px,transparent 3px) 0 0/28px 28px}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 40%,rgba(0,0,0,.35) 100%)}
.badge{width:250px;height:250px;border-radius:50%;background:#fff;border:10px solid #111;display:flex;align-items:center;justify-content:center;font:400 86px Anton;color:#E52B2B;box-shadow:12px 12px 0 #111}
.strike{position:relative;display:inline-block}.strike:after{content:'';position:absolute;left:-14px;right:-14px;top:46%;height:20px;background:#111;border-radius:10px;transform:rotate(-4deg)}
.chip{display:inline-block;font:800 48px Inter;background:#fff;color:#555;padding:10px 28px;border-radius:40px;border:5px solid #111;position:relative}
.chip:after{content:'';position:absolute;left:10px;right:10px;top:47%;height:9px;background:#E52B2B;border-radius:5px;transform:rotate(-6deg)}
.phone{width:470px;height:836px;border-radius:64px;background:#0b0b0b;padding:20px;box-shadow:0 0 0 6px #fff,0 40px 80px rgba(0,0,0,.55),0 0 120px rgba(255,229,0,.35)}
.phone img{width:430px;height:796px;object-fit:cover;object-position:top;border-radius:46px;display:block}
.brand{display:flex;align-items:center;gap:12px;font:400 38px Anton;color:#fff;text-shadow:3px 3px 0 #111}
.brand img{width:56px;height:56px;border-radius:12px;border:3px solid #fff}
"""
def day(d, top=300): return f'<div class="a cx" style="top:{top}px"><span class="day">DAY {d}/30 &#183; SUBSCRIPTION BAND KARO</span></div>'
def bg(col): return f'<div class="a" style="inset:0;background:{col}"></div><div class="rays"></div><div class="dots"></div><div class="vig"></div>'
brand = '<div class="a brand" style="left:50px;top:1560px"><img src="icon.png"><span>@FREESTACK.AI</span></div>'
def pop(d, col, f):
    return f'''{bg(C[col])}{day(d)}
<div class="a cx" style="top:400px"><span class="anton out fit" data-w="980" style="font-size:125px">{f["l1"]}</span></div>
<div class="a cx" style="top:560px"><span class="fit" data-w="860"><span class="anton hy" style="font-size:230px;transform:rotate(-3deg)">{f["l2"]}</span></span></div>
<div class="a cx" style="top:880px"><span class="anton out fit" data-w="960" style="font-size:66px">{f["l3"]}</span></div>
<img class="a" src="st/{f["pose"]}.png" style="left:150px;top:990px;width:780px">
<div class="a badge" style="left:770px;top:1000px;transform:rotate(12deg)">{f["badge"]}</div>{brand}'''
def split(d, col, f):
    return f'''<div class="a" style="inset:0;background:#FFE500"></div><div class="dots"></div>
<div class="a" style="inset:0;background:#E52B2B;clip-path:polygon(0 0,100% 0,100% 47%,0 55%)"><div class="rays"></div></div>
{day(d)}
<div class="a cx" style="top:400px"><span class="anton out fit" data-w="980" style="font-size:120px">{f["head"]}</span></div>
<div class="a" style="left:60px;top:580px"><span class="day" style="background:#fff;color:#E52B2B;border-color:#111">PAID</span></div>
<div class="a" style="left:60px;top:680px"><span class="anton out fit lf strike" data-w="600" style="font-size:150px">{f["paid"]}</span></div>
<div class="a" style="left:330px;top:900px;width:190px;height:190px;border-radius:50%;background:#111;border:10px solid #fff;display:flex;align-items:center;justify-content:center;font:400 90px Anton;color:#FFE500;transform:rotate(-8deg)">VS</div>
<div class="a" style="left:60px;top:1130px"><span class="day">FREE &#183; OPEN SOURCE</span></div>
<div class="a" style="left:60px;top:1230px"><span class="fit lf" data-w="560"><span class="anton hy" style="font-size:150px;background:#fff">{f["free"]}</span></span></div>
<img class="a" src="st/{f["pose"]}.png" style="left:560px;top:820px;width:560px">
<div class="a" style="left:60px;top:1500px;font:400 70px Anton;color:#111">&#8377;0 / MONTH</div>'''
def screen(d, col, f):
    return f'''<div class="a" style="inset:0;background:linear-gradient(160deg,{C[col]} 0%,#0b0b14 75%)"></div><div class="rays" style="opacity:.5"></div><div class="dots" style="opacity:.6"></div>
{day(d)}
<div class="a cx" style="top:395px"><span class="anton out fit" data-w="980" style="font-size:115px">{f["l1"]}</span></div>
<div class="a cx" style="top:530px"><span class="fit" data-w="860"><span class="anton hy" style="font-size:170px;transform:rotate(-2deg)">{f["l2"]}</span></span></div>
<div class="a phone" style="left:300px;top:790px;transform:rotate(6deg)"><img src="fr/f{d:02d}.jpg"></div>
<img class="a" src="st/{f["pose"]}.png" style="left:-60px;top:1060px;width:560px">
<div class="a" style="left:720px;top:1480px;transform:rotate(-8deg)"><span class="day" style="background:#FFE500;color:#111;border-color:#111;font-size:50px">&#9654; DEMO</span></div>'''
def sign(d, col, f):
    chip = f'<div class="a" style="left:40px;top:420px;transform:rotate(-10deg)"><span class="chip">{f["chip"]}</span></div><div class="a" style="right:40px;top:470px;transform:rotate(9deg)"><span class="day" style="background:#fff;color:#111;border-color:#111">&#8594; FREE</span></div>' if f["chip"] else ""
    return f'''{bg(C[col])}<div class="a cx" style="top:1550px"><span class="day">DAY {d}/30 &#183; SUBSCRIPTION BAND KARO</span></div>
{chip}
<img class="a" src="st/11-sign.png" style="left:90px;top:200px;width:900px">
<div class="a" style="left:220px;top:1002px;width:651px;height:482px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;transform:rotate(-1deg)">
  <span class="anton fit" data-w="600" style="font-size:86px;color:#111">{f["s1"]}</span>
  <span class="anton fit" data-w="610" style="font-size:230px;color:#E52B2B;line-height:.9">{f["s2"]}</span></div>'''
def warn(d, col, f):
    stripe = 'background:repeating-linear-gradient(-45deg,#FFE500 0 60px,#111 60px 120px)'
    return f'''<div class="a" style="inset:0;background:#111"></div><div class="dots" style="opacity:.5"></div>
<div class="a" style="left:0;right:0;top:0;height:230px;{stripe}"></div><div class="a" style="left:0;right:0;bottom:0;height:230px;{stripe}"></div>
{day(d)}
<svg class="a" style="left:400px;top:390px" width="280" height="250" viewBox="0 0 28 25"><path d="M14 1L27 24H1Z" fill="#E52B2B" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><rect x="12.7" y="8" width="2.6" height="9" rx="1.2" fill="#fff"/><circle cx="14" cy="20.3" r="1.5" fill="#fff"/></svg>
<div class="a cx" style="top:670px"><span class="anton out fit" data-w="980" style="font-size:135px">{f["l1"]}</span></div>
<div class="a cx" style="top:830px"><span class="fit" data-w="860"><span class="anton hy" style="font-size:200px;background:#E52B2B;color:#fff;transform:rotate(-3deg)">{f["l2"]}</span></span></div>
<img class="a" src="st/{f["pose"]}.png" style="left:200px;top:1100px;width:680px">'''
T = dict(pop=pop, split=split, screen=screen, sign=sign, warn=warn)
body = "".join(f'<div class="c" id="d{d}">{T[t](d, col, f)}</div>' for d, (t, col, f) in sorted(D.items()))
html = f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@600;800;900&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{body}
<script>document.fonts.ready.then(()=>{{document.querySelectorAll('.fit').forEach(e=>{{const w=+e.dataset.w,s=Math.min(1,w/e.getBoundingClientRect().width);e.style.transform=(e.style.transform||'')+` scale(${{s}})`;}});document.body.dataset.ready=1;}});</script>
</body></html>'''
open(sys.argv[1] + "/all.html", "w").write(html)
