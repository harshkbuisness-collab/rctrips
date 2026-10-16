// Timeline contract. Claude/ChatGPT writes JSON that must pass this schema;
// the renderer only understands what is defined here. Keep it in sync with
// prompts/generate-timeline.md.
import {z} from 'zod';
import {parseAnchor} from './anchors.js';
import {FONT_NAMES, THEME_NAMES} from './theme.js';
import {ICON_NAMES} from './mgLayout.js';

const ANCHOR_HELP = 'head, face, neck, shoulders, chest, back, abs, hips, arms, elbows, forearms, hands, thighs, knees, calves, feet, body (add left_/right_ for one side)';

const sec = z.number().min(0);
const norm = z.number().min(-1).max(2); // 0..1 = on canvas; small overshoot allowed for off-screen starts
const point = z.tuple([norm, norm]);
const color = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'hex color like #RRGGBB');

export const ENTER_TYPES = [
  'cut', 'fade', 'up', 'down', 'left', 'right', 'pop', 'punch', 'slam', 'zoom', 'blur',
  'elastic', 'smear', 'flyLeft', 'flyRight', 'flyUp', 'flyDown', 'squash',
  'whip', // slides in fast with ghost copies behind it, lands with a squash (animation feel)
];
export const MOTION_TYPES = ['none', 'zoomIn', 'zoomOut', 'float', 'pulse', 'driftLeft', 'driftRight', 'shake'];
export const BACKDROPS = ['none', 'rays', 'dots', 'grid', 'spotlight', 'stripes', 'halftone', 'blobs', 'notebook', 'plus', 'checker', 'waves'];
// circle = a growing circle opens the new scene, wipe = colour bars sweep across, zoomThrough = fly into the new scene, glitch = RGB-split jolt
export const TRANSITION_TYPES = ['cut', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'zoom', 'flash', 'circle', 'wipe', 'zoomThrough', 'glitch', 'zoomBlur', 'slideBlur', 'whip'];

const anim = z.union([
  z.enum(ENTER_TYPES),
  z.object({type: z.enum(ENTER_TYPES), duration: z.number().min(0).max(3).optional()}),
]);

const base = {
  id: z.string().optional(),
  at: sec.optional(),            // absolute seconds; defaults to scene start
  until: sec.optional(),         // absolute seconds; defaults to scene end
  enter: anim.optional(),
  exit: anim.optional(),
  opacity: z.number().min(0).max(1).optional(),
};
const placed = {
  x: norm.default(0.5),          // center of the layer, 0..1 of canvas width
  y: norm.default(0.58),         // center of the layer, 0..1 of canvas height
  width: z.number().min(0.02).max(3).default(0.8), // 0..1 of canvas width (full-body character fits at 0.8)
  rotation: z.number().optional(),
  flipX: z.boolean().optional(),
  motion: z.object({type: z.enum(MOTION_TYPES), amount: z.number().min(0).max(3).optional()}).optional(),
};

const ImageLayer = z.object({
  type: z.literal('image'), ...base, ...placed,
  asset: z.string(),
  shadow: z.boolean().optional(), // soft ground shadow under the figure
  frame: z.enum(['none', 'circle']).default('none'), // circle: round inset with a dark border (scene / place / detail)
  life: z.boolean().optional(), // H breathes and bounces on key words (default: on for hero_ drawings)
  autoPlace: z.boolean().optional(), // false = never moved down / smaller under a big card
  border: color.optional(),
});

const PoseLayer = z.object({
  type: z.literal('poses'), ...base, ...placed,
  frames: z.array(z.object({asset: z.string(), at: sec})).min(1),
  crossfade: z.number().min(0).max(2).default(0), // 0 = clean cuts (a crossfade shows two bodies at once)
  autoAlign: z.boolean().default(true), // match character scale + feet position between frames
  life: z.boolean().optional(),
  autoPlace: z.boolean().optional(),
  shadow: z.boolean().optional(),
});

const VideoLayer = z.object({
  type: z.literal('video'), ...base, ...placed,
  asset: z.string(),
  muted: z.boolean().default(true),
  loop: z.boolean().default(true), // an animation clip repeats while the layer is on screen
  rate: z.number().min(0.25).max(3).default(1), // playback speed (1.3 = snappier reps)
  from: z.number().min(0).default(0), // start this many seconds into the clip
  blend: z.enum(['multiply', 'normal']).default('multiply'), // multiply: the clip's white background disappears into the scene
});

