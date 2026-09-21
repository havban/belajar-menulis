import { clipName } from './lines.js?v=__BUILD__';

// All sound is synthesised in the browser - there is not a single audio file in
// the repo. A cheerful four-bar loop plays under the app, short effects mark
// every success and mistake, and the letter names are spoken by the device's
// own Indonesian voice when it has one.

let ctx = null;
let master = null, musicGain = null, sfxGain = null;
let started = false;

export const settings = { music: true, sfx: true, voice: true };

export function ready() { return !!ctx; }

// Browsers only allow audio after a real tap, so every entry point calls this.
export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = settings.music ? 0.26 : 0;
  musicGain.connect(master);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = settings.sfx ? 0.7 : 0;
  sfxGain.connect(master);
}

export function setMusic(on) {
  settings.music = on;
  if (musicGain) musicGain.gain.setTargetAtTime(on ? 0.26 : 0, ctx.currentTime, 0.1);
  // also stop the scheduler, so switching the music off really costs nothing
  if (on) startMusic(); else setTimeout(stopMusic, 300);
}

export function setSfx(on) {
  settings.sfx = on;
  if (sfxGain) sfxGain.gain.setTargetAtTime(on ? 0.7 : 0, ctx.currentTime, 0.05);
}

const note = (semi, oct = 0) => 261.63 * Math.pow(2, semi / 12 + oct);

function voice(freq, t, dur, type = 'triangle', gain = 0.25, dest = musicGain) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
  return o;
}

function noise(t, dur, gain = 0.2, band = 6000, dest = musicGain) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = band; f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t);
  return src;
}

// ------------------------------------------------------------------- music
// Four bars of bouncy C major pentatonic: melody, walking bass, kick and hats.
const MELODY = [
  0, 4, 7, 4, 7, 4, 0, null,
  7, 9, 7, 4, 2, 4, null, null,
  5, 9, 12, 9, 7, 5, 4, null,
  7, 4, 2, 0, 2, 4, 0, null,
];
const BASS = [0, 7, 9, 5];            // C  G  Am  F
const STEP = 0.25;                    // an eighth note at 120 bpm
let step = 0, nextT = 0, timer = 0;

function schedule() {
  if (!ctx) return;
  while (nextT < ctx.currentTime + 0.35) {
    const i = step % MELODY.length;
    const bar = Math.floor(i / 8);
    const m = MELODY[i];
    if (m !== null) voice(note(m, 1), nextT, 0.34, 'triangle', 0.22);
    if (i % 8 === 0) voice(note(BASS[bar], -1), nextT, 0.7, 'sine', 0.3);
    if (i % 8 === 4) voice(note(BASS[bar] + 7, -1), nextT, 0.5, 'sine', 0.22);
    if (i % 4 === 0) {                                  // kick
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, nextT);
      o.frequency.exponentialRampToValueAtTime(50, nextT + 0.12);
      g.gain.setValueAtTime(0.5, nextT);
      g.gain.exponentialRampToValueAtTime(0.001, nextT + 0.18);
      o.connect(g); g.connect(musicGain);
      o.start(nextT); o.stop(nextT + 0.2);
    }
    noise(nextT, i % 4 === 2 ? 0.09 : 0.04, i % 4 === 2 ? 0.1 : 0.05, 9000);
    nextT += STEP;
    step++;
  }
}

export function startMusic() {
  unlock();
  if (!ctx || started || !settings.music) return;
  started = true;
  step = 0;
  nextT = ctx.currentTime + 0.1;
  schedule();
  timer = setInterval(schedule, 60);
}

export function stopMusic() {
  started = false;
  clearInterval(timer);
}

// --------------------------------------------------------------- effects
export function sfx(name) {
  unlock();
  if (!ctx || !settings.sfx) return;
  const t = ctx.currentTime;
  const S = (f, d, ty, g) => voice(f, t, d, ty, g, sfxGain);
  switch (name) {
    case 'tap': S(660, 0.08, 'sine', 0.18); break;
    case 'pop': S(880, 0.12, 'triangle', 0.22); break;
    case 'good': [0, 4, 7].forEach((n, i) => voice(note(n, 1), t + i * 0.07, 0.22, 'triangle', 0.26, sfxGain)); break;
    case 'star': [12, 16, 19].forEach((n, i) => voice(note(n, 0), t + i * 0.06, 0.25, 'sine', 0.24, sfxGain)); break;
    case 'win': [0, 4, 7, 12, 16].forEach((n, i) => voice(note(n, 1), t + i * 0.09, 0.42, 'triangle', 0.3, sfxGain)); break;
    case 'bad': {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.28);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(sfxGain);
      o.start(t); o.stop(t + 0.32);
      break;
    }
    case 'roar': {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(90, t);
      o.frequency.linearRampToValueAtTime(58, t + 0.5);
      f.type = 'lowpass'; f.frequency.setValueAtTime(900, t);
      f.frequency.exponentialRampToValueAtTime(260, t + 0.55);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.42, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.62);
      o.connect(f); f.connect(g); g.connect(sfxGain);
      o.start(t); o.stop(t + 0.65);
      noise(t, 0.5, 0.12, 700, sfxGain);
      break;
    }
    case 'stomp': noise(t, 0.22, 0.3, 180, sfxGain); S(70, 0.2, 'sine', 0.3); break;
    case 'whoosh': noise(t, 0.3, 0.16, 2400, sfxGain); break;
    case 'lose': [7, 4, 0, -5].forEach((n, i) => voice(note(n, 0), t + i * 0.13, 0.32, 'triangle', 0.24, sfxGain)); break;
    default: S(500, 0.1, 'sine', 0.15);
  }
}

