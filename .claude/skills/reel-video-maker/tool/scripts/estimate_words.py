# Word timings for an uploaded voiceover WITHOUT pocketsphinx (fallback when the aligner cannot be installed,
# e.g. Python 3.14). Finds the pauses in the audio and matches them to the script's sentence and comma breaks,
# then spreads the words of each piece over its speech by word length. Clean voiceovers (AI voices, studio
# recordings): typically within ~0.1-0.2 s per word. English and Hinglish scripts alike (it never needs a dictionary).
# usage: python3 scripts/estimate_words.py voice16k.wav script.txt words.json
import json
import re
import sys
import wave

import numpy as np

FRAME = 0.01  # s


def load(path):
    with wave.open(path, 'rb') as w:
        sr, n, ch, width = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if width != 2:
        raise SystemExit('expected 16-bit PCM wav')
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    if ch > 1:
        a = a.reshape(-1, ch).mean(axis=1)
    return a, sr


def pauses_of(a, sr):
    """speech start / end and the silences in between, in seconds: (t0, t1, [[a, b], ...])"""
    hop = int(sr * FRAME)
    frames = len(a) // hop
    if frames < 10:
        raise SystemExit('the voiceover is too short')
    rms = np.sqrt(np.mean(a[:frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    floor, loud = np.percentile(db, 10), np.percentile(db, 95)
    speech = db > floor + 0.3 * (loud - floor)
    idx = np.flatnonzero(speech)
    if not len(idx):
        raise SystemExit('no speech found in the voiceover')
    t0, t1 = idx[0], idx[-1] + 1
    out, run = [], None
    for i in range(t0, t1):
        if not speech[i] and run is None:
            run = i
        elif speech[i] and run is not None:
            if (i - run) * FRAME >= 0.09:
                out.append([run * FRAME, i * FRAME])
            run = None
    return t0 * FRAME, t1 * FRAME, out


def weight(w):
    return max(2, len(re.sub(r'[^\w]', '', w)) + 1)


def strength(w):
    return 3 if re.search(r'[.!?…]["\')\]]*$', w) else 2 if re.search(r'[,;:—-]["\')\]]*$', w) else 0


def main():
    wav, script_file, out_file = sys.argv[1:4]
    words = open(script_file, encoding='utf-8-sig').read().split()
    if not words:
        raise SystemExit('the script is empty')
    a, sr = load(wav)
    t0, t1, pauses = pauses_of(a, sr)

    # speech time: real time with the pauses taken out
    def speech_before(t):
        return (t - t0) - sum(max(0, min(t, q) - p) for p, q in pauses if p < t)
    total_speech = speech_before(t1)
    weights = [weight(w) for w in words]
    cum = np.cumsum(weights) / sum(weights)

    # breaks after a word (sentence end 3, comma 2) and where the speech says they should be
    breaks = [(i, strength(w), cum[i] * total_speech) for i, w in enumerate(words[:-1]) if strength(w)]
    cands = [(p, q, speech_before(p)) for p, q in pauses]

    # match breaks to pauses in order (dynamic programming): reward long pauses at strong breaks, punish distance
    B, P = len(breaks), len(cands)
    NEG = -1e9
    score = np.full((B + 1, P + 1), NEG)
    score[0, :] = 0
    move = {}
    for i in range(1, B + 1):
        _, st, pred = breaks[i - 1]
        tol = 1.2 + 0.08 * pred ** 0.5
        for j in range(0, P + 1):
            best, how = score[i - 1, j], ('skip', j)   # this break has no pause
            if j > 0:
                p, q, pos = cands[j - 1]
                d = abs(pos - pred)
                if d < tol:
                    gain = (1.0 if st == 3 else 0.6) * (1 - d / tol) + min(q - p, 0.6)
                    s = max(score[i - 1, :j].max(), 0) + gain
                    if s > best:
                        best, how = s, ('match', j)
            if j > 0 and score[i, j - 1] > best:
                best, how = score[i, j - 1], ('left', j - 1)
            score[i, j] = best
            move[(i, j)] = how
    anchors = []  # (word index the break follows, pause start, pause end)
    i, j = B, P
    while i > 0:
        kind, jj = move[(i, j)]
        if kind == 'left':
            j = jj
            continue
        if kind == 'match':
            p, q, _ = cands[jj - 1]
            anchors.append((breaks[i - 1][0], p, q))
            j = jj - 1
        i -= 1
    anchors.reverse()

    # spread the words of each piece over that piece's speech time (pauses inside a piece are skipped)
    result = []
    pieces, start_w, start_t = [], 0, t0
    for wi, p, q in anchors:
        pieces.append((start_w, wi + 1, start_t, p))
        start_w, start_t = wi + 1, q
    pieces.append((start_w, len(words), start_t, t1))

    def real_time(s_from, s_amount):
        """the real time reached after s_amount seconds of speech, starting at real time s_from"""
        t, left = s_from, s_amount
        for p, q in pauses:
            if q <= t:
                continue
            if p > t:
                if p - t >= left:
                    return t + left
                left -= p - t
            t = max(t, q)
        return t + left
    for a_w, b_w, a_t, b_t in pieces:
        if b_w <= a_w:
            continue
        span = speech_before(b_t) - speech_before(a_t)
        wsum = sum(weights[a_w:b_w])
        acc = 0.0
        for k in range(a_w, b_w):
            s = real_time(a_t, span * acc / wsum)
            acc += weights[k]
            e = real_time(a_t, span * acc / wsum)
            result.append({'text': words[k], 'start': round(s, 3), 'end': round(max(e, s + 0.05), 3)})
    json.dump({'words': result, 'estimated': True}, open(out_file, 'w', encoding='utf-8'), indent=1)
    print(f'{len(result)} words, {len(anchors)} of {len(breaks)} breaks matched to pauses')


if __name__ == '__main__':
    main()