const TextLayer = z.object({
  type: z.literal('text'), ...base,
  text: z.string().min(1),
  // defaults = a step title: top left, typed on and erased letter by letter
  x: norm.default(0.07),
  y: norm.default(0.17),
  size: z.number().min(10).max(400).default(84),
  maxWidth: z.number().min(0.1).max(1).default(0.86),
  align: z.enum(['left', 'center', 'right']).default('left'),
  font: z.enum(['display', 'body']).default('display'),
  italic: z.boolean().default(false),
  uppercase: z.boolean().default(true),
  color: color.optional(),
  stroke: z.object({color, width: z.number().min(0).max(30)}).default({color: '#FFFFFF', width: 12}),
  animation: z.enum(['typewriter', 'words', 'letters', 'none']).default('typewriter'), // typewriter = letter by letter, letters = each letter slams in
  untype: z.boolean().default(true), // erase letter by letter before `until`
  cps: z.number().min(2).max(120).default(28), // typewriter speed, characters per second
  strike: sec.optional(), // time a red line crosses the text out ("GYM MEMBERSHIPS" -> crossed)
  marker: sec.optional(), // time a highlighter pen swipes behind the text
  markerColor: color.optional(),
  // styled text: pop = bold YouTube letters with a black outline, box = white letters on a coloured sticker,
  // hook = fat cartoon letters with a 3D shadow, comic = comic-book letters
  look: z.enum(['plain', 'pop', 'box', 'thumb', 'hook', 'comic', 'giant', 'outline', 'neon', 'echo', 'marquee', 'tape']).optional(),
  // echo = the word stacked 5 times (middle solid, the others hollow), marquee = a giant word sliding across the screen non-stop,
  // tape = a tilted caution tape across the screen with the word repeated on it (boxColor = tape colour)
  speed: z.number().min(0).max(1500).default(260), // marquee / tape: pixels per second
  // giant = huge solid letters (best as a word behind H), outline = hollow letters (only the border), neon = white letters glowing in boxColor
  behind: z.boolean().default(false), // drawn behind the character (a big word behind H); it is not moved away from his face
  accentColor: color.optional(), // colour of *starred* words (default: the theme's main colour)
  boxColor: color.optional(),
  tilt: z.number().min(-20).max(20).optional(), // degrees
});

// No longer drawn (stars covered the character). Old plans with a burst still load; the burst is skipped.
const BurstLayer = z.object({
  type: z.literal('burst'), ...base,
  shape: z.enum(['star', 'circle', 'rays']).default('star'), // star = comic explosion, rays = spinning sunburst
  x: norm.default(0.5), y: norm.default(0.5),
  size: z.number().min(0.05).max(3).default(0.3), // 0..1 of canvas width
  color: color.default('#FFD23F'),
  outline: color.default('#111111'),
  points: z.number().int().min(5).max(40).default(14),
  spin: z.boolean().default(true),
});

const CounterLayer = z.object({
  type: z.literal('counter'), ...base,
  from: z.number().default(0), to: z.number(),
  duration: z.number().min(0.1).max(10).default(1), // seconds of counting after `at`
  decimals: z.number().int().min(0).max(2).default(0),
  prefix: z.string().default(''), suffix: z.string().default(''),
  x: norm.default(0.5), y: norm.default(0.5),
  size: z.number().min(20).max(500).default(170),
  color: color.optional(),
  look: z.enum(['plain', 'pop', 'box', 'thumb', 'hook', 'comic']).default('pop'),
  boxColor: color.optional(),
  tilt: z.number().min(-20).max(20).optional(),
});

const ProgressLayer = z.object({
  type: z.literal('progress'), ...base,
  from: z.number().min(0).max(1).default(0), to: z.number().min(0).max(1), // filled part of the bar
  duration: z.number().min(0.1).max(10).default(0.9),
  label: z.string().optional(), // e.g. "DAY 7 / 30", shown above the bar
  x: norm.default(0.5), y: norm.default(0.85),
  width: z.number().min(0.1).max(1).default(0.5),
  color: color.default('#3DDC84'),
});


