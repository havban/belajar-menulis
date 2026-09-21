// Every picture in the app is drawn here with canvas paths: the mascot T-Rex,
// the other dinosaurs, and the prehistoric backdrop. Nothing is loaded from a
// file, so the whole app stays tiny and works offline.
//
// Each creature is drawn in its own 100-unit-tall box with the feet at y = 0
// and the head towards negative y, then scaled into place by the caller.

const TAU = Math.PI * 2;

function blob(c, pts) {
  // Closed smooth curve through the given points (Catmull-Rom to Bezier).
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

function ellipse(c, x, y, rx, ry, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
}

// ------------------------------------------------------------------ the rex
const POSES = {
  idle:   { lean: 0,    mouth: 0.10, arm: -0.5, legs: 0,   bob: 1,   tail: 1 },
  cheer:  { lean: -0.12, mouth: 0.75, arm: -2.1, legs: 0,  bob: 2.6, tail: 2.2, hop: 1 },
  sad:    { lean: 0.22, mouth: 0.05, arm: 0.35, legs: 0,   bob: 0.3, tail: 0.2, droop: 1 },
  run:    { lean: 0.18, mouth: 0.25, arm: -0.9, legs: 1,   bob: 1.4, tail: 1.6 },
  roar:   { lean: 0.10, mouth: 1.0,  arm: -1.6, legs: 0.4, bob: 1.2, tail: 2.4 },
  hurt:   { lean: -0.25, mouth: 0.6, arm: 0.9,  legs: 0,   bob: 0.6, tail: 0.6, droop: 1 },
};

export function drawRex(c, { x, y, size = 100, t = 0, pose = 'idle', flip = false, skin = '#57c16b', belly = '#d8f3a6' }) {
  const p = POSES[pose] || POSES.idle;
  const breathe = Math.sin(t * 3.1) * p.bob;
  const hop = p.hop ? Math.abs(Math.sin(t * 6)) * 12 : 0;
  const legPhase = t * 13;

  c.save();
  c.translate(x, y - hop);
  c.scale((size / 100) * (flip ? -1 : 1), size / 100);

  const dark = shade(skin, -0.22);
  const darker = shade(skin, -0.38);

  // back leg
  c.fillStyle = dark;
  const bl = p.legs ? Math.sin(legPhase) * 16 : 0;
  leg(c, -6, -34, bl, dark);
  // tail
  const sway = Math.sin(t * 2.4) * 5 * p.tail;
  c.fillStyle = skin;
  c.beginPath();
  c.moveTo(-16, -48);
  c.quadraticCurveTo(-54, -48 + sway * 0.4, -86, -18 + sway);
  c.quadraticCurveTo(-54, -24 + sway * 0.5, -16, -20);
  c.closePath();
  c.fill();

  c.save();
  c.translate(0, -30);
  c.rotate(p.lean * 0.35);
  c.translate(0, 30);

  // body
  c.fillStyle = skin;
  blob(c, [[-18, -40], [-6, -66 - breathe * 0.3], [18, -74], [34, -60], [30, -34], [12, -20], [-10, -22]]);
  c.fill();
  // belly patch
  c.fillStyle = belly;
  blob(c, [[6, -26], [24, -32], [30, -48], [20, -58], [8, -52], [2, -38]]);
  c.fill();
  // back spikes
  c.fillStyle = darker;
  for (let i = 0; i < 4; i++) {
    const sx = -14 + i * 9, sy = -46 - i * 6 - breathe * 0.2;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + 4, sy - 8);
    c.lineTo(sx + 9, sy + 1);
    c.closePath();
    c.fill();
  }

  // head group
  c.save();
  c.translate(22, -72 - breathe);
  c.rotate((p.droop ? 0.18 : -0.04) + Math.sin(t * 2.1) * 0.02);
  // skull
  c.fillStyle = skin;
  blob(c, [[-16, 4], [-14, -14], [2, -22], [24, -16], [30, -4], [16, 6], [-2, 8]]);
  c.fill();
  // snout top
  c.fillStyle = skin;
  blob(c, [[10, -12], [30, -14], [36, -4], [28, 2], [12, 0]]);
  c.fill();
  // mouth / jaw
  c.save();
  c.translate(6, 0);
  c.rotate(p.mouth * 0.55);
  c.fillStyle = shade(skin, -0.12);
  blob(c, [[-6, 0], [24, -2], [30, 4], [22, 8], [-4, 7]]);
  c.fill();
  c.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(6 + i * 8, 0);
    c.lineTo(10 + i * 8, -5);
    c.lineTo(13 + i * 8, 0);
    c.closePath();
    c.fill();
  }
  c.restore();
  if (p.mouth > 0.3) {
    c.fillStyle = '#b5364f';
    blob(c, [[2, 1], [22, 0], [24, 4], [4, 6]]);
    c.fill();
  }
  // upper teeth
  c.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(8 + i * 8, -1);
    c.lineTo(11 + i * 8, 4);
    c.lineTo(14 + i * 8, -1);
    c.closePath();
    c.fill();
  }
  // eye
  const blink = Math.sin(t * 0.9) > 0.985 ? 0.12 : 1;
  c.fillStyle = '#fff';
  ellipse(c, 7, -12, 8, 8 * blink); c.fill();
  c.fillStyle = '#26323d';
  const look = pose === 'sad' || pose === 'hurt' ? 1.5 : 0;
  ellipse(c, 9.5, -11 + look, 3.6 * blink + 0.4, 4 * blink); c.fill();
  c.fillStyle = '#fff';
  ellipse(c, 11, -13, 1.4, 1.4); c.fill();
  // brow
  c.strokeStyle = darker; c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath();
  if (pose === 'sad' || pose === 'hurt') { c.moveTo(1, -21); c.lineTo(14, -17); }
  else if (pose === 'roar') { c.moveTo(1, -17); c.lineTo(14, -22); }
  else { c.moveTo(1, -21); c.lineTo(14, -22); }
  c.stroke();
  // nostril
  c.fillStyle = darker;
  ellipse(c, 30, -8, 1.6, 1.2); c.fill();
  c.restore();

  // arm
  c.save();
  c.translate(22, -46);
  c.rotate(p.arm + Math.sin(t * 4) * 0.12);
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(12, 2, 16, 10);
  c.quadraticCurveTo(8, 10, 0, 6);
  c.closePath();
  c.fill();
  c.restore();

  c.restore();  // lean

  // front leg
  const fl = p.legs ? Math.sin(legPhase + Math.PI) * 16 : 0;
  leg(c, 10, -32, fl, skin);
  c.restore();
}

