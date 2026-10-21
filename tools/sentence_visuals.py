"""Pictures for ONE spoken sentence, chosen from that sentence's own words, so the screen shows what is being said.

sentence_props(sentence)  -> drawing codes for the things the sentence names, in the order they are said (max 3)
narrator_for(sentence)    -> a narrator pose that fits the tone (question, shock, sad, good news, neutral)
number_sign(sentence)     -> the sentence's key number as short sign text ("$1,000", "25 YEARS", "90%", "1929"), or ""
"""
import re

# (pattern, code). Order matters only for ties; the earliest match in the sentence comes first on screen.
KEYWORDS = [
    (r"bank run|run on the bank|banks? (failed|collapsed|shut|closed)", "D16_bank_building_scared"),
    (r"\bbank(s|er|ers|ing)?\b", "D15_bank_building"),
    (r"\bfed\b|federal reserve|central bank", "G10_central_bank_building"),
    (r"\bstocks?\b|\bshares?\b|stock market|\bmarket\b|wall street|exchange|\bdow\b|nasdaq|s and p", "G11_stock_exchange"),
    (r"\b(crash\w*|fell|fall\w*|drop\w*|lost|los(e|ing)|collaps\w*|plung\w*|sank|shrank|down)\b", "D14_chart_arrow_down"),
    (r"\b(ros(e|ing)|soar\w*|boom\w*|grew|grow\w*|jump\w*|doubl\w*|climb\w*|higher|record high)\b", "D13_chart_arrow_up"),
    (r"\bmortgages?\b|\bhouses?\b|\bhomes?\b|homeowner\w*", "D09_house_happy"),
    (r"foreclos\w*|underwater|evict\w*", "D10_house_sad"),
    (r"\brent(s|ers?|ing)?\b|landlord", "G21_landlord"),
    (r"\bcars?\b|model t|\btruck\b", "E41_car"),
    (r"\bradios?\b|\btv\b|television|\bmovie\b|\bfilm\b|hollywood", "E13_tv_screen"),
    (r"newspaper|reporter|headline|magazine|journalist|\bpress\b", "E09_newspaper"),
    (r"\bphones?\b|\bcall(s|ed)?\b|\btext(s)?\b", "E08_phone"),
    (r"factor(y|ies)|\bcompan(y|ies)\b|business(es)?|\bfirm\b|corporation", "E33_factory"),
    (r"unemploy\w*|laid off|layoff\w*|lost (their|his|her) jobs?", "C28_crowd_small"),
    (r"\bjobs?\b|\bworkers?\b|\bwages?\b|paycheck|salary|employee\w*|hired?\b", "C09_worker_woman_neutral"),
    (r"\bfarm\w*|\bcrops?\b|wheat|\bfood\b|\bbread\b|grocer\w*|soybeans?|flour|\beggs?\b", "E39_grocery_bag"),
    (r"inflation|prices?\b|\bcosts?\b|expensive|afford\w*", "E37_cart_prices_up"),
    (r"\boil\b|\bgas\b|gasoline|\bfuel\b|kerosene|refiner\w*|barrels?", "D17_oil_barrel"),
    (r"\bships?\b|shipping|\bports?\b|imports?\b|exports?\b|\btrade\b|container", "E31_cargo_ship"),
    (r"tariffs?", "G19_tariff_wall"),
    (r"\btax(es)?\b|\birs\b|tax return", "D26_tax_form_evil"),
    (r"\bpresident\b|politician\w*|senator|mayor|\bhoover\b|roosevelt|\bfdr\b", "C05_politician_podium"),
    (r"government|washington|congress|\blaws?\b|\bact\b|treasury department|white house", "G09_capitol_building"),
    (r"\bpercent\b|interest|\brates?\b", "G04_percent_happy"),
    (r"\bcourt\b|\bjudge\b|\bjury\b|supreme court|\bsued\b|lawsuit|regulator\w*|\bsec\b", "E14_podium"),
    (r"prison|\bjail|fraud|crime|criminal|arrest\w*|\bfbi\b|charged|guilty|scheme|launder\w*", "E55_handcuffs_chain"),
    (r"\bchina\b|chinese", "G14_map_china"),
    (r"\bjapan\w*|\btokyo\b|\byen\b", "G15_map_japan"),
    (r"europe\w*|germany|german|britain|british|london|\bitaly\b|switzerland|swiss|iceland", "G16_map_europe"),
    (r"\bindia\b", "G17_map_india"),
    (r"\bworld\b|global|countr(y|ies)|overseas|abroad|foreign|nations?\b", "E43_globe"),
    (r"america\b|american|united states|\bthe u\.?s\.?\b|\bohio\b|texas|california|new york|cleveland|stockton|denver|charlotte|abilene", "G13_map_usa_grey"),
    (r"\bdebts?\b|\bowe[sd]?\b|\bloans?\b|borrow\w*", "D28_debt_monster"),
    (r"credit cards?|\bcredit\b|swipe", "D18_credit_card"),
    (r"\bbonds?\b|treasur(y|ies)\b|\biou\b|securities", "D24_bond_document"),
    (r"retire\w*|pension|401|four oh one k|social security", "D25_retirement_document"),
    (r"\bsav(e|ed|es|ing|ings)\b|\bsafe\b|insur\w*|protect\w*|vault", "E21_safe_vault"),
    (r"\bdollars?\b|\bcash\b|\bmoney\b|\bpaid\b|\bpay\b|\bbills?\b|\bfunds?\b", "E01_cash_stack"),
    (r"\bcents?\b|\bcoins?\b|\bpenn(y|ies)\b|\bdimes?\b", "E04_coin_pile"),
    (r"\bgold\b", "E05_gold_bars"),
    (r"\brich\b|billionaire|millionaire|fortune|wealth\w*", "C21_billionaire_neutral"),
    (r"\bbubbles?\b", "D29_bubble_character"),
    (r"\bai\b|artificial intelligence|\bchips?\b|data cent(er|re)s?|computer\w*|nvidia", "D23_ai_chip"),
    (r"robot\w*|chatbot\w*|chatgpt", "C17_robot_neutral"),
    (r"bitcoin|crypto\w*", "D08_bitcoin_nervous"),
    (r"\bprint(ed|ing|s)?\b|printer", "D19_money_printer"),
    (r"\bshop\w*|\bstores?\b|\bbuy(ing|s)?\b|\bbought\b|\bsell(ing|s)?\b|\bsold\b|customers?", "E36_cart_full"),
    (r"drought|\bdust\b|\bstorms?\b", "G24_storm_cloud"),
    (r"\barmy\b|\bwar\b|soldiers?|military|veterans?|tear gas|defen[cs]e", "G18_army_tank"),
    (r"\bwar(n|ning)\w*|danger\w*|\brisk\w*|\bfear\w*|\bpanic\w*|worr(y|ied)", "E44_warning_sign"),
    (r"\bfire\b|burn\w*", "E19_fire"),
    (r"explo\w*|blew up|implode\w*", "E47_explosion"),
    (r"\bidea\b|lesson|learn\w*|takeaway|understand", "E17_light_bulb"),
    (r"school|teacher|\bclass\b|students?|college", "E10_chalkboard"),
    (r"\bkids?\b|child(ren)?|daughter|\bson\b|grandson|granddaughter", "C27_kid_curious"),
    (r"grandma|grandmother|grandpa|retiree\w*|elderly", "C13_retiree_neutral"),
    (r"control\w*|monopol\w*|empire|\bpower(ful)?\b", "E27_crown"),
    (r"\bcity\b|cities|street|skyscraper|tower|downtown|office", "E34_skyscraper"),
    (r"plane|flight|fly|travel\w*|airport", "E42_airplane"),
    (r"coffee", "E40_coffee_cup"),
    (r"online|internet|website|\bapp\b|laptop|email", "E07_laptop"),
    (r"\bbooks?\b|\brules?\b|report\w*|study|studies|research\w*|paper(s|work)?\b", "H22_book_open"),
    (r"\bfair\b|unfair|balance|compare\w*|versus", "E22_scale"),
    (r"\bslow\w*", "E54_snail"),
    (r"\bclocks?\b|\bhours?\b|minutes?|\bfast(er)?\b|deadline", "E24_clock"),
    (r"\byears?\b|decades?|centur(y|ies)|\blater\b|\buntil\b", "E23_hourglass"),
    (r"\bmonths?\b|\bweeks?\b|\bdays?\b|monday|tuesday|wednesday|thursday|friday|calendar", "E25_calendar"),
    (r"\bladder\b|step by step|climb", "E29_ladder"),
    (r"\bwin\w*|trophy|record|best\b", "E28_trophy"),
    (r"\bfamil(y|ies)\b|\blove\b|heart", "H27_heart"),
    (r"millions of|\bpeople\b|americans|everyone|everybody|crowds?|investors|thousands of", "C28_crowd_small"),
    (r"\bwhy\b|\bhow\b|\bwhat\b|\bwho\b|\?", "E48_question_marks"),
]
_KW = [(re.compile(p, re.I), c) for p, c in KEYWORDS]

