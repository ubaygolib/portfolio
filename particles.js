/**
 * PARTICLES.JS — Ultra Matrix Portrait Engine v2.6
 *
 * Features:
 *  - Parses avatar.png pixels into binary + cyber-glyph characters
 *  - Magnetic repulsion scatter with fluid acceleration physics
 *  - Smooth elastic snap-back to exact pixel origins
 *  - Procedural fallback portrait if no image found
 *  - DPR-aware, resize-safe, 60fps optimized
 */

(function () {
  'use strict';

  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const DPR   = Math.min(window.devicePixelRatio || 1, 2);
  const W_CSS = () => canvas.offsetWidth  || 360;
  const H_CSS = () => canvas.offsetHeight || 420;

  function setSize() {
    canvas.width  = W_CSS() * DPR;
    canvas.height = H_CSS() * DPR;
    ctx.scale(DPR, DPR);
  }
  setSize();

  /* ── CONFIG ─────────────────────────────────── */
  const CFG = {
    cell      : 7,      // grid spacing
    font      : 6,      // font px
    scatter_r : 95,     // mouse repulsion radius
    scatter_f : 160,    // max scatter force distance
    return_k  : 0.055,  // spring return constant
    damping   : 0.80,   // velocity damping
    // Richer character pool for cyber-glyph feel
    chars     : '01010110110100101010ｱｳｴｵｶｷｸｹ#@!$%&<>[]',
    bg      : 'rgba(2,4,8,0.95)',
  };

  /* ── STATE ──────────────────────────────────── */
  let particles  = [];
  let mouse      = { x: -9999, y: -9999 };
  let hover      = false;
  let raf        = null;
  let W = W_CSS(), H = H_CSS();

  /* ── PARTICLE CLASS ─────────────────────────── */
  class Particle {
    constructor(ox, oy, brightness, r, g, b) {
      this.ox = ox; this.oy = oy;  // home position
      // start scattered from random edge
      const edge = Math.random() * 4 | 0;
      if      (edge === 0) { this.x = Math.random() * W; this.y = -20; }
      else if (edge === 1) { this.x = W + 20; this.y = Math.random() * H; }
      else if (edge === 2) { this.x = Math.random() * W; this.y = H + 20; }
      else                 { this.x = -20; this.y = Math.random() * H; }
      this.vx = 0;
      this.vy = 0;
      this.char     = pickChar();
      this.charT    = (Math.random() * 80) | 0;
      this.charRate = (25 + Math.random() * 80) | 0;
      // Vivid matrix colour: bright=white/cyan, mid=cyan, dark=green
      if (brightness > 0.75) {
        this.colorR = 180 + Math.round(brightness * 75);
        this.colorG = 240 + Math.round(brightness * 15);
        this.colorB = 255;
      } else if (brightness > 0.4) {
        this.colorR = 0;
        this.colorG = 220 + Math.round(brightness * 35);
        this.colorB = 255;
      } else {
        this.colorR = 0;
        this.colorG = 160 + Math.round(brightness * 200);
        this.colorB = 80 + Math.round(brightness * 100);
      }
      this.alpha = 0.6 + brightness * 0.4;
    }

    update() {
      // Cycle character
      if (++this.charT > this.charRate) { this.char = pickChar(); this.charT = 0; }

      const dx   = this.x - mouse.x;
      const dy   = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (hover && dist < CFG.scatter_r) {
        // Repulsion: stronger the closer
        const norm  = dist < 1 ? 1 : dist;
        const force = Math.pow((CFG.scatter_r - dist) / CFG.scatter_r, 2) * CFG.scatter_f;
        this.vx += (dx / norm) * force * 0.065;
        this.vy += (dy / norm) * force * 0.065;
      }

      // Spring back to origin
      this.vx += (this.ox - this.x) * CFG.return_k;
      this.vy += (this.oy - this.y) * CFG.return_k;

      // Damping
      this.vx *= CFG.damping;
      this.vy *= CFG.damping;

      this.x += this.vx;
      this.y += this.vy;
    }

    draw() {
      const distHome = Math.hypot(this.x - this.ox, this.y - this.oy);
      const glow     = Math.min(distHome / 40, 1);

      // Scattered = bright magenta/white, at-home = vivid cyan/green
      const r = Math.round(this.colorR + glow * (255 - this.colorR) * 0.8);
      const g = Math.round(this.colorG * (1 - glow * 0.5) + glow * 60);
      const b = Math.round(this.colorB * (1 - glow * 0.2) + glow * 255);

      // Full brightness — no dim
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(this.char, this.x, this.y);
    }
  }

  function pickChar() {
    return CFG.chars[Math.random() * CFG.chars.length | 0];
  }

  /* ── BUILD FROM IMAGE ───────────────────────── */
  function buildFromImage(img) {
    W = W_CSS(); H = H_CSS();
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const oc = off.getContext('2d', { willReadFrequently: true });

    const ratio = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    const iw = img.naturalWidth  * ratio;
    const ih = img.naturalHeight * ratio;
    oc.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);

    const data = oc.getImageData(0, 0, W, H).data;
    particles  = [];

    ctx.font = `${CFG.font}px 'Share Tech Mono', monospace`;

    for (let y = CFG.cell; y < H - CFG.cell; y += CFG.cell) {
      for (let x = CFG.cell * 0.5; x < W - CFG.cell * 0.5; x += CFG.cell) {
        const i  = ((y * W + (x | 0)) * 4);
        const r  = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 25) continue;
        const br = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (br < 0.05) continue;
        particles.push(new Particle(x, y, br, r, g, b));
      }
    }
  }

  /* ── PROCEDURAL FALLBACK PORTRAIT ───────────── */
  function buildFallback() {
    W = W_CSS(); H = H_CSS();
    particles = [];
    ctx.font = `${CFG.font}px 'Share Tech Mono', monospace`;
    const cx = W / 2, cy = H / 2;

    for (let y = CFG.cell; y < H - CFG.cell; y += CFG.cell) {
      for (let x = CFG.cell * 0.5; x < W - CFG.cell * 0.5; x += CFG.cell) {
        const nx = (x - cx) / (W * 0.44);
        const ny = (y - cy) / (H * 0.46);
        const hd = nx*nx + (ny + 0.08)*(ny + 0.08);
        let br = 0;

        if (hd < 0.88) {
          br = 0.85 - hd * 0.4;
          // eyes
          const ey = ny + 0.06;
          if ((nx+0.24)*(nx+0.24) + ey*ey < 0.055) br = 0.12;
          if ((nx-0.24)*(nx-0.24) + ey*ey < 0.055) br = 0.12;
          // mouth
          if (Math.abs(nx) < 0.22 && ny > 0.28 && ny < 0.38) br = 0.15;
        } else if (ny > 0.38 && Math.abs(nx) < 0.65 + (ny - 0.38) * 0.8) {
          br = 0.55 - (ny - 0.38) * 0.65;
        }

        if (br < 0.07) continue;
        // Synthetic pixel colour: cyan tint for face, darker for body
        const v = Math.round(br * 220);
        particles.push(new Particle(x, y, br, v * 0.6, v, v));
      }
    }
  }

  /* ── RENDER LOOP ────────────────────────────── */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CFG.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${CFG.font}px 'Share Tech Mono', monospace`;
    ctx.textBaseline = 'middle';

    for (let i = 0, l = particles.length; i < l; i++) {
      particles[i].update();
      particles[i].draw();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(render);
  }

  /* ── INIT ───────────────────────────────────── */
  function init() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    setSize();

    const img = new Image();
    // NO crossOrigin for local file:// or Python http.server — avoids CORS taint
    img.onload = () => {
      try {
        buildFromImage(img);
      } catch (e) {
        // Canvas tainted (e.g. file://) — use fallback
        console.warn('[Matrix] Image tainted, using fallback:', e.message);
        buildFallback();
      }
      if (!raf) render();
    };
    img.onerror = () => {
      console.warn('[Matrix] avatar.png not found, using fallback portrait.');
      buildFallback();
      if (!raf) render();
    };
    // Simple path — no cache-bust (avoids some server 404 quirks)
    img.src = 'avatar.png';
  }

  /* ── MOUSE ──────────────────────────────────── */
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e); mouse.x = p.x; mouse.y = p.y; hover = true;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; hover = false; });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const p = canvasPos(e.touches[0]); mouse.x = p.x; mouse.y = p.y; hover = true;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { hover = false; mouse.x = -9999; mouse.y = -9999; });

  /* ── RESIZE ─────────────────────────────────── */
  let rTimer;
  window.addEventListener('resize', () => {
    clearTimeout(rTimer);
    rTimer = setTimeout(init, 280);
  });

  init();
})();
