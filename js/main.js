// App shell: the animated backdrop, screen switching, the menu and settings.

import { drawBackdrop } from './dino.js?v=__BUILD__';
import { Mascot } from './mascot.js?v=__BUILD__';
import { createTutor } from './tutor.js?v=__BUILD__';
import { createGame } from './game.js?v=__BUILD__';
import { createAwards } from './awards.js?v=__BUILD__';
import { createKata } from './kata.js?v=__BUILD__';
import * as update from './update.js?v=__BUILD__';
import * as audio from './audio.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';
import * as stats from './analytics.js?v=__BUILD__';

const $ = (id) => document.getElementById(id);
const screens = { menu: $('s-menu'), belajar: $('s-belajar'), kata: $('s-kata'), game: $('s-game'), pencapaian: $('s-pencapaian') };
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
  $('m-who-name').textContent = who || 'Anak';
  $('m-greet').textContent = who
    ? `Halo, ${who}! Ayo belajar menulis 🦖`
    : 'Petualangan menulis bersama dino 🦖';
}

// ---------------------------------------------------------- the name
const nameBox = $('s-name'), nameInput = $('name-input');

let nameMode = 'edit';                   // 'edit' renames, 'add' creates a child

function askName(mode = 'edit') {
  nameMode = mode;
  nameInput.value = mode === 'add' ? '' : progress.name();
  $('name-title').textContent = mode === 'add' ? 'Siapa namanya?' : 'Siapa namamu?';
  $('name-sub').textContent = mode === 'add'
    ? 'Anak baru ini punya bintang dan skornya sendiri.'
    : 'Supaya dino bisa memanggil namamu saat belajar.';
  nameBox.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 60);
}

function saveName() {
  audio.unlock();
  const typed = nameInput.value;
  if (nameMode === 'add') {
    if (!progress.tidyName(typed)) { nameBox.classList.add('hidden'); return; }
    progress.addProfile(typed);
    stats.once('profil-ditambah', 'Menambah anak');
  } else {
    progress.setName(typed);
  }
  const who = progress.name();
  nameBox.classList.add('hidden');
  afterProfileChange();
  stats.trackName(who);
  if (who) {
    audio.sfx('star');
    audio.speakParts([{ text: 'Halo,', pitch: 1.25 }, who, 'ayo kita belajar menulis!']);
  }
}

// Everything that shows a name or a star count has to catch up when the active
// profile changes.
function afterProfileChange() {
  refreshMenu();
  tutor.showName();
  tutor.refreshFromProfile();
  if (current === 'pencapaian') awards.render();
}

// ------------------------------------------------------- profile picker
const profileBox = $('s-profiles');

function renderProfiles() {
  const list = $('p-list');
  list.textContent = '';
  const activeId = progress.activeId();
  for (const p of progress.profiles()) {
    const sum = progress.summary(p.id);
    const row = document.createElement('div');
    row.className = 'profile-row';

    const pick = document.createElement('button');
    pick.className = `profile-pick${p.id === activeId ? ' on' : ''}`;
    const nm = document.createElement('span');
    nm.textContent = p.name || 'Anak';
    const sub = document.createElement('span');
    sub.className = 'sub';
    sub.textContent = `⭐ ${sum.stars} · 🏆 ${sum.best}`;
    pick.append(nm, sub);
    pick.addEventListener('click', () => {
      audio.sfx('pop');
      progress.switchTo(p.id);
      stats.once('profil-ganti', 'Berganti anak');
      stats.trackName(progress.name());
      profileBox.classList.add('hidden');
      afterProfileChange();
      const who = progress.name();
      if (who) audio.speakParts([{ text: 'Halo,', pitch: 1.25 }, who]);
    });

    const rename = document.createElement('button');
    rename.className = 'icon-btn';
    rename.textContent = '✏️';
    rename.title = 'Ganti nama';
    rename.addEventListener('click', () => {
      audio.sfx('tap');
      progress.switchTo(p.id);
      profileBox.classList.add('hidden');
      afterProfileChange();
      askName('edit');
    });

    const del = document.createElement('button');
    del.className = 'icon-btn';
    del.textContent = '🗑️';
    del.title = 'Hapus anak';
    del.addEventListener('click', () => {
      audio.sfx('tap');
      const label = p.name || 'anak ini';
      if (!confirm(`Hapus ${label} beserta semua bintangnya?`)) return;
      progress.removeProfile(p.id);
      renderProfiles();
      afterProfileChange();
    });

    row.append(pick, rename, del);
    list.append(row);
  }
}

