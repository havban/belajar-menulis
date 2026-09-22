// The shark theme: a cute shark and the world it swims in.
//
// Same rules as js/dino.js - every shape is drawn with canvas paths, nothing is
// loaded - and the same call signatures, so a theme can be swapped in without
// the mascot, the game or the backdrop knowing which one they are drawing.
//
// Creatures are drawn in a 100-unit box whose y = 0 is the ground line the
// caller gives. A shark does not stand on it: the body floats above it, which
// is what `FLOAT` is for.

import { shade } from './dino.js?v=__BUILD__';

const TAU = Math.PI * 2;
const FLOAT = 34;           // how far above the sea bed the body sits

function ellipse(c, x, y, rx, ry, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
}

function blob(c, pts) {
  c.beginPath();
  const n = pts.length;
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    c.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1],
    );
  }
  c.closePath();
}

// ----------------------------------------------------------------- the shark
const POSES = {
  idle:  { mouth: 0.12, tail: 1,   bob: 1.6, tilt: 0 },
  cheer: { mouth: 0.8,  tail: 2.4, bob: 3.2, tilt: -0.1, hop: 1 },
  sad:   { mouth: 0.05, tail: 0.3, bob: 0.5, tilt: 0.2, droop: 1 },
  run:   { mouth: 0.22, tail: 2.6, bob: 2.2, tilt: -0.05 },
  roar:  { mouth: 1,    tail: 3,   bob: 2,   tilt: 0.06 },
  hurt:  { mouth: 0.6,  tail: 0.6, bob: 0.8, tilt: -0.22, droop: 1 },
};

export function drawShark(c, { x, y, size = 100, t = 0, pose = 'idle', flip = false, skin = '#5bc0de', belly = '#eaf6fb' }) {
  const p = POSES[pose] || POSES.idle;
  const swim = Math.sin(t * 3.4) * p.bob;
  const hop = p.hop ? Math.abs(Math.sin(t * 6)) * 12 : 0;
  const dark = shade(skin, -0.22);
  const darker = shade(skin, -0.42);

  c.save();
  c.translate(x, y - hop);
  c.scale((size / 100) * (flip ? -1 : 1), size / 100);
  c.translate(0, -FLOAT + swim * 0.6);
  c.rotate(p.tilt + Math.sin(t * 1.7) * 0.02);

  // Everything below is drawn round rather than sharp: a plump body, a big
  // head, small soft fins and an eye that takes up most of the face. That is
  // what makes it read as a friendly cartoon instead of a shark.

  // tail: two rounded lobes, not spikes
  const sway = Math.sin(t * 4.2) * 8 * p.tail;
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-26, -4);
  c.quadraticCurveTo(-46, -18 + sway, -58, -26 + sway * 1.2);
  c.quadraticCurveTo(-56, -10 + sway * 0.6, -48, 2 + sway * 0.5);
  c.quadraticCurveTo(-56, 12 + sway * 0.9, -54, 24 + sway);
  c.quadraticCurveTo(-42, 12 + sway * 0.5, -26, 6);
  c.closePath();
  c.fill();

  // dorsal fin: small, with a rounded tip
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-6, -24);
  c.quadraticCurveTo(4, -44, 18, -34);
  c.quadraticCurveTo(10, -28, 6, -21);
  c.closePath();
  c.fill();

  // body: chubby, with a short snout
  c.fillStyle = skin;
  blob(c, [[46, 2], [36, -16], [12, -28], [-12, -24], [-27, -8], [-24, 10], [-2, 22], [26, 18], [42, 10]]);
  c.fill();

  // a big pale belly, which also makes it look softer
  c.fillStyle = belly;
  blob(c, [[-18, 6], [4, 20], [28, 16], [42, 8], [26, 10], [2, 11]]);
  c.fill();

  // side fin: a small rounded paddle
  c.fillStyle = darker;
  c.beginPath();
  c.moveTo(6, 12);
  c.quadraticCurveTo(-6, 22 + swim * 0.3, 2, 27 + swim * 0.3);
  c.quadraticCurveTo(12, 22, 18, 15);
  c.closePath();
  c.fill();

  // gills, drawn lightly so they do not clutter the face
  c.strokeStyle = darker;
  c.globalAlpha = 0.5;
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(-2 + i * 5, -10);
    c.quadraticCurveTo(-5 + i * 5, -4, -2 + i * 5, 2);
    c.stroke();
  }
  c.globalAlpha = 1;

  // mouth: a wide smile that opens into a round chomp
  const open = p.mouth * 13;
  if (open > 3) {
    c.fillStyle = '#8c3247';
    c.beginPath();
    c.moveTo(16, 6);
    c.quadraticCurveTo(30, 3, 42, 6);
    c.quadraticCurveTo(30, 10 + open, 16, 6);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {                  // a few soft teeth
      const tx = 21 + i * 7;
      c.beginPath();
      c.moveTo(tx, 5.4);
      c.lineTo(tx + 2.2, 9);
      c.lineTo(tx + 4.4, 5);
      c.closePath();
      c.fill();
    }
  } else {
    c.strokeStyle = '#a8415a';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(20, 8);
    c.quadraticCurveTo(30, 15, 40, 8);
    c.stroke();
  }

  // blush
  c.fillStyle = 'rgba(255,112,146,0.55)';
  ellipse(c, 36, 0, 6.5, 4.2); c.fill();

  // one big eye, most of the face
  const blink = Math.sin(t * 0.8) > 0.985 ? 0.1 : 1;
  c.fillStyle = '#fff';
  ellipse(c, 22, -10, 13, 13 * blink); c.fill();
  c.fillStyle = '#20313d';
  const look = p.droop ? 2.5 : 0;
  ellipse(c, 25, -9 + look, 6.5 * blink + 0.4, 7 * blink); c.fill();
  c.fillStyle = '#fff';
  ellipse(c, 27.5, -12.5, 2.6, 2.6); c.fill();
  ellipse(c, 22.5, -5.5, 1.4, 1.4); c.fill();
  // A brow only when there is a mood to show - a blank face reads friendlier.
  if (p.droop || pose === 'roar') {
    c.strokeStyle = darker; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath();
    if (p.droop) { c.moveTo(13, -25); c.lineTo(28, -20); }
    else { c.moveTo(13, -21); c.lineTo(28, -27); }
    c.stroke();
  }

  c.restore();
}

