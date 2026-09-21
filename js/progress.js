// Stars per glyph and the game high score, kept in localStorage. Private
// browsing or a locked-down browser just means progress is not remembered,
// which must never stop a child from playing.

const KEY = 'belajar-menulis:v1';

const blank = () => ({ stars: {}, best: 0, played: 0, name: '', settings: { music: true, sfx: true, voice: true, repeat: 1 } });

let data = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) data = Object.assign(blank(), JSON.parse(raw));
} catch (e) { /* ignore */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

export const stars = (ch) => data.stars[ch] || 0;

// Only ever improves: a sloppy second attempt cannot take a star away.
export function award(ch, n) {
  const had = stars(ch);
  if (n > had) { data.stars[ch] = n; save(); return true; }
  return false;
}

export function totalStars() {
  return Object.values(data.stars).reduce((a, b) => a + b, 0);
}

export function learnedCount() {
  return Object.keys(data.stars).length;
}

export const best = () => data.best;
export function setBest(n) { if (n > data.best) { data.best = n; save(); } }

// The child's name, tidied: one line, sensible length, first letters capital.
export const name = () => data.name || '';
export function setName(n) {
  // Title case, so "rANi" typed by a five-year-old still reads "Rani".
  data.name = String(n || '').replace(/\s+/g, ' ').trim().slice(0, 14).toLowerCase()
    .replace(/(^|[\s'-])(\S)/g, (m, a, b) => a + b.toUpperCase());
  save();
  return data.name;
}

export const prefs = () => data.settings;
export function setPref(k, v) { data.settings[k] = v; save(); }

export function reset() { data = blank(); save(); }
