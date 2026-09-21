// Full-screen celebration layer: confetti, rising stars and a big word of
// praise. Draws on its own canvas above everything and stops itself when the
// last piece has fallen, so it costs nothing while idle.

let cv = null, cx = null, raf = 0, last = 0;
const bits = [];
const COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#4d96ff', '#c77dff', '#ff9f1c'];

function layer() {
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.className = 'fx-layer';
  document.body.appendChild(cv);
  cx = cv.getContext('2d');
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(innerWidth * dpr);
    cv.height = Math.round(innerHeight * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  addEventListener('resize', fit);
  return cv;
}

function run() {
  if (raf) return;
  last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += b.g * dt;
      b.rot += b.spin * dt;
      cx.save();
      cx.globalAlpha = Math.min(1, b.life * 1.6);
      cx.translate(b.x, b.y);
      cx.rotate(b.rot);
      if (b.kind === 'star') {
        star(cx, 0, 0, b.size, b.color);
      } else if (b.kind === 'text') {
        cx.globalAlpha = Math.min(1, b.life);
        cx.font = `bold ${b.size}px "Segoe UI Rounded", ui-rounded, system-ui, sans-serif`;
        cx.textAlign = 'center';
        cx.lineWidth = b.size * 0.14;
        cx.strokeStyle = '#fff';
        cx.strokeText(b.text, 0, 0);
        cx.fillStyle = b.color;
        cx.fillText(b.text, 0, 0);
      } else {
        cx.fillStyle = b.color;
        cx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      }
      cx.restore();
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      if (bits[i].life <= 0 || bits[i].y > innerHeight + 80) bits.splice(i, 1);
    }
    if (bits.length) raf = requestAnimationFrame(tick);
    else { cx.clearRect(0, 0, innerWidth, innerHeight); raf = 0; }
  };
  raf = requestAnimationFrame(tick);
}

function star(c, x, y, r, color) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.lineWidth = r * 0.16;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.stroke();
}

export function confetti(n = 90) {
  layer();
  for (let i = 0; i < n; i++) {
    bits.push({
      kind: Math.random() < 0.25 ? 'star' : 'bit',
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 140,
      vy: 120 + Math.random() * 260,
      g: 260,
      size: 8 + Math.random() * 14,
      rot: Math.random() * 6,
      spin: (Math.random() - 0.5) * 9,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 2.6 + Math.random() * 1.6,
    });
  }
  run();
}

export function burstStars(x, y, n = 3) {
  layer();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.45;
    bits.push({
      kind: 'star', x, y,
      vx: Math.cos(a) * 190, vy: Math.sin(a) * 190,
      g: 300, size: 20 + Math.random() * 10,
      rot: 0, spin: (Math.random() - 0.5) * 6,
      color: '#ffd166', life: 1.7,
    });
  }
  run();
}

export function praise(text, color = '#ff4d6d') {
  layer();
  bits.push({
    kind: 'text', text,
    x: innerWidth / 2, y: innerHeight * 0.42,
    vx: 0, vy: -70, g: 24,
    size: Math.min(innerWidth * 0.14, 86),
    rot: 0, spin: 0, color, life: 1.5,
  });
  run();
}
