// "Tulis Kata": writing whole words, and then simple sentences.
//
// The pad puts one box per letter, so a word is written the way it is read -
// left to right, in one go - rather than a letter at a time in isolation. A
// sentence is written one word per page, with the whole sentence kept in view
// so the child can see where they are in it.

import { LEVELS, levelOf } from './words.js?v=__BUILD__';
import { TracePad, reasonText } from './trace.js?v=__BUILD__';
import { Mascot } from './mascot.js?v=__BUILD__';
import * as audio from './audio.js?v=__BUILD__';
import * as lines from './lines.js?v=__BUILD__';
import * as fx from './fx.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';
import * as stats from './analytics.js?v=__BUILD__';

const $ = (id) => document.getElementById(id);
const PRAISE = ['Hebat!', 'Keren!', 'Pintar!', 'Bagus sekali!', 'Mantap!'];

export function createKata() {
  const mascot = new Mascot($('k-mascot'));
  let level = LEVELS[0].id;
  let item = null;          // [text, emoji]
  let words = [];           // the text split into pages, one word each
  let page = 0;
  let scores = [];          // every stroke score across the whole item
  let fails = 0;
  let done = false;
  const said = { ask: -1, done: -1 };
  const lastItem = {};      // per level, so the same word does not come twice

  const pad = new TracePad($('k-pad'), {
    guide: 'full',
    tol: 13,
    onStroke: (res) => {
      if (res.pass) {
        fails = 0;
        audio.sfx('pop');
        paintTarget();
        return;
      }
      fails++;
      audio.sfx('bad');
      say(reasonText(res.reason), 'bad');
      mascot.react('sad', 1.2);
      if (fails >= 2) { fails = 0; setTimeout(() => pad.playDemo(pad.index), 350); }
    },
    // a letter of the word is finished; the next box lights up on its own
    onCell: () => {
      audio.sfx('pop');
      paintTarget();
      say(`Bagus! Lanjut huruf ${pad.letter}.`, 'good');
      mascot.react('cheer', 0.8);
    },
    onComplete: () => finishPage(),
  });

  function say(text, kind = '') {
    $('k-tip').textContent = text;
    $('k-tip').className = 'tip ' + kind;
  }

  // The target text, letter by letter: written letters fill in, the one being
  // written is ringed, and the word being worked on is the bright one.
  function paintTarget() {
    const box = $('k-text');
    box.textContent = '';
    words.forEach((w, wi) => {
      const wrap = document.createElement('span');
      wrap.className = `wt-word${wi === page ? ' now' : ''}${wi < page ? ' done' : ''}`;
      [...w].forEach((ch, ci) => {
        const cell = document.createElement('b');
        const written = wi < page || (wi === page && ci < pad.cell);
        const active = wi === page && ci === pad.cell && !done;
        cell.className = `wt-ch${written ? ' on' : ''}${active ? ' now' : ''}`;
        cell.textContent = ch;
        wrap.append(cell);
      });
      box.append(wrap);
    });
  }

  function pick() {
    const lv = levelOf(level);
    const list = lv.items;
    let next = list[(Math.random() * list.length) | 0];
    if (list.length > 1 && lastItem[level] === next[0]) {
      next = list[(list.indexOf(next) + 1) % list.length];
    }
    lastItem[level] = next[0];
    return next;
  }

  function start(chosen) {
    const lv = levelOf(level);
    item = chosen || pick();
    words = item[0].split(' ');
    page = 0;
    scores = [];
    fails = 0;
    done = false;
    $('k-emoji').textContent = item[1];
    $('k-next').classList.remove('pulse');
    pad.setWord([...words[0]]);
    paintTarget();
    say(words.length > 1 ? `${lv.hint} Mulai dari kata "${words[0]}".` : lv.hint);
    progress.rememberSession({ screen: 'kata', level });
    audio.speakParts(audio.pickLine(lines.WORD_ASK, said, 'ask')(item[0]));
  }

  function finishPage() {
    scores = scores.concat(pad.scores);
    if (page + 1 < words.length) {
      page++;
      pad.setWord([...words[page]]);
      paintTarget();
      audio.sfx('star');
      const [cx, cy] = pad.cellCentre(0);
      fx.burstStars(cx, cy, 2);
      mascot.react('cheer', 1.2);
      say(`Bagus! Sekarang kata "${words[page]}".`, 'good');
      audio.speakParts([{ text: 'Bagus!', pitch: 1.26 }, 'Sekarang kata', { text: words[page], rate: 0.85 }]);
      return;
    }
    celebrate();
  }

  function celebrate() {
    done = true;
    paintTarget();
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const stars = avg >= 0.88 ? 3 : avg >= 0.74 ? 2 : 1;
    const sentence = words.length > 1;
    progress.recordWord(sentence);
    stats.recordWord({ level, sentence, stars });
    audio.sfx('win');
    fx.confetti(110);
    fx.praise(PRAISE[(Math.random() * PRAISE.length) | 0]);
    fx.burstStars(innerWidth / 2, innerHeight * 0.5, stars);
    mascot.react('cheer', 3);
    say(`${'⭐'.repeat(stars)} Kamu menulis "${item[0]}"!`, 'good');
    audio.speakParts(audio.pickLine(lines.WORD_DONE, said, 'done')(item[0]));
    $('k-next').classList.add('pulse');
    refreshCount();
  }

  function refreshCount() {
    $('k-score').textContent = progress.summary().words;
  }

  function buildTabs() {
    const tabs = $('k-tabs');
    tabs.textContent = '';
    for (const lv of LEVELS) {
      const b = document.createElement('button');
      b.className = `tab${lv.id === level ? ' on' : ''}`;
      b.textContent = lv.label;
      b.addEventListener('click', () => {
        audio.sfx('tap');
        level = lv.id;
        stats.once(`kata-tingkat-${lv.id}`, `Tingkat kata: ${lv.title}`);
        buildTabs();
        start();
      });
      tabs.append(b);
    }
  }

  $('k-demo').addEventListener('click', () => { audio.sfx('tap'); pad.playDemo(pad.finished ? 0 : pad.index); });
  $('k-clear').addEventListener('click', () => {
    audio.sfx('tap');
    scores = [];
    done = false;
    pad.setWord([...words[page]]);
    paintTarget();
    say('Ayo tulis lagi dari awal!');
  });
  $('k-say').addEventListener('click', () => {
    audio.sfx('tap');
    audio.speakParts([{ text: item[0], rate: 0.85, pitch: 1.16 }]);
  });
  $('k-next').addEventListener('click', () => { audio.sfx('tap'); start(); });

  return {
    pad, mascot,
    get item() { return item; },
    get level() { return level; },
    setLevel(id) { if (levelOf(id).id === id) level = id; },
    open() {
      mascot.start();
      buildTabs();
      refreshCount();
      start();
    },
    close() { mascot.stop(); audio.shutUp(); },
  };
}