// -------------------------------------------------------- the other swimmers
export function drawFish(c, { x, y, size = 60, t = 0, color = '#ff9f1c', flip = false }) {
  c.save();
  c.translate(x, y);
  c.scale((size / 100) * (flip ? -1 : 1), size / 100);
  const wag = Math.sin(t * 6) * 6;
  c.fillStyle = shade(color, -0.2);
  c.beginPath();                                  // tail
  c.moveTo(-18, 0);
  c.lineTo(-34, -12 + wag);
  c.lineTo(-34, 12 + wag);
  c.closePath();
  c.fill();
  c.fillStyle = color;
  ellipse(c, 0, 0, 22, 14); c.fill();
  c.fillStyle = shade(color, -0.2);
  c.beginPath();                                  // top fin
  c.moveTo(-4, -12);
  c.quadraticCurveTo(2, -24, 12, -10);
  c.closePath();
  c.fill();
  c.fillStyle = '#fff';
  ellipse(c, 11, -3, 5, 5); c.fill();
  c.fillStyle = '#20313d';
  ellipse(c, 12.5, -3, 2.2, 2.2); c.fill();
  c.restore();
}

export function drawJelly(c, { x, y, size = 60, t = 0, color = '#c77dff' }) {
  c.save();
  c.translate(x, y);
  c.scale(size / 100, size / 100);
  const pulse = 1 + Math.sin(t * 3) * 0.08;
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(0, 0, 24 * pulse, 20 / pulse, 0, Math.PI, TAU);
  c.closePath();
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 4;
  c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const tx = -16 + i * 8;
    c.beginPath();
    c.moveTo(tx, 0);
    c.quadraticCurveTo(tx + Math.sin(t * 3 + i) * 8, 16, tx + Math.sin(t * 3 + i) * 12, 30);
    c.stroke();
  }
  c.fillStyle = '#fff';
  ellipse(c, -6, -8, 3.5, 3.5); c.fill();
  ellipse(c, 7, -8, 3.5, 3.5); c.fill();
  c.fillStyle = '#20313d';
  ellipse(c, -5.5, -8, 1.6, 1.6); c.fill();
  ellipse(c, 7.5, -8, 1.6, 1.6); c.fill();
  c.restore();
}

export function drawOctopus(c, { x, y, size = 100, t = 0, color = '#e4572e', flip = false }) {
  c.save();
  c.translate(x, y);
  c.scale((size / 100) * (flip ? -1 : 1), size / 100);
  c.translate(0, -FLOAT);
  c.fillStyle = shade(color, -0.15);
  for (let i = 0; i < 5; i++) {                   // arms
    const a = -22 + i * 11;
    c.beginPath();
    c.moveTo(a, 6);
    c.quadraticCurveTo(a - 10 + Math.sin(t * 3 + i) * 8, 26, a - 4 + Math.sin(t * 3 + i) * 14, 40);
    c.lineWidth = 7;
    c.strokeStyle = shade(color, -0.15);
    c.lineCap = 'round';
    c.stroke();
  }
  c.fillStyle = color;
  ellipse(c, 0, -8, 30, 28); c.fill();
  c.fillStyle = '#fff';
  ellipse(c, -10, -12, 9, 10); c.fill();
  ellipse(c, 12, -12, 9, 10); c.fill();
  c.fillStyle = '#20313d';
  ellipse(c, -8, -11, 4, 4.6); c.fill();
  ellipse(c, 14, -11, 4, 4.6); c.fill();
  c.strokeStyle = shade(color, -0.45); c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-18, -26); c.lineTo(-4, -22); c.stroke();
  c.beginPath(); c.moveTo(20, -26); c.lineTo(6, -22); c.stroke();
  c.restore();
}

