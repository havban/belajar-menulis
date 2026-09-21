// Stroke data for every glyph the app teaches.
//
// Everything lives in a 100x100 box with y pointing down, so a glyph can be
// drawn at any size by scaling once. The four guide lines match how writing is
// taught on ruled paper:
//
//   y = 12  cap height (top of A, of the ascender of b, and of digits)
//   y = 38  x-height   (top of a, c, e ...)
//   y = 80  baseline
//   y = 97  descender  (bottom of g, j, p, q, y)
//
// A glyph is a list of strokes; a stroke is a list of segments, and the child
// draws one stroke with one uninterrupted finger movement. Stroke order and
// direction are the ones taught in Indonesian primary school (top to bottom,
// left to right, circles anti-clockwise).
//
// Angles are degrees in the same y-down space: 0 = right, 90 = bottom,
// 180 = left, 270 = top. Increasing sweeps clockwise on screen, decreasing
// sweeps anti-clockwise, which is why most bowls count downwards.

export const GUIDE = { cap: 12, xTop: 38, base: 80, desc: 97 };

const L = (...p) => ({ k: 'l', p });                       // polyline, flat pairs
const A = (cx, cy, rx, ry, a0, a1) => ({ k: 'a', cx, cy, rx, ry, a0, a1 });
const C = (...p) => ({ k: 'c', p });                       // cubic: x0,y0,c1,c2,x1
const DOT = (x, y) => ({ k: 'dot', x, y });                // tapped, not drawn

// ---------------------------------------------------------------- uppercase
const UPPER = {
  A: [[L(50, 12, 24, 80)], [L(50, 12, 76, 80)], [L(33, 58, 67, 58)]],
  B: [[L(28, 12, 28, 80)],
      [L(28, 12, 50, 12), A(50, 29, 21, 17, -90, 90), L(50, 46, 28, 46),
       L(28, 46, 52, 46), A(52, 63, 21, 17, -90, 90), L(52, 80, 28, 80)]],
  C: [[A(50, 46, 26, 34, -50, -310)]],
  D: [[L(28, 12, 28, 80)],
      [L(28, 12, 46, 12), A(46, 46, 28, 34, -90, 90), L(46, 80, 28, 80)]],
  E: [[L(28, 12, 28, 80)], [L(28, 12, 72, 12)], [L(28, 46, 64, 46)], [L(28, 80, 72, 80)]],
  F: [[L(28, 12, 28, 80)], [L(28, 12, 72, 12)], [L(28, 46, 64, 46)]],
  G: [[A(50, 46, 26, 34, -50, -320), L(70, 68, 70, 50), L(70, 50, 54, 50)]],
  H: [[L(28, 12, 28, 80)], [L(72, 12, 72, 80)], [L(28, 46, 72, 46)]],
  I: [[L(50, 12, 50, 80)], [L(32, 12, 68, 12)], [L(32, 80, 68, 80)]],
  J: [[L(50, 12, 50, 64), A(36, 64, 14, 16, 0, 180)]],
  K: [[L(28, 12, 28, 80)], [L(72, 12, 32, 48)], [L(40, 41, 72, 80)]],
  L: [[L(28, 12, 28, 80, 68, 80)]],
  M: [[L(24, 12, 24, 80)], [L(24, 12, 50, 56)], [L(76, 12, 50, 56)], [L(76, 12, 76, 80)]],
  N: [[L(26, 12, 26, 80)], [L(26, 12, 74, 80)], [L(74, 12, 74, 80)]],
  O: [[A(50, 46, 26, 34, -90, -450)]],
  P: [[L(28, 12, 28, 80)],
      [L(28, 12, 50, 12), A(50, 31, 22, 19, -90, 90), L(50, 50, 28, 50)]],
  Q: [[A(50, 46, 26, 34, -90, -450)], [L(58, 62, 80, 86)]],
  R: [[L(28, 12, 28, 80)],
      [L(28, 12, 50, 12), A(50, 31, 22, 19, -90, 90), L(50, 50, 28, 50)],
      [L(44, 50, 72, 80)]],
  S: [[C(68, 22, 56, 9, 30, 12, 34, 34), C(34, 34, 38, 50, 70, 52, 66, 66),
       C(66, 66, 62, 80, 40, 84, 30, 70)]],
  T: [[L(50, 12, 50, 80)], [L(26, 12, 74, 12)]],
  U: [[L(26, 12, 26, 58), A(50, 58, 24, 22, 180, 0), L(74, 58, 74, 12)]],
  V: [[L(26, 12, 50, 80, 74, 12)]],
  W: [[L(20, 12, 35, 80, 50, 30, 65, 80, 80, 12)]],
  X: [[L(28, 12, 72, 80)], [L(72, 12, 28, 80)]],
  Y: [[L(28, 12, 50, 46)], [L(72, 12, 50, 46, 50, 80)]],
  Z: [[L(28, 12, 72, 12, 28, 80, 72, 80)]],
};

