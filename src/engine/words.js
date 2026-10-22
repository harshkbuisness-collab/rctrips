// Word-level helpers: script detection, filler words, hero scoring.
// Works for English, Hinglish (Roman) and Hindi (Devanagari).

const DEVANAGARI = /[ऀ-ॿ]/;

export const isDevanagari = (text = '') => DEVANAGARI.test(text);

// Lowercase and strip punctuation, keeping letters/marks/digits from any script.
export const norm = (w = '') => String(w).toLowerCase().replace(/[^\p{L}\p{M}\p{N}%₹$]/gu, '');

const FILLER = new Set([
  // English
  'a','an','the','is','are','was','were','be','been','am','i','you','we','they','he','she','it','me','my','your','our','their',
  'this','that','these','those','to','of','in','on','at','for','with','from','by','as','and','or','but','if','so','then','than',
  'do','does','did','not','no','can','will','just','very','really','also','about','into','what','which','who','how','why','when',
  'there','here','have','has','had','get','got','its','it\'s','dont','don\'t','one','more','most','some','any','all','up','out',
  // Hinglish (Roman)
  'agar','aap','aapko','aapka','aapke','aapki','apna','apne','apni','hum','hamare','main','mai','mera','mere','meri','tum','tumhare',
  'ye','yeh','wo','woh','ki','ke','ka','ko','se','me','mein','par','pe','aur','ya','to','toh','bhi','hi','hai','hain','ho','hota',
  'hoti','hote','tha','thi','the','raha','rahe','rahi','kar','karo','karna','karne','karte','karta','kya','kyun','kaise','jo','jab',
  'tab','phir','fir','sirf','bas','kuch','koi','lagta','lagti','shayad','abhi','yahan','wahan','iske','uske','unke','isko','usko',
  'jata','jaata','jati','jate','jaate','gaya','gayi','kyunki','lekin','magar','na','nahi','nhi','mat','sab','sabse','bahut','bohot','zyada','jyada','wala','wale','wali','log','liye',
  // Hindi (Devanagari)
  'अगर','आप','आपको','आपका','आपके','आपकी','अपना','अपने','अपनी','हम','मैं','मेरा','मेरे','मेरी','तुम','ये','यह','वो','वह','की','के',
  'का','को','से','में','पर','पे','और','या','तो','भी','ही','है','हैं','हो','होता','होती','होते','था','थी','थे','रहा','रहे','रही','कर',
  'करो','करना','करने','करते','करता','क्या','क्यों','कैसे','जो','जब','तब','फिर','सिर्फ','बस','कुछ','कोई','लगता','लगती','शायद',
  'अभी','यहाँ','वहाँ','जाता','जाती','जाते','गया','गई','क्योंकि','लेकिन','ना','नहीं','मत','सब','सबसे','बहुत','ज्यादा','ज़्यादा','वाला','वाले','वाली','लोग','लिए',
]);

// Words that should almost always win the highlight when present.
const POWER = new Set([
  'growth','grow','viral','hook','hooks','views','view','reach','followers','follow','retention','engagement','algorithm','content',
  'reel','reels','video','videos','money','income','sales','leads','brand','audience','strategy','secret','mistake','mistakes',
  'attention','value','script','scripts','ai','chatgpt','free','result','results','consistency','trust','story','stories','save',
  'share','comment','dm','instagram','youtube','editing','trend','trending','proof','offer','scroll','stop','first','never','always',
  'focus','galat','sahi','asli','fark','paisa','paise','kamai','dhyan',
  'ग्रोथ','वायरल','हुक','व्यूज','व्यूज़','फॉलोअर्स','कंटेंट','वीडियो','रील','पैसा','पैसे','गलत','ग़लत','सही','असली','फोकस','फर्क','फ़र्क','ध्यान',
  'सीक्रेट','गलती','रिटेंशन','एल्गोरिदम','स्क्रिप्ट','अटेंशन',
]);

export const isFiller = (w) => FILLER.has(norm(w));

export function heroScore(word = '') {
  const n = norm(word);
  if (!n || FILLER.has(n)) return 0;
  let s = 1;
  if (/\d/.test(n)) s += 6;
  if (POWER.has(n)) s += 5;
  if (/^[A-Z]{2,}$/.test(String(word).replace(/[^A-Za-z]/g, ''))) s += 2; // already ALL CAPS in source
  s += Math.min(3, [...n].length / 3);
  return s;
}

// Pick the index of the strongest word, or -1 when nothing deserves the highlight.
export function pickHero(words) {
  let best = -1, bestScore = 2.4;
  words.forEach((w, i) => { const s = heroScore(w.text); if (s > bestScore) { best = i; bestScore = s; } });
  return best;
}
