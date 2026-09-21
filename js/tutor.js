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
  const lastOf = { kapital: 'A', kecil: 'a', angka: '0' };

  const pad = new TracePad($('t-pad'), {
    guide: 'full',
    tol: 13,
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
    say(`${'⭐'.repeat(stars)} ${CHEER_LINE[(Math.random() * CHEER_LINE.length) | 0]}`, 'good');
    audio.speak(`${PRAISE[(Math.random() * PRAISE.length) | 0]} Kamu berhasil menulis ${spokenName(ch)}`);
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
    pad.setGlyph(c, { guide: 'full' });
    big.textContent = c;
    const w = wordOf(c);
    emoji.textContent = w.emoji;
    word.textContent = w.word;
    const n = glyph(c).strokes.length;
    say(n > 1 ? `Ada ${n} garis. Mulai dari titik hijau!` : 'Mulai dari titik hijau, ikuti panahnya!');
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
      buildStrip();
      switchSet(set, lastOf[set]);
    },
    close() { mascot.stop(); audio.shutUp(); },
  };
}