// ---------------------------------------------------------------- lowercase
const LOWER = {
  a: [[A(51, 59, 23, 23, -61, -299)], [L(62, 38, 62, 80)]],
  b: [[L(30, 12, 30, 80)], [A(41, 59, 23, 23, -119, 119)]],
  c: [[A(50, 59, 18, 21, -40, -320)]],
  d: [[A(51, 59, 23, 23, -61, -299)], [L(62, 12, 62, 80)]],
  e: [[L(32, 62, 68, 62), A(50, 59, 18, 21, 10, -310)]],
  f: [[A(52, 26, 16, 14, -50, -175), L(36, 25, 36, 80)], [L(24, 44, 52, 44)]],
  g: [[A(51, 59, 23, 23, -61, -299)], [L(62, 38, 62, 86), A(48, 86, 14, 11, 0, 150)]],
  h: [[L(30, 12, 30, 80)], [A(48, 52, 18, 14, 180, 360), L(66, 52, 66, 80)]],
  i: [[L(50, 38, 50, 80)], [DOT(50, 22)]],
  j: [[L(50, 38, 50, 86), A(36, 86, 14, 11, 0, 150)], [DOT(50, 22)]],
  k: [[L(30, 12, 30, 80)], [L(64, 44, 32, 64)], [L(40, 56, 66, 80)]],
  l: [[L(50, 12, 50, 80)]],
  m: [[L(28, 38, 28, 80)],
      [A(40, 52, 12, 14, 180, 360), L(52, 52, 52, 80)],
      [A(64, 52, 12, 14, 180, 360), L(76, 52, 76, 80)]],
  n: [[L(32, 38, 32, 80)], [A(48, 52, 16, 14, 180, 360), L(64, 52, 64, 80)]],
  o: [[A(50, 59, 19, 21, -90, -450)]],
  p: [[L(30, 38, 30, 97)], [A(41, 59, 23, 23, -119, 119)]],
  q: [[A(51, 59, 23, 23, -61, -299)], [L(62, 38, 62, 90), A(70, 90, 8, 8, 180, 60)]],
  r: [[L(32, 38, 32, 80)], [A(48, 52, 16, 14, 180, 330)]],
  s: [[C(65, 44, 55, 36, 33, 38, 36, 52), C(36, 52, 40, 61, 67, 63, 64, 71),
       C(64, 71, 60, 80, 42, 83, 33, 74)]],
  t: [[L(46, 20, 46, 72), A(56, 72, 10, 8, 180, 60)], [L(30, 38, 62, 38)]],
  u: [[L(32, 38, 32, 66), A(48, 66, 16, 14, 180, 0), L(64, 66, 64, 38)], [L(64, 38, 64, 80)]],
  v: [[L(30, 38, 50, 80, 70, 38)]],
  w: [[L(24, 38, 38, 80, 50, 50, 62, 80, 76, 38)]],
  x: [[L(32, 38, 68, 80)], [L(68, 38, 32, 80)]],
  y: [[L(32, 38, 52, 76)], [L(70, 38, 46, 88), A(34, 88, 12, 9, 0, 140)]],
  z: [[L(30, 38, 70, 38, 30, 80, 70, 80)]],
};

