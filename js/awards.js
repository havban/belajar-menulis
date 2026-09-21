// The achievements screen: what one child has collected so far, and a way to
// look at any other child using the same device.
//
// Everything is built with createElement and textContent - names come from the
// keyboard, so they never go near innerHTML.

import { SETS, wordOf } from './glyphs.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';
import * as audio from './audio.js?v=__BUILD__';
import * as stats from './analytics.js?v=__BUILD__';

const $ = (id) => document.getElementById(id);
const TOTAL = SETS.kapital.chars.length + SETS.kecil.chars.length + SETS.angka.chars.length;

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

// "2026-09-21" -> "21 Sep": the year makes the tile wrap on a phone and adds
// nothing a parent needs at a glance.
function shortDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function tile(big, caption) {
  const t = el('div', 'tile');
  t.append(el('b', 'big', String(big)), el('span', 'cap', caption));
  return t;
}

// Badges are earned, never lost, and are deliberately easy to reach early on:
// the first ten letters are the hardest work a beginner will ever do.
function badgeList(sum, perSet) {
  const list = [
    ['🥚', 'Baru Mulai', sum.learned >= 1],
    ['🦖', 'Petualang Huruf', sum.mastered >= 10],
    ['⭐', 'Bintang Huruf', sum.mastered >= 30],
    ['👑', 'Juara Menulis', sum.mastered >= TOTAL],
    ['🔤', 'ABC Lengkap', perSet.kapital.mastered === SETS.kapital.chars.length],
    ['🔡', 'abc Lengkap', perSet.kecil.mastered === SETS.kecil.chars.length],
    ['🔢', '123 Lengkap', perSet.angka.mastered === SETS.angka.chars.length],
    ['🎮', 'Pendekar Dino', sum.best >= 300],
  ];
  const wrap = el('div', 'badges');
  for (const [icon, label, earned] of list) {
    wrap.append(el('div', `badge${earned ? '' : ' off'}`, `${icon} ${label}`));
  }
  return wrap;
}

function setBlock(id, title, chars, starsFor) {
  const box = el('div', 'award-set');
  const head = el('h3');
  const mastered = chars.filter((c) => starsFor(c) >= 3).length;
  head.append(el('span', null, title), el('span', null, `${mastered}/${chars.length} dikuasai`));
  box.append(head);
  const grid = el('div', 'award-grid');
  for (const ch of chars) {
    const n = starsFor(ch);
    const cell = el('div', `award-cell${n ? ` s${n}` : ''}`);
    cell.append(el('b', null, ch), el('i', null, n ? '★'.repeat(n) : ''));
    const w = wordOf(ch);
    cell.title = n ? `${ch} — ${w.word}, ${n} bintang` : `${ch} — ${w.word}, belum ditulis`;
    grid.append(cell);
  }
  box.append(grid);
  return box;
}

export function createAwards(nav) {
  let viewing = progress.activeId();

  function renderTabs() {
    const tabs = $('a-tabs');
    tabs.textContent = '';
    const list = progress.profiles();
    tabs.hidden = list.length < 2;      // one child: nothing to switch between
    for (const p of list) {
      const b = el('button', `who-chip${p.id === viewing ? ' on' : ''}`, p.name || 'Anak');
      b.addEventListener('click', () => { audio.sfx('tap'); viewing = p.id; render(); });
      tabs.append(b);
    }
  }

  function render() {
    renderTabs();
    const sum = progress.summary(viewing);
    const starsFor = (ch) => progress.starsOf(viewing, ch);
    const who = $('a-who').querySelector('b');
    who.textContent = sum.name || 'Anak';

    const perSet = {};
    for (const key of Object.keys(SETS)) {
      const chars = SETS[key].chars;
      perSet[key] = { mastered: chars.filter((c) => starsFor(c) >= 3).length };
    }

    const body = $('a-body');
    body.textContent = '';

    const tiles = el('div', 'tiles');
    tiles.append(
      tile(sum.stars, 'bintang'),
      tile(`${sum.mastered}/${TOTAL}`, 'huruf dikuasai'),
      tile(sum.learned, 'huruf dicoba'),
      tile(sum.best, 'skor terbaik'),
      tile(sum.games, 'permainan'),
      tile(shortDate(sum.created), 'mulai belajar'),
    );
    body.append(tiles, badgeList(sum, perSet));

    body.append(
      setBlock('kapital', 'Huruf Kapital  ABC', SETS.kapital.chars, starsFor),
      setBlock('kecil', 'Huruf Kecil  abc', SETS.kecil.chars, starsFor),
      setBlock('angka', 'Angka  123', SETS.angka.chars, starsFor),
    );

    if (!sum.learned) {
      const hint = el('p', 'tip', 'Belum ada huruf yang ditulis. Ayo mulai dari menu Belajar Menulis!');
      body.append(hint);
    }
  }

  return {
    render,
    get viewing() { return viewing; },
    open() {
      viewing = progress.activeId();
      stats.once('pencapaian-dibuka', 'Membuka pencapaian');
      render();
    },
    close() { /* nothing to tear down */ },
  };
}
