"""Clean data charts for a video, in the look of the charts Casual Finance shows (a title, a short subtitle, the
source under it, one thing marked in red). The video shows them like screenshots: doc:ch_<key>.png

Usage: python3 tools/make_charts.py videos/<slug>       (reads 01_script/charts.json, writes 02_assets/screens/ch_*.png)
charts.json: [{"key": "dow", "type": "line" | "bars", "title": "...", "sub": "...", "source": "...",
               "x": [...], "y": [...], "unit": "$", "mark": [index, ...], "notes": {"index": "text"}}]
"""
import json, os, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

for f in ("/usr/share/fonts/opentype/inter/Inter-Regular.otf", "/usr/share/fonts/opentype/inter/Inter-Bold.otf"):
    if os.path.exists(f):
        font_manager.fontManager.addfont(f)
plt.rcParams.update({"font.family": "Inter", "font.size": 15, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.edgecolor": "#888", "axes.labelcolor": "#444", "xtick.color": "#444", "ytick.color": "#444"})
NAVY, GREY, RED, GREEN = "#1f3a5f", "#b9b9b9", "#d62728", "#2e9e44"


def fmt(v, unit):
    if unit == "$":
        return f"${v:,.0f}" if v >= 10 else f"${v:,.2f}".rstrip("0").rstrip(".")
    if unit == "$B":
        return f"${v:,.1f}B".replace(".0B", "B")
    if unit == "%":
        return f"{v:g}%"
    return f"{v:,.0f}"


def chart(c, out):
    fig, ax = plt.subplots(figsize=(12.8, 7.2), dpi=125)
    fig.subplots_adjust(left=0.08, right=0.97, top=0.8, bottom=0.17)
    x, y, mark = c["x"], c["y"], set(c.get("mark", []))
    if c["type"] == "line":
        ax.plot(x, y, color=NAVY, lw=3)
        for i in mark:
            ax.scatter([x[i]], [y[i]], s=90, color=RED, zorder=5)
        for i, t in c.get("notes", {}).items():
            i = int(i)
            ax.annotate(t, (x[i], y[i]), xytext=(0, 18 if y[i] > min(y) * 1.5 else -34), textcoords="offset points",
                        ha="right" if i == len(x) - 1 else "left" if i == 0 else "center", fontsize=15, fontweight="bold", color=RED)
        ax.grid(axis="y", color="#e6e6e6")
    else:
        cols = [c.get("colors", {}).get(str(i)) or (RED if i in mark else NAVY if mark else NAVY) for i in range(len(y))]
        if mark:
            cols = [cl if i in mark else GREY for i, cl in enumerate(cols)]
        bars = ax.bar([str(v) for v in x], y, color=cols, width=0.62)
        for b, v in zip(bars, y):
            ax.text(b.get_x() + b.get_width() / 2, b.get_height(), fmt(v, c.get("unit", "")), ha="center",
                    va="bottom", fontsize=16, fontweight="bold", color="#222")
        ax.set_yticks([])
        ax.spines["left"].set_visible(False)
    fig.text(0.08, 0.92, c["title"], fontsize=26, fontweight="bold", color="#111")
    fig.text(0.08, 0.86, c.get("sub", ""), fontsize=15, color="#555")
    fig.text(0.08, 0.05, "Source: " + c["source"], fontsize=12, color="#777")
    fig.savefig(out, facecolor="white")
    plt.close(fig)


def main(vdir):
    spec = json.load(open(os.path.join(vdir, "01_script", "charts.json")))
    out = os.path.join(vdir, "02_assets", "screens")
    os.makedirs(out, exist_ok=True)
    for c in spec:
        chart(c, os.path.join(out, f"ch_{c['key']}.png"))
    print(f"{len(spec)} charts -> {out}")


if __name__ == "__main__":
    main(sys.argv[1])