// ------------------------------------------------------------------- digits
const DIGITS = {
  '0': [[A(50, 46, 22, 34, -90, -450)]],
  '1': [[L(34, 26, 50, 12, 50, 80)], [L(36, 80, 64, 80)]],
  '2': [[A(50, 30, 20, 17, 190, 350), L(70, 27, 28, 80), L(28, 80, 74, 80)]],
  '3': [[A(46, 29, 19, 17, 200, 430), A(46, 62, 21, 18, -72, 135)]],
  '4': [[L(58, 12, 24, 56, 70, 56)], [L(58, 12, 58, 80)]],
  '5': [[L(34, 13, 36, 45), A(46, 62, 24, 18, 250, 500)], [L(34, 13, 70, 13)]],
  '6': [[C(62, 14, 42, 14, 26, 27, 28, 63), A(50, 63, 22, 17, 180, -180)]],
  '7': [[L(28, 13, 72, 13, 42, 80)]],
  '8': [[C(50, 12, 41, 12, 33, 20, 33, 29), C(33, 29, 32, 40, 42, 40, 50, 46),
         C(50, 46, 58, 52, 70, 54, 70, 64), C(70, 64, 70, 76, 58, 80, 50, 80),
         C(50, 80, 40, 80, 30, 74, 30, 64), C(30, 64, 30, 54, 42, 52, 50, 46),
         C(50, 46, 58, 40, 67, 38, 67, 29), C(67, 29, 67, 20, 59, 12, 50, 12)]],
  '9': [[A(46, 32, 18, 20, 0, -360), L(64, 32, 64, 62), C(64, 62, 64, 76, 52, 80, 34, 79)]],
};

// How each letter is said out loud in Indonesian, plus a word a child knows.
// The emoji is the only "illustration" in the app - everything else is drawn.
const INFO = {
  A: ['a', 'Ayam', '🐔'], B: ['be', 'Bola', '⚽'], C: ['ce', 'Cicak', '🦎'],
  D: ['de', 'Dinosaurus', '🦕'], E: ['e', 'Es krim', '🍦'], F: ['ef', 'Foto', '📷'],
  G: ['ge', 'Gajah', '🐘'], H: ['ha', 'Hujan', '🌧️'], I: ['i', 'Ikan', '🐟'],
  J: ['je', 'Jeruk', '🍊'], K: ['ka', 'Kucing', '🐱'], L: ['el', 'Lebah', '🐝'],
  M: ['em', 'Matahari', '☀️'], N: ['en', 'Naga', '🐉'], O: ['o', 'Ombak', '🌊'],
  P: ['pe', 'Pohon', '🌳'], Q: ['ki', 'Quran', '📖'], R: ['er', 'Rumah', '🏠'],
  S: ['es', 'Sepeda', '🚲'], T: ['te', 'Topi', '👒'], U: ['u', 'Ular', '🐍'],
  V: ['ve', 'Vas bunga', '🏺'], W: ['we', 'Wortel', '🥕'], X: ['eks', 'Xilofon', '🎹'],
  Y: ['ye', 'Yoyo', '🪀'], Z: ['zet', 'Zebra', '🦓'],
};

const DIGIT_INFO = {
  '0': ['nol', 'Nol', '🥚'], '1': ['satu', 'Satu', '🦖'], '2': ['dua', 'Dua', '🦖🦖'],
  '3': ['tiga', 'Tiga', '🦖🦖🦖'], '4': ['empat', 'Empat', '🥚🥚🥚🥚'],
  '5': ['lima', 'Lima', '🌟🌟🌟🌟🌟'], '6': ['enam', 'Enam', '🍃'],
  '7': ['tujuh', 'Tujuh', '🌴'], '8': ['delapan', 'Delapan', '🦴'],
  '9': ['sembilan', 'Sembilan', '🌋'],
};

export const SETS = {
  kapital: { label: 'ABC', title: 'Huruf Kapital', chars: Object.keys(UPPER) },
  kecil: { label: 'abc', title: 'Huruf Kecil', chars: Object.keys(LOWER) },
  angka: { label: '123', title: 'Angka', chars: Object.keys(DIGITS) },
};

