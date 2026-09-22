// Who is writing, and what each of them has achieved.
//
// One device is often shared - siblings, or a whole classroom corner - so the
// store holds a list of profiles and remembers which one is active. Each
// profile owns its stars, its high score and its practice-repeat setting;
// sound settings belong to the device.
//
// Private browsing or a locked-down browser just means nothing is remembered,
// which must never stop a child from playing.

const KEY = 'belajar-menulis:v2';
const OLD_KEY = 'belajar-menulis:v1';

const today = () => new Date().toISOString().slice(0, 10);

const newProfile = (name = '') => ({
  id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  name,
  created: today(),
  seen: today(),
  stars: {},          // glyph -> 1..3
  best: 0,            // best game score
  games: 0,
  words: 0,           // words finished in the writing game
  sentences: 0,
  repeat: 1,          // how many times a letter is written per page
  theme: 'dino',      // which world: dino or hiu
});

const blank = () => ({ v: 2, active: '', profiles: [], settings: { music: true, sfx: true, voice: true } });

// Names are tidied to title case, so "rANi" typed by a five-year-old reads
// "Rani", and kept short enough to fit the chip in the corner.
export function tidyName(n) {
  return String(n || '').replace(/\s+/g, ' ').trim().slice(0, 14).toLowerCase()
    .replace(/(^|[\s'-])(\S)/g, (m, a, b) => a + b.toUpperCase());
}

function fixProfile(p) {
  const base = newProfile();
  return {
    ...base, ...p,
    id: p.id || base.id,
    name: tidyName(p.name),
    stars: p.stars && typeof p.stars === 'object' ? p.stars : {},
    best: Number(p.best) || 0,
    games: Number(p.games) || 0,
    words: Number(p.words) || 0,
    sentences: Number(p.sentences) || 0,
    repeat: Math.min(4, Math.max(1, Number(p.repeat) || 1)),
    theme: p.theme === 'hiu' ? 'hiu' : 'dino',
  };
}

// The single-child store from before this app knew about profiles becomes the
// first profile, keeping its stars, its score and its settings.
function migrate(old) {
  const d = blank();
  const s = old.settings || {};
  d.settings = { music: s.music !== false, sfx: s.sfx !== false, voice: s.voice !== false };
  const p = fixProfile({
    name: old.name || '',
    stars: old.stars || {},
    best: old.best || 0,
    repeat: s.repeat || 1,
  });
  d.profiles = [p];
  d.active = p.id;
  return d;
}

function normalise(raw) {
  const d = blank();
  if (raw && typeof raw === 'object') {
    Object.assign(d.settings, raw.settings || {});
    d.profiles = Array.isArray(raw.profiles) ? raw.profiles.map(fixProfile) : [];
    d.active = raw.active || (d.profiles[0] && d.profiles[0].id) || '';
  }
  return d;
}

let data = blank();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) data = normalise(JSON.parse(raw));
  else {
    const old = localStorage.getItem(OLD_KEY);
    if (old) data = migrate(JSON.parse(old));
  }
} catch (e) { /* ignore */ }

if (!data.profiles.length) {
  const p = newProfile();
  data.profiles = [p];
  data.active = p.id;
}
if (!data.profiles.some((p) => p.id === data.active)) data.active = data.profiles[0].id;

// Where the app was when it was last closed - screen, which letter, whose
// achievements were on show. Kept apart from the profiles so a broken session
// can never take a child's stars with it.
const LAST_KEY = 'belajar-menulis:last';

export function lastSession() {
  try {
    const raw = JSON.parse(localStorage.getItem(LAST_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : null;
  } catch (e) { return null; }
}

export function rememberSession(patch) {
  try {
    const next = { ...(lastSession() || {}), ...patch, at: Date.now() };
    localStorage.setItem(LAST_KEY, JSON.stringify(next));
  } catch (e) { /* ignore */ }
}

export function forgetSession() {
  try { localStorage.removeItem(LAST_KEY); } catch (e) { /* ignore */ }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

function active() {
  return data.profiles.find((p) => p.id === data.active) || data.profiles[0];
}

// ------------------------------------------------------------- profiles
export const profiles = () => data.profiles.map((p) => ({ ...p, stars: { ...p.stars } }));
export const activeId = () => data.active;
export const profileOf = (id) => data.profiles.find((p) => p.id === id) || null;
export const count = () => data.profiles.length;

export const name = () => active().name || '';

export function setName(n) {
  active().name = tidyName(n);
  active().seen = today();
  save();
  return active().name;
}

export function addProfile(n = '') {
  const p = newProfile(tidyName(n));
  data.profiles.push(p);
  data.active = p.id;
  save();
  return p.id;
}

export function switchTo(id) {
  if (!profileOf(id)) return false;
  data.active = id;
  active().seen = today();
  save();
  return true;
}

// Removing the last profile leaves an empty one behind rather than no profile
// at all, so the app always has somewhere to put the next child's stars.
export function removeProfile(id) {
  const i = data.profiles.findIndex((p) => p.id === id);
  if (i < 0) return false;
  data.profiles.splice(i, 1);
  if (!data.profiles.length) data.profiles.push(newProfile());
  if (!profileOf(data.active)) data.active = data.profiles[0].id;
  save();
  return true;
}

// Everything the achievements screen needs about one child.
export function summary(id = data.active) {
  const p = profileOf(id) || active();
  const vals = Object.values(p.stars);
  return {
    id: p.id,
    name: p.name,
    stars: vals.reduce((a, b) => a + b, 0),
    learned: vals.length,
    mastered: vals.filter((n) => n >= 3).length,
    best: p.best,
    games: p.games,
    words: p.words || 0,
    sentences: p.sentences || 0,
    created: p.created,
    seen: p.seen,
  };
}

export const starsOf = (id, ch) => (profileOf(id) || active()).stars[ch] || 0;

// -------------------------------------------------- the active child's work
export const stars = (ch) => active().stars[ch] || 0;

// Only ever improves: a sloppy second attempt cannot take a star away.
export function award(ch, n) {
  const p = active();
  if (n > (p.stars[ch] || 0)) {
    p.stars[ch] = n;
    p.seen = today();
    save();
    return true;
  }
  return false;
}

export function totalStars() {
  return Object.values(active().stars).reduce((a, b) => a + b, 0);
}

export function learnedCount() {
  return Object.keys(active().stars).length;
}

export const best = () => active().best;

export function setBest(n) {
  const p = active();
  if (n > p.best) { p.best = n; p.seen = today(); save(); }
}

export function recordWord(sentence) {
  const p = active();
  p.words += 1;
  if (sentence) p.sentences += 1;
  p.seen = today();
  save();
}

export function bumpGames() {
  active().games += 1;
  active().seen = today();
  save();
}

// ------------------------------------------------------------- settings
// Sound belongs to the device; how many times a letter is written belongs to
// the child, because a five-year-old and an eight-year-old want different
// amounts of it.
export const prefs = () => ({ ...data.settings, repeat: active().repeat, theme: active().theme || 'dino' });

export function setPref(k, v) {
  if (k === 'repeat') active().repeat = Math.min(4, Math.max(1, Number(v) || 1));
  else if (k === 'theme') active().theme = v === 'hiu' ? 'hiu' : 'dino';
  else data.settings[k] = v;
  save();
}

/** Clears the active child's stars and score, keeping the profile itself. */
export function reset() {
  const p = active();
  p.stars = {};
  p.best = 0;
  p.games = 0;
  p.words = 0;
  p.sentences = 0;
  save();
}