const markKind = z.enum(['tick', 'cross', 'number', 'box']);
const ChecklistLayer = z.object({
  type: z.literal('checklist'), ...base,
  title: z.string().optional(),
  items: z.array(z.object({text: z.string().min(1), at: sec.optional(), mark: markKind.optional()})).min(1).max(6),
  mark: markKind.default('tick'), // tick = green check, cross = red X + strike, number = 1 2 3 steps
  stagger: z.number().min(0).max(3).default(0.5), // seconds between items without their own `at`
  x: norm.default(0.5), y: norm.default(0.45),
  width: z.number().min(0.2).max(1).default(0.8),
  size: z.number().min(20).max(140).default(72),
  color: color.optional(),
  card: z.boolean().default(true),
});

const BarsLayer = z.object({
  type: z.literal('bars'), ...base,
  items: z.array(z.object({label: z.string(), value: z.number(), color: color.optional(), at: sec.optional(), display: z.string().optional()})).min(1).max(5),
  max: z.number().optional(),
  prefix: z.string().optional(), suffix: z.string().optional(),
  decimals: z.number().int().min(0).max(2).default(0),
  duration: z.number().min(0.1).max(5).default(0.8),
  x: norm.default(0.5), y: norm.default(0.45),
  width: z.number().min(0.2).max(1).default(0.76),
  height: z.number().min(0.1).max(0.7).default(0.3),
  size: z.number().min(20).max(140).default(80),
});

const RingLayer = z.object({
  type: z.literal('ring'), ...base,
  from: z.number().min(0).max(1).default(0), to: z.number().min(0).max(1).default(1),
  duration: z.number().min(0.1).max(60).default(1.2),
  text: z.string().optional(), // in the middle; default = the percentage
  count: z.object({from: z.number().default(0), to: z.number(), prefix: z.string().optional(), suffix: z.string().optional(), decimals: z.number().int().min(0).max(2).optional()}).optional(),
  label: z.string().optional(), // small sticker under the ring
  x: norm.default(0.5), y: norm.default(0.42),
  size: z.number().min(0.1).max(0.8).default(0.4), // diameter, 0..1 of width
  color: color.optional(),
});

const BannerLayer = z.object({
  type: z.literal('banner'), ...base,
  text: z.string().min(1),
  y: norm.default(0.3),
  size: z.number().min(30).max(220).default(110),
  color: color.optional(),
  textColor: color.optional(),
  shadowBand: color.optional(), // a second band behind, e.g. "#111111"
  tilt: z.number().min(-15).max(15).default(-4),
  side: z.enum(['left', 'right']).default('left'), // the band wipes in from this side
  scroll: z.boolean().default(false),
});

const VersusSide = z.object({
  label: z.string().min(1), // header, e.g. "WRONG" / "RIGHT"
  asset: z.string().optional(), text: z.string().optional(),
  good: z.boolean().optional(), color: color.optional(), flipX: z.boolean().optional(),
  at: sec.optional(),
});
const VersusLayer = z.object({
  type: z.literal('versus'), ...base,
  left: VersusSide, right: VersusSide,
  y: norm.default(0.45),
  height: z.number().min(0.15).max(0.6).default(0.36),
  size: z.number().min(24).max(120).default(64),
});

const ChatLayer = z.object({
  type: z.literal('chat'), ...base,
  name: z.string().optional(),
  messages: z.array(z.object({text: z.string().min(1), side: z.enum(['left', 'right']).default('left'), at: sec.optional()})).min(1).max(6),
  x: norm.default(0.5), y: norm.default(0.45),
  width: z.number().min(0.3).max(1).default(0.8),
  size: z.number().min(20).max(100).default(64),
  color: color.optional(),
});

const CalloutLayer = z.object({
  type: z.literal('callout'), ...base,
  text: z.string().min(1),
  anchor: z.string().optional(), target: z.string().optional(), // body part on the character, or `to`
  to: point.optional(),
  x: norm.optional(), y: norm.optional(), // where the label sits (default: beside the point, toward the middle)
  size: z.number().min(24).max(120).default(72),
  color: color.optional(),
});

const AccentLayer = z.object({
  type: z.literal('accent'), ...base,
  kind: z.enum(['lines', 'ripple', 'underline', 'circle']).default('lines'),
  x: norm.default(0.5), y: norm.default(0.5),
  size: z.number().min(0.05).max(1.2).default(0.3), // 0..1 of width
  aspect: z.number().min(0.1).max(2).optional(), // circle: height / width
  rotation: z.number().optional(),
  color: color.optional(),
});

