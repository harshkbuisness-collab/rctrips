# Word timings without an SRT: force-aligns the known script text to the
# voiceover with pocketsphinx (offline, English only; pip install pocketsphinx).
# usage: python3 scripts/align_words.py voice.wav script.txt public/projects/<name>/words.json
import json, os, re, subprocess, sys, tempfile, wave
from pocketsphinx import Decoder

# words missing from the pocketsphinx dictionary: spelling -> ARPAbet phones
EXTRA_WORDS = {'glute': 'G L UW T', 'glutes': 'G L UW T S', 'calisthenics': 'K AE L AH S TH EH N IH K S',
               'reps': 'R EH P S', 'abs': 'AE B Z', 'quads': 'K W AA D Z', 'lats': 'L AE T S'}


def is_16k_mono_wav(path):
    try:
        with wave.open(path, 'rb') as w:
            return w.getframerate() == 16000 and w.getnchannels() == 1 and w.getsampwidth() == 2
    except (wave.Error, EOFError, OSError):
        return False


ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()
ORDINAL = {'one': 'first', 'two': 'second', 'three': 'third', 'five': 'fifth', 'eight': 'eighth', 'nine': 'ninth', 'twelve': 'twelfth'}


def number_words(n):
    """12 -> ['twelve'], 245 -> ['two', 'hundred', 'forty', 'five'], 2024 -> ['two', 'thousand', 'twenty', 'four']"""
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + (number_words(n % 10) if n % 10 else [])
    if n < 1000:
        return number_words(n // 100) + ['hundred'] + (number_words(n % 100) if n % 100 else [])
    if n < 1000000:
        return number_words(n // 1000) + ['thousand'] + (number_words(n % 1000) if n % 1000 else [])
    return [c for d in str(n) for c in number_words(int(d))]


def spoken(token):
    """What the voice says for one script token: '10' -> ['ten'], '90%' -> ['ninety', 'percent'],
    '1st' -> ['first'], 'push-ups' -> ['push', 'ups'], '3x' -> ['three', 'times'], '&' -> ['and']."""
    t = token.lower().replace('’', "'")
    out = []
    for part in re.split(r'[-–—/]', t):
        part = part.strip('.,!?;:"()[]{}')
        if not part:
            continue
        if part == '&':
            out.append('and'); continue
        m = re.fullmatch(r'(\d+)(st|nd|rd|th)', part)
        if m:
            w = number_words(int(m.group(1)))
            last = w[-1]
            w[-1] = ORDINAL.get(last, (last[:-1] + 'ieth') if last.endswith('y') else last + 'th')
            out += w; continue
        m = re.fullmatch(r'(\d+)(?:[.,](\d+))?(%|x|°|kg|k)?', part)
        if m:
            out += number_words(int(m.group(1)))
            if m.group(2):
                out += ['point'] + [ONES[int(c)] for c in m.group(2)]
            out += {'%': ['percent'], 'x': ['times'], '°': ['degrees'], 'kg': ['kilos'], 'k': ['thousand']}.get(m.group(3), [])
            continue
        w = re.sub(r"[^a-z']", '', part).strip("'")
        if w:
            out.append(w)
    return out


# rough spelling -> phones for words the dictionary doesn't know (brand names, slang, Hinglish)
G2P = [('tch', 'CH'), ('sch', 'S K'), ('ph', 'F'), ('sh', 'SH'), ('ch', 'CH'), ('th', 'TH'), ('ng', 'NG'), ('ck', 'K'),
       ('qu', 'K W'), ('wh', 'W'), ('ee', 'IY'), ('ea', 'IY'), ('oo', 'UW'), ('ou', 'AW'), ('ow', 'OW'), ('ai', 'EY'),
       ('ay', 'EY'), ('oi', 'OY'), ('oy', 'OY'), ('au', 'AO'), ('aw', 'AO'), ('ie', 'IY'), ('kh', 'K'), ('gh', 'G'), ('bh', 'B'),
       ('a', 'AE'), ('b', 'B'), ('c', 'K'), ('d', 'D'), ('e', 'EH'), ('f', 'F'), ('g', 'G'), ('h', 'HH'), ('i', 'IH'), ('j', 'JH'),
       ('k', 'K'), ('l', 'L'), ('m', 'M'), ('n', 'N'), ('o', 'AA'), ('p', 'P'), ('q', 'K'), ('r', 'R'), ('s', 'S'), ('t', 'T'),
       ('u', 'AH'), ('v', 'V'), ('w', 'W'), ('x', 'K S'), ('y', 'Y'), ('z', 'Z')]


def guess_phones(word):
    w, phones = word.replace("'", ''), []
    while w:
        for k, p in G2P:
            if w.startswith(k):
                if not (phones and phones[-1] == p):  # "ll", "ss" -> one sound
                    phones.append(p)
                w = w[len(k):]
                break
        else:
            w = w[1:]
    return ' '.join(phones) or 'AH'


def align(audio, text):
    display = text.split()
    # every display token -> the words actually spoken for it (digits become words)
    groups = [spoken(t) for t in display]
    flat = [(i, w) for i, g in enumerate(groups) for w in g]
    d = Decoder(samprate=16000, bestpath=False)
    for w, phones in EXTRA_WORDS.items():
        if d.lookup_word(w) is None:
            d.add_word(w, phones, True)
    for w in sorted({w for _, w in flat if d.lookup_word(w) is None}):
        d.add_word(w, guess_phones(w), True)
    with tempfile.TemporaryDirectory() as tmp:
        wav = audio if is_16k_mono_wav(audio) else os.path.join(tmp, 'a.wav')
        if wav != audio:  # the web tool passes a ready 16 kHz wav; the CLI converts here
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', audio, '-ar', '16000', '-ac', '1', wav], check=True)
        w = wave.open(wav, 'rb')
        d.set_align_text(' '.join(x for _, x in flat))
        d.start_utt(); d.process_raw(w.readframes(w.getnframes()), full_utt=True); d.end_utt()
    segs = [(re.sub(r'\(\d+\)$', '', s.word), s.start_frame / 100, (s.end_frame + 1) / 100)
            for s in d.seg() if s.word not in ('<s>', '</s>', '<sil>') and not s.word.startswith('[')]
    if [s[0] for s in segs] != [x for _, x in flat]:
        sys.exit('alignment failed: the audio does not match the script text. Check that the script is exactly what the voice says.')
    # back to the script's own tokens ("10" keeps showing as 10 in captions)
    times = {}
    for (i, _), (_, a, b) in zip(flat, segs):
        s0, e0 = times.get(i, (a, b))
        times[i] = (min(s0, a), max(e0, b))
    words = []
    for i, tok in enumerate(display):
        if i in times:
            words.append({'text': tok, 'start': round(times[i][0], 2), 'end': round(times[i][1], 2)})
        elif words:  # pure punctuation like "-" sticks to the word before
            words[-1]['text'] += ' ' + tok
    return words


if __name__ == '__main__':
    audio, script, out = sys.argv[1:4]
    with open(script, encoding='utf-8-sig') as f:
        words = align(audio, f.read())
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'words': words}, f, indent=1)
    print(f'{len(words)} words -> {out}')