NARRATOR = [(r"\?", "A06_narrator_thinking"),
            (r"\b(crash|collaps|lost|worst|panic|billion|trillion|record|biggest|shock)", "A08_narrator_shocked"),
            (r"\b(gone|nobody|never got|broke|ruin|sad|cried|died)\b", "A41_narrator_sitting_sad"),
            (r"\b(lie|lied|fraud|secret|hid|hidden|scheme|trick)", "A05_narrator_suspicious"),
            (r"\b(works?|worked|safe|insured|good news|solved|fixed|helps?|win)\b", "A21_narrator_thumbs_up"),
            (r"\b(here's|first|second|third|means|called|think of|imagine|picture)\b", "A38_narrator_teacher_pointer")]


GENERIC = {"D13_chart_arrow_up", "D14_chart_arrow_down", "E23_hourglass", "E25_calendar", "E24_clock",
           "E48_question_marks", "G13_map_usa_grey", "E01_cash_stack", "C28_crowd_small", "E36_cart_full"}


def sentence_props(s, limit=3):
    """Concrete things first (a bank, a tank, bread), then general ideas (up, down, time), each in spoken order."""
    if re.search(r"\bstocks?\b|ticker|shares?\b|market", s, re.I):
        s_prices = re.sub(r"\bprices?\b", "", s, flags=re.I)      # stock prices are not shopping prices
    else:
        s_prices = s
    hits = []
    for rx, code in _KW:
        m = rx.search(s_prices)
        if m:
            hits.append((code in GENERIC, m.start(), code))
    out = []
    for _, _, c in sorted(hits):
        if c not in out and not (c == "E48_question_marks" and len(hits) > 2):
            out.append(c)
    return out[:limit]