const IconLayer = z.object({
  type: z.literal('icon'), ...base,
  name: z.enum(ICON_NAMES),
  label: z.string().optional(),
  x: norm.default(0.8), y: norm.default(0.36),
  size: z.number().min(0.05).max(0.6).default(0.2), // 0..1 of width
  color: color.optional(),
  badge: z.boolean().default(true), // false = the icon alone, no round badge
});

const StatLayer = z.object({
  type: z.literal('stat'), ...base,
  value: z.string().optional(), // "72%", or count instead
  count: z.object({from: z.number().default(0), to: z.number(), prefix: z.string().optional(), suffix: z.string().optional(), decimals: z.number().int().min(0).max(2).optional()}).optional(),
  label: z.string().optional(),
  icon: z.enum(ICON_NAMES).optional(),
  duration: z.number().min(0.1).max(5).default(1),
  x: norm.default(0.5), y: norm.default(0.3),
  width: z.number().min(0.3).max(1).default(0.74),
  size: z.number().min(40).max(260).default(130),
  color: color.optional(),
  tilt: z.number().min(-15).max(15).optional(),
});

const CommentLayer = z.object({
  type: z.literal('comment'), ...base,
  text: z.string().min(1),
  user: z.string().optional(), ago: z.string().optional(), likes: z.string().optional(),
  avatarColor: color.optional(),
  x: norm.default(0.5), y: norm.default(0.3),
  width: z.number().min(0.4).max(1).default(0.82),
  size: z.number().min(24).max(90).default(60),
  tilt: z.number().min(-15).max(15).optional(),
});

const TimelineLayer = z.object({
  type: z.literal('timeline'), ...base,
  steps: z.array(z.object({label: z.string(), at: sec.optional(), mark: z.enum(['tick', 'cross', 'number', 'box']).optional()})).min(2).max(6),
  x: norm.default(0.5), y: norm.default(0.3),
  width: z.number().min(0.4).max(1).default(0.8),
  size: z.number().min(20).max(90).default(48),
  color: color.optional(),
});

const SliderSide = z.object({asset: z.string().optional(), label: z.string().optional()});
const SliderLayer = z.object({
  type: z.literal('slider'), ...base,
  before: SliderSide, after: SliderSide,
  revealAt: sec.optional(), // when the divider slides (default: 0.6 s after it appears)
  split: z.number().min(0).max(1).default(0.5), // where the divider stops (0 = all "after")
  x: norm.default(0.5), y: norm.default(0.45),
  width: z.number().min(0.4).max(1).default(0.8),
  height: z.number().min(0.2).max(0.7).default(0.42),
  size: z.number().min(24).max(100).default(52),
});

const KineticLayer = z.object({
  type: z.literal('kinetic'), ...base,
  lines: z.array(z.object({text: z.string().min(1), at: sec.optional(), color: color.optional(), size: z.number().min(40).max(400).optional(),
    look: z.enum(['plain', 'box']).optional(), tilt: z.number().min(-15).max(15).optional()})).min(1).max(6),
  y: norm.default(0.2), // at the top, like a thumbnail title: H stays big below it
  size: z.number().min(40).max(400).default(130),
  look: z.enum(['plain', 'box']).default('plain'),
});

const anchorFields = {
  anchor: z.string().optional(), // body part on the character layer: "hips", "head", "left_hand", ...
  target: z.string().optional(), // id of that character layer (default: the closest one above in the list)
};

const ArrowLayer = z.object({
  type: z.literal('arrow'), ...base, ...anchorFields,
  from: point.optional(), to: point.optional(), // or use anchor (+ side)
  side: z.enum(['left', 'right', 'above', 'below', 'above-left', 'above-right', 'below-left', 'below-right']).optional(),
  pointing: z.enum(['up', 'down', 'left', 'right']).optional(), // with anchor: arrow beside the body part showing which way it moves
  color: color.optional(),
  thickness: z.number().min(2).max(60).default(16),
  glow: z.boolean().default(true),
  bob: z.boolean().default(true),
});

const HighlightLayer = z.object({
  type: z.literal('highlight'), ...base, ...anchorFields,
  shape: z.enum(['capsule', 'circle', 'mask']).default('circle'),
  x: norm.optional(), y: norm.optional(),
  w: z.number().min(0.01).max(2).optional(),
  h: z.number().min(0.01).max(2).optional(),
  rotation: z.number().default(0),
  asset: z.string().optional(), // shape=mask: transparent PNG of the body part to light up
  color: color.optional(),
  pulse: z.boolean().default(true),
});