// ------------------------------------------------------------- the sea floor
function seaweed(c, x, groundY, h, t, color) {
  c.save();
  c.translate(x, groundY);
  c.strokeStyle = color;
  c.lineWidth = h * 0.13;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(Math.sin(t * 1.3 + x * 0.02) * h * 0.25, -h * 0.55, Math.sin(t * 1.3 + x * 0.02) * h * 0.4, -h);
  c.stroke();
  c.restore();
}

function coral(c, x, groundY, h, color) {
  c.save();
  c.translate(x, groundY);
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.lineWidth = h * 0.18;
  for (const a of [-0.5, 0, 0.5]) {
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(a * h * 0.5, -h * 0.5, a * h * 0.8, -h * 0.9);
    c.stroke();
  }
  c.restore();
}

/** Underwater version of drawBackdrop - same arguments, same job. */
export function drawSea(c, w, h, t, opts = {}) {
  const scroll = opts.scroll || 0;
  const groundY = opts.groundY || h * 0.82;

  const water = c.createLinearGradient(0, 0, 0, h);
  water.addColorStop(0, '#7fd4f0');
  water.addColorStop(0.45, '#2aa3d6');
  water.addColorStop(1, '#0c6ca8');
  c.fillStyle = water;
  c.fillRect(0, 0, w, h);

  // sun beams slanting down through the surface
  c.save();
  c.globalAlpha = 0.16;
  c.fillStyle = '#eaf9ff';
  for (let i = 0; i < 5; i++) {
    const x = ((i * 0.27 + t * 0.01) % 1.2 - 0.1) * w;
    const wid = w * 0.09;
    c.beginPath();
    c.moveTo(x, -10);
    c.lineTo(x + wid, -10);
    c.lineTo(x + wid * 2.6 + h * 0.22, groundY);
    c.lineTo(x + wid * 1.6 + h * 0.22, groundY);
    c.closePath();
    c.fill();
  }
  c.restore();

  // the surface, rippling just under the top edge
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = 3;
  c.beginPath();
  for (let x = 0; x <= w; x += 8) {
    const y = h * 0.045 + Math.sin(x * 0.02 + t * 1.6) * 5;
    x ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke();

  // far rocks, two layers
  for (const [depth, amp, color] of [[0.05, h * 0.12, '#1a7fb8'], [0.1, h * 0.08, '#15699a']]) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(-10, groundY + 2);
    for (let x = -10; x <= w + 10; x += 14) {
      const k = x + scroll * depth;
      c.lineTo(x, groundY - amp * (0.55 + 0.45 * Math.sin(k * 0.007) + 0.3 * Math.sin(k * 0.015)));
    }
    c.lineTo(w + 10, groundY + 2);
    c.closePath();
    c.fill();
  }

  // background swimmers
  const fw = w + 200;
  drawFish(c, { x: ((t * 22 + scroll * 0.06) % fw) - 100, y: h * (0.3 + Math.sin(t * 0.8) * 0.03), size: Math.min(w, h) * 0.12, t, color: '#ffd166' });
  drawFish(c, { x: fw - ((t * 16 + scroll * 0.04) % fw), y: h * (0.5 + Math.sin(t * 0.6 + 2) * 0.03), size: Math.min(w, h) * 0.09, t: t + 1, color: '#ff9f1c', flip: true });
  drawJelly(c, { x: ((w * 0.7 - scroll * 0.05) % (w * 1.4)), y: h * (0.22 + Math.sin(t * 0.5) * 0.04), size: Math.min(w, h) * 0.12, t });

  // sea bed
  const sand = c.createLinearGradient(0, groundY, 0, h);
  sand.addColorStop(0, '#f2dfa8');
  sand.addColorStop(1, '#d9bf78');
  c.fillStyle = sand;
  c.fillRect(0, groundY, w, h - groundY);
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, groundY); c.lineTo(w, groundY); c.stroke();

  // plants along the bed
  const base = Math.min(w, h);
  for (let i = 0; i < 7; i++) {
    const x = ((i * 0.16 * w * 1.3 - scroll * 0.5) % (w + 160) + w + 160) % (w + 160) - 80;
    seaweed(c, x, groundY + 6, base * (0.16 + (i % 3) * 0.05), t, i % 2 ? '#2f9e6d' : '#3fbf86');
  }
  for (let i = 0; i < 3; i++) {
    const x = ((i * 0.37 * w * 1.2 - scroll * 0.35) % (w + 240) + w + 240) % (w + 240) - 120;
    coral(c, x, groundY + 6, base * 0.14, i % 2 ? '#ff8fab' : '#ffb26b');
  }

  // bubbles
  c.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 14; i++) {
    const seed = i * 97.3;
    const x = ((seed - scroll * 0.2) % (w + 40) + w + 40) % (w + 40) - 20;
    const y = groundY - ((t * (18 + (i % 5) * 7) + seed) % (groundY + 40));
    const r = 2 + (i % 4) * 1.6;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
  }
}
