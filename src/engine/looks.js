// Video styles ("looks"). Each look sets colours, fonts, how words animate in,
// how the keyword is highlighted, and the card layout. Read by src/remotion/Reel.jsx.
const DEV = "'Noto Sans Devanagari', sans-serif";
const INTER = `Inter, ${DEV}`;

// layout:    cards   — sentence / big-word cards (default)
//            oneword — one huge word at a time
//            karaoke — whole line as captions, spoken word boxed
// wordAnim:  blur | rise | pop | slam | type | fade
// highlight: color | box | marker | glow | underline
export const LOOKS = [
  {id: 'editorial', label: '01 · Editorial (white, blur-in)', layout: 'cards',
    bg: '#FAFAFA', ink: '#111111', dark: '#050505', darkInk: '#FFFFFF', accents: ['#E5262A', '#1F6BFF'], cta: '#FFE600',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: true, labelFont: `'Libre Caslon Text', ${DEV}`,
    wordAnim: 'blur', highlight: 'color'},
  {id: 'neon', label: '02 · Neon Night (dark, glow)', layout: 'cards',
    bg: '#07070B', ink: '#F5F5F5', dark: '#000000', darkInk: '#FFFFFF', accents: ['#39FF88', '#00E5FF'], cta: '#39FF88',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: INTER,
    wordAnim: 'rise', highlight: 'glow', boxBg: '#39FF88', boxInk: '#000000'},
  {id: 'poster', label: '03 · Bold Poster (colour blocks, ALL CAPS)', layout: 'cards', upper: true,
    cycle: [{bg: '#FF3B30', ink: '#FFFFFF', accent: '#111111'}, {bg: '#111111', ink: '#FFFFFF', accent: '#FFD60A'},
      {bg: '#FFD60A', ink: '#111111', accent: '#FF3B30'}, {bg: '#1F6BFF', ink: '#FFFFFF', accent: '#FFD60A'}],
    bg: '#FF3B30', ink: '#FFFFFF', dark: '#111111', darkInk: '#FFFFFF', accents: ['#111111'], cta: '#FFD60A',
    font: `Anton, ${DEV}`, weight: 400, heroFont: `Anton, ${DEV}`, heroWeight: 400, heroItalic: false, labelFont: `Anton, ${DEV}`,
    wordAnim: 'slam', highlight: 'color', textScale: 1.35, tracking: '0.01em', boxBg: '#FFD60A', boxInk: '#111111'},
  {id: 'kinetic', label: '04 · Kinetic (one word at a time)', layout: 'oneword', upper: true,
    bg: '#111111', ink: '#FFFFFF', dark: '#000000', darkInk: '#FFFFFF', accents: ['#FFD60A', '#FF3B30'], cta: '#FFD60A',
    font: `Oswald, ${DEV}`, weight: 700, heroFont: `Oswald, ${DEV}`, heroWeight: 700, heroItalic: false, labelFont: `Oswald, ${DEV}`,
    wordAnim: 'pop', highlight: 'color', boxBg: '#FFD60A', boxInk: '#111111'},
  {id: 'notebook', label: '05 · Notebook (cream, marker)', layout: 'cards',
    bg: '#FFF8E7', ink: '#1D1D1D', dark: '#1D1D1D', darkInk: '#FFF8E7', accents: ['#E5262A', '#1F6BFF'], cta: '#FFE066',
    font: `'DM Sans', ${DEV}`, weight: 700, heroFont: `Caveat, ${DEV}`, heroWeight: 700, heroItalic: false, heroScale: 1.25,
    labelFont: `Caveat, ${DEV}`, labelScale: 1.4, wordAnim: 'rise', highlight: 'marker', marker: '#FFE066', boxBg: '#FFE066', boxInk: '#1D1D1D'},
  {id: 'captions', label: '06 · Captions (karaoke box)', layout: 'karaoke', upper: true,
    bg: '#0E0E10', ink: '#FFFFFF', dark: '#000000', darkInk: '#FFFFFF', accents: ['#7B3FF2', '#FF2D87'], cta: '#FFFFFF',
    font: `'DM Sans', ${DEV}`, weight: 800, heroFont: `'DM Sans', ${DEV}`, heroWeight: 800, heroItalic: false, labelFont: `'DM Sans', ${DEV}`,
    wordAnim: 'pop', highlight: 'box', boxBg: '#7B3FF2', boxInk: '#FFFFFF'},
  {id: 'typewriter', label: '07 · Typewriter (mono, paper)', layout: 'cards',
    bg: '#F4F1EA', ink: '#222222', dark: '#222222', darkInk: '#F4F1EA', accents: ['#E5262A', '#E5262A'], cta: '#F4F1EA',
    font: `'Space Mono', ${DEV}`, weight: 700, heroFont: `'Space Mono', ${DEV}`, heroWeight: 700, heroItalic: false, heroScale: 0.8,
    labelFont: `'Space Mono', ${DEV}`, wordAnim: 'type', highlight: 'underline', tracking: '-0.03em', boxBg: '#F4F1EA', boxInk: '#222222'},
  {id: 'boldbox', label: '08 · Bold Box (dark, boxed keyword)', layout: 'cards', upper: true, align: 'left',
    bg: '#0B0B0B', ink: '#FFFFFF', dark: '#FF5A1F', darkInk: '#0B0B0B', accents: ['#FF5A1F', '#FF5A1F'], cta: '#0B0B0B',
    font: INTER, weight: 900, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: INTER,
    wordAnim: 'pop', highlight: 'box', textScale: 1.15, tracking: '-0.03em', boxBg: '#0B0B0B', boxInk: '#FFFFFF'},
  {id: 'comic', label: '09 · Comic Pop (yellow, outlined)', layout: 'cards', upper: true,
    bg: '#FFD60A', ink: '#FFFFFF', dark: '#111111', darkInk: '#FFD60A', accents: ['#FF3B30', '#1F6BFF'], cta: '#FFD60A',
    font: `Anton, ${DEV}`, weight: 400, heroFont: `Anton, ${DEV}`, heroWeight: 400, heroItalic: false, labelFont: `Anton, ${DEV}`,
    wordAnim: 'pop', highlight: 'color', textScale: 1.3, tracking: '0.01em', outline: '#111111', boxBg: '#FF3B30', boxInk: '#FFFFFF'},
  {id: 'luxury', label: '10 · Luxury (black, gold serif)', layout: 'cards',
    bg: '#0A0A0A', ink: '#F2EDE4', dark: '#0A0A0A', darkInk: '#F2EDE4', accents: ['#D4AF37', '#D4AF37'], cta: '#D4AF37',
    font: `'Playfair Display', ${DEV}`, weight: 700, heroFont: `'Playfair Display', ${DEV}`, heroWeight: 700, heroItalic: true,
    labelFont: `'Playfair Display', ${DEV}`, wordAnim: 'fade', highlight: 'color', tracking: '0.01em', boxBg: '#D4AF37', boxInk: '#0A0A0A'},
];

export const getLook = (id) => LOOKS.find((l) => l.id === id) || LOOKS[0];
