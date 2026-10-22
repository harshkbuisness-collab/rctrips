// Video templates ("looks"), modelled on reference reels. A template sets colours,
// fonts, layout, decorations and the text animation. Read by src/remotion/Reel.jsx.
const DEV = "'Noto Sans Devanagari', sans-serif";
const INTER = `Inter, ${DEV}`;
const SERIF = `'Playfair Display', ${DEV}`;
const SCRIPT = `'Dancing Script', ${DEV}`;
const HAND = `Caveat, ${DEV}`;

// layout:     stack   — sentence / big-word cards (default)
//             collage — words scattered at mixed sizes
//             serif   — serif lockups in red + dark, italic / script / small-caps mixes, rotating per card
//             lockup  — poster lockup: small lead-in, huge keyword, small follow-on (with camera and flair)
//             tag     — keyword in a title tag, visual in the middle, sentence below
//             feed    — lines type in at the bottom and push older lines up
//             run     — whole line dim, a highlight box runs from word to word
// motion:     text animation for words (src/remotion/motion.jsx); heroMotion for the big word
// transition: how a card comes in — wipe (diagonal black), zoom (through the camera), whip (sideways), blur
// extras:     ghost (huge faded keyword behind), texture (paper | grain), cycle (per-card
//             backgrounds), mascot (corner character), walker (cat walking along the bottom),
//             scriptFont (every other big word in script), ctaBg (coloured Comment card),
//             toggle (switch turns on for "setting / on / enable" lines), artEnter (slide | draw),
//             questions ("?" marks pop on question cards), character (poses on the left, lockup layout),
//             bgArt (the card's visual, huge and faded in sepia behind the text),
//             sfx (typing clicks, pops, whooshes), transitionEvery (only every Nth card transitions)
export const LOOKS = [
  {id: 'classic', label: '01 · Blur Build', layout: 'stack', motion: 'blur', ghost: true,
    bg: '#FAFAFA', ink: '#111111', dark: '#050505', darkInk: '#FFFFFF', accents: ['#E5262A', '#1F6BFF'], cta: '#FFFFFF', ctaBg: '#29A8F0',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: true, scriptFont: SCRIPT, labelFont: `'Libre Caslon Text', ${DEV}`},
  {id: 'collage', label: '02 · Type & Build', layout: 'lockup', motion: 'type', transition: 'wipe', transitionEvery: 3, texture: 'soft', character: true,
    cycle: [{bg: '#FFFFFF', ink: '#111111', accent: 'gradient'}, {bg: '#FFFFFF', ink: '#111111', accent: '#E5262A'},
      {bg: '#FFFFFF', ink: '#111111', accent: 'gradient'}, {bg: '#0A0A0A', ink: '#FFFFFF', accent: '#FF3B30'}],
    gradient: 'linear-gradient(90deg, #1F4BFF, #00B7FF)',
    bg: '#FFFFFF', ink: '#111111', dark: '#0A0A0A', darkInk: '#FFFFFF', accents: ['#1F4BFF', '#E5262A'], cta: '#25D366',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: INTER},
  {id: 'cinematic', label: '03 · Scramble Settle', layout: 'stack', motion: 'blur', heroMotion: 'scatter', transition: 'blur', align: 'center',
    bg: '#000000', ink: '#FFFFFF', dark: '#000000', darkInk: '#FFFFFF', accents: ['#FFFFFF', '#FFFFFF'], cta: '#FFFFFF', subInk: '#3D7BFF',
    font: INTER, weight: 600, heroFont: SERIF, heroWeight: 900, heroItalic: false, heroTracking: '-0.02em', labelFont: SERIF, boxBg: '#FFFFFF', boxInk: '#000000'},
  {id: 'maroon', label: '04 · Push-Up Feed', layout: 'feed', motion: 'type', walker: 's010',
    bg: '#5A1E2C', ink: '#FFFFFF', dark: '#3E1420', darkInk: '#F4C542', accents: ['#F4C542', '#F4C542'], cta: '#F4C542',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: INTER, boxBg: '#F4C542', boxInk: '#3E1420'},
  {id: 'cream', label: '05 · Pop & Toggle', layout: 'stack', motion: 'pop', ghost: true, toggle: true, align: 'center',
    bg: '#FBF5D9', ink: '#111111', dark: '#111111', darkInk: '#FBF5D9', accents: ['#111111', '#E5262A'], cta: '#E5262A', subInk: '#E5262A',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, heroScale: 1.1, labelFont: INTER, boxBg: '#E5262A', boxInk: '#FFFFFF'},
  {id: 'newspaper', label: '06 · Slide-In Story', layout: 'stack', motion: 'blur', heroMotion: 'slide', artEnter: 'slide', texture: 'grain',
    cycle: [{bg: '#B3121B', ink: '#FFFFFF', accent: '#F6D47A'}, {bg: '#EFD27E', ink: '#B3121B', accent: '#7A0A10'}],
    bg: '#B3121B', ink: '#FFFFFF', dark: '#7A0A10', darkInk: '#F6D47A', accents: ['#F6D47A', '#F6D47A'], cta: '#F6D47A',
    font: SCRIPT, weight: 700, textScale: 1.4, subScale: 1.4, heroFont: SERIF, heroWeight: 900, heroItalic: false, heroScale: 1.1, labelFont: SERIF, boxBg: '#F6D47A', boxInk: '#7A0A10'},
  {id: 'paper', label: '07 · Tag Wipe', layout: 'tag', motion: 'type', ghost: true, texture: 'paper', artEnter: 'draw', questions: true,
    bg: '#E9E9E7', ink: '#3A3A3A', dark: '#2F5D50', darkInk: '#FFFFFF', accents: ['#2F5D50', '#C0392B'], cta: '#FFFFFF', tagBg: '#2F5D50', tagInk: '#FFFFFF',
    font: INTER, weight: 600, heroFont: `Oswald, ${DEV}`, heroWeight: 700, heroItalic: false, labelFont: `Oswald, ${DEV}`, boxBg: '#FFFFFF', boxInk: '#2F5D50'},
  {id: 'meme', label: '08 · Zoom-Through', layout: 'stack', motion: 'zoom', heroMotion: 'stamp', transition: 'zoom', align: 'center', upperHero: true,
    bg: '#1C1C1C', ink: '#FFFFFF', dark: '#111111', darkInk: '#FFFFFF', accents: ['#F2272D', '#F2272D'], cta: '#F2272D',
    font: INTER, weight: 700, heroFont: `Anton, ${DEV}`, heroWeight: 400, heroItalic: false, heroScale: 1.35, heroTracking: '0.01em', labelFont: INTER,
    boxBg: '#F2272D', boxInk: '#FFFFFF', bigArt: true},
  {id: 'blackserif', label: '09 · Whip Pan', layout: 'stack', motion: 'mask', transition: 'whip', align: 'center',
    bg: '#000000', ink: '#FFFFFF', dark: '#000000', darkInk: '#FFFFFF', accents: ['#E5262A', '#E5262A'], cta: '#E5262A',
    font: SERIF, weight: 700, heroFont: SERIF, heroWeight: 900, heroItalic: false, labelFont: SERIF, tracking: '-0.01em', boxBg: '#E5262A', boxInk: '#FFFFFF'},
  {id: 'mascot', label: '10 · Highlight Run', layout: 'run', motion: 'pop', align: 'center', mascot: true,
    cycle: [{bg: '#F7E7B0', ink: '#111111', accent: '#1F5BFF'}, {bg: '#000000', ink: '#FFFFFF', accent: '#3D7BFF'}],
    bg: '#F7E7B0', ink: '#111111', dark: '#000000', darkInk: '#FFFFFF', accents: ['#1F5BFF', '#1F5BFF'], cta: '#F7E7B0',
    font: INTER, weight: 800, heroFont: INTER, heroWeight: 900, heroItalic: false, heroScale: 0.8, labelFont: INTER, stepPrefix: 'Step:', boxBg: '#F7E7B0', boxInk: '#111111'},
  {id: 'statue', label: 'Ref 2 · Serif Statue (cream, faded statue)', layout: 'serif', motion: 'fade', bgArt: true,
    bg: '#FBF3DC', ink: '#2A2522', dark: '#111111', darkInk: '#FBF3DC', accents: ['#CF1B1B', '#CF1B1B'], cta: '#CF1B1B',
    font: SERIF, weight: 700, heroFont: SERIF, heroWeight: 900, heroItalic: false, scriptFont: SCRIPT, labelFont: SERIF, boxBg: '#CF1B1B', boxInk: '#FBF3DC'},
];

// Text animations a template can be switched to (src/remotion/motion.jsx).
export const MOTIONS = [
  ['blur', 'Blur Rise'], ['mask', 'Mask Slide'], ['drop', 'Letter Drop'], ['decode', 'Decode'], ['type', 'Typewriter'],
  ['zoom', 'Zoom Punch'], ['tracking', 'Tracking In'], ['flip', '3D Flip'], ['fill', 'Fill Sweep'], ['glitch', 'Glitch'],
  ['pop', 'Pop'], ['stamp', 'Stamp'], ['scatter', 'Scatter'], ['slide', 'Slide'], ['fade', 'Fade'],
];

// Older projects saved 'editorial'; it is the classic template without the ghost word.
export const getLook = (id) => LOOKS.find((l) => l.id === id) || {...LOOKS[0], ghost: false};
