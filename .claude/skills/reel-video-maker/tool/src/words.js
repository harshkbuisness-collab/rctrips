// Group words into short phrases: break on punctuation, pauses or maxWords.
export function phrases(words, maxWords) {
  const out = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const pause = next ? next.start - w.end > 0.35 : true;
    if (cur.length >= maxWords || /[.,!?;:]$/.test(w.text) || pause) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
}
