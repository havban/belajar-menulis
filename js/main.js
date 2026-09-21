// App shell: the animated backdrop, screen switching, the menu and settings.

import { drawBackdrop } from './dino.js?v=__BUILD__';
import { Mascot } from './mascot.js?v=__BUILD__';
import { createTutor } from './tutor.js?v=__BUILD__';
import { createGame } from './game.js?v=__BUILD__';
import * as audio from './audio.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';
import * as stats from './analytics.js?v=__BUILD__';

const $ = (id) => document.getElementById(id);
const screens = { menu: $('s-menu'), belajar: $('s-belajar'), game: $('s-game') };
let current = 'menu';

// ---------------------------------------------------------- backdrop
const bg = $('bg'), bgx = bg.getContext('2d');
let bgT = 0, bgLast = performance.now(), bgRaf = 0, bgDrawn = 0;

function bgResize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  bg.width = Math.round(innerWidth * dpr);
  bg.height = Math.round(innerHeight * dpr);
  bgx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function bgLoop(now) {
  bgRaf = requestAnimationFrame(bgLoop);
  const dt = Math.min(0.05, (now - bgLast) / 1000);
  bgLast = now;
  // the game draws its own world, so the shell backdrop idles there
  if (current === 'game') return;
  bgT += dt;
  // The shell backdrop is decoration behind the real work, so it redraws at
  // about 20fps. On a cheap tablet that leaves the writing pad, which must
  // never lag behind a finger, with the frame budget it needs.
  if (now - bgDrawn < 48) return;
  bgDrawn = now;
  drawBackdrop(bgx, innerWidth, innerHeight, bgT, { scroll: bgT * 14, groundY: innerHeight * 0.86 });
}

addEventListener('resize', bgResize);
bgResize();
bgRaf = requestAnimationFrame(bgLoop);

// -------------------------------------------------------------- menu
const menuMascot = new Mascot($('m-mascot'));
menuMascot.start();
$('m-mascot').addEventListener('click', () => {
  audio.unlock();
  audio.sfx('roar');
  menuMascot.react('roar', 1.2);
});

function refreshMenu() {
  $('m-stars').textContent = progress.totalStars();
  $('m-best').textContent = progress.best();
  const who = progress.name();
  $('m-greet').textContent = who
    ? `Halo, ${who}! Ayo belajar menulis 🦖`
    : 'Petualangan menulis bersama dino 🦖';
}

// ---------------------------------------------------------- the name
const nameBox = $('s-name'), nameInput = $('name-input');

function askName() {
  nameInput.value = progress.name();
  nameBox.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 60);
}

function saveName() {
  audio.unlock();
  const who = progress.setName(nameInput.value);
  nameBox.classList.add('hidden');
  refreshMenu();
  tutor.showName();
  stats.trackName(who);
  if (who) {
    audio.sfx('star');
    audio.speakParts([{ text: 'Halo,', pitch: 1.25 }, who, 'ayo kita belajar menulis!']);
  }
}

$('name-save').addEventListener('click', saveName);
$('name-skip').addEventListener('click', () => { audio.sfx('tap'); nameBox.classList.add('hidden'); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

// ------------------------------------------------------------ router
const tutor = createTutor();
const game = createGame();
const parts = { belajar: tutor, game };

const SCREEN_EVENT = {
  belajar: ['belajar-dibuka', 'Membuka layar belajar'],
  game: ['game-dibuka', 'Membuka permainan'],
};

function show(name) {
  if (name === current) return;
  const prev = parts[current];
  if (prev) prev.close();
  screens[current].classList.remove('show');
  current = name;
  screens[name].classList.add('show');
  if (name === 'menu') { refreshMenu(); menuMascot.start(); } else menuMascot.stop();
  const part = parts[name];
  if (part) part.open();
  if (SCREEN_EVENT[name]) stats.once(...SCREEN_EVENT[name]);
}

for (const el of document.querySelectorAll('[data-go]')) {
  el.addEventListener('click', () => {
    audio.unlock();
    audio.startMusic();
    audio.sfx('tap');
    show(el.dataset.go);
  });
}
for (const el of document.querySelectorAll('[data-back]')) {
  el.addEventListener('click', () => { audio.sfx('tap'); show('menu'); });
}

// The Android back button should walk back to the menu, not leave the app.
addEventListener('popstate', () => {
  if (current !== 'menu') { show('menu'); history.pushState({}, ''); }
});
history.pushState({}, '');

// ---------------------------------------------------------- settings
const prefs = progress.prefs();
Object.assign(audio.settings, prefs);
$('set-music').checked = prefs.music;
$('set-sfx').checked = prefs.sfx;
$('set-voice').checked = prefs.voice;

$('btn-settings').addEventListener('click', () => { audio.sfx('tap'); $('s-settings').classList.remove('hidden'); });
$('set-name').addEventListener('click', () => { audio.sfx('tap'); $('s-settings').classList.add('hidden'); askName(); });
$('set-close').addEventListener('click', () => { audio.sfx('tap'); $('s-settings').classList.add('hidden'); });
$('set-music').addEventListener('change', (e) => { audio.unlock(); audio.setMusic(e.target.checked); progress.setPref('music', e.target.checked); });
$('set-sfx').addEventListener('change', (e) => { audio.unlock(); audio.setSfx(e.target.checked); progress.setPref('sfx', e.target.checked); audio.sfx('pop'); });
$('set-voice').addEventListener('change', (e) => { audio.settings.voice = e.target.checked; progress.setPref('voice', e.target.checked); });
// Fullscreen keeps small fingers away from the browser's own buttons.
const full = $('set-full');
full.addEventListener('change', async (e) => {
  try {
    if (e.target.checked) await document.documentElement.requestFullscreen();
    else if (document.fullscreenElement) await document.exitFullscreen();
  } catch (err) { e.target.checked = !!document.fullscreenElement; }
});
document.addEventListener('fullscreenchange', () => { full.checked = !!document.fullscreenElement; });
if (!document.documentElement.requestFullscreen) full.parentElement.style.display = 'none';

$('set-reset').addEventListener('click', () => {
  if (confirm('Hapus semua bintang dan skor?')) {
    progress.reset();
    refreshMenu();
    tutor.showName();
    audio.sfx('bad');
  }
});

// Audio can only start from a real tap; the first one anywhere does it.
addEventListener('pointerdown', function first() {
  audio.unlock();
  audio.startMusic();
  removeEventListener('pointerdown', first);
}, { once: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { audio.stopMusic(); audio.shutUp(); }
  else if (audio.settings.music) audio.startMusic();
});

// Stop a stray second finger from pinch-zooming the page mid-lesson.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

// A recorded voice pack replaces the device's text-to-speech where it exists.
audio.loadVoicePack().then((n) => { if (n) console.info(`[suara] ${n} rekaman dimuat`); });

// Offline support; harmless if the browser or the page's origin refuses it.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Usage counters: a local tally that never leaves the device, plus aggregate
// events to GoatCounter when its tag is present.
stats.install();
stats.trackVisitor();
if (progress.name()) stats.trackName(progress.name());
if (/[?&]stats=1/.test(location.search)) stats.mountPanel();
window.__stats = () => stats.mountPanel();

refreshMenu();
// First visit: ask who is about to write, so the dino can use their name - but
// only if they are still looking at the menu. A child who has already tapped
// through to a lesson should not have a dialog land on top of their writing.
if (!progress.name()) {
  setTimeout(() => { if (!progress.name() && current === 'menu') askName(); }, 700);
}

window.__app = { show, progress, audio, stats, askName, get screen() { return current; }, tutor, game };
