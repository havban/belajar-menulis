// "Petualangan Dino": the rex runs, an enemy catches up, and the only way to
// fight back is to write the letter that appears. Writing well is the attack -
// that is the whole point of the game, so the pad is always the biggest thing
// on screen and the fight waits as long as the child needs it to.

import { SETS, spokenName, setOf } from './glyphs.js?v=__BUILD__';
import { TracePad, reasonText } from './trace.js?v=__BUILD__';
import { drawBackdrop, drawRex, drawPtero } from './dino.js?v=__BUILD__';
import * as audio from './audio.js?v=__BUILD__';
import * as fx from './fx.js?v=__BUILD__';
import * as progress from './progress.js?v=__BUILD__';

const $ = (id) => document.getElementById(id);
const WIN_WORDS = ['Hebat!', 'Kena!', 'Mantap!', 'Keren!', 'Pukul!'];

export function createGame(nav) {
  const scene = $('g-scene'), sctx = scene.getContext('2d');
  const promptEl = $('g-prompt'), timerEl = $('g-timer'), heartsEl = $('g-hearts');
  let raf = 0, last = 0, W = 0, H = 0, dpr = 1;

  const S = {
    phase: 'ready', hearts: 3, score: 0, level: 1, streak: 0, round: 0,
    t: 0, scroll: 0, ch: 'A', timeLeft: 0, timeMax: 20, shake: 0,
    lunge: 0, phaseT: 0, enemy: null, puffs: [], floaters: [], fails: 0,
  };

  const pad = new TracePad($('g-pad'), {
    guide: 'full', tol: 13,
    onStroke: (res) => {
      if (res.pass) { audio.sfx('pop'); return; }
      S.fails++;
      audio.sfx('bad');
      flashPrompt(reasonText(res.reason));
      if (S.fails % 3 === 0) pad.playDemo(pad.index);
    },
    onComplete: () => succeed(),
  });
  pad.enabled = false;

  function flashPrompt(text) {
    promptEl.innerHTML = `<span>${text}</span>`;
    clearTimeout(flashPrompt.timer);
    flashPrompt.timer = setTimeout(showPrompt, 1600);
  }

  function showPrompt() {
    const kind = setOf(S.ch);
    const label = kind === 'angka' ? 'angka' : kind === 'kapital' ? 'huruf besar' : 'huruf kecil';
    promptEl.innerHTML = `<span>Tulis ${label}</span> <b>${S.ch}</b>`;
  }

  // ------------------------------------------------------------ rounds
  function pool() {
    const l = S.level;
    let p = SETS.kapital.chars.slice(0, Math.min(26, 8 + l * 4));
    if (l >= 3) p = p.concat(SETS.angka.chars);
    if (l >= 4) p = p.concat(SETS.kecil.chars.slice(0, Math.min(26, (l - 3) * 8)));
    return p;
  }

  function pickChar() {
    const p = pool();
    let c = p[(Math.random() * p.length) | 0];
    if (c === S.ch) c = p[(Math.random() * p.length) | 0];
    return c;
  }

  function startRound() {
    S.round++;
    S.ch = pickChar();
    S.fails = 0;
    S.phase = 'approach';
    S.phaseT = 0;
    const boss = S.round % 5 === 0;
    const flying = !boss && S.round % 2 === 0;
    S.enemy = {
      type: boss ? 'boss' : flying ? 'ptero' : 'raptor',
      x: W + W * 0.2, y: 0, vx: 0, vy: 0, rot: 0, dead: false,
      size: boss ? H * 0.46 : flying ? H * 0.26 : H * 0.34,
    };
    S.timeMax = Math.max(11, 22 - S.level * 1.4);
    pad.setGlyph(S.ch, {
      guide: S.level <= 2 ? 'full' : 'faint',
      tol: S.level <= 2 ? 13 : S.level <= 4 ? 12 : 11,
    });
    pad.enabled = false;
    promptEl.classList.add('hide');
    updateHud();
  }

  function beginWriting() {
    S.phase = 'write';
    S.phaseT = 0;
    S.timeLeft = S.timeMax;
    pad.enabled = true;
    promptEl.classList.remove('hide');
    showPrompt();
    audio.speak(`Tulis ${spokenName(S.ch)}`);
  }

  function succeed() {
    if (S.phase !== 'write') return;
    S.phase = 'attack';
    S.phaseT = 0;
    pad.enabled = false;
    audio.sfx('roar');
    audio.shutUp();
  }

  function landHit() {
    const e = S.enemy;
    e.dead = true;
    e.vx = W * 0.85 + Math.random() * W * 0.2;
    e.vy = -H * 1.1;
    e.rot = 0.1;
    audio.sfx('stomp');
    S.shake = 1;
    puff(e.x, groundY() - (e.type === 'ptero' ? H * 0.3 : H * 0.1), 22);
    const stars = pad.stars || 1;
    const bonus = Math.round(S.timeLeft) + S.level * 2;
    const gained = 10 + stars * 5 + bonus;
    S.score += gained;
    S.streak++;
    floater(e.x, groundY() - H * 0.35, `+${gained}`, '#ffd166');
    fx.praise(WIN_WORDS[(Math.random() * WIN_WORDS.length) | 0], '#06d6a0');
    fx.burstStars(innerWidth * 0.5, innerHeight * 0.3, stars);
    if (S.streak % 4 === 0 && S.level < 9) {
      S.level++;
      audio.sfx('star');
      floater(W * 0.5, groundY() - H * 0.5, `Level ${S.level}!`, '#ff4d6d');
      audio.speak(`Level ${S.level}! Kamu hebat!`);
    } else {
      audio.speak('Kena! Hebat!');
    }
    updateHud();
  }

  function fail() {
    if (S.phase !== 'write') return;
    S.phase = 'hurt';
    S.phaseT = 0;
    S.hearts--;
    S.streak = 0;
    pad.enabled = false;
    audio.sfx('lose');
    S.shake = 1;
    const e = S.enemy;
    e.vx = -W * 0.9;
    e.vy = e.type === 'ptero' ? 0 : -H * 0.4;
    floater(W * 0.3, groundY() - H * 0.4, '💔', '#ff4d6d');
    audio.speak(S.hearts > 0 ? 'Aduh! Ayo coba lagi.' : 'Permainan selesai.');
    updateHud();
  }

  function gameOver() {
    S.phase = 'over';
    progress.setBest(S.score);
    $('go-score').textContent = S.score;
    $('go-best').textContent = progress.best();
    $('go-title').textContent = S.score >= progress.best() && S.score > 0 ? 'Rekor Baru! 🏆' : 'Permainan Selesai!';
    $('g-over').classList.remove('hidden');
    audio.sfx('lose');
  }

  function updateHud() {
    $('g-score').textContent = S.score;
    $('g-level').textContent = S.level;
    heartsEl.textContent = '❤️'.repeat(Math.max(0, S.hearts)) + '🤍'.repeat(Math.max(0, 3 - S.hearts));
  }

  function puff(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 260;
      S.puffs.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.7 + Math.random() * 0.5, r: 4 + Math.random() * 12, c: ['#fff', '#ffd166', '#ff9f1c'][(Math.random() * 3) | 0] });
    }
  }

  function floater(x, y, text, color) {
    S.floaters.push({ x, y, text, color, life: 1.4 });
  }

  const groundY = () => H * 0.84;
  const rexX = () => W * 0.24;

  // -------------------------------------------------------------- loop
  function resize() {
    const r = scene.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    scene.width = Math.round(W * dpr);
    scene.height = Math.round(H * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function step(dt) {
    S.t += dt;
    S.phaseT += dt;
    S.shake = Math.max(0, S.shake - dt * 2.5);
    const running = S.phase === 'approach' || S.phase === 'attack';
    S.scroll += dt * (running ? 300 : S.phase === 'write' ? 60 : 160);

    for (const p of S.puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.life -= dt; }
    S.puffs = S.puffs.filter((p) => p.life > 0);
    for (const f of S.floaters) { f.y -= 44 * dt; f.life -= dt; }
    S.floaters = S.floaters.filter((f) => f.life > 0);

    const e = S.enemy;
    if (!e) return;

    if (S.phase === 'approach') {
      const target = W * 0.63;
      e.x += (target - e.x) * Math.min(1, dt * 2.6);
      if (e.x - target < W * 0.02) beginWriting();
    } else if (S.phase === 'write') {
      e.x = W * 0.63 + Math.sin(S.t * 2) * W * 0.012;
      S.timeLeft -= dt;
      const f = Math.max(0, S.timeLeft / S.timeMax);
      timerEl.style.width = `${f * 100}%`;
      timerEl.className = f < 0.25 ? 'danger' : f < 0.5 ? 'warn' : '';
      if (S.timeLeft <= 0) fail();
    } else if (S.phase === 'attack') {
      // lunge out, hit, spring back
      const reach = W * 0.3;
      S.lunge = S.phaseT < 0.3 ? (S.phaseT / 0.3) * reach : Math.max(0, (1 - (S.phaseT - 0.3) / 0.5)) * reach;
      if (!e.dead && S.phaseT > 0.26) landHit();
      if (e.dead) { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += H * 2.4 * dt; e.rot += dt * 7; }
      if (S.phaseT > 1.15) { S.lunge = 0; startRound(); }
    } else if (S.phase === 'hurt') {
      e.x += e.vx * dt;
      if (e.type !== 'ptero') { e.y += e.vy * dt; e.vy += H * 2.4 * dt; if (e.y > 0) { e.y = 0; e.vy = 0; } }
      if (S.phaseT > 1.4) {
        if (S.hearts <= 0) gameOver(); else startRound();
      }
    }
  }

  function render() {
    const gY = groundY();
    sctx.save();
    if (S.shake > 0) sctx.translate(Math.sin(S.t * 70) * S.shake * 7, Math.cos(S.t * 63) * S.shake * 4);
    drawBackdrop(sctx, W, H, S.t, { scroll: S.scroll, groundY: gY });

    // the hero
    const pose = S.phase === 'attack' ? 'roar' : S.phase === 'hurt' ? 'hurt' : 'run';
    drawRex(sctx, { x: rexX() + S.lunge, y: gY + H * 0.02, size: H * 0.44, t: S.t, pose });

    const e = S.enemy;
    if (e) {
      sctx.save();
      if (e.type === 'ptero') {
        sctx.translate(e.x, gY - H * 0.34 + e.y + Math.sin(S.t * 3) * H * 0.02);
        sctx.rotate(e.rot);
        drawPtero(sctx, { x: 0, y: 0, size: e.size, t: S.t, color: '#e4572e' });
      } else {
        sctx.translate(e.x, gY + H * 0.02 + e.y);
        sctx.rotate(e.rot);
        drawRex(sctx, {
          x: 0, y: 0, size: e.size, t: S.t, flip: true,
          pose: e.dead ? 'hurt' : 'run',
          skin: e.type === 'boss' ? '#9b51e0' : '#e4572e',
          belly: e.type === 'boss' ? '#e6c6f5' : '#ffd6a5',
        });
      }
      sctx.restore();
    }

    for (const p of S.puffs) {
      sctx.globalAlpha = Math.max(0, p.life);
      sctx.fillStyle = p.c;
      sctx.beginPath();
      sctx.arc(p.x, p.y, p.r * p.life + 1, 0, 7);
      sctx.fill();
    }
    sctx.globalAlpha = 1;
    sctx.textAlign = 'center';
    for (const f of S.floaters) {
      sctx.globalAlpha = Math.min(1, f.life);
      sctx.font = `bold ${Math.round(H * 0.11)}px system-ui, sans-serif`;
      sctx.lineWidth = H * 0.016;
      sctx.strokeStyle = '#fff';
      sctx.strokeText(f.text, f.x, f.y);
      sctx.fillStyle = f.color;
      sctx.fillText(f.text, f.x, f.y);
    }
    sctx.globalAlpha = 1;
    sctx.restore();
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!W) { resize(); return; }
    if (S.phase !== 'ready' && S.phase !== 'over') step(dt);
    render();
  }

  function newGame() {
    Object.assign(S, {
      hearts: 3, score: 0, level: 1, streak: 0, round: 0,
      scroll: 0, lunge: 0, puffs: [], floaters: [], fails: 0, shake: 0,
    });
    $('g-over').classList.add('hidden');
    updateHud();
    startRound();
  }

  $('gs-go').addEventListener('click', () => {
    audio.sfx('tap');
    $('g-start').classList.add('hidden');
    newGame();
  });
  $('go-again').addEventListener('click', () => { audio.sfx('tap'); newGame(); });
  const ro = new ResizeObserver(resize);
  ro.observe(scene);

  return {
    pad, state: S,
    open() {
      resize();
      S.phase = 'ready';
      S.enemy = null;
      $('g-over').classList.add('hidden');
      $('g-start').classList.remove('hidden');
      updateHud();
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(loop);
    },
    close() {
      cancelAnimationFrame(raf);
      raf = 0;
      pad.enabled = false;
      audio.shutUp();
    },
  };
}
