// Visual library made in Google Flow (public/library, indexed in libraryData.js by
// scripts/import-flow-assets.py). Picks an object or a mascot reaction from script words.
import LIBRARY from './libraryData.js';

export {LIBRARY};
export const LIB_BY_ID = Object.fromEntries(LIBRARY.map((x) => [x.id, x]));

// Script words (English, Hinglish, Hindi) → library keyword sets; an item matches a set when it has all its words.
const CONCEPTS = [
  ['money income paisa paise kamai earn earning earnings revenue sales profit salary rich cash ₹ पैसा पैसे कमाई', ['coins', 'banknotes', 'money bag', 'wallet']],
  ['rupee rupees rs inr रुपये रुपया', ['rupee']],
  ['save saving savings bachat बचत', ['piggy']],
  ['bank loan emi बैंक', ['bank']],
  ['card payment pay upi', ['credit card']],
  ['bill bills receipt invoice बिल', ['receipt']],
  ['budget calculate math hisab हिसाब', ['calculator']],
  ['growth grow grows growing increase badh badhao badhega scale ग्रोथ बढ़', ['chart rising', 'rocket', 'plant']],
  ['drop down decrease loss fall falling kam ghat girna घट नुकसान', ['chart falling']],
  ['data analytics stats insights report numbers डेटा', ['pie chart', 'chart rising']],
  ['fast quick speed jaldi tez तेज़ जल्दी', ['lightning', 'rocket']],
  ['launch start shuru boost', ['rocket']],
  ['idea ideas tip tips trick tricks creative आइडिया', ['bulb']],
  ['brain mind think thinking psychology soch दिमाग सोच', ['brain']],
  ['time seconds second minute minutes waqt समय टाइम सेकंड सेकेंड्स', ['stopwatch', 'hourglass', 'alarm clock']],
  ['daily consistency consistent days week month schedule roz rozana रोज़ रोज', ['calendar']],
  ['morning subah सुबह', ['alarm clock', 'sun']],
  ['night sleep raat neend रात नींद', ['moon']],
  ['goal goals target niche aim lakshya लक्ष्य टारगेट', ['dart target', 'mountain flag']],
  ['steps step process roadmap level', ['ladder']],
  ['success win winner result results best जीत सफलता', ['trophy', 'medal']],
  ['king boss top premium no1', ['crown']],
  ['value quality worth luxury', ['diamond']],
  ['secret secrets hidden private raaz राज़ सीक्रेट', ['padlock']],
  ['solution answer unlock key', ['key']],
  ['problem problems issue confusion', ['puzzle']],
  ['attract attraction magnet pull', ['magnet']],
  ['free bonus gift offer फ्री गिफ्ट', ['gift']],
  ['announce announcement launch news', ['megaphone']],
  ['search find seo research khoj खोज', ['magnifying']],
  ['viral trend trending hot fire वायरल ट्रेंड', ['fire']],
  ['right correct sahi yes done सही', ['check']],
  ['wrong mistake mistakes galat galti no fail गलत ग़लत गलती', ['cross']],
  ['question why how kyun kaise kya सवाल क्यों', ['question']],
  ['warning careful dhyan danger alert ध्यान', ['exclamation']],
  ['like likes love pyaar लाइक प्यार', ['heart']],
  ['comment comments reply कमेंट', ['speech bubble']],
  ['share send dm message messages शेयर', ['paper plane', 'speech bubble']],
  ['save saved bookmark सेव', ['bookmark']],
  ['follow followers subscribe फॉलो फॉलोअर्स', ['person plus', 'bell']],
  ['notification notifications alert', ['bell']],
  ['views view watch watching dekh dekhte व्यूज व्यूज़ देख', ['eye']],
  ['audience people community log customers लोग ऑडियंस', ['people']],
  ['video videos reel reels youtube shorts वीडियो रील', ['play', 'clapperboard']],
  ['camera shoot filming record', ['camera']],
  ['podcast mic voice audio', ['microphone']],
  ['music song headphones गाना म्यूजिक', ['headphones']],
  ['phone mobile instagram app apps फोन मोबाइल इंस्टाग्राम', ['smartphone']],
  ['laptop computer online website', ['laptop']],
  ['ai chatgpt robot automation एआई', ['robot']],
  ['tech technology chip gpu', ['chip']],
  ['code coding developer programming', ['code']],
  ['cloud upload backup', ['cloud']],
  ['internet wifi network', ['wifi']],
  ['settings setup system tool tools', ['gear']],
  ['email mail newsletter', ['envelope']],
  ['hashtag hashtags', ['hashtag']],
  ['percent percentage discount off', ['percentage']],
  ['business work job office career naukri नौकरी काम', ['briefcase']],
  ['deal partnership collab collaboration', ['handshake']],
  ['shop store dukaan दुकान', ['store', 'shop']],
  ['buy shopping order sale', ['shopping cart', 'shopping bag']],
  ['delivery parcel product', ['parcel']],
  ['fair balance compare vs', ['scale']],
  ['learn learning study read book books पढ़', ['book']],
  ['exam degree college student students', ['graduation']],
  ['write writing script likh लिख', ['pencil', 'notebook']],
  ['plan checklist list todo', ['checklist', 'notebook']],
  ['fitness gym workout exercise', ['dumbbell']],
  ['run running walk steps', ['shoe']],
  ['health healthy heart दिल', ['heart pulse']],
  ['food diet eat khana खाना', ['apple']],
  ['water pani पानी', ['water']],
  ['medicine pill doctor dawai दवाई', ['pill']],
  ['coffee chai energy', ['coffee']],
  ['calm peace meditation stress', ['lotus']],
  ['home house ghar घर', ['house']],
  ['car drive gaadi गाड़ी', ['car']],
  ['travel trip flight plane safar सफ़र', ['airplane', 'suitcase']],
  ['world global country duniya दुनिया', ['globe']],
  ['location place local city', ['map pin']],
  ['energy tired thak', ['battery']],
  ['happy khush smile खुश', ['smiley']],
];