const RAW = { ...UPPER, ...LOWER, ...DIGITS };

export function setOf(ch) {
  if (ch in DIGITS) return 'angka';
  return ch === ch.toUpperCase() && ch in UPPER ? 'kapital' : 'kecil';
}

// Spoken label: "huruf be besar", "huruf be kecil", "angka dua".
export function spokenName(ch) {
  if (ch in DIGIT_INFO) return `angka ${DIGIT_INFO[ch][0]}`;
  const up = ch.toUpperCase();
  const [name] = INFO[up];
  return `huruf ${name} ${ch === up ? 'besar' : 'kecil'}`;
}

export function shortName(ch) {
  if (ch in DIGIT_INFO) return DIGIT_INFO[ch][0];
  return INFO[ch.toUpperCase()][0];
}

export function wordOf(ch) {
  const info = ch in DIGIT_INFO ? DIGIT_INFO[ch] : INFO[ch.toUpperCase()];
  return { word: info[1], emoji: info[2] };
}

// --------------------------------------------------------------- sampling
const D2R = Math.PI / 180;

function segPoints(s, step) {
  const out = [];
  if (s.k === 'l') {
    for (let i = 0; i + 3 < s.p.length; i += 2) {
      const [x0, y0, x1, y1] = [s.p[i], s.p[i + 1], s.p[i + 2], s.p[i + 3]];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let j = i === 0 ? 0 : 1; j <= n; j++) {
        const t = j / n;
        out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      }
    }
  } else if (s.k === 'a') {
    const span = Math.abs(s.a1 - s.a0);
    const len = span * D2R * (s.rx + s.ry) / 2;
    const n = Math.max(8, Math.ceil(len / step));
    for (let i = 0; i <= n; i++) {
      const a = (s.a0 + (s.a1 - s.a0) * (i / n)) * D2R;
      out.push([s.cx + s.rx * Math.cos(a), s.cy + s.ry * Math.sin(a)]);
    }
  } else if (s.k === 'c') {
    const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = s.p;
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y1,
      ]);
    }
  } else if (s.k === 'dot') {
    out.push([s.x, s.y]);
  }
  return out;
}

// Even spacing matters: scoring counts how many target points the child's line
// came close to, so clustered points would weight a short segment too heavily.
export function resample(pts, spacing) {
  if (pts.length < 2) return pts.slice();
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    let d = Math.hypot(x1 - x0, y1 - y0);
    if (d === 0) continue;
    let t = 0;
    while (carry + (1 - t) * d >= spacing) {
      t += (spacing - carry) / d;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      carry = 0;
    }
    carry += (1 - t) * d;
  }
  const last = pts[pts.length - 1];
  const [lx, ly] = out[out.length - 1];
  if (Math.hypot(last[0] - lx, last[1] - ly) > spacing * 0.35) out.push(last);
  return out;
}

const cache = new Map();

// Returns the glyph as { strokes: [{ segs, pts, dot, len }] }, points evenly
// spaced in glyph units and cached because every frame asks for them.
export function glyph(ch) {
  if (cache.has(ch)) return cache.get(ch);
  const raw = RAW[ch];
  if (!raw) throw new Error(`glyph tidak dikenal: ${ch}`);
  const strokes = raw.map((segs) => {
    const dot = segs.length === 1 && segs[0].k === 'dot';
    let pts = [];
    for (const s of segs) {
      const p = segPoints(s, 1.2);
      if (pts.length && p.length) {
        const [ax, ay] = pts[pts.length - 1], [bx, by] = p[0];
        if (Math.hypot(bx - ax, by - ay) < 0.35) p.shift();
      }
      pts = pts.concat(p);
    }
    if (!dot) pts = resample(pts, 1.5);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { segs, pts, dot, len };
  });
  const g = { ch, strokes };
  cache.set(ch, g);
  return g;
}

export function allChars() {
  return [...SETS.kapital.chars, ...SETS.kecil.chars, ...SETS.angka.chars];
}
