import sys, re
sys.path.insert(0, __import__("os").path.dirname(__file__))
from plan_rows import ROWS
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

wb = Workbook()
ws = wb.active; ws.title = "30 Topics"
hdr = ["Day","Working title","Other title ideas","Thumbnail text","Type","Opening hook (first line)","Chapter outline","Facts to check on the day","Evidence / screenshots to use","Proven by (competitor views)","Length","Script status","Your decision","Your notes"]
ws.append(hdr)
for r in ROWS:
    status = "Full script written (see 'Day 1 script' tab)" if r[0]==1 else "Outline only"
    ws.append(list(r[:5]) + [r[5], r[6], r[7], r[8], r[9], "~14 min", status, "", ""])
widths = [6,34,34,20,12,45,48,40,42,26,9,22,14,30]
for i,w in enumerate(widths): ws.column_dimensions[chr(65+i)].width = w
fill = PatternFill("solid", fgColor="1F3864")
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF"); c.fill = fill
    c.alignment = Alignment(wrap_text=True, vertical="center")
for row in ws.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
ws.freeze_panes = "C2"
dv = DataValidation(type="list", formula1='"Approve,Change,Reject"', allow_blank=True)
ws.add_data_validation(dv); dv.add(f"M2:M{len(ROWS)+1}")

s = wb.create_sheet("Day 1 script")
s.append(["#","Chapter","Voice tag","Script (what the voice says)","Picture on screen"])
txt = open("/home/user/rctrips/videos/2026-11_day01_1929_crash/01_script/script.md").read()
chap = None; n = 0
def clean(x): return re.sub(r"\*+|`", "", x).strip()
for line in txt.splitlines():
    l = line.strip()
    if l.startswith("## "):
        h = l[3:]
        if re.search(r"evidence|sources", h, re.I): break
        chap = h; continue
    if chap is None or not l or l.startswith(("#", ">", "|", "---")): continue
    m = re.match(r"^\*?\[VISUAL:?\s*(.*?)\]\*?$", l, re.I)
    if m:
        if n: s.cell(row=n+1, column=5).value = ((s.cell(row=n+1, column=5).value or "") + " " + clean(m.group(1))).strip()
        continue
    tag = ""
    m = re.match(r"^\[(\w+)\]\s*(.*)$", l)
    if m: tag, l = m.group(1), m.group(2)
    n += 1; s.append([n, chap, tag, clean(l), ""])
for k,w in zip("ABCDE",[5,28,10,80,50]): s.column_dimensions[k].width = w
for c in s[1]: c.font = Font(bold=True, color="FFFFFF"); c.fill = fill
for row in s.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
s.freeze_panes = "A2"

h = wb.create_sheet("How to use")
for l in ["How to use this sheet",
 "1. Open Google Sheets > File > Import > Upload this file > 'Replace spreadsheet'.",
 "2. In '30 Topics', column M: choose Approve / Change / Reject for each topic.",
 "3. Write any changes in column N (new title, different angle, swap the day).",
 "4. Send the sheet back (or just tell me the day numbers). I write full scripts only for approved topics.",
 "Note: every number is checked again on the day the script is written. Titles are working titles."]:
    h.append([l])
h.column_dimensions["A"].width = 100; h["A1"].font = Font(bold=True, size=14)
wb.save("/home/user/rctrips/research/06-topics-and-scripts.xlsx")
print(n, "script lines")