// Script moods → mascot reaction keyword sets.
const MOODS = [
  ['why kya kaise kyun really seriously confused samajh क्या क्यों कैसे', ['thinking', 'shrugging']],
  ['wrong galat mistake fail never nahi nhi गलत नहीं', ['facepalm', 'thumbs down']],
  ['success best great finally win perfect sahi सही', ['thumbs up', 'celebrating']],
  ['comment follow save share dm कमेंट फॉलो', ['pointing up', 'pointing right']],
  ['thanks thank please shukriya धन्यवाद', ['praying', 'heart hands']],
  ['shock shocking crazy wow unbelievable secret insane', ['shocked', 'exploding head', 'surprise']],
  ['funny lol joke haha mazaak', ['laughing']],
  ['sad tired boring bore', ['yawning', 'crying']],
  ['angry hate gussa गुस्सा', ['angry']],
  ['hello hi namaste welcome', ['waving hello']],
  ['cool smart pro', ['sunglasses']],
];

const WORD = (w) => String(w?.text ?? w).toLowerCase().replace(/[^\p{L}\p{M}\p{N}₹]/gu, '');
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function build(table) {
  const map = new Map();
  for (const [triggers, sets] of table) for (const t of triggers.split(/\s+/)) if (!map.has(t)) map.set(t, sets);
  return map;
}
const CONCEPT_MAP = build(CONCEPTS);
const MOOD_MAP = build(MOODS);

function pick(sets, kind, seed) {
  for (const set of sets) {
    const need = set.split(' ');
    const pool = LIBRARY.filter((x) => x.kind === kind && need.every((n) => x.keywords.includes(n)));
    if (pool.length) return pool[hash(`${seed}|${set}`) % pool.length].id;
  }
  return '';
}

// Object visual for the first matching word (hero word checked first).
export function matchObject(words, heroIndex = -1, seed = 0) {
  const order = heroIndex >= 0 ? [words[heroIndex], ...words] : words;
  for (const w of order) {
    const sets = CONCEPT_MAP.get(WORD(w));
    const id = sets && pick(sets, 'object', seed);
    if (id) return id;
  }
  return '';
}

export function matchReaction(words, seed = 0) {
  for (const w of words) {
    const sets = MOOD_MAP.get(WORD(w));
    const id = sets && pick(sets, 'reaction', seed + words.length);
    if (id) return id;
  }
  return '';
}