function leg(c, x, hip, swing, fill) {
  c.save();
  c.fillStyle = fill;
  c.translate(x, hip);
  c.rotate(swing * 0.02);
  blob(c, [[-9, -6], [7, -8], [11, 6], [7, 20], [-2, 22], [-9, 8]]);
  c.fill();
  // shin + foot
  c.save();
  c.translate(2, 18);
  c.rotate(swing * 0.03);
  c.fillRect(-5, 0, 10, 12);
  c.beginPath();
  c.moveTo(-6, 10); c.lineTo(15, 10); c.lineTo(15, 14); c.lineTo(-7, 14);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 3; i++) { c.fillRect(4 + i * 4, 10, 2, 4); }
  c.restore();
  c.restore();
}

// --------------------------------------------------------- other dinosaurs
export function drawBronto(c, { x, y, size = 100, t = 0, color = '#7bb7e0' }) {
  c.save();
  c.translate(x, y);
  c.scale(size / 100, size / 100);
  const sway = Math.sin(t * 1.2) * 4;
  c.fillStyle = color;
  // tail
  c.beginPath();
  c.moveTo(-20, -38);
  c.quadraticCurveTo(-60, -34, -88, -8 + sway);
  c.quadraticCurveTo(-56, -18, -18, -24);
  c.closePath(); c.fill();
  // body
  ellipse(c, 0, -38, 34, 24); c.fill();
  // neck
  c.lineWidth = 15; c.strokeStyle = color; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(18, -46);
  c.quadraticCurveTo(46, -58, 44 + sway * 0.5, -92);
  c.stroke();
  // head
  ellipse(c, 46 + sway * 0.5, -98, 13, 9, -0.2); c.fill();
  c.fillStyle = '#20313d';
  ellipse(c, 50 + sway * 0.5, -100, 2, 2); c.fill();
  // legs
  c.fillStyle = shade(color, -0.15);
  for (const lx of [-18, 2, 16]) c.fillRect(lx, -22, 11, 22);
  c.restore();
}

