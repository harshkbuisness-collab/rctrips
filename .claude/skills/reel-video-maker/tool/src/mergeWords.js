// Combines an SRT's timing with the script's words. Transcribers mishear and
// rewrite things ("Number one" → "1.", "ninety" → "90", watermark text), so
// the captions and the times Claude refers to use the script, and the SRT only
// supplies when each word is spoken.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export const numberWords = (n) => (n < 20 ? [ONES[n]] : n < 100 ? [TENS[Math.floor(n / 10)], ...(n % 10 ? [ONES[n % 10]] : [])]
  : n < 1000 ? [ONES[Math.floor(n / 100)], 'hundred', ...(n % 100 ? numberWords(n % 100) : [])] : [String(n)]);

// one SRT/script word -> comparable tokens ("90" -> ["ninety"], "-ups." -> ["ups"])
export function tokens(text) {
  const t = String(text).toLowerCase().replace(/[^\p{L}\p{N}']+/gu, ' ').replace(/'/g, '').trim();
  return t ? t.split(/\s+/).flatMap((w) => (/^\d+$/.test(w) ? numberWords(Number(w)) : [w])) : [];
}

export function mergeScriptWithTimings(script, timed) {
  // SRT side: drop bracketed notes such as "(Transcribed by …)" and spread each
  // timed word's span over its tokens
  const cleaned = timed.map((w) => ({...w, text: String(w.text).replace(/\([^)]*\)?|\[[^\]]*\]?/g, ' ')}));
  const src = [];
  cleaned.forEach((w) => {
    const tk = tokens(w.text);
    tk.forEach((tok, i) => src.push({tok, start: w.start + ((w.end - w.start) * i) / tk.length, end: w.start + ((w.end - w.start) * (i + 1)) / tk.length}));
  });
  const words = script.split(/\s+/).filter(Boolean).map((text) => ({text, toks: tokens(text)}));
  const dst = [];
  words.forEach((w, wi) => w.toks.forEach((tok) => dst.push({tok, wi})));

  // longest common subsequence of tokens
  const n = dst.length, m = src.length;
  const L = Array.from({length: n + 1}, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i][j] = dst[i].tok === src[j].tok ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  for (let i = 0, j = 0; i < n && j < m;) {
    if (dst[i].tok === src[j].tok) { dst[i].t = src[j]; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }

  // script word time = its matched tokens; unmatched words share the gap between neighbours
  const out = words.map((w, wi) => {
    const hits = dst.filter((d) => d.wi === wi && d.t).map((d) => d.t);
    return {text: w.text, start: hits.length ? hits[0].start : null, end: hits.length ? hits[hits.length - 1].end : null};
  });
  const audioEnd = src.length ? src[src.length - 1].end : 0;
  for (let i = 0; i < out.length;) {
    if (out[i].start !== null) { i++; continue; }
    let k = i;
    while (k < out.length && out[k].start === null) k++;
    const from = i > 0 ? out[i - 1].end : 0;
    const to = k < out.length ? out[k].start : Math.max(from + 0.3 * (k - i), audioEnd);
    const weights = out.slice(i, k).map((w) => w.text.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let c = from;
    for (let x = i; x < k; x++) {
      const d = ((to - from) * weights[x - i]) / total;
      out[x].start = c; out[x].end = c + d; c += d;
    }
    i = k;
  }
  const matched = dst.filter((d) => d.t).length;
  return {words: out.map((w) => ({text: w.text, start: Math.round(w.start * 1000) / 1000, end: Math.round(w.end * 1000) / 1000})), matched, total: dst.length};
}
