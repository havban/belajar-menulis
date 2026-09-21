// The writing pad: draws the guide, captures the finger, and scores the result.
//
// Everything inside works in glyph units (the 100x100 box from glyphs.js) and
// only converts to pixels when painting, so the same pad works at any size and
// the scoring tolerances mean the same thing on a phone and on a tablet.

import { glyph, GUIDE, resample } from './glyphs.js?v=__BUILD__';

export const INK = ['#ff4d6d', '#2d9cdb', '#27ae60', '#f2994a', '#9b51e0', '#eb5757'];

// Distance from (x,y) to a polyline, in glyph units.
function distToPath(pts, x, y) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t, py = ay + dy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best) best = d;
  }
  if (pts.length === 1) best = Math.hypot(x - pts[0][0], y - pts[0][1]);
  return best;
}

function nearestIndex(pts, x, y) {
  let best = Infinity, bi = 0;
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(x - pts[i][0], y - pts[i][1]);
    if (d < best) { best = d; bi = i; }
  }
  return bi;
}

// Walks a polyline and returns `n` points spread evenly along it, optionally
// only the slice between two fractions of its length. Even spacing is what
// makes the comparison below fair: it compares shape, not drawing speed.
function uniform(pts, n, from = 0, to = 1) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  if (!L) return new Array(n).fill(pts[0]);
  const a = L * from, b = L * to;
  const out = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const d = a + ((b - a) * i) / (n - 1);
    while (j < cum.length - 1 && cum[j] < d) j++;
    const seg = cum[j] - cum[j - 1] || 1;
    const t = (d - cum[j - 1]) / seg;
    out.push([
      pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t,
      pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t,
    ]);
  }
  return out;
}

const SAMPLES = 34;

// Judges one stroke by walking the model stroke and the child's stroke side by
// side at the same fraction of the way along each, and measuring how far apart
// the two pens are. That one number catches everything that matters: a wrong
// shape, a stroke drawn backwards, one that stops half way, or one that wanders
// off and comes back. Plain "did you pass near every part of the line" scoring
// is far too generous - it happily accepts a C when the letter asked for the
// slanted stroke of an A.
//
// It is still deliberately forgiving about wobble, because a five-year-old's
// hand shakes and nothing kills the fun faster than a good letter being
// rejected. The drawing may also overshoot at either end, which is why the
// comparison is retried against a trimmed version of it.
export function scoreStroke(target, user, tol = 12) {
  if (target.dot) {
    const p = user[user.length - 1];
    const d = Math.hypot(p[0] - target.pts[0][0], p[1] - target.pts[0][1]);
    const ok = d < tol + 6;
    return { pass: ok, score: ok ? 1 : 0, mean: d, reason: ok ? 'ok' : 'jauh' };
  }
  if (user.length < 2) return { pass: false, score: 0, reason: 'pendek' };

  const u = resample(user, 1.2);
  const t = target.pts;
  // Length is measured on the smoothed 34-point version of each line. Raw
  // touch samples jitter, and that jitter would otherwise inflate the length
  // enough to fail a perfectly good letter for being "too long".
  const plen = (pts) => {
    let n = 0;
    for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return n;
  };
  const ratio = plen(uniform(u, SAMPLES)) / plen(uniform(t, SAMPLES));
  if (ratio < 0.55) return { pass: false, score: 0.1, reason: 'pendek' };

  const d0 = Math.hypot(u[0][0] - t[0][0], u[0][1] - t[0][1]);
  const dEnd = Math.hypot(u[0][0] - t[t.length - 1][0], u[0][1] - t[t.length - 1][1]);
  const reversed = dEnd + 6 < d0 && dEnd < tol * 2;

  const T = uniform(t, SAMPLES);
  let mean = Infinity, p90 = Infinity;
  for (const [a, b] of [[0, 1], [0, 0.86], [0.14, 1]]) {
    const U = uniform(u, SAMPLES, a, b);
    const ds = T.map((q, i) => Math.hypot(q[0] - U[i][0], q[1] - U[i][1]));
    const m = ds.reduce((x, y) => x + y, 0) / ds.length;
    if (m < mean) {
      mean = m;
      p90 = ds.slice().sort((x, y) => x - y)[Math.floor(ds.length * 0.9)];
    }
  }

  // coverage only decides how many stars, never pass or fail
  let covered = 0;
  for (const q of t) if (distToPath(u, q[0], q[1]) <= tol) covered++;
  const coverage = covered / t.length;

  const lenOK = ratio > 0.62 && ratio < 2.1;
  const pass = !reversed && lenOK && mean <= tol * 0.62 && p90 <= tol * 1.15;
  const score = Math.max(0, Math.min(1, 1 - mean / (tol * 0.9))) * 0.75 + coverage * 0.25;

  let reason = 'ok';
  if (!pass) {
    if (reversed) reason = 'terbalik';
    else if (!lenOK) reason = ratio <= 0.62 ? 'pendek' : 'kepanjangan';
    else if (d0 > tol * 1.9) reason = 'mulai';
    else if (p90 > tol * 1.15) reason = 'meleset';
    else reason = 'kurang';
  }
  return { pass, score, mean, p90, coverage, ratio, reason, reversed };
}