export function drawStego(c, { x, y, size = 100, t = 0, color = '#c98ad6' }) {
  c.save();
  c.translate(x, y);
  c.scale(size / 100, size / 100);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-42, -18);
  c.quadraticCurveTo(-20, -52, 10, -48);
  c.quadraticCurveTo(38, -44, 46, -30);
  c.quadraticCurveTo(30, -12, -10, -14);
  c.closePath(); c.fill();
  c.fillStyle = shade(color, -0.25);
  for (let i = 0; i < 5; i++) {
    const px = -26 + i * 13, py = -40 - Math.sin(i / 4 * Math.PI) * 10;
    c.beginPath();
    c.moveTo(px - 6, py + 6); c.lineTo(px, py - 10); c.lineTo(px + 6, py + 6);
    c.closePath(); c.fill();
  }
  c.fillStyle = shade(color, -0.12);
  for (const lx of [-20, 0, 18]) c.fillRect(lx, -18, 9, 18);
  c.fillStyle = '#20313d';
  ellipse(c, 40, -32, 2, 2); c.fill();
  c.restore();
}

export function drawPtero(c, { x, y, size = 60, t = 0, color = '#f2994a' }) {
  c.save();
  c.translate(x, y);
  c.scale(size / 100, size / 100);
  const flap = Math.sin(t * 6);
  c.fillStyle = color;
  for (const s of [-1, 1]) {
    c.save();
    c.scale(s, 1);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(28, -14 + flap * 16, 58, 2 + flap * 22);
    c.quadraticCurveTo(28, 6 + flap * 6, 0, 8);
    c.closePath(); c.fill();
    c.restore();
  }
  ellipse(c, 0, 2, 11, 9); c.fill();
  c.beginPath();
  c.moveTo(6, -2); c.lineTo(26, 4); c.lineTo(6, 8);
  c.closePath(); c.fill();
  c.fillStyle = shade(color, -0.35);
  c.beginPath(); c.moveTo(0, -4); c.lineTo(-14, -12); c.lineTo(-2, -10); c.closePath(); c.fill();
  c.fillStyle = '#20313d';
  ellipse(c, 4, -1, 1.8, 1.8); c.fill();
  c.restore();
}

// -------------------------------------------------------------- the scenery
export function drawTree(c, x, groundY, size, t, kind = 0) {
  c.save();
  c.translate(x, groundY);
  c.scale(size / 100, size / 100);
  const sway = Math.sin(t * 1.1 + x * 0.01) * 0.05;
  if (kind === 0) {                       // palm
    c.strokeStyle = '#8a6a4a'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -50, 2, -96); c.stroke();
    c.fillStyle = '#3fa34d';
    for (let i = 0; i < 6; i++) {
      c.save();
      c.translate(2, -96);
      c.rotate((i / 6) * TAU + sway);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(26, -12, 54, 4);
      c.quadraticCurveTo(26, 6, 0, 8);
      c.closePath(); c.fill();
      c.restore();
    }
  } else {                                // fern bush
    c.fillStyle = '#2f8f4e';
    for (let i = 0; i < 7; i++) {
      c.save();
      c.rotate((-0.9 + i * 0.3) + sway);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-8, -40, 0, -74);
      c.quadraticCurveTo(10, -40, 0, 0);
      c.closePath(); c.fill();
      c.restore();
    }
  }
  c.restore();
}