function openProfiles() {
  renderProfiles();
  profileBox.classList.remove('hidden');
}

$('m-who').addEventListener('click', () => { audio.sfx('tap'); openProfiles(); });
$('m-awards').addEventListener('click', () => { audio.sfx('tap'); show('pencapaian'); });
$('p-add').addEventListener('click', () => { audio.sfx('tap'); profileBox.classList.add('hidden'); askName('add'); });
$('p-close').addEventListener('click', () => { audio.sfx('tap'); profileBox.classList.add('hidden'); });

$('name-save').addEventListener('click', saveName);
$('name-skip').addEventListener('click', () => { audio.sfx('tap'); nameBox.classList.add('hidden'); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

// ------------------------------------------------------------ router
const tutor = createTutor();
const game = createGame();
const awards = createAwards();
const kata = createKata();
const parts = { belajar: tutor, kata, game, pencapaian: awards };

const SCREEN_EVENT = {
  belajar: ['belajar-dibuka', 'Membuka layar belajar'],
  kata: ['kata-dibuka', 'Membuka tulis kata'],
  game: ['game-dibuka', 'Membuka permainan'],
  pencapaian: ['pencapaian-dibuka', 'Membuka pencapaian'],
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
  progress.rememberSession({ screen: name });
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
  el.addEventListener('click', () => {
    audio.sfx('tap');
    $('g-start').classList.add('hidden');
    $('g-over').classList.add('hidden');
    show('menu');
  });
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
$('set-name').addEventListener('click', () => { audio.sfx('tap'); $('s-settings').classList.add('hidden'); askName('edit'); });
$('set-profiles').addEventListener('click', () => { audio.sfx('tap'); $('s-settings').classList.add('hidden'); openProfiles(); });
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
  const who = progress.name() || 'anak ini';
  if (confirm(`Hapus semua bintang dan skor ${who}?`)) {
    progress.reset();
    afterProfileChange();
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

// ------------------------------------------------- new build available
// The deploy stamps its commit into <meta name="build"> and writes
// version.json; when those disagree, a newer build is live. The child is not
// interrupted - a toast waits until they choose to reload, and because the
// screen and letter they are on are already saved, the reload puts them back.
const toast = $('update-toast');
update.stampSourceLink('https://github.com/havban/belajar-menulis');
update.watch((build) => {
  toast.classList.remove('hidden');
  stats.event('versi-baru', 'Versi baru terdeteksi');
  $('btn-update').onclick = () => {
    stats.event('versi-baru-dimuat', 'Muat ulang ke versi baru');
    progress.rememberSession({ screen: current });
    update.reload(build);
  };
});
$('btn-update-later').addEventListener('click', () => { audio.sfx('tap'); toast.classList.add('hidden'); });

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

// Back to where the app was left - after an update reload, or just the next
// time the tablet is picked up. The menu is always the fallback.
const last = progress.lastSession();
if (last && last.screen && last.screen !== 'menu' && screens[last.screen]) {
  if (last.screen === 'belajar') tutor.resumeAt(last.set, last.ch);
  if (last.screen === 'kata' && last.level) kata.setLevel(last.level);
  if (last.screen === 'pencapaian') awards.viewAt(last.awards);
  show(last.screen);
}

// First visit: ask who is about to write, so the dino can use their name - but
// only if they are still looking at the menu. A child who has already tapped
// through to a lesson should not have a dialog land on top of their writing.
if (!progress.name()) {
  setTimeout(() => { if (!progress.name() && current === 'menu') askName(); }, 700);
}

window.__app = { show, progress, audio, stats, update, askName, openProfiles, awards, kata, get screen() { return current; }, tutor, game };
