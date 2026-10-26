"""Build research/06-topics-and-scripts.xlsx from the plan and scripts/dayNN_*.md.

Usage: python3 tools/sheet/build_sheet.py
"""
import glob, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from plan_rows import ROWS
from parse_script import parse, voice_text
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "research", "06-topics-and-scripts.xlsx")
FILL = PatternFill("solid", fgColor="1F3864")
WRAP = Alignment(wrap_text=True, vertical="top")


def style(ws, widths, freeze="A2"):
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF"); c.fill = FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = WRAP
    ws.freeze_panes = freeze


def day1_old():
    """Day 1 was written before the v2 format; read its markdown style."""
    d = {"day": 1, "lines": [], "sources": [], "titles": "", "thumbnail": "", "thread": "a $1,000 investment in Sept 1929"}
    txt = open(os.path.join(ROOT, "videos/2026-11_day01_1929_crash/01_script/script.md"), encoding="utf-8").read()
    chap = None
    clean = lambda x: re.sub(r"\*+|`", "", x).strip()
    for l in (x.strip() for x in txt.splitlines()):
        if l.startswith("## "):
            if re.search(r"evidence|sources", l, re.I):
                chap = "SRC"; continue
            chap = l[3:]; continue
        if chap == "SRC":
            if l.startswith("- "):
                d["sources"].append(clean(l[2:]))
            continue
        if chap is None or not l or l.startswith(("#", ">", "|", "---")):
            continue
        m = re.match(r"^\*?\[VISUAL:?\s*(.*?)\]\*?$", l, re.I)
        if m:
            if d["lines"]:
                d["lines"][-1]["visual"] = (d["lines"][-1]["visual"] + " " + clean(m.group(1))).strip()
            continue
        tag = ""
        m = re.match(r"^\[(\w+)\]\s*(.*)$", l)
        if m:
            tag, l = m.group(1), m.group(2)
        d["lines"].append({"chap": chap, "tag": tag, "text": clean(l), "visual": "", "screen": ""})
    d["words"] = sum(len(x["text"].split()) for x in d["lines"])
    d["screens"] = 20  # Day 1 shows 22 real screenshots/photos (see its SOURCES.md)
    return d


scripts = {1: day1_old()}
for p in sorted(glob.glob(os.path.join(ROOT, "scripts", "day*.md"))):
    d = parse(p)
    if d["day"]:
        d["file"] = os.path.relpath(p, ROOT)
        scripts[d["day"]] = d

wb = Workbook()
h = wb.active; h.title = "How to use"
for l in ["How to use this sheet",
          "1. Google Sheets > File > Import > Upload this file.",
          "2. '30 Topics': one row per video. Column 'Your decision' has Approve / Change / Reject.",
          "3. 'Day 01' ... 'Day 30': the full script, line by line: what the voice says, what moves on screen, and which real screenshot to show.",
          "4. 'Voice text': the whole spoken script for each day in one cell, already in \"quotes\" with [emotion] tags, ready to paste into Voice Studio.",
          "5. Each Day tab ends with its sources. Lines marked VERIFY must be checked before recording.",
          "Style: calm, simple storytelling, one thread from start to end, a real screenshot about every 30-40 seconds."]:
    h.append([l])
h.column_dimensions["A"].width = 120; h["A1"].font = Font(bold=True, size=14)

ws = wb.create_sheet("30 Topics")
ws.append(["Day", "Working title", "Title ideas", "Thumbnail", "Type", "Story thread", "Opening line",
           "Chapters", "Spoken words", "Minutes (150 wpm)", "Real screenshots", "Claims to VERIFY",
           "Proven by (competitor views)", "Script status", "Your decision", "Your notes"])
for r in ROWS:
    day = r[0]; d = scripts.get(day)
    if d:
        chaps = list(dict.fromkeys(x["chap"] for x in d["lines"]))
        ver = sum("VERIFY" in s.upper() for s in d["sources"])
        ws.append([day, d.get("title") or r[1], d["titles"] or r[2], d["thumbnail"] or r[3], r[4], d["thread"],
                   d["lines"][0]["text"] if d["lines"] else "", "\n".join(chaps), d["words"],
                   round(d["words"] / 150, 1), d["screens"], ver, r[9],
                   "Video made" if day == 1 else "Full script ready", "", ""])
    else:
        ws.append([day, r[1], r[2], r[3], r[4], "", r[5], r[6], "", "", "", "", r[9], "Outline only", "", ""])
style(ws, [5, 32, 34, 22, 11, 26, 45, 34, 9, 9, 10, 9, 22, 14, 12, 28], "C2")
dv = DataValidation(type="list", formula1='"Approve,Change,Reject"', allow_blank=True)
ws.add_data_validation(dv); dv.add(f"O2:O{len(ROWS) + 1}")

v = wb.create_sheet("Voice text")
v.append(["Day", "Title", "Whole spoken script for Voice Studio (copy the cell)"])
for day in sorted(scripts):
    d = scripts[day]
    v.append([day, d.get("title") or ROWS[day - 1][1], voice_text(d)])
style(v, [5, 30, 140])

for day in sorted(scripts):
    d = scripts[day]
    s = wb.create_sheet(f"Day {day:02d}")
    s.append(["#", "Chapter", "Emotion", "What the voice says", "What moves on screen", "Real screenshot (source | URL | highlight)"])
    for i, x in enumerate(d["lines"], 1):
        s.append([i, x["chap"], x["tag"], x["text"], x["visual"], x["screen"]])
    s.append([]); s.append(["", "SOURCES"])
    s.cell(row=s.max_row, column=2).font = Font(bold=True)
    for src in d["sources"]:
        s.append(["", "", "", src])
    style(s, [5, 24, 9, 70, 50, 50])

wb.save(OUT)
print(f"{len(scripts)} scripts -> {OUT}")
for day in sorted(scripts):
    d = scripts[day]
    print(day, d["words"], "words", d["screens"], "screens")
