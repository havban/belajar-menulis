// The little T-Rex that watches the child work. It owns its own canvas and
// only animates while its screen is on, so idle screens cost nothing.

import { drawRex } from './dino.js?v=__BUILD__';

export class Mascot {
  constructor(canvas, base = 'idle') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.base = base;
    this.pose = base;
    this.until = 0;
    this.t = 0;
    this.raf = 0;
    this._loop = this._loop.bind(this);
  }

  start() { if (!this.raf) { this._last = performance.now(); this.raf = requestAnimationFrame(this._loop); } }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }

  // Show a reaction for a moment, then settle back to the resting pose.
  react(pose, seconds = 1.6) { this.pose = pose; this.until = this.t + seconds; }
  setBase(pose) { this.base = pose; if (this.t > this.until) this.pose = pose; }

  _loop(now) {
    this.raf = requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this.t += dt;
    if (this.t > this.until) this.pose = this.base;

    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.canvas.width !== Math.round(r.width * dpr)) {
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
    }
    const c = this.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    // the rex box is about 150 wide for 100 tall once the tail is counted
    const size = Math.min(r.height * 0.94, r.width * 0.72);
    drawRex(c, { x: r.width * 0.56, y: r.height - 2, size, t: this.t, pose: this.pose });
  }
}
