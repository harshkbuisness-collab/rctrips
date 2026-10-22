// 3D icons (Microsoft Fluent Emoji, MIT licensed, stored in public/icons) matched to spoken keywords.

// [Fluent asset name, keywords (English, Hinglish, Hindi)]
const ICONS = [
  ['Chart increasing', 'growth grow grows growing badh badhega increase ग्रोथ बढ़'],
  ['Chart decreasing', 'drop down decrease loss girna kam घट कम'],
  ['Eyes', 'views view watch watching dekh dekhte dekhne attention व्यूज व्यूज़ देख अटेंशन'],
  ['Fishing pole', 'hook hooks हुक'],
  ['Money bag', 'money income paisa paise kamai earn earning revenue sales ₹ पैसा पैसे कमाई'],
  ['Stopwatch', 'second seconds time minute minutes waqt jaldi सेकंड सेकेंड्स समय टाइम मिनट'],
  ['Light bulb', 'idea ideas tip tips trick tricks आइडिया टिप'],
  ['Clapper board', 'video videos reel reels shoot वीडियो रील'],
  ['Mobile phone', 'phone mobile instagram app apps फोन मोबाइल इंस्टाग्राम'],
  ['Speech balloon', 'comment comments reply message dm कमेंट मैसेज'],
  ['Bell', 'follow followers subscribe notification फॉलो फॉलोअर्स'],
  ['Red heart', 'like likes love pyaar लाइक प्यार'],
  ['Bookmark', 'save saved सेव'],
  ['Fire', 'viral trend trending hot fire वायरल ट्रेंड'],
  ['Rocket', 'fast launch boost rocket tez तेज़ बूस्ट'],
  ['Bullseye', 'target goal audience niche लक्ष्य टारगेट ऑडियंस'],
  ['Robot', 'ai chatgpt automation robot एआई'],
  ['Musical notes', 'music song audio sound गाना म्यूजिक'],
  ['Cross mark', 'mistake mistakes wrong galat galti fail गलत ग़लत गलती'],
  ['Check mark button', 'right correct sahi done yes सही'],
  ['Stop sign', 'stop ruk ruko रुको रुक'],
  ['Warning', 'problem warning danger risk समस्या प्रॉब्लम'],
  ['Brain', 'brain mind psychology think soch दिमाग सोच'],
  ['Red question mark', 'question why kyun kya kaise सवाल क्यों'],
  ['Locked', 'secret secrets hidden राज़ सीक्रेट'],
  ['Memo', 'script scripts write likh content post caption स्क्रिप्ट कंटेंट लिख'],
  ['Scissors', 'edit editing cut एडिट'],
  ['Hammer and wrench', 'tool tools setup fix टूल'],
  ['Trophy', 'win success result results best जीत सफलता रिजल्ट'],
  ['Bar chart', 'data analytics insights stats numbers डेटा'],
  ['Spiral calendar', 'daily consistency consistent day days week रोज़ रोज दिन'],
  ['Busts in silhouette', 'people log audience community लोग'],
  ['Wrapped gift', 'free bonus gift फ्री गिफ्ट'],
  ['Magnet', 'attract magnet pull आकर्षित'],
  ['Gem stone', 'brand premium value quality ब्रांड वैल्यू'],
  ['Magnifying glass tilted left', 'search find research seo खोज'],
  ['Sleeping face', 'boring bore बोरिंग'],
  ['Exploding head', 'shocking shock crazy mindblowing'],
];

// Path inside public/ — wrap with staticFile() when rendering.
export const iconPath = (name) => (name ? `icons/${name.toLowerCase().replace(/ /g, '_')}.png` : '');
export const ICON_NAMES = ICONS.map(([name]) => name);

const LOOKUP = new Map();
for (const [name, words] of ICONS) for (const w of words.split(/\s+/)) LOOKUP.set(w.toLowerCase(), name);

// Return the icon for the first matching word (hero word checked first).
export function matchIcon(words, heroIndex = -1) {
  const order = heroIndex >= 0 ? [words[heroIndex], ...words] : words;
  for (const w of order) {
    const key = String(w.text).toLowerCase().replace(/[^\p{L}\p{M}\p{N}₹]/gu, '');
    if (LOOKUP.has(key)) return LOOKUP.get(key);
  }
  return '';
}