const MeasureLayer = z.object({
  type: z.literal('measure'), ...base, target: z.string().optional(),
  from: z.union([point, z.string()]), to: z.union([point, z.string()]), // [x, y] or a body part
  label: z.string().optional(),
  color: color.optional(),
});

const ZoomBubbleLayer = z.object({
  type: z.literal('zoomBubble'), ...base, ...anchorFields,
  asset: z.string().optional(), // default with anchor: the image the character layer shows
  focus: point.optional(), // point inside the asset to magnify (or use anchor)
  zoom: z.number().min(1).max(10).optional(),
  x: norm.optional(), y: norm.optional(),
  size: z.number().min(0.1).max(1).default(0.42), // diameter, 0..1 of canvas width
  borderColor: color.default('#111111'),
  background: color.optional(),
});

const SplitLayer = z.object({
  type: z.literal('split'), ...base,
  layout: z.enum(['2x2', '1x2', '2x1']).default('2x2'),
  colors: z.array(color).min(1).max(4).optional(),
  cells: z.array(z.object({asset: z.string().optional(), at: sec.optional(), width: z.number().min(0.1).max(1).default(0.8)})).max(4),
});

const PatternLayer = z.object({
  type: z.literal('pattern'), ...base,
  asset: z.string(),
  cols: z.number().int().min(1).max(10).default(3),
  rows: z.number().int().min(1).max(12).default(6),
  drift: z.number().default(30), // px per second, diagonal
});

// Motion graphics that keep H big (src/fx.jsx)
const ChipLayer = z.object({
  type: z.literal('chip'), ...base,
  text: z.string().min(1).max(24), // 1-3 words: "+2X GROWTH", "30 SEC"
  icon: z.enum(ICON_NAMES).optional(),
  hot: z.number().int().min(1).max(4).optional(), // this word (1 = first) in the chip colour
  x: norm.default(0.8), y: norm.default(0.36),
  size: z.number().min(30).max(110).default(68),
  color: color.optional(),
});
const GlowLayer = z.object({
  type: z.literal('glow'), ...base, ...anchorFields,
  color: color.optional(),
  size: z.number().min(0.5).max(4).default(1.2), // glow diameter, times the body part's size (kept off the face)
});
const PathLayer = z.object({
  type: z.literal('path'), ...base, target: z.string().optional(),
  from: z.union([point, z.string()]), to: z.union([point, z.string()]), // body parts (or [x, y]) where the movement starts and ends
  fromAt: sec.optional(), // moment the body part is at `from` (its position is taken then); default: the layer's start
  toAt: sec.optional(), // moment the body part reaches `to` (its position is taken then); default: the layer's start
  bend: z.number().min(-1).max(1.5).default(0.35), // how much the path curves outward
  thickness: z.number().min(4).max(40).default(14),
  loop: z.boolean().default(true), // a dot keeps running along the path
  color: color.optional(),
});
const PulseLayer = z.object({
  type: z.literal('pulse'), ...base,
  kind: z.enum(['edge', 'flash', 'impact']).default('edge'), // edge = the screen edges glow a colour, flash = a quick white flash,
  // impact = anime impact frames: for a split second the picture turns into a high-contrast silhouette (black / red)
  color: color.optional(),
  duration: z.number().min(0.1).max(2).default(0.6),
});
const SpeedLayer = z.object({
  type: z.literal('speed'), ...base,
  color: color.optional(),
  duration: z.number().min(0.15).max(2).default(0.5),
});

export const LayerSchema = z.discriminatedUnion('type', [
  ImageLayer, PoseLayer, VideoLayer, TextLayer, ArrowLayer, HighlightLayer, MeasureLayer, ZoomBubbleLayer, SplitLayer, PatternLayer,
  BurstLayer, CounterLayer, ProgressLayer,
  ChecklistLayer, BarsLayer, RingLayer, BannerLayer, VersusLayer, ChatLayer, CalloutLayer, AccentLayer,
  IconLayer, StatLayer, CommentLayer, TimelineLayer, SliderLayer, KineticLayer,
  ChipLayer, GlowLayer, PathLayer, PulseLayer, SpeedLayer,
]);