const REASON_TEXT = {
  pendek: 'Garisnya masih pendek, tarik sampai ujung ya!',
  terbalik: 'Arahnya terbalik. Mulai dari titik hijau!',
  mulai: 'Mulai dari titik hijau ya!',
  kurang: 'Ikuti garis putus-putusnya sampai habis!',
  meleset: 'Hampir! Coba lebih dekat ke garisnya.',
  kepanjangan: 'Garisnya kepanjangan, berhenti di ujung ya!',
  jauh: 'Ketuk tepat di titiknya ya!',
};
export const reasonText = (r) => REASON_TEXT[r] || 'Ayo coba sekali lagi!';

export class TracePad {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ guide: 'full', tol: 12, lines: true, onStroke: null, onComplete: null, onDraw: null }, opts);
    this.ch = null;
    this.strokes = [];
    this.done = [];          // the child's accepted ink, one entry per stroke
    this.index = 0;
    this.live = null;
    this.sparks = [];
    this.demoT = -1;
    this.demoStroke = 0;
    this.shake = 0;
    this.enabled = true;
    this.scores = [];
    this._raf = 0;
    this._t0 = performance.now();

    this._onDown = this._down.bind(this);
    this._onMove = this._move.bind(this);
    this._onUp = this._up.bind(this);
    canvas.addEventListener('pointerdown', this._onDown);
    canvas.addEventListener('pointermove', this._onMove);
    canvas.addEventListener('pointerup', this._onUp);
    canvas.addEventListener('pointercancel', this._onUp);
    this._ro = new ResizeObserver(() => this._layout());
    this._ro.observe(canvas);
    this._layout();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._ro.disconnect();
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointermove', this._onMove);
    this.canvas.removeEventListener('pointerup', this._onUp);
    this.canvas.removeEventListener('pointercancel', this._onUp);
  }

  setGlyph(ch, opts = {}) {
    Object.assign(this.opts, opts);
    this.ch = ch;
    this.strokes = glyph(ch).strokes;
    this.done = [];
    this.scores = [];
    this.index = 0;
    this.live = null;
    this.sparks = [];
    this.demoT = -1;
    this.shake = 0;
  }

  reset() { if (this.ch) this.setGlyph(this.ch); }

  get finished() { return this.index >= this.strokes.length; }

  // Average of the stroke scores, turned into 1..3 stars.
  get stars() {
    if (!this.scores.length) return 0;
    const avg = this.scores.reduce((a, b) => a + b, 0) / this.scores.length;
    return avg >= 0.88 ? 3 : avg >= 0.74 ? 2 : 1;
  }

  // Never interrupt a child who is already drawing - the demo can wait.
  playDemo(from = null) {
    if (this.live) return Promise.resolve();
    this.demoStroke = from === null ? this.index : from;
    if (this.demoStroke >= this.strokes.length) this.demoStroke = 0;
    this.demoT = 0;
    this.live = null;
    return new Promise((res) => { this._demoDone = res; });
  }

  stopDemo() { this.demoT = -1; if (this._demoDone) { this._demoDone(); this._demoDone = null; } }

  _layout() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.w = r.width; this.h = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const side = Math.min(r.width, r.height) * 0.9;
    this.s = side / 100;
    this.ox = (r.width - side) / 2;
    this.oy = (r.height - side) / 2;
  }

  X(v) { return this.ox + v * this.s; }
  Y(v) { return this.oy + v * this.s; }

  _pt(e) {
    const r = this.canvas.getBoundingClientRect();
    return [(e.clientX - r.left - this.ox) / this.s, (e.clientY - r.top - this.oy) / this.s];
  }

  _down(e) {
    if (!this.enabled || this.finished) return;
    // A child who starts writing during the demo means "I've got it" - stop
    // showing and let them draw, instead of swallowing the touch.
    if (this.demoT >= 0) this.stopDemo();
    if (this.live) return;                       // one finger at a time: palms happen
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this._pid = e.pointerId;
    this.live = [this._pt(e)];
  }

  _move(e) {
    if (!this.live || e.pointerId !== this._pid) return;
    e.preventDefault();
    const p = this._pt(e);
    const last = this.live[this.live.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.6) return;
    this.live.push(p);
    if (this.sparks.length < 90 && Math.random() < 0.6) {
      this.sparks.push({ x: p[0], y: p[1], vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12 - 6, life: 1, hue: (performance.now() / 8) % 360 });
    }
    if (this.opts.onDraw) this.opts.onDraw(p);
  }

  _up(e) {
    if (!this.live || e.pointerId !== this._pid) return;
    e.preventDefault();
    const user = this.live;
    this.live = null;
    const target = this.strokes[this.index];
    const res = scoreStroke(target, user, this.opts.tol);
    if (res.pass) {
      this.done.push({ pts: user, i: this.index });
      this.scores.push(res.score);
      this.index++;
      this._burst(user[user.length - 1]);
    } else {
      this.shake = 1;
    }
    if (this.opts.onStroke) this.opts.onStroke(res, this.index - (res.pass ? 1 : 0), this);
    if (res.pass && this.finished && this.opts.onComplete) {
      this.opts.onComplete({ stars: this.stars, scores: this.scores, ch: this.ch });
    }
  }

  _burst(p) {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, sp = 10 + Math.random() * 30;
      this.sparks.push({ x: p[0], y: p[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, hue: Math.random() * 360 });
    }
  }

  _loop(now) {
    this._raf = requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this._t0) / 1000);
    this._t0 = now;
    if (!this.w) { this._layout(); return; }
    this.shake = Math.max(0, this.shake - dt * 3);
    for (const s of this.sparks) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; s.life -= dt * 1.6;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
    if (this.demoT >= 0) {
      this.demoT += dt;
      const st = this.strokes[this.demoStroke];
      const dur = st.dot ? 0.5 : Math.max(0.7, st.len / 62);
      if (this.demoT > dur + 0.45) {
        this.demoT = 0;
        this.demoStroke++;
        if (this.demoStroke >= this.strokes.length) this.stopDemo();
      }
    }
    this._paint(now / 1000);
  }

  _paint(time) {
    const c = this.ctx, { w, h } = this;
    c.save();
    if (this.shake > 0) c.translate(Math.sin(time * 60) * this.shake * 6, 0);
    c.clearRect(-20, -20, w + 40, h + 40);

    if (this.opts.lines) this._paintPaper();

    const gu = this.opts.guide;
    if (gu !== 'none') {
      // Strokes not reached yet sit quietly in the background.
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < this.strokes.length; i++) {
        if (i < this.index) continue;
        const st = this.strokes[i];
        const cur = i === this.index;
        if (gu === 'faint' && !cur) continue;
        c.strokeStyle = cur ? 'rgba(90,90,120,0.30)' : 'rgba(120,120,150,0.14)';
        if (gu === 'faint') c.strokeStyle = 'rgba(120,120,150,0.18)';
        c.lineWidth = this.s * 11;
        this._path(st);
        if (st.dot) { c.fillStyle = c.strokeStyle; c.fill(); } else c.stroke();
      }
    }

    // The child's own ink, one colour per stroke.
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const d of this.done) {
      c.strokeStyle = INK[d.i % INK.length];
      c.lineWidth = this.s * 9;
      if (d.pts.length === 1) {
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.arc(this.X(d.pts[0][0]), this.Y(d.pts[0][1]), this.s * 4.5, 0, 7);
        c.fill();
      } else {
        this._ink(d.pts);
        c.stroke();
      }
    }

    if (!this.finished && gu !== 'none') this._paintCurrent(time);
    if (this.live) {
      c.strokeStyle = INK[this.index % INK.length];
      c.lineWidth = this.s * 9;
      c.shadowColor = c.strokeStyle; c.shadowBlur = this.s * 3;
      this._ink(this.live);
      c.stroke();
      c.shadowBlur = 0;
    }
    if (this.demoT >= 0) this._paintDemo();
    for (const s of this.sparks) {
      c.globalAlpha = Math.max(0, s.life);
      c.fillStyle = `hsl(${s.hue},95%,62%)`;
      c.beginPath();
      c.arc(this.X(s.x), this.Y(s.y), this.s * 1.8 * s.life + 0.5, 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  // Ink is drawn as a curve through the midpoints of the captured samples, so
  // a shaky finger still leaves a smooth line.
  _ink(pts) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(this.X(pts[0][0]), this.Y(pts[0][1]));
    if (pts.length === 2) {
      c.lineTo(this.X(pts[1][0]), this.Y(pts[1][1]));
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      c.quadraticCurveTo(this.X(pts[i][0]), this.Y(pts[i][1]), this.X(mx), this.Y(my));
    }
    const n = pts.length - 1;
    c.lineTo(this.X(pts[n][0]), this.Y(pts[n][1]));
  }

  _paintPaper() {
    const c = this.ctx;
    c.save();
    c.strokeStyle = 'rgba(70,90,130,0.22)';
    c.lineWidth = 1.5;
    for (const [y, dash] of [[GUIDE.cap, [7, 7]], [GUIDE.xTop, [4, 8]], [GUIDE.base, []], [GUIDE.desc, [4, 8]]]) {
      c.setLineDash(dash);
      c.strokeStyle = dash.length ? 'rgba(70,90,130,0.20)' : 'rgba(70,90,130,0.45)';
      c.beginPath();
      c.moveTo(this.X(-2), this.Y(y));
      c.lineTo(this.X(102), this.Y(y));
      c.stroke();
    }
    c.restore();
  }

  _path(st) {
    const c = this.ctx;
    c.beginPath();
    if (st.dot) { c.arc(this.X(st.pts[0][0]), this.Y(st.pts[0][1]), this.s * 5, 0, 7); return; }
    st.pts.forEach((p, j) => (j ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]))));
  }

  // The stroke to draw right now: a marching dashed line, a green start dot with
  // the stroke number in it, and an arrow at the far end.
  _paintCurrent(time) {
    const c = this.ctx, st = this.strokes[this.index];
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.setLineDash([this.s * 4, this.s * 4]);
    c.lineDashOffset = -time * this.s * 14;
    c.strokeStyle = INK[this.index % INK.length];
    c.globalAlpha = 0.75;
    c.lineWidth = this.s * 3;
    this._path(st);
    if (st.dot) { c.fillStyle = c.strokeStyle; c.fill(); } else c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;

    const pulse = 1 + Math.sin(time * 6) * 0.13;
    const [sx, sy] = st.pts[0];
    c.fillStyle = '#2ecc71';
    c.strokeStyle = '#fff';
    c.lineWidth = this.s * 0.9;
    c.beginPath();
    c.arc(this.X(sx), this.Y(sy), this.s * 5 * pulse, 0, 7);
    c.fill(); c.stroke();
    c.fillStyle = '#fff';
    c.font = `bold ${this.s * 6}px system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(this.index + 1), this.X(sx), this.Y(sy) + this.s * 0.4);

    if (!st.dot && st.pts.length > 4) {
      const n = st.pts.length;
      // On a closed stroke (o, a, 8 ...) the end sits on top of the start, so
      // the arrow would hide the numbered green dot. Put it three quarters of
      // the way round instead - it still shows which way to go.
      const [fx, fy] = st.pts[0], [lx, ly] = st.pts[n - 1];
      const at = Math.hypot(lx - fx, ly - fy) < 9 ? Math.round(n * 0.72) : n - 1;
      const [ex, ey] = st.pts[at], [px, py] = st.pts[Math.max(0, at - 4)];
      const a = Math.atan2(ey - py, ex - px);
      c.save();
      c.translate(this.X(ex), this.Y(ey));
      c.rotate(a);
      c.fillStyle = INK[this.index % INK.length];
      c.beginPath();
      c.moveTo(this.s * 4.5, 0);
      c.lineTo(-this.s * 2.5, -this.s * 3);
      c.lineTo(-this.s * 2.5, this.s * 3);
      c.closePath();
      c.fill();
      c.restore();
    }
    c.restore();
  }

  // A glowing dot walks the stroke so the child can watch the movement first.
  _paintDemo() {
    const c = this.ctx, st = this.strokes[this.demoStroke];
    const dur = st.dot ? 0.5 : Math.max(0.7, st.len / 62);
    const t = Math.min(1, this.demoT / dur);
    const n = st.pts.length;
    const upto = Math.max(1, Math.round(t * (n - 1)));
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = INK[this.demoStroke % INK.length];
    c.lineWidth = this.s * 8;
    c.globalAlpha = 0.9;
    c.beginPath();
    for (let i = 0; i <= upto; i++) {
      const p = st.pts[i];
      i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1]));
    }
    if (st.dot) { c.arc(this.X(st.pts[0][0]), this.Y(st.pts[0][1]), this.s * 4.5, 0, 7); c.fillStyle = c.strokeStyle; c.fill(); }
    c.stroke();
    const p = st.pts[upto];
    c.globalAlpha = 1;
    c.fillStyle = '#fff';
    c.shadowColor = INK[this.demoStroke % INK.length];
    c.shadowBlur = this.s * 6;
    c.beginPath();
    c.arc(this.X(p[0]), this.Y(p[1]), this.s * 3.4, 0, 7);
    c.fill();
    c.restore();
  }
}
