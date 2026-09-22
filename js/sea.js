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

  // Baby-animal proportions, not a real shark: a nearly round body, a head
  // that is most of it, two big eyes on the same side of the face, tiny fins
  // and a wide simple grin. The palette and the shapes are our own - the
  // borrowed part is only the idea that a baby shark should look like a
  // cuddly toy.

  // tail: two short rounded lobes
  const sway = Math.sin(t * 4.2) * 7 * p.tail;
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-22, -2);
  c.quadraticCurveTo(-40, -16 + sway, -50, -22 + sway * 1.2);
  c.quadraticCurveTo(-46, -8 + sway * 0.6, -40, 2 + sway * 0.5);
  c.quadraticCurveTo(-46, 12 + sway * 0.9, -44, 22 + sway);
  c.quadraticCurveTo(-34, 12 + sway * 0.5, -22, 6);
  c.closePath();
  c.fill();

  // dorsal fin: a small rounded triangle
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(-4, -26);
  c.quadraticCurveTo(6, -44, 18, -32);
  c.quadraticCurveTo(10, -28, 6, -23);
  c.closePath();
  c.fill();

  // body: round, with just a hint of a snout at the front
  c.fillStyle = skin;
  blob(c, [[44, 0], [36, -18], [12, -30], [-12, -24], [-25, -4], [-14, 16], [8, 24], [32, 16]]);
  c.fill();

  // belly: a big pale front, which is most of what makes it look like a baby
  c.fillStyle = belly;
  blob(c, [[-10, 10], [10, 23], [32, 15], [43, 2], [30, 6], [6, 9]]);
  c.fill();

  // side fin: a little paddle
  c.fillStyle = darker;
  c.beginPath();
  c.moveTo(4, 14);
  c.quadraticCurveTo(-8, 24 + swim * 0.3, 0, 28 + swim * 0.3);
  c.quadraticCurveTo(10, 23, 16, 17);
  c.closePath();
  c.fill();

  // mouth: a shallow grin. The teeth are a white band with soft notches, not
  // a row of fangs - pointed teeth on a round face read as a predator, which
  // is the opposite of what this is for.
  const open = p.mouth * 15;
  c.fillStyle = '#9c3b52';
  c.beginPath();
  c.moveTo(12, 4);
  c.quadraticCurveTo(26, 1, 40, 3);
  c.quadraticCurveTo(28, 11 + open, 12, 4);
  c.closePath();
  c.fill();
  c.save();
  c.clip();                                    // everything below stays inside
  c.fillStyle = '#fff';
  c.fillRect(8, -4, 36, 7.5);                  // upper teeth: one bright band
  c.strokeStyle = 'rgba(156,59,82,0.5)';
  c.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) {                // soft separations, no points
    c.beginPath();
    c.moveTo(12 + i * 6, -1);
    c.lineTo(12 + i * 6, 3.6);
    c.stroke();
  }
  if (open > 6) {
    const ly = 8 + open * 0.55;
    c.fillStyle = '#fff';
    c.fillRect(13, ly - 4, 26, 6);             // lower band, only when open
    c.strokeStyle = 'rgba(156,59,82,0.5)';
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(13 + i * 6.5, ly - 3.4);
      c.lineTo(13 + i * 6.5, ly + 1);
      c.stroke();
    }
  }
  c.restore();

  // blush, on the cheek between eye and grin
  c.fillStyle = 'rgba(255,105,135,0.75)';
  ellipse(c, 41, -1, 4.6, 3.2); c.fill();
  ellipse(c, 2, 1, 4.2, 3); c.fill();

  // two eyes on the same side of the face, the far one a little smaller
  const blink = Math.sin(t * 0.8) > 0.985 ? 0.1 : 1;
  const look = p.droop ? 2.5 : 0;
  const eye = (ex, ey, r) => {
    c.fillStyle = '#fff';
    ellipse(c, ex, ey, r, r * blink); c.fill();
    c.fillStyle = '#20313d';
    ellipse(c, ex + r * 0.2, ey + look, r * 0.58 * blink + 0.3, r * 0.6 * blink); c.fill();
    c.fillStyle = '#fff';
    ellipse(c, ex + r * 0.42, ey - r * 0.3, r * 0.2, r * 0.2); c.fill();
    ellipse(c, ex - r * 0.1, ey + r * 0.35, r * 0.11, r * 0.11); c.fill();
  };
  eye(13, -12, 9);
  eye(31, -11, 11);

  // A brow only when there is a mood to show - a blank face reads friendlier.
  if (p.droop || pose === 'roar') {
    c.strokeStyle = darker; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath();
    if (p.droop) { c.moveTo(24, -26); c.lineTo(38, -21); c.moveTo(6, -25); c.lineTo(18, -22); }
    else { c.moveTo(24, -23); c.lineTo(38, -28); c.moveTo(6, -21); c.lineTo(18, -25); }
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
