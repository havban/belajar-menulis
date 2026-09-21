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

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  if (!vs.length) return null;
  idVoice = vs.find((v) => /^id(-|_)?/i.test(v.lang)) || vs.find((v) => /indones/i.test(v.name)) || null;
  voicesTried = true;
  return idVoice;
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
}

// Speaks Indonesian if the device has a voice for it; silently does nothing if
// not, so the app never depends on it.
export function speak(text, { rate = 0.92, pitch = 1.15 } = {}) {
  if (!settings.voice || !('speechSynthesis' in window)) return;
  if (!voicesTried) pickVoice();
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    if (idVoice) u.voice = idVoice;
    u.rate = rate; u.pitch = pitch;
    if (musicGain && ctx) {
      musicGain.gain.setTargetAtTime(settings.music ? 0.09 : 0, ctx.currentTime, 0.15);
      u.onend = u.onerror = () => musicGain.gain.setTargetAtTime(settings.music ? 0.26 : 0, ctx.currentTime, 0.4);
    }
    speechSynthesis.speak(u);
  } catch (e) { /* a missing voice must never break the lesson */ }
}

export function shutUp() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
