// Video templates ("looks"), modelled on reference reels. A template sets colours,
// fonts, layout, decorations and the text animation. Read by src/remotion/Reel.jsx.
const DEV = "'Noto Sans Devanagari', sans-serif";
const INTER = `Inter, ${DEV}`;
const SERIF = `'Playfair Display', ${DEV}`;
const SCRIPT = `'Dancing Script', ${DEV}`;
const HAND = `Caveat, ${DEV}`;

// layout:     stack   — sentence / big-word cards (default)
//             collage — words scattered at mixed sizes
//             bonus   — white keyword + ghost / black yellow-script / red script / yellow flash cards, rotating
//             stair   — staircase lines: small white, red outlined keyword typed, small white; inline and big-red cards
//             meme    — dark icon cards with words around the icon, white red-headline cards with a cat rising,
//                       dark number lines, grey serif meme cards, peach cards (reference 5)
//             super   — huge white serif keyword with small blue words as superscript / subscript / beside,
//                       yellow accents, a Follow button being clicked (reference 7)
//             wire    — paper, CAPS title tag on top, a line-drawn UI wireframe panel drawing in (reference 8)
//             app     — cream then black cards: huge condensed word + app tile + toggle, yellow stat cards,
//                       icon + blue serif keyword, typed lines; mascot peeking bottom-right (reference 9)
//             ourtypo — burgundy: white + gold lines that build, wide-spaced serif tails, vertical word stacks,
//                       italic serif leads, numbered lines; cat silhouettes walk the bottom (reference 11)
//             anuj    — cream: red keyword with small words above-left / below-right, pen hands from the corners,
//                       a keyword shrinking into place, a ghost word with a black word on top, an orbit badge (reference 12)
//             news    — red grain / pale-yellow cards: bold sans + italic serif lockups, a paper cut-out sliding in,
//                       keywords in yellow highlight boxes, tiny italic one-liners (reference 15)
//             serif   — serif lockups in red + dark, italic / script / small-caps mixes, rotating per card
//             lockup  — poster lockup: small lead-in, huge keyword, small follow-on (with camera and flair)
//             tag     — keyword in a title tag, visual in the middle, sentence below
//             feed    — lines type in at the bottom and push older lines up
//             run     — whole line dim, a highlight box runs from word to word
// motion:     text animation for words (src/remotion/motion.jsx); heroMotion for the big word
// transition: how a card comes in — wipe (diagonal black), circle (white circle grows), zoom (through the camera), whip (sideways), blur
// extras:     ghost (huge faded keyword behind), texture (paper | grain), cycle (per-card
//             backgrounds), mascot (corner character), walker (cat walking along the bottom),
//             scriptFont (every other big word in script), ctaBg (coloured Comment card),
//             toggle (switch turns on for "setting / on / enable" lines), artEnter (slide | draw),
//             questions ("?" marks pop on question cards), character (poses on the left, lockup layout),
//             heroCycle (full-colour backgrounds for big-word cards), frame (cards inside a rounded frame),
//             ctaStack (Comment over a blue “keyword”, offset), ctaInline (Comment “keyword” on one line), ctaHands (3D hands pointing at the Comment card), bgArt (the card's visual, huge and faded in sepia behind the text),
//             sfx (typing clicks, pops, whooshes), transitionEvery (only every Nth card transitions)
export const LOOKS = [
  {id: 'collage', label: 'Ref 1 · Type & Build (lockups, mascot, black wipe)', layout: 'lockup', motion: 'type', transition: 'wipe', transitionEvery: 3, texture: 'soft', character: true,
    cycle: [{bg: '#FFFFFF', ink: '#111111', accent: 'gradient'}, {bg: '#FFFFFF', ink: '#111111', accent: '#E5262A'},
      {bg: '#FFFFFF', ink: '#111111', accent: 'gradient'}, {bg: '#0A0A0A', ink: '#FFFFFF', accent: '#FF3B30'}],
    gradient: 'linear-gradient(90deg, #1F4BFF, #00B7FF)',
    bg: '#FFFFFF', ink: '#111111', dark: '#0A0A0A', darkInk: '#FFFFFF', accents: ['#1F4BFF', '#E5262A'], cta: '#25D366',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: INTER},
  {id: 'statue', label: 'Ref 2 · Serif Statue (cream, faded statue)', layout: 'serif', motion: 'fade', bgArt: true,
    bg: '#FBF3DC', ink: '#2A2522', dark: '#111111', darkInk: '#FBF3DC', accents: ['#CF1B1B', '#CF1B1B'], cta: '#CF1B1B',
    font: SERIF, weight: 700, heroFont: SERIF, heroWeight: 900, heroItalic: false, scriptFont: SCRIPT, labelFont: SERIF, boxBg: '#CF1B1B', boxInk: '#FBF3DC'},
  {id: 'bonus', label: 'Ref 3 · Bold Bonus (white/black, ghost word, yellow script)', layout: 'bonus', motion: 'blur', ghost: true,
    bg: '#FFFFFF', ink: '#111111', dark: '#050505', darkInk: '#FFFFFF', accents: ['#E5262A', '#1F6BFF'], cta: '#FFFFFF', ctaBg: '#29A8F0', ctaHands: true,
    font: INTER, weight: 800, heroFont: INTER, heroWeight: 900, heroItalic: false, scriptFont: `Yellowtail, ${DEV}`, labelFont: `'Libre Caslon Text', ${DEV}`},
  {id: 'haider', label: 'Ref 4 · Black Serif Staircase (red outlined keyword)', layout: 'stair', motion: 'fade', character: true,
    bg: '#000000', ink: '#FFFFFF', dark: '#000000', darkInk: '#FFFFFF', accents: ['#E5161D', '#E5161D'], cta: '#E5161D',
    font: SERIF, weight: 700, heroFont: SERIF, heroWeight: 900, heroItalic: false, labelFont: SERIF, boxBg: '#E5161D', boxInk: '#FFFFFF'},
  {id: 'zubair', label: 'Ref 5 · Meme Mix (icon cards, red headlines, circle wipe)', layout: 'meme', motion: 'fade', transition: 'circle',
    bg: '#2A2A2A', ink: '#FFFFFF', dark: '#2A2A2A', darkInk: '#FFFFFF', accents: ['#E8291C', '#E8291C'], cta: '#E8291C',
    font: INTER, weight: 600, heroFont: INTER, heroWeight: 700, heroItalic: false, labelFont: INTER, boxBg: '#E8291C', boxInk: '#FFFFFF'},
  {id: 'presenter', label: 'Ref 6 · Presenter (mascot, dark green)', layout: 'run', motion: 'pop', mascot: true,
    bg: '#0F2E22', ink: '#FFFFFF', dark: '#06140F', darkInk: '#FFFFFF', accents: ['#2FBF71', '#2FBF71'], cta: '#3DDC84',
    font: INTER, weight: 800, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: INTER, stepPrefix: 'Step', boxBg: '#3DDC84', boxInk: '#06140F'},
  {id: 'superscript', label: 'Ref 7 · Cinematic Serif (white serif + blue super/subscript)', layout: 'super', motion: 'fade',
    bg: '#000000', ink: '#FFFFFF', dark: '#000000', darkInk: '#FFFFFF', accents: ['#2E9BFF', '#FFD60A'], cta: '#FFFFFF',
    font: INTER, weight: 500, heroFont: SERIF, heroWeight: 900, heroItalic: false, labelFont: SERIF, boxBg: '#FFFFFF', boxInk: '#000000'},
  {id: 'wireframe', label: 'Ref 8 · Paper Wireframe (title tag + drawn UI panels)', layout: 'wire', motion: 'type', ghost: true, texture: 'paper', questions: true,
    bg: '#E8E8E5', ink: '#3A3A3A', dark: '#2F5D50', darkInk: '#FFFFFF', accents: ['#2F5D50', '#B9474B'], cta: '#FFFFFF',
    font: `Caveat, ${DEV}`, weight: 700, heroFont: `Montserrat, ${DEV}`, heroWeight: 800, heroItalic: false, labelFont: `Montserrat, ${DEV}`, boxBg: '#FFFFFF', boxInk: '#2F5D50'},
  {id: 'appsteps', label: 'Ref 9 · App Steps (cream → black, peeking mascot, toggles, stat cards)', layout: 'app', motion: 'type', ctaInline: true,
    bg: '#F3EBC7', ink: '#1A1A1A', dark: '#000000', darkInk: '#FFFFFF', accents: ['#2F6BFF', '#2F6BFF'], cta: '#FFFFFF', stepPrefix: 'Step:',
    font: INTER, weight: 800, heroFont: `Oswald, ${DEV}`, heroWeight: 700, heroItalic: false, labelFont: INTER, boxBg: '#FFFFFF', boxInk: '#000000'},
  {id: 'framed', label: 'Ref 10 · Framed Cards (brown / cream)', layout: 'stack', motion: 'type', frame: true, frameBg: '#161616', align: 'center',
    cycle: [{bg: '#6B4A35', ink: '#F3E3C8', accent: '#FFC94A'}, {bg: '#F3E3C8', ink: '#4A2F1F', accent: '#C0392B'}],
    bg: '#6B4A35', ink: '#F3E3C8', dark: '#2B1D14', darkInk: '#F3E3C8', accents: ['#FFC94A', '#FFC94A'], cta: '#FFC94A',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, heroScale: 0.85, labelFont: INTER, boxBg: '#FFC94A', boxInk: '#2B1D14'},
  {id: 'ourtypo', label: 'Ref 11 · Burgundy Build (gold words, wide serif, cat parade, hanging toy)', layout: 'ourtypo', motion: 'fade',
    bg: '#5A1E2C', ink: '#FFFFFF', dark: '#4A1724', darkInk: '#FFFFFF', accents: ['#F4C542', '#F4C542'], cta: '#F4C542',
    font: INTER, weight: 800, heroFont: INTER, heroWeight: 900, heroItalic: false, labelFont: SERIF, boxBg: '#F4C542', boxInk: '#4A1724'},
  {id: 'anuj', label: 'Ref 12 · Cream Pop (red keyword, pen hands, ghost overlay, orbit badge)', layout: 'anuj', motion: 'pop', ctaStack: true,
    bg: '#FBF8D4', ink: '#111111', dark: '#FBF8D4', darkInk: '#111111', accents: ['#D41F26', '#3B4CFF'], cta: '#111111',
    font: `Montserrat, ${DEV}`, weight: 800, heroFont: `Montserrat, ${DEV}`, heroWeight: 800, heroItalic: false, labelFont: `Montserrat, ${DEV}`, boxBg: '#D41F26', boxInk: '#FFFFFF'},
  {id: 'classic2', label: 'Ref 13 · Classic Flash (colour flash cards)', layout: 'stack', motion: 'blur', ghost: true, align: 'center',
    heroCycle: [{bg: '#FFFFFF', ink: '#111111', accent: '#E5262A'}, {bg: '#FFE14D', ink: '#111111', accent: '#111111'},
      {bg: '#E5262A', ink: '#FFFFFF', accent: '#FFFFFF'}, {bg: '#29A8F0', ink: '#FFFFFF', accent: '#FFFFFF'}],
    bg: '#FFFFFF', ink: '#111111', dark: '#050505', darkInk: '#FFFFFF', accents: ['#E5262A', '#E5262A'], cta: '#FFFFFF', ctaBg: '#29A8F0',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, scriptFont: SCRIPT, labelFont: INTER},
  {id: 'plum', label: 'Ref 14 · Plum (white + yellow, mascot)', layout: 'stack', motion: 'tracking', mascot: true, align: 'center',
    bg: '#3A1E35', ink: '#FFFFFF', dark: '#2A1426', darkInk: '#FFFFFF', accents: ['#FFD43B', '#FF7AC6'], cta: '#FFD43B',
    font: INTER, weight: 700, heroFont: INTER, heroWeight: 900, heroItalic: false, heroScale: 0.9, labelFont: INTER, boxBg: '#FFD43B', boxInk: '#2A1426'},
  {id: 'newsprint', label: 'Ref 15 · Newsprint (red grain, sans + italic serif, cut-outs, yellow highlight)', layout: 'news', motion: 'fade', texture: 'grain',
    bg: '#A80C0C', ink: '#F2C3A0', dark: '#8E0A0A', darkInk: '#F5D9B8', accents: ['#F2C3A0', '#EDD98A'], cta: '#F5D9B8',
    font: `Montserrat, ${DEV}`, weight: 800, heroFont: `Montserrat, ${DEV}`, heroWeight: 800, heroItalic: false, labelFont: SERIF, boxBg: '#EDD98A', boxInk: '#A80C0C'},
];

// Text animations a template can be switched to (src/remotion/motion.jsx).
export const MOTIONS = [
  ['blur', 'Blur Rise'], ['mask', 'Mask Slide'], ['drop', 'Letter Drop'], ['decode', 'Decode'], ['type', 'Typewriter'],
  ['zoom', 'Zoom Punch'], ['tracking', 'Tracking In'], ['flip', '3D Flip'], ['fill', 'Fill Sweep'], ['glitch', 'Glitch'],
  ['pop', 'Pop'], ['stamp', 'Stamp'], ['scatter', 'Scatter'], ['slide', 'Slide'], ['fade', 'Fade'],
];

// Unknown or retired ids fall back to the first template.
export const getLook = (id) => LOOKS.find((l) => l.id === id) || LOOKS[0];
