// Two worlds, one app. A theme decides what the backdrop looks like, who the
// hero is, and what it fights - nothing else in the app knows which one is on.
//
// Adding a third means filling in the same shape: a backdrop painter, a hero
// painter that understands the shared pose names (idle, cheer, sad, run, roar,
// hurt), and three enemies.

import { drawRex, drawPtero, drawBackdrop } from './dino.js?v=__BUILD__';
import { drawShark, drawFish, drawJelly, drawOctopus, drawSea } from './sea.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';

export const THEMES = {
  dino: {
    id: 'dino',
    label: '🦖 Dino',
    emoji: '🦖',
    hero: 'dino',
    title: 'Petualangan Dino',
    intro: 'Musuh datang! Tulis huruf yang diminta dengan benar, lalu dino kamu akan menyerang. Ada 3 nyawa ❤️❤️❤️',
    subtitle: 'Petualangan menulis bersama dino 🦖',
    backdrop: drawBackdrop,
    drawHero: (c, o) => drawRex(c, o),
    enemies: {
      raptor: { flying: false, size: 0.34, draw: (c, o) => drawRex(c, { ...o, skin: '#e4572e', belly: '#ffd6a5' }) },
      flyer: { flying: true, size: 0.26, draw: (c, o) => drawPtero(c, { ...o, color: '#e4572e' }) },
      boss: { flying: false, size: 0.46, draw: (c, o) => drawRex(c, { ...o, skin: '#9b51e0', belly: '#e6c6f5' }) },
    },
  },
  hiu: {
    id: 'hiu',
    label: '🦈 Hiu',
    emoji: '🦈',
    hero: 'hiu',
    title: 'Petualangan Hiu',
    intro: 'Penyusup datang! Tulis huruf yang diminta dengan benar, lalu hiu kamu akan menyerang. Ada 3 nyawa ❤️❤️❤️',
    subtitle: 'Petualangan menulis di dasar laut 🦈',
    backdrop: drawSea,
    drawHero: (c, o) => drawShark(c, { ...o, x: o.x + o.size * 0.07 }),
    enemies: {
      raptor: { flying: false, size: 0.36, draw: (c, o) => drawFish(c, { ...o, y: o.y - o.size * 0.42, color: '#ff5d5d' }) },
      flyer: { flying: true, size: 0.26, draw: (c, o) => drawJelly(c, { ...o, color: '#c77dff' }) },
      boss: { flying: false, size: 0.46, draw: (c, o) => drawOctopus(c, o) },
    },
  },
};

export const DEFAULT = 'dino';

/** The theme the active child chose. */
export function current() {
  return THEMES[progress.prefs().theme] || THEMES[DEFAULT];
}

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function set(id) {
  if (!THEMES[id]) return false;
  progress.setPref('theme', id);
  for (const fn of listeners) fn(THEMES[id]);
  return true;
}
