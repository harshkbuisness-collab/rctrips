// Colour palettes: one "theme" line in the plan colours every banner, card, ring, highlight and background,
// so a video looks like one brand instead of random colours.
// main = the brand colour (banners, cards, rings), second = a partner colour (second bar, other side),
// good / bad = right / wrong, dark = text and outlines, tints = backdrop colours used scene after scene.
export const THEMES = {
  classic: {main: '#2F80FF', second: '#FFC83D', good: '#22C55E', bad: '#FF4D3D', dark: '#111111', tints: ['#FF4D3D', '#2F80FF', '#22C55E', '#FFC83D', '#8B3DFF']},
  purple: {main: '#8B3DFF', second: '#FFC83D', good: '#22C55E', bad: '#FF4D3D', dark: '#15111C', tints: ['#8B3DFF', '#FF5FA2', '#5B8CFF', '#FFC83D']},
  coral: {main: '#FF5C39', second: '#11132B', good: '#1FB47A', bad: '#E5243B', dark: '#11132B', tints: ['#FF5C39', '#3D5AFE', '#FFB347', '#11132B']},
  tomato: {main: '#E23744', second: '#FFC83D', good: '#22A559', bad: '#E23744', dark: '#17141A', tints: ['#E23744', '#FF8A3D', '#FFC83D', '#17141A']},
  lime: {main: '#7BC300', second: '#111111', good: '#7BC300', bad: '#FF3B30', dark: '#0D0D0F', tints: ['#B8F000', '#0D0D0F', '#7BC300', '#00C2A8']},
  pink: {main: '#FF2E88', second: '#7A3CFF', good: '#22C55E', bad: '#FF3B30', dark: '#1A0B1F', tints: ['#FF2E88', '#7A3CFF', '#FF9ECF', '#FFC83D']},
  gold: {main: '#F2A100', second: '#1C1206', good: '#3BAA3B', bad: '#E5402B', dark: '#1C1206', tints: ['#FFB000', '#FF7A00', '#C08A2E', '#1C1206']},
  ocean: {main: '#00A3E0', second: '#071A2B', good: '#14C995', bad: '#FF4D5E', dark: '#071A2B', tints: ['#00B8F5', '#2F6BFF', '#14C995', '#071A2B']},
  mint: {main: '#14B88A', second: '#0E1F1A', good: '#14B88A', bad: '#FF5A4E', dark: '#0E1F1A', tints: ['#14C995', '#2F80FF', '#FFC83D', '#0E1F1A']},
  royal: {main: '#1E3FAE', second: '#FFD400', good: '#22C55E', bad: '#FF3B30', dark: '#0B1A4A', tints: ['#1E3FAE', '#FFD400', '#2F80FF', '#FF3B30']},
  blackred: {main: '#FF1E1E', second: '#0A0A0A', good: '#22C55E', bad: '#FF1E1E', dark: '#0A0A0A', tints: ['#FF1E1E', '#0A0A0A', '#FF6B6B', '#0A0A0A']},
};
// Font sets: pop = stickers, banners, cards; hook = fat hook words; comic; display = titles, captions, card text.
// wk = how wide the letters are compared with the classic fonts (the tool sizes text with it so it never runs off screen).
export const FONT_SETS = {
  classic: {pop: '"Anton"', popWeight: 400, hook: '"Luckiest Guy"', hookWeight: 400, comic: '"Bangers"', display: '"Jost"', displayWeight: 800,
    wk: {pop: 1, box: 1, thumb: 1, hook: 1, comic: 1, display: 1}},
  // sporty: tall condensed headlines + a heavy grotesk
  sport: {pop: '"Bebas Neue"', popWeight: 400, hook: '"Archivo Black"', hookWeight: 400, comic: '"Bebas Neue"', display: '"Archivo"', displayWeight: 800,
    wk: {pop: 0.83, box: 0.83, thumb: 0.83, hook: 1.35, comic: 0.93, display: 1.01}},
  // modern: wide geometric headlines, clean techy text
  modern: {pop: '"Unbounded"', popWeight: 800, hook: '"Dela Gothic One"', hookWeight: 400, comic: '"Unbounded"', display: '"Space Grotesk"', displayWeight: 700,
    wk: {pop: 1.8, box: 1.8, thumb: 1.8, hook: 1.58, comic: 2.0, display: 0.88}},
  // playful: round chunky letters that match the cartoon H
  playful: {pop: '"Lilita One"', popWeight: 400, hook: '"Lilita One"', hookWeight: 400, comic: '"Lilita One"', display: '"Rubik"', displayWeight: 800,
    wk: {pop: 1.24, box: 1.24, thumb: 1.24, hook: 1.04, comic: 1.4, display: 0.97}},
  // Effortless Exercise brand: Anton like the thumbnails, Archivo for small text
  brand: {pop: '"Anton"', popWeight: 400, hook: '"Anton"', hookWeight: 400, comic: '"Anton"', display: '"Archivo"', displayWeight: 800,
    wk: {pop: 1, box: 1, thumb: 1, hook: 0.83, comic: 1.12, display: 1.01}},
};
export const FONT_NAMES = Object.keys(FONT_SETS);

// Brand themes: own colours + own fonts in one name
Object.assign(THEMES, {
  volt: {main: '#C6F432', second: '#0B0B0F', good: '#00C27A', bad: '#FF4D1F', dark: '#0B0B0F', font: 'sport', tints: ['#C6F432', '#FF4D1F', '#5B5BFF', '#0B0B0F']},
  blaze: {main: '#5B2EFF', second: '#FFC21A', good: '#00C9A7', bad: '#FF3D68', dark: '#12101F', font: 'modern', tints: ['#5B2EFF', '#FF3D68', '#00C9A7', '#FFC21A']},
  // the channel's own look: black + red + neon green on white, like the thumbnails and the logo
  effortless: {main: '#E3262E', second: '#111111', good: '#2FD94E', bad: '#E3262E', dark: '#111111', font: 'brand', tints: ['#E3262E', '#2FD94E', '#111111', '#E3262E', '#2FD94E']},
  candy: {main: '#7B2FF7', second: '#FFD23F', good: '#12C2B5', bad: '#FF4F6D', dark: '#1B1033', font: 'playful', tints: ['#7B2FF7', '#FFD23F', '#FF4F6D', '#12C2B5']},
});
export const THEME_NAMES = Object.keys(THEMES);
// theme + font set (the plan's "font" wins over the theme's own)
export const themeOf = (name, font) => {
  const t = THEMES[name] ?? THEMES.classic;
  return {...t, fonts: FONT_SETS[font ?? t.font ?? 'classic'] ?? FONT_SETS.classic};
};
// CSS variables the layers read their fonts from
export const fontVars = (f) => ({'--f-pop': `${f.pop}, "Anton", sans-serif`, '--w-pop': f.popWeight, '--f-hook': `${f.hook}, "Anton", sans-serif`, '--w-hook': f.hookWeight,
  '--f-comic': `${f.comic}, "Anton", sans-serif`, '--f-display': `${f.display}, "Jost", sans-serif`, '--w-display': f.displayWeight});
// text colour that reads on a background colour
export const onColor = (hex, dark = '#111111') => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(f, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? dark : '#FFFFFF';
};

// A scene without a backdrop still gets one: the patterns rotate scene by scene in the theme's colours.
export const AUTO_BACKDROPS = ['halftone', 'grid', 'dots', 'stripes', 'notebook', 'blobs', 'plus', 'waves', 'checker'];
