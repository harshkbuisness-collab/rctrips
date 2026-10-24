"""Quick script check: spoken words, SCREEN count, unknown drawing codes, spoken lines without VISUAL, symbols in speech.
Usage: python3 tools/check_script.py scripts/dayNN_x.md"""
import re, sys
L = open(sys.argv[1]).read().splitlines()
codes = {l.split("_")[0] for l in open("library/ASSET_LIST.txt").read().split()}
sp = [i for i, l in enumerate(L) if l.strip() and not re.match(r"(#|>|TITLES|THUMBNAIL|THREAD|- )", l)]
words = sum(len(re.sub(r"^\[\w+\]", "", L[i]).split()) for i in sp)
bad = {c for l in L if l.startswith("> VISUAL") for c in re.findall(r"\b([A-H]\d\d)\b", l) if c not in codes}
nov = [L[i][:50] for i in sp if i + 1 >= len(L) or not L[i + 1].startswith("> VISUAL")]
sym = [L[i][:50] for i in sp if re.search(r"[%$&()]", L[i])]
print(f"words {words} (target 2050-2250) | SCREEN {sum(l.startswith('> SCREEN') for l in L)} | chapters {sum(l.startswith('## CHAPTER') for l in L)}")
print("bad codes:", bad or "none"); print("no VISUAL:", nov or "none"); print("symbols:", sym or "none")
