import re, sys
sys.path.insert(0, sys.argv[1]); from data import A, B
hl = lambda s: re.sub(r"\*(.+?)\*", r'<span class="hl">\1</span>', s)
css = open(sys.argv[1] + "/day1.html").read().split("<style>")[1].split("</style>")[0]
css += """
.fit{white-space:nowrap;display:inline-block;transform-origin:0 50%}
.cfit{white-space:nowrap;display:inline-block;transform-origin:50% 50%}
"""
walls = '<div class="shd" style="left:120px;width:240px"></div><div class="shd" style="left:780px;width:240px"></div>'
out = []
for d in range(1, 31):
    if d in A:
        title, rows = A[d]
        lst = "".join(f'<div class="fit" data-w="560" style="margin-bottom:22px"><span class="anton strike" style="font-size:66px;color:#999">{p}</span><span style="font:900 56px Inter;color:#111;margin:0 18px">&#8594;</span><span class="anton" style="font-size:66px;background:#FFE500;padding:0 14px;color:#111">{f}</span></div><br>' for p, f in rows)
        out.append(f'''<div class="c wall" id="d{d}">{walls}
 <div class="a" style="left:0;right:0;top:300px;text-align:center"><span class="day">DAY {d}/30 · SUBSCRIPTION BAND KARO</span></div>
 <div class="a anton" style="left:0;right:0;top:400px;text-align:center;font-size:150px;color:var(--ink)">{hl(title)}</div>
 <div class="a" style="left:70px;top:{760 if len(rows) > 3 else 800}px">{lst}</div>
 <img class="a m" src="02-shocked.webp" style="right:-40px;top:900px;width:560px">
 <div class="a brand" style="left:70px;top:1560px"><img src="icon.png"><span>@FREESTACK.AI</span></div></div>''')
    else:
        chips, top, big, bottom = B[d]
        ch = "".join(f'<span class="strike" style="font:800 44px Inter;color:#666;background:#fff;padding:10px 24px;border-radius:40px;box-shadow:0 8px 18px rgba(0,0,0,.12)">{c}</span>' for c in chips)
        pose = "15-point-viewer.webp" if d % 2 == 0 else "02-shocked.webp"
        out.append(f'''<div class="c wall" id="d{d}">{walls}
 <div class="a" style="left:0;right:0;top:300px;text-align:center"><span class="day">DAY {d}/30</span></div>
 <div class="a" style="left:40px;right:40px;top:400px;display:flex;flex-wrap:wrap;justify-content:center;gap:16px">{ch}</div>
 <div class="a" style="left:0;right:0;top:{570 if chips else 450}px;text-align:center"><span class="anton cfit" data-w="980" style="font-size:120px;color:var(--ink)">{top}</span></div>
 <div class="a" style="left:0;right:0;top:{700 if chips else 590}px;text-align:center"><span class="anton cfit" data-w="900" style="font-size:300px;line-height:1"><span class="hl" style="padding:10px 40px 0;transform:rotate(-3deg);box-shadow:16px 16px 0 var(--ink)">{big}</span></span></div>
 <div class="a" style="left:0;right:0;top:{1040 if chips else 930}px;text-align:center"><span class="anton cfit" data-w="980" style="font-size:96px;color:var(--ink)">{bottom}</span></div>
 <img class="a m" src="{pose}" style="left:265px;top:{1150 if chips else 1060}px;width:550px"></div>''')
html = f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@600;800;900&display=swap" rel="stylesheet">
<style>{css}</style></head><body>{"".join(out)}
<script>
document.fonts.ready.then(()=>{{document.querySelectorAll('.fit,.cfit').forEach(e=>{{const w=+e.dataset.w,s=Math.min(1,w/e.scrollWidth);e.style.transform=`scale(${{s}})`;}});document.body.dataset.ready=1;}});
</script></body></html>'''
open(sys.argv[1] + "/all.html", "w").write(html)
