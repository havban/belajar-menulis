// The lesson screen: pick a letter, watch it drawn, copy it, collect stars.

import { SETS, spokenName, shortName, wordOf, glyph } from './glyphs.js?v=__BUILD__';
import { TracePad, reasonText } from './trace.js?v=__BUILD__';
import { Mascot } from './mascot.js?v=__BUILD__';
import * as audio from './audio.js?v=__BUILD__';
import * as fx from './fx.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';

const PRAISE = ['Hebat!', 'Keren!', 'Pintar!', 'Bagus sekali!', 'Mantap!', 'Wow!'];
const CHEER_LINE = ['Hebat sekali!', 'Keren, kamu pintar!', 'Bagus! Lanjut ya!', 'Wah, rapi sekali!'];
const $ = (id) => document.getElementById(id);

export function createTutor() {
  const strip = $('t-strip'), tabs = $('t-tabs');
  const big = $('t-big'), emoji = $('t-emoji'), word = $('t-word'), tip = $('t-tip');
  const mascot = new Mascot($('t-mascot'));
  let set = 'kapital';
  let ch = null;
  let fails = 0;
  let celebrating = false;
  // how many times the letter is written on one page - repetition is what
  // actually smooths a child's handwriting, so the choice is remembered
  let repeat = Math.max(1, Math.min(4, progress.prefs().repeat || 1));
  const lastOf = { kapital: 'A', kecil: 'a', angka: '0' };

  const pad = new TracePad($('t-pad'), {
    guide: 'full',
    tol: 13,
    repeat,
    onStroke: (res, i) => {
      if (res.pass) {
        fails = 0;
        audio.sfx('pop');
        if (!pad.finished) {                 // the last stroke is onComplete's job
          say(`Bagus! Sekarang garis ke-${pad.index + 1}.`, 'good');
          mascot.react('cheer', 0.9);
        }
      } else {
        fails++;
        audio.sfx('bad');
        say(reasonText(res.reason), 'bad');
        mascot.react('sad', 1.2);
        if (fails >= 2) { fails = 0; setTimeout(() => pad.playDemo(pad.index), 350); }
      }
    },
    onCell: (doneCells, total, self) => {
      // one copy finished, more to go: a small reward keeps the page moving
      audio.sfx('star');
      const [cx, cy] = self.cellCentre(doneCells - 1);
      fx.burstStars(cx, cy, 2);
      mascot.react('cheer', 1.2);
      const left = total - doneCells;
      say(`Bagus! ${left} kali lagi ya.`, 'good');
      audio.speak(left === 1 ? 'Bagus! Sekali lagi ya.' : `Bagus! ${left} kali lagi.`);
    },
    onComplete: ({ stars }) => celebrate(stars),
  });

  function say(text, kind = '') {
    tip.textContent = text;
    tip.className = 'tip ' + kind;
  }

  function celebrate(stars) {
    if (celebrating) return;
    celebrating = true;
    const fresh = progress.award(ch, stars);
    audio.sfx('win');
    fx.confetti(110);
    fx.praise(PRAISE[(Math.random() * PRAISE.length) | 0]);
    fx.burstStars(innerWidth / 2, innerHeight * 0.55, stars);
    mascot.react('cheer', 3);
    const times = repeat > 1 ? ` Kamu menulis ${repeat} kali!` : '';
    say(`${'⭐'.repeat(stars)} ${CHEER_LINE[(Math.random() * CHEER_LINE.length) | 0]}${times}`, 'good');
    audio.speak(`${PRAISE[(Math.random() * PRAISE.length) | 0]} Kamu berhasil menulis ${spokenName(ch)}${repeat > 1 ? `, ${repeat} kali` : ''}`);
    if (fresh) refreshStars();
    $('t-next').classList.add('pulse');
    setTimeout(() => { celebrating = false; }, 900);
  }

  function refreshStars() {
    $('t-stars').textContent = progress.totalStars();
    for (const el of strip.children) {
      const n = progress.stars(el.dataset.ch);
      el.querySelector('.st').textContent = n ? '⭐'.repeat(n) : '';
    }
  }

  function buildStrip() {
    strip.innerHTML = '';
    for (const c of SETS[set].chars) {
      const b = document.createElement('button');
      b.className = 'letter';
      b.dataset.ch = c;
      b.innerHTML = `<span>${c}</span><span class="st"></span>`;
      b.addEventListener('click', () => { audio.sfx('tap'); select(c); });
      strip.appendChild(b);
    }
    refreshStars();
  }

  function select(c, { demo = null } = {}) {
    ch = c;
    lastOf[set] = c;
    fails = 0;
    celebrating = false;
    pad.setGlyph(c, { guide: 'full', repeat });
    big.textContent = c;
    const w = wordOf(c);
    emoji.textContent = w.emoji;
    word.textContent = w.word;
    const n = glyph(c).strokes.length;
    const base = n > 1 ? `Ada ${n} garis. Mulai dari titik hijau!` : 'Mulai dari titik hijau, ikuti panahnya!';
    say(repeat > 1 ? `${base} Tulis ${repeat} kali ya.` : base);
    $('t-next').classList.remove('pulse');
    for (const el of strip.children) el.classList.toggle('on', el.dataset.ch === c);
    const on = strip.querySelector('.letter.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    audio.speak(`Ayo tulis ${spokenName(c)}`);
    const wantDemo = demo === null ? progress.stars(c) < 2 : demo;
    if (wantDemo) {
      setTimeout(() => {
        // only if the child is still on this letter and has not started writing
        if (ch === c && pad.index === 0 && !pad.live) pad.playDemo(0);
      }, 900);
    }
  }

  function nextChar() {
    const list = SETS[set].chars;
    const i = list.indexOf(ch);
    if (i + 1 < list.length) return select(list[i + 1]);
    // end of a set: roll on to the next one
    const order = ['kapital', 'kecil', 'angka'];
    const ni = (order.indexOf(set) + 1) % order.length;
    switchSet(order[ni], order[ni] === 'kapital' ? 'A' : order[ni] === 'kecil' ? 'a' : '0');
  }

  function switchSet(s, startCh = null) {
    set = s;
    for (const t of tabs.children) t.classList.toggle('on', t.dataset.set === s);
    buildStrip();
    select(startCh || lastOf[s] || SETS[s].chars[0]);
  }

  for (const t of tabs.children) {
    t.addEventListener('click', () => { audio.sfx('tap'); switchSet(t.dataset.set); });
  }
  for (const b of $('t-reps').querySelectorAll('.rep')) {
    b.addEventListener('click', () => {
      audio.sfx('tap');
      setRepeat(+b.dataset.n);
      if (ch) select(ch, { demo: false });     // re-lay the page with the new count
    });
  }

  function setRepeat(n) {
    repeat = Math.max(1, Math.min(4, n));
    progress.setPref('repeat', repeat);
    for (const b of $('t-reps').querySelectorAll('.rep')) b.classList.toggle('on', +b.dataset.n === repeat);
  }

  $('t-demo').addEventListener('click', () => { audio.sfx('tap'); pad.playDemo(pad.finished ? 0 : pad.index); });
  $('t-clear').addEventListener('click', () => { audio.sfx('tap'); pad.reset(); celebrating = false; say('Ayo tulis lagi dari awal!'); });
  $('t-say').addEventListener('click', () => { audio.sfx('tap'); audio.speak(`${spokenName(ch)}. ${shortName(ch)} untuk ${wordOf(ch).word}`); });
  $('t-next').addEventListener('click', () => { audio.sfx('tap'); nextChar(); });

  return {
    pad, mascot,
    get ch() { return ch; },
    select,
    open() {
      mascot.start();
      setRepeat(repeat);
      buildStrip();
      switchSet(set, lastOf[set]);
    },
    close() { mascot.stop(); audio.shutUp(); },
  };
}