const CameraKey = z.object({
  at: sec,
  zoom: z.number().min(0.5).max(6).default(1),
  focus: z.union([point, z.string()]).default([0.5, 0.5]), // canvas point, or a body part, that moves to the center
});

const SceneSchema = z.object({
  id: z.string().optional(),
  start: sec,
  end: sec.optional(), // default: next scene's start / end of the video
  background: color.optional(),
  // decoration behind everything (each also tints the white a little in its colour):
  // dots, grid (graph paper), stripes (diagonal), halftone (dots growing toward the bottom), blobs (soft moving colour),
  // notebook (lined paper), plus (+ signs), checker, waves, spotlight (soft glow), rays (slow sunburst)
  backdrop: z.enum(BACKDROPS).optional(),
  backdropColor: color.optional(),
  backdropOpacity: z.number().min(0).max(3).default(1), // strength of the pattern
  transition: z.union([
    z.enum(TRANSITION_TYPES),
    z.object({type: z.enum(TRANSITION_TYPES), duration: z.number().min(0).max(2).optional()}),
  ]).default('cut'),
  camera: z.array(CameraKey).optional(),
  shakes: z.array(z.object({at: sec, duration: z.number().min(0.05).max(5).default(0.4), intensity: z.number().min(0).max(80).default(14)})).optional(),
  layers: z.array(LayerSchema).default([]),
});

const WordSchema = z.object({text: z.string(), start: sec, end: sec});

export const TimelineSchema = z.object({
  version: z.literal(1).default(1),
  title: z.string().optional(),
  // colour palette for every banner, card, ring and background: classic, purple, coral, tomato, lime, pink, gold, ocean, mint, royal, blackred
  theme: z.enum(THEME_NAMES).optional(),
  // font set (default: the theme's): classic (Anton / Luckiest Guy / Jost), sport (Bebas Neue / Archivo Black / Archivo),
  // modern (Unbounded / Dela Gothic One / Space Grotesk), playful (Lilita One / Rubik)
  font: z.enum(FONT_NAMES).optional(),
  // the first scene opens with a quick camera punch (zoomed in, snaps back in 0.45 s) unless it has its own camera keys
  hookPunch: z.boolean().default(true),
  progressBar: z.boolean().default(false), // a thin red bar at the top fills up over the video (keeps people watching)
  canvas: z.object({
    width: z.number().int().default(1080),
    height: z.number().int().default(1920),
    fps: z.number().int().min(12).max(60).default(30),
    background: color.default('#FFFFFF'),
  }).prefault({}),
  style: z.object({
    textColor: color.default('#111111'),
    accent: color.optional(), // default: the theme's main colour (cyan without a theme)
    danger: color.optional(),
  }).prefault({}),
  audio: z.object({
    voice: z.string().optional(),
    voiceVolume: z.number().min(0).max(2).default(1),
    music: z.string().optional(),
    musicVolume: z.number().min(0).max(1).default(0.08),
    musicFade: z.number().min(0).max(10).default(1.5), // seconds of fade-in / fade-out
    sfxVolume: z.number().min(0).max(2).default(1),   // all sound effects together
    autoSfx: z.boolean().default(true), // a fitting sound when a card, tick, banner, bubble … appears (skipped where the plan already has one)
  }).prefault({}),
  duration: sec.optional(),
  scenes: z.array(SceneSchema).min(1),
  captions: z.object({
    mode: z.enum(['none', 'word', 'phrase']).default('none'),
    y: norm.default(0.14),
    size: z.number().min(20).max(300).default(86),
    maxWords: z.number().int().min(1).max(8).default(3), // phrase mode
    keywords: z.array(z.string()).default([]),          // emphasised (bigger, accent color)
    hide: z.array(z.tuple([sec, sec])).default([]),       // time ranges with no captions
    bottom: z.array(z.tuple([sec, sec])).default([]),     // time ranges with small phrase captions at the bottom (e.g. while a step title is on screen)
  }).prefault({}),
  wordsFile: z.string().optional(),
  words: z.array(WordSchema).default([]),
  sfx: z.array(z.object({at: sec, src: z.string(), volume: z.number().min(0).max(2).optional()})).default([]), // volume: default = the sound's own level
  // an uploaded thumbnail shown full screen at the very start (Shorts), so it can be picked as the cover in the app
  cover: z.object({src: z.string(), duration: z.number().min(0.03).max(2).default(0.1)}).optional(),
});