// One reusable backdrop: sky, sun, clouds, volcano, hills, dinosaurs, plants.
// `scroll` slides the mid and foreground so the game can reuse it while running.
export function drawBackdrop(c, w, h, t, opts = {}) {
  const scroll = opts.scroll || 0;
  const groundY = opts.groundY || h * 0.82;

  const sky = c.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#59c8f5');
  sky.addColorStop(0.55, '#a8e6ff');
  sky.addColorStop(1, '#ffe9b0');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  // sun with slow rays
  const sx = w * 0.84, sy = h * 0.14, sr = Math.min(w, h) * 0.07;
  c.save();
  c.translate(sx, sy);
  c.rotate(t * 0.08);
  c.fillStyle = 'rgba(255,214,102,0.55)';
  for (let i = 0; i < 12; i++) {
    c.rotate(TAU / 12);
    c.beginPath();
    c.moveTo(sr * 1.2, -sr * 0.12);
    c.lineTo(sr * 2.1, 0);
    c.lineTo(sr * 1.2, sr * 0.12);
    c.closePath(); c.fill();
  }
  c.restore();
  c.fillStyle = '#ffd166';
  ellipse(c, sx, sy, sr, sr); c.fill();

  // clouds
  for (let i = 0; i < 4; i++) {
    const cw = w * (0.13 + (i % 2) * 0.05);
    const cx = ((i * 0.31 + t * 0.006 + scroll * 0.00004) % 1.3 - 0.15) * w;
    const cy = h * (0.10 + (i % 3) * 0.07);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    ellipse(c, cx, cy, cw * 0.5, cw * 0.22); c.fill();
    ellipse(c, cx - cw * 0.22, cy + cw * 0.05, cw * 0.3, cw * 0.17); c.fill();
    ellipse(c, cx + cw * 0.25, cy + cw * 0.04, cw * 0.26, cw * 0.15); c.fill();
  }

  // volcano
  const vx = w * 0.18 - scroll * 0.04 % (w * 2);
  c.fillStyle = '#7f8ca3';
  c.beginPath();
  c.moveTo(vx - w * 0.22, groundY);
  c.lineTo(vx - w * 0.05, h * 0.30);
  c.lineTo(vx + w * 0.04, h * 0.30);
  c.lineTo(vx + w * 0.21, groundY);
  c.closePath(); c.fill();
  c.fillStyle = '#e4572e';
  c.beginPath();
  c.moveTo(vx - w * 0.05, h * 0.30);
  c.lineTo(vx - w * 0.02, h * 0.36);
  c.lineTo(vx + w * 0.015, h * 0.33);
  c.lineTo(vx + w * 0.04, h * 0.30);
  c.closePath(); c.fill();
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.12 + i / 3) % 1;
    c.fillStyle = `rgba(230,230,235,${0.5 * (1 - p)})`;
    ellipse(c, vx - w * 0.005 + Math.sin(p * 6) * w * 0.02, h * 0.30 - p * h * 0.18, w * (0.02 + p * 0.035), w * (0.018 + p * 0.03));
    c.fill();
  }

  // hills, two layers
  hills(c, w, h, groundY, scroll * 0.06, h * 0.13, '#8fd18f');
  hills(c, w, h, groundY, scroll * 0.12, h * 0.08, '#6ec06e');

  // background dinosaurs
  const bx = (w * 0.62 - scroll * 0.05) % (w * 1.6);
  drawBronto(c, { x: bx, y: groundY - h * 0.02, size: Math.min(w, h) * 0.30, t, color: '#8bb8e8' });
  drawStego(c, { x: (w * 0.30 - scroll * 0.08) % (w * 1.7), y: groundY + h * 0.01, size: Math.min(w, h) * 0.20, t, color: '#cf92dd' });
  drawPtero(c, { x: (t * 26 + scroll * 0.3) % (w + 240) - 120, y: h * (0.20 + Math.sin(t * 0.7) * 0.03), size: Math.min(w, h) * 0.13, t, color: '#f2994a' });

  // ground
  const g = c.createLinearGradient(0, groundY, 0, h);
  g.addColorStop(0, '#7ac74f');
  g.addColorStop(1, '#4e9a3a');
  c.fillStyle = g;
  c.fillRect(0, groundY, w, h - groundY);
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, groundY); c.lineTo(w, groundY); c.stroke();

  // grass tufts + plants along the ground
  c.fillStyle = '#4e9a3a';
  for (let i = 0; i < 26; i++) {
    const gx = ((i * 97.3 - scroll * 0.6) % (w + 60) + w + 60) % (w + 60) - 30;
    const gh = 6 + (i % 4) * 4;
    c.beginPath();
    c.moveTo(gx, groundY + 6);
    c.quadraticCurveTo(gx + 3, groundY + 6 - gh, gx + 8, groundY + 6);
    c.closePath(); c.fill();
  }
  const treeSize = Math.min(w, h) * 0.34;
  for (let i = 0; i < 4; i++) {
    const tx = ((i * 0.28 * w * 1.4 - scroll * 0.5) % (w + 300) + w + 300) % (w + 300) - 150;
    drawTree(c, tx, groundY + 4, treeSize * (i % 2 ? 0.6 : 1), t, i % 2);
  }
}

function hills(c, w, h, groundY, off, amp, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-10, groundY + 2);
  for (let x = -10; x <= w + 10; x += 12) {
    const y = groundY - amp * (0.6 + 0.4 * Math.sin((x + off) * 0.006) + 0.3 * Math.sin((x + off) * 0.013));
    c.lineTo(x, y);
  }
  c.lineTo(w + 10, groundY + 2);
  c.closePath();
  c.fill();
}

// #rrggbb -> lighter/darker sibling, so each creature needs only one colour.
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  return `#${((1 << 24) + (f((n >> 16) & 255) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1)}`;
}