def narrator_for(s, i=0):
    for p, c in NARRATOR:
        if re.search(p, s, re.I):
            return c
    return ("A15_narrator_point_right", "A18_narrator_present_right", "A01_narrator_neutral")[i % 3]


# ---------- numbers said in words -> short sign text ----------
UNITS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen "
                                     "fourteen fifteen sixteen seventeen eighteen nineteen".split())}
TENS = {w: 10 * i for i, w in enumerate("_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()) if w != "_"}
SCALES = {"hundred": 100, "thousand": 1_000, "million": 1_000_000, "billion": 1_000_000_000, "trillion": 1_000_000_000_000}
NUMWORD = re.compile(r"\b(?:(?:" + "|".join(list(UNITS) + list(TENS) + list(SCALES) + ["a", "and", "point"]) +
                     r")(?:[\s-]+|\b))+", re.I)


def _value(words):
    """'one thousand two hundred' -> 1200 ; 'forty point three trillion' -> 40.3e12 ; years like 'nineteen twenty-nine'."""
    w = [x for x in re.split(r"[\s-]+", words.lower()) if x and x not in ("and",)]
    if not w or all(x == "a" for x in w):
        return None
    if w[0] == "a":
        w[0] = "one"
    # year: teen/ten word followed by tens(-unit), e.g. nineteen twenty nine, eighteen seventies is not handled
    if len(w) in (2, 3) and w[1] in TENS and ((w[0] in UNITS and 10 <= UNITS[w[0]] <= 20) or w[0] in ("twenty",)):
        return (UNITS.get(w[0]) or TENS[w[0]]) * 100 + TENS[w[1]] + (UNITS.get(w[2], 0) if len(w) == 3 else 0), "year"
    if w[:2] == ["two", "thousand"] and len(w) <= 4 and "hundred" not in w:
        v = 2000 + sum(UNITS.get(x, 0) + TENS.get(x, 0) for x in w[2:])
        return v, "year"
    total, cur, frac, in_frac = 0.0, 0.0, "", False
    for x in w:
        if x == "point":
            in_frac = True
        elif in_frac and x in UNITS:
            frac += str(UNITS[x])
        elif x in UNITS:
            cur += UNITS[x]
        elif x in TENS:
            cur += TENS[x]
        elif x == "hundred":
            cur = (cur or 1) * 100
        elif x in SCALES:
            cur = (cur + (float("0." + frac) if frac else 0)) or 1
            total += cur * SCALES[x]
            cur, frac, in_frac = 0, "", False
        else:
            return None
    total += cur + (float("0." + frac) if frac else 0)
    return total, "num"


def _fmt(v):
    for s, name in ((1e12, "TRILLION"), (1e9, "BILLION"), (1e6, "MILLION")):
        if v >= s:
            x = v / s
            return (f"{x:.1f}".rstrip("0").rstrip(".")) + " " + name
    return f"{v:,.0f}" if v == int(v) else f"{v:,.2f}".rstrip("0")


def number_sign(s):
    """The most telling number in the sentence as sign text ($ amounts, then %, then counts, then years), or ''."""
    m = re.search(r"\b(one|two|three|four|five|six|seven|eight|nine|ten) in (two|three|four|five|six|seven|eight|nine|ten|a hundred)\b", s, re.I)
    if m:
        return f"{_value(m.group(1))[0]:.0f} IN {_value(m.group(2))[0]:.0f}"
    found = []
    for m in NUMWORD.finditer(s):
        words = m.group(0).strip(" -")
        if len(words) < 3 or words.lower() in ("a", "and", "one", "a and"):
            continue
        r = _value(words)
        if not r:
            continue
        v, kind = r
        if kind == "year":
            found.append((3, str(int(v))))
            continue
        if v < 2:
            continue
        after = s[m.end():m.end() + 20].lower()
        if after.startswith("dollar"):
            found.append((0, "$" + _fmt(v)))
            continue
        if after.startswith("percent"):
            found.append((1, _fmt(v) + "%"))
            continue
        unit = re.match(r"([a-z]+)", after)
        unit = unit.group(1).upper() if unit and unit.group(1) not in ("of", "and", "the", "in", "to", "a", "times", "or") else ""
        text = (_fmt(v) + " " + unit).strip()
        found.append((2, text if len(text) <= 18 else _fmt(v)))
    if found:
        return min(found, key=lambda x: x[0])[1]
    m = re.search(r"\$\d[\d,.]*\s*(?:million|billion|trillion)?|\d[\d,.]*\s*%", s)   # digits written as digits
    return m.group(0).upper() if m else ""


if __name__ == "__main__":
    for t in ["If you put one thousand dollars into the stock market in September nineteen twenty-nine, you would wait.",
              "Twenty-five years.", "The market lost almost ninety percent of its value.",
              "Nine thousand banks shut their doors, and the people's savings went with them.",
              "On October eighth, twenty twenty-six, America owed about forty point three trillion dollars.",
              "One in four workers lost their job."]:
        print(number_sign(t), "|", sentence_props(t), "|", narrator_for(t))


# ---------- variety inside one video ----------
VARIANTS = {
    "E01": ["E01", "E02", "D01", "E04", "B10", "E05"], "E33": ["E33", "D21", "E34", "E06"],
    "E37": ["E37", "E38", "D30", "H17"], "G11": ["G11", "G12", "G03"], "E36": ["E36", "E39", "D30", "H19"],
    "C28": ["C28", "H09", "H11", "C09", "C11"], "D15": ["D15", "C01", "C03", "D16"], "D14": ["D14", "E46", "G02", "D02"],
    "D13": ["D13", "E45", "G01", "E26"], "E23": ["E23", "E24", "E25"], "G09": ["G09", "C05", "C06", "C08"],
    "D28": ["D28", "D18", "D24"], "G04": ["G04", "G05"], "E43": ["E43", "D20"], "D09": ["D09", "D11", "E35", "H23"],
    "C21": ["C21", "C22", "C23", "C24"], "C01": ["C01", "C02", "C03", "C04"], "E55": ["E55", "E14"],
    "E09": ["E09", "H06"], "E17": ["E17", "H22"], "E44": ["E44", "E49", "E50"], "E21": ["E21", "E05", "H19"],
    "C09": ["C09", "C10", "C11", "C12"], "C13": ["C13", "C14", "C15", "C16"], "D25": ["D25", "C15", "H28"],
    "E48": ["E48", "E52"], "D17": ["D17", "E32"], "E41": ["E41", "D22"], "C17": ["C17", "C18", "C20"],
    "E31": ["E31", "E42"], "D26": ["D26", "H28", "H15"], "D23": ["D23", "C17", "E07"],
}
POSES = {   # narrator poses by mood; the least used one that wasn't just on screen is picked
    "question": ["A06", "A07", "A39", "A14", "A05"], "shock": ["A08", "A45", "A36", "A09", "A10", "A35"],
    "sad": ["A41", "A11", "A42", "A47", "A32", "A19"], "suspicious": ["A05", "A37", "A04", "A46", "A43"],
    "good": ["A21", "A02", "A34", "A03", "H03", "A23"], "teach": ["A38", "A18", "A15", "A16", "A17", "H01", "A20"],
    "neutral": ["A01", "A15", "A18", "A29", "A33", "A44", "A24", "A27", "A28", "H05", "H08", "A40"],
}
MOOD = {"A06": "question", "A08": "shock", "A41": "sad", "A05": "suspicious", "A21": "good", "A38": "teach"}
STOP = set("the a an and or but of to in on for with that this it its is was were be been are as at by from his her "
           "their they he she we you your our not no so if then than there here what when who how why which into out "
           "over about after before more most very just also can could would will may might one did does do had has "
           "have that's it's don't didn't isn't wasn't every each some any all only even still again once".split())


class Picker:
    """Keeps one video varied: each drawing has a use limit, and nothing repeats in the next scene."""

    def __init__(self, limit=5):
        self.used, self.prev, self.limit = {}, set(), limit

    def _best(self, options):
        ok = [o for o in options if o not in self.prev] or options
        return min(ok, key=lambda o: (self.used.get(o, 0), options.index(o)))

    def prop(self, code):
        c = self._best(VARIANTS.get(code, [code]))
        return None if self.used.get(c, 0) >= self.limit * 2 else c

    def pose(self, sentence):
        mood = MOOD.get(narrator_for(sentence)[:3], "neutral")
        return self._best(POSES[mood])

    def take(self, codes):
        for c in codes:
            self.used[c] = self.used.get(c, 0) + 1
        self.prev = set(codes)


def key_words(s, n=3):
    """A few important words of the sentence for a sign, when no drawing fits."""
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z'-]+", s) if w.lower() not in STOP and len(w) > 3]
    caps = [w for w in words if w[0].isupper()]
    pick = (caps + [w for w in words if w not in caps])[:n]
    text = " ".join(pick).upper()
    while len(text) > 18 and " " in text:
        text = text.rsplit(" ", 1)[0]
    return text[:18]