export const LibrarySchema = z.object({
  assets: z.array(z.object({
    id: z.string(),
    file: z.string(),                       // path relative to public/
    kind: z.enum(['image', 'video', 'mask', 'audio']).default('image'),
    description: z.string().default(''),
    tags: z.array(z.string()).default([]),
    size: z.tuple([z.number(), z.number()]).optional(),             // px, from measure_library.py
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(), // 0..1 of the image
    area: z.number().optional(),                                     // silhouette fraction of the image
    points: z.record(z.string(), z.tuple([z.number(), z.number()])).optional(), // body points, tools/body_points.py
    noPoints: z.boolean().optional(),
    category: z.string().optional(),   // sounds: transition / ui / impact / meme / body / ambience
    volume: z.number().optional(),     // sounds: default loudness 0..1
    duration: z.number().optional(),   // sounds: seconds
  })),
});

export const animOf = (a, fallbackDuration = 0.3) => {
  if (!a) return {type: 'cut', duration: 0};
  if (typeof a === 'string') return {type: a, duration: a === 'cut' ? 0 : fallbackDuration};
  return {type: a.type, duration: a.duration ?? (a.type === 'cut' ? 0 : fallbackDuration)};
};

export const timelineDuration = (t) => {
  const sceneEnd = Math.max(...t.scenes.map((s) => s.end));
  const wordEnd = t.words.length ? Math.max(...t.words.map((w) => w.end)) : 0;
  return t.duration ?? Math.max(sceneEnd, wordEnd);
};

// Parse + semantic checks. Returns {ok, timeline, errors[], warnings[]} with
// messages written so they can be pasted straight back to the LLM.
// Video formats the tool can make. The JSON never sets the size: the project's format does.
// 9:16 safe zone (YouTube Shorts / Reels / TikTok): outside it the app's title, channel name and buttons cover the video.
// Measured on a 1080×1920 safe-zone template: 113–988 px wide, 269–1492 px high, and below 822 px the right edge is 848 px
// (the like / comment / share buttons).
export const SAFE_VERTICAL = {x0: 0.105, x1: 0.915, y0: 0.14, y1: 0.777, notchY: 0.428, notchX1: 0.785};
export const safeZoneOf = (W, H) => (H > W ? SAFE_VERTICAL : null);

export const FORMATS = {
  vertical: {width: 1080, height: 1920, background: '#FFFFFF'},
  landscape: {width: 1920, height: 1080, background: '#FFFFFF'},
};

// Landscape (16:9) is wider than tall, so sizes that are "0..1 of the canvas width" need other defaults:
// a full-body character is ~0.27 of the width, props ~0.12, zoom bubbles ~0.22, captions sit at the bottom.
export function applyFormatDefaults(raw) {
  const c = raw.canvas || {};
  if (!(c.width > c.height)) return raw;
  for (const s of raw.scenes || []) {
    for (const l of s.layers || []) {
      if (['image', 'poses', 'video'].includes(l.type)) {
        const prop = /^prop_/.test(l.asset || '');
        const circle = l.frame === 'circle';
        if (l.width === undefined) l.width = circle ? 0.2 : prop ? 0.12 : 0.27;
        if (l.y === undefined && !prop && !circle) l.y = 0.55;
      }
      if (l.type === 'zoomBubble' && l.size === undefined) l.size = 0.22;
      // on the white 16:9 background plain coloured letters disappear: bold outlined letters by default
      if (l.type === 'text' && l.look === undefined) l.look = 'pop';
      if (l.type === 'highlight' && l.w === undefined && !l.anchor) l.w = 0.07;
    }
  }
  raw.captions = raw.captions || {};
  if (raw.captions.y === undefined) raw.captions.y = 0.88;
  if (raw.captions.size === undefined) raw.captions.size = 64;
  return raw;
}