// ---------------------------------------------------------------- speech
let idVoice = null, voicesTried = false;
let speechToken = 0, watchdog = 0;

// ------------------------------------------------- recorded voice (optional)
// If `voice/clips.json` lists a recording for a phrase, that recording is
// played instead of asking the device to synthesise it - a real human voice,
// identical on every phone, and no dependency on whether the tablet happens to
// have an Indonesian voice installed. Anything not recorded still falls back to
// the device voice, so a half-finished pack works fine.
const clipCache = new Map();
let clipExt = 'm4a';
let clipHave = new Set();
let playing = null;

export async function loadVoicePack() {
  try {
    const res = await fetch('voice/clips.json', { cache: 'no-cache' });
    if (!res.ok) return 0;
    const j = await res.json();
    clipExt = j.ext || 'm4a';
    clipHave = new Set(j.have || []);
    return clipHave.size;
  } catch (e) { return 0; }        // no pack: the device voice is used
}

export const voicePackSize = () => clipHave.size;

async function clipFor(text) {
  if (!ctx || !clipHave.size) return null;
  const name = clipName(text);
  if (!clipHave.has(name)) return null;
  if (clipCache.has(name)) return clipCache.get(name);
  try {
    const res = await fetch(`voice/${name}.${clipExt}`);
    if (!res.ok) throw new Error('404');
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    clipCache.set(name, buf);
    return buf;
  } catch (e) {
    clipHave.delete(name);         // broken file: stop trying, speak it instead
    return null;
  }
}

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return null;
  const id = vs.filter((v) => /^id(-|_)?/i.test(v.lang) || /indones/i.test(v.name));
  // Prefer a warmer voice where the device offers a choice - Damayanti is the
  // Indonesian voice on iOS, Android usually labels its own.
  idVoice = id.find((v) => /damayanti|female|wanita|perempuan/i.test(v.name)) || id[0] || null;
  voicesTried = true;
  return idVoice;
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
}

// Drop the music under the teacher's voice, and bring it back afterwards.
function duck(on) {
  if (!musicGain || !ctx) return;
  const base = settings.music ? 0.26 : 0;
  musicGain.gain.setTargetAtTime(on ? base * 0.35 : base, ctx.currentTime, on ? 0.15 : 0.4);
}

// Speaks Indonesian if the device has a voice for it; silently does nothing if
// not, so the app never depends on it.
//
// A sentence is given as a list of parts, each spoken as its own utterance.
// That buys two things a single long string cannot: a real breath-pause
// between "ayo kita tulis" and the letter itself, and the chance to slow the
// letter down so the child actually catches it. Every part also gets a small
// random wobble in speed and pitch, because a synthetic voice repeating the
// identical line 26 times in a row is what makes an app grating to sit with.
export function speakParts(parts, { gap = 130 } = {}) {
  if (!settings.voice || !parts.length) return;
  if (!('speechSynthesis' in window) && !clipHave.size) return;
  if (!voicesTried) pickVoice();
  const list = parts.map((p) => (typeof p === 'string' ? { text: p } : p));
  const token = ++speechToken;
  try {
    speechSynthesis.cancel();
    duck(true);
    // On a device with no Indonesian voice the utterance may never start and
    // never report an error, which would leave the music ducked for good. This
    // brings it back after the line could not possibly still be talking.
    clearTimeout(watchdog);
    const budget = list.reduce((a, p) => a + p.text.length, 0) * 110 + 2500;
    watchdog = setTimeout(() => { if (token === speechToken) duck(false); }, budget);
    let i = 0;
    const next = () => {
      if (token !== speechToken) return;            // a newer line took over
      if (i >= list.length) { clearTimeout(watchdog); duck(false); return; }
      const p = list[i++];
      clipFor(p.text).then((buf) => {
        if (token !== speechToken) return;
        if (buf) {                                  // recorded: just play it
          clearTimeout(watchdog);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(master);
          src.onended = () => { if (token === speechToken) setTimeout(next, p.gap ?? gap); };
          playing = src;
          src.start();
          watchdog = setTimeout(() => { if (token === speechToken) duck(false); }, buf.duration * 1000 + 2500);
          return;
        }
        const u = new SpeechSynthesisUtterance(p.text);
        u.lang = 'id-ID';
        if (idVoice) u.voice = idVoice;
        u.rate = (p.rate ?? 0.95) + (Math.random() - 0.5) * 0.10;
        u.pitch = (p.pitch ?? 1.12) + (Math.random() - 0.5) * 0.16;
        u.onend = () => { if (token === speechToken) setTimeout(next, p.gap ?? gap); };
        u.onerror = () => { if (token === speechToken) { clearTimeout(watchdog); duck(false); } };
        speechSynthesis.speak(u);
      });
    };
    next();
  } catch (e) { clearTimeout(watchdog); duck(false); /* a missing voice must never break the lesson */ }
}

export function speak(text, opts = {}) {
  speakParts([{ text, ...opts }]);
}

// Picks a line at random but never the same one twice running, which is what
// the ear actually notices. `state` remembers the last index per key.
export function pickLine(list, state, key = 'last') {
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === state[key]) i = (i + 1) % list.length;
  state[key] = i;
  return list[i];
}

export function shutUp() {
  speechToken++;
  clearTimeout(watchdog);
  duck(false);
  if (playing) { try { playing.stop(); } catch (e) { /* already finished */ } playing = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