export function checkTimeline(raw, library) {
  applyFormatDefaults(raw);
  const errors = [];
  const warnings = [];
  const parsed = TimelineSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.push(`${issue.path.join('.') || '(root)'}: ${issue.message}`);
    return {ok: false, errors, warnings};
  }
  const t = parsed.data;
  const sceneEnd = timelineDuration({...t, scenes: t.scenes.map((s) => ({...s, end: s.end ?? s.start}))});
  t.scenes.forEach((s, i) => {
    if (s.end === undefined) s.end = t.scenes[i + 1]?.start ?? Math.max(sceneEnd, s.start + 0.5);
  });
  const ids = new Set((library?.assets || []).map((a) => a.id));
  const assetRef = (where, id) => {
    if (!id) return;
    if (!ids.has(id) && !/\.(png|webp|jpe?g|svg|gif|mp4|webm|mov|mp3|wav|m4a)$/i.test(id)) {
      errors.push(`${where}: unknown asset "${id}" (not in library.json)`);
    }
  };
  const total = timelineDuration(t);

  t.scenes.forEach((s, i) => {
    const w = `scenes[${i}]`;
    if (s.end <= s.start) errors.push(`${w}: end (${s.end}) must be after start (${s.start})`);
    const prev = t.scenes[i - 1];
    if (prev && s.start < prev.start) errors.push(`${w}: scenes must be sorted by start`);
    if (prev && s.start > prev.end + 0.05) warnings.push(`${w}: gap of ${(s.start - prev.end).toFixed(2)}s after previous scene (background only)`);
    s.layers.forEach((l, j) => {
      const lw = `${w}.layers[${j}] (${l.type})`;
      const at = l.at ?? s.start;
      const until = l.until ?? s.end;
      if (until <= at) errors.push(`${lw}: until must be after at`);
      if (at < s.start - 0.01 || at > s.end) warnings.push(`${lw}: at=${at} is outside its scene ${s.start}-${s.end}`);
      assetRef(lw, l.asset);
      if (l.type === 'poses') l.frames.forEach((f, k) => assetRef(`${lw}.frames[${k}]`, f.asset));
      if (l.type === 'split') l.cells.forEach((c, k) => assetRef(`${lw}.cells[${k}]`, c.asset));
      if (l.type === 'highlight' && l.shape === 'mask' && !l.asset) errors.push(`${lw}: shape "mask" needs an asset`);
      const anchors = [l.anchor, typeof l.from === 'string' ? l.from : null, typeof l.to === 'string' ? l.to : null].filter(Boolean);
      anchors.forEach((a) => { if (!parseAnchor(a)) errors.push(`${lw}: unknown body part "${a}". Use one of: ${ANCHOR_HELP}`); });
      if (l.type === 'arrow' && !l.anchor && !(l.from && l.to)) errors.push(`${lw}: arrow needs "anchor" or "from" + "to"`);
      if (l.type === 'highlight' && l.shape !== 'mask' && !l.anchor && (l.x === undefined || l.y === undefined)) errors.push(`${lw}: highlight needs "anchor" or "x" + "y"`);
      if (l.type === 'zoomBubble' && !l.anchor && !l.asset) errors.push(`${lw}: zoomBubble needs "anchor" or "asset"`);
      if (l.type === 'burst') warnings.push(`${lw}: bursts (stars) are not drawn any more: use a banner, a box sticker or an accent instead`);
      if (l.type === 'callout' && !l.anchor && !l.to) errors.push(`${lw}: callout needs "anchor" (a body part) or "to": [x, y]`);
      if (l.type === 'versus') ['left', 'right'].forEach((k) => assetRef(`${lw}.${k}`, l[k].asset));
      if (l.type === 'slider') ['before', 'after'].forEach((k) => assetRef(`${lw}.${k}`, l[k].asset));
      if (l.type === 'stat' && !l.value && !l.count) errors.push(`${lw}: stat needs "value" or "count"`);
      if (l.target && !s.layers.some((o) => o.id === l.target)) errors.push(`${lw}: target "${l.target}" is not a layer id in this scene`);
      const needsChar = l.anchor || anchors.length;
      if (needsChar && !l.target && !s.layers.some((o) => ['image', 'poses', 'video'].includes(o.type))) errors.push(`${lw}: body part "${anchors[0]}" needs an image or poses layer in the same scene`);
    });
  });
  t.words.forEach((wd, i) => {
    if (wd.end < wd.start) errors.push(`words[${i}] "${wd.text}": end before start`);
  });
  if (t.captions.mode !== 'none' && !t.words.length && !t.wordsFile) warnings.push('captions are on but no words/wordsFile given');
  if (t.audio.voice && !t.words.length && !t.wordsFile) warnings.push('voice given without word timings: nothing can sync to it');
  if (total > 180) warnings.push(`duration ${total.toFixed(1)}s is long for a reel`);
  return {ok: errors.length === 0, timeline: t, errors, warnings};
}
