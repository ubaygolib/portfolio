/**
 * SCRIPT.JS — Portfolio Interactions v2.6
 *
 * Modules:
 *  0. Cursor
 *  1. Interactive cosmic BG canvas (node web + mouse depth)
 *  2. Navbar scroll
 *  3. Scroll reveal
 *  4. Counters
 *  5. Typewriter hero command line
 *  6. Live terminal log (UBAY_GOLIB_AI_AGENT_v2.6)
 *  7. Horizontal project track (scroll-tied + drag + 3D tilt)
 *  8. Discipline bars animated fill
 *  9. Heartbeat canvas on marathon hover
 * 10. BPM flicker
 * 11. Nav glitch scramble
 * 12. Active nav highlight
 * 13. Form glow + send button
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     0. CURSOR
  ═════════════════════════════════════════════ */
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let cx = -100, cy = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
  });

  (function cursorRaf() {
    if (dot && ring) {
      dot.style.left  = cx + 'px';
      dot.style.top   = cy + 'px';
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
    }
    requestAnimationFrame(cursorRaf);
  })();

  document.querySelectorAll('a,button,.pcard,.ctl,.hbtn,.dc,.mf').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });


  /* ══════════════════════════════════════════════
     1. INTERACTIVE COSMIC BG CANVAS
  ═════════════════════════════════════════════ */
  (function initBg() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, nodes = [], edges = [], mouse = { x: W/2, y: H/2 };
    const NODE_COUNT = 80;
    const CONNECT_DIST = 160;
    const MOUSE_DIST = 220;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', () => { resize(); buildNodes(); });

    // Build nodes
    function buildNodes() {
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x  : Math.random() * W,
          y  : Math.random() * H,
          vx : (Math.random() - 0.5) * 0.25,
          vy : (Math.random() - 0.5) * 0.25,
          r  : 1 + Math.random() * 1.5,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }
    buildNodes();

    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function render() {
      ctx.clearRect(0, 0, W, H);

      // Subtle gradient overlay
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_DIST * 1.5);
      grad.addColorStop(0,   'rgba(0,245,255,0.025)');
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += 0.012;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = W + 10;
        if (n.x > W+10) n.x = -10;
        if (n.y < -10) n.y = H + 10;
        if (n.y > H+10) n.y = -10;

        // Mouse attraction (very subtle)
        const mdx  = mouse.x - n.x;
        const mdy  = mouse.y - n.y;
        const mdist = Math.sqrt(mdx*mdx + mdy*mdy);
        if (mdist < MOUSE_DIST) {
          const f = (MOUSE_DIST - mdist) / MOUSE_DIST * 0.0003;
          n.vx += mdx * f;
          n.vy += mdy * f;
        }
        // Velocity cap
        const spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
        if (spd > 0.6) { n.vx = n.vx / spd * 0.6; n.vy = n.vy / spd * 0.6; }
      }

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.18;
            // Closer to mouse = brighter edges
            const mx = (a.x + b.x) * 0.5 - mouse.x;
            const my = (a.y + b.y) * 0.5 - mouse.y;
            const md = Math.sqrt(mx*mx + my*my);
            const mBoost = md < MOUSE_DIST ? (1 - md / MOUSE_DIST) * 0.3 : 0;
            ctx.strokeStyle = `rgba(0,245,255,${(alpha + mBoost).toFixed(3)})`;
            ctx.lineWidth   = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const md = Math.sqrt(dx*dx + dy*dy);
        const mBoost = md < MOUSE_DIST ? (1 - md / MOUSE_DIST) * 0.6 : 0;
        const pulse  = (Math.sin(n.pulse) * 0.5 + 0.5);
        const alpha  = 0.15 + pulse * 0.25 + mBoost * 0.3;
        ctx.fillStyle = `rgba(0,245,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + mBoost * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // Glow for near-mouse nodes
        if (md < MOUSE_DIST * 0.5) {
          ctx.fillStyle = `rgba(0,245,255,${(mBoost * 0.2).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(render);
    }
    render();
  })();


  /* ══════════════════════════════════════════════
     2. NAVBAR SCROLL
  ═════════════════════════════════════════════ */
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });


  /* ══════════════════════════════════════════════
     3. SCROLL REVEAL
  ═════════════════════════════════════════════ */
  const revEls = document.querySelectorAll('.reveal-up');
  if (revEls.length) {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('vis'); revObs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    revEls.forEach(el => revObs.observe(el));
  }


  /* ══════════════════════════════════════════════
     4. COUNTERS
  ═════════════════════════════════════════════ */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function animCounter(el, target, dur) {
    const start = performance.now();
    (function step(now) {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(easeOut(t) * target);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target;
    })(performance.now());
  }

  const counterEls = document.querySelectorAll('[data-target]');
  if (counterEls.length) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animCounter(e.target, parseInt(e.target.dataset.target), 1800);
          cObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => cObs.observe(el));
  }


  /* ══════════════════════════════════════════════
     5. TYPEWRITER COMMAND LINE
  ═════════════════════════════════════════════ */
  (function initTypewriter() {
    const el = document.getElementById('cmdType');
    if (!el) return;
    const lines = [
      'python crm_sync.py --uysot --amocrm',
      'git commit -m "feat: yangi loyiha qoshildi 🚀"',
      'node agents/ubay_golib_agent.js --jonli',
      'ai_prompt_engine.py --vazifa=optimallashtirish',
      './marafon_42km.sh --sur-at=5:30',
    ];
    let li = 0, ci = 0, deleting = false;

    function type() {
      const line = lines[li];
      if (!deleting) {
        el.textContent = line.slice(0, ++ci);
        if (ci >= line.length) { deleting = true; setTimeout(type, 1800); return; }
        setTimeout(type, 55 + Math.random() * 30);
      } else {
        el.textContent = line.slice(0, --ci);
        if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; setTimeout(type, 400); return; }
        setTimeout(type, 28);
      }
    }
    setTimeout(type, 800);
  })();


  /* ══════════════════════════════════════════════
     6. LIVE TERMINAL LOG
  ═════════════════════════════════════════════ */
  (function initTerminal() {
    const body = document.getElementById('termBody');
    if (!body) return;

    // All log entries — typed one by one in sequence, then loop
    const LOG = [
      { cls:'tl-dim',   text:'──────────────────────────────────' },
      { cls:'tl-sys',   text:'[TIZ_INIT]: UBAY_GOLIB_AI_AGENT_v2.6 ishga tushmoqda...' },
      { cls:'tl-ok',    text:'[TIZ_INIT]: Yadro modullari yuklandi        [OK]' },
      { cls:'tl-ok',    text:'[TIZ_INIT]: Xotira ajratildi 512MB          [OK]' },
      { cls:'tl-sys',   text:'[CRM_INIT]: UYSOT tizimiga ulanilmoqda...' },
      { cls:'tl-ok',    text:'[CRM_INIT]: Ulanish o'rnatildi              [OK]' },
      { cls:'tl-sys',   text:'[CRM_INIT]: amoCRM integratsiyasi yuklanmoqda...' },
      { cls:'tl-ok',    text:'[CRM_INIT]: 14 migratsiya qo'llanildi       [OK]' },
      { cls:'tl-agent', text:'[AI_AGENT]: Gemini API mijozi ishga tushmoqda...' },
      { cls:'tl-ok',    text:'[AI_AGENT]: gemini-pro modeli yuklandi      [OK]' },
      { cls:'tl-agent', text:'[AI_AGENT]: Userbot asosiy siklda faol v3' },
      { cls:'tl-agent', text:'[AI_AGENT]: Kontekst oynasi: 1M token tayyor' },
      { cls:'tl-sys',   text:'[TELEGRAM]: Bot API shlyuziga ulanilmoqda...' },
      { cls:'tl-ok',    text:'[TELEGRAM]: Webhook ro'yxatdan o'tdi         [OK]' },
      { cls:'tl-info',  text:'[NAZORAT]: Tizim holati tekshirilmoqda...' },
      { cls:'tl-ok',    text:'[NAZORAT]: CPU yuklanishi: 12% normal       [OK]' },
      { cls:'tl-ok',    text:'[NAZORAT]: RAM yuklanishi: 38% barqaror     [OK]' },
      { cls:'tl-sys',   text:'[INTIZOM]: Marafon trening jarayoni: 92%' },
      { cls:'tl-ok',    text:'[INTIZOM]: Haftalik masofa: 68 km           [OK]' },
      { cls:'tl-agent', text:'[AI_AGENT]: Yugurish natijalari tahlil qilinmoqda...' },
      { cls:'tl-ok',    text:'[AI_AGENT]: Sur'at optimallashtirildi: 5:28/km [OK]' },
      { cls:'tl-sys',   text:'[DIZAYN]: Portfolio bundle qurilmoqda...' },
      { cls:'tl-ok',    text:'[DIZAYN]: Vizual shaderlar kompilyatsiya qilindi [OK]' },
      { cls:'tl-ok',    text:'[DIZAYN]: Canvas zarrachalari: 4200 nuqta   [OK]' },
      { cls:'tl-warn',  text:'[OGOHLANTIRISH]: 47-tugunida yuqori tezlik aniqlandi' },
      { cls:'tl-ok',    text:'[AGENT]: Traektoriya avtomatik to'g'irlandi  [OK]' },
      { cls:'tl-info',  text:'[LOG]: Ishlash vaqti: 99.98% — SLA saqlandi' },
      { cls:'tl-agent', text:'[AI_AGENT]: Keyingi sprint vazifalari yaratilmoqda...' },
      { cls:'tl-ok',    text:'[AI_AGENT]: 12 ta vazifa navbatda            [OK]' },
      { cls:'tl-sys',   text:'[CRON]: Zaxira nusxa rejalashtirildi 03:00 UTC' },
      { cls:'tl-ok',    text:'[CRON]: Ish ro'yxatdan o'tdi               [OK]' },
      { cls:'tl-info',  text:'[HOLAT]: Barcha tizimlar normal. Agent ishlayapti.' },
      { cls:'tl-dim',   text:'──────────────────────────────────' },
    ];

    let idx = 0;
    const SPEED = 18;   // ms per char
    const PAUSE = 280;  // ms between lines

    function typeLine(text, cls, done) {
      const span = document.createElement('div');
      span.className = cls;
      body.appendChild(span);
      body.scrollTop = body.scrollHeight;
      let i = 0;
      (function type() {
        span.textContent = text.slice(0, ++i);
        body.scrollTop = body.scrollHeight;
        if (i < text.length) setTimeout(type, SPEED);
        else done();
      })();
    }

    function nextLine() {
      const entry = LOG[idx % LOG.length];
      typeLine(entry.text, entry.cls, () => {
        idx++;
        setTimeout(nextLine, PAUSE);
      });
    }

    setTimeout(nextLine, 600);
  })();


  /* ══════════════════════════════════════════════
     7. HORIZONTAL PROJECT TRACK
  ═════════════════════════════════════════════ */
  (function initHTrack() {
    const outer   = document.getElementById('hOuter');
    const track   = document.getElementById('hTrack');
    const fill    = document.getElementById('hFill');
    const lbl     = document.getElementById('hLbl');
    const section = document.getElementById('projects');
    if (!outer || !track || !section) return;

    const CARDS = track.querySelectorAll('.pcard');
    const TOTAL = CARDS.length;
    let targetX  = 0;
    let currentX = 0;
    let isDrag   = false;
    let dragStartX = 0, dragStartTarget = 0;

    function maxScroll() {
      return -(track.scrollWidth - outer.clientWidth);
    }

    // Scroll-tied movement
    window.addEventListener('scroll', () => {
      const rect    = section.getBoundingClientRect();
      const sH      = section.offsetHeight;
      const vH      = window.innerHeight;
      const ratio   = 1 - (rect.top - (-sH)) / (vH - (-sH));
      const pct     = Math.max(0, Math.min(1, ratio));
      targetX = pct * maxScroll();
      if (fill) fill.style.width = (pct * 100).toFixed(1) + '%';
      if (lbl) {
        const ci = Math.min(Math.ceil(pct * TOTAL), TOTAL);
        lbl.textContent = String(ci).padStart(2,'0') + ' / ' + String(TOTAL).padStart(2,'0');
      }
    }, { passive: true });

    // Smooth lerp
    (function raf() {
      currentX += (targetX - currentX) * 0.075;
      if (Math.abs(targetX - currentX) < 0.05) currentX = targetX;
      track.style.transform = `translateX(${currentX}px)`;
      requestAnimationFrame(raf);
    })();

    // Drag
    outer.addEventListener('mousedown', (e) => {
      isDrag = true; dragStartX = e.clientX; dragStartTarget = targetX;
      outer.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDrag) return;
      const d = e.clientX - dragStartX;
      targetX = Math.max(maxScroll(), Math.min(0, dragStartTarget + d));
      const pct = targetX / maxScroll();
      if (fill) fill.style.width = ((1 - pct) * 100 * -1 + 100).toFixed(1) + '%';
    });
    window.addEventListener('mouseup', () => {
      isDrag = false; outer.style.cursor = 'grab';
    });

    // Touch
    outer.addEventListener('touchstart', (e) => {
      dragStartX = e.touches[0].clientX; dragStartTarget = targetX;
    }, { passive: true });
    outer.addEventListener('touchmove', (e) => {
      const d = e.touches[0].clientX - dragStartX;
      targetX = Math.max(maxScroll(), Math.min(0, dragStartTarget + d));
    }, { passive: true });

    // 3D TILT on cards
    CARDS.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r    = card.getBoundingClientRect();
        const x    = e.clientX - r.left - r.width / 2;
        const y    = e.clientY - r.top  - r.height / 2;
        const rx   = -(y / (r.height / 2)) * 8;
        const ry   =  (x / (r.width  / 2)) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  })();


  /* ══════════════════════════════════════════════
     8. DISCIPLINE BARS ANIMATED FILL
  ═════════════════════════════════════════════ */
  (function initBars() {
    const fills = document.querySelectorAll('.dc-fill');
    if (!fills.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const p  = getComputedStyle(el).getPropertyValue('--p').trim();
          // Trigger transition by briefly setting to 0 then target
          el.style.width = '0%';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { el.style.width = p; });
          });
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    fills.forEach(f => obs.observe(f));
  })();


  /* ══════════════════════════════════════════════
     9. HEARTBEAT CANVAS (Marathon hover)
  ═════════════════════════════════════════════ */
  (function initHeartbeat() {
    const hCanvas = document.getElementById('heartCanvas');
    const trigger = document.getElementById('dcMarathon');
    if (!hCanvas || !trigger) return;
    const hCtx = hCanvas.getContext('2d');
    let W, H, active = false, raf = null;
    let points = [], t = 0;

    function resize() {
      W = hCanvas.width  = hCanvas.offsetWidth  || window.innerWidth;
      H = hCanvas.height = hCanvas.offsetHeight || 400;
    }
    resize();
    window.addEventListener('resize', resize);

    // Generate ECG-like heartbeat path
    function ecgY(x) {
      const period  = W * 0.25;
      const phase   = ((x + t * 2) % period) / period;
      let y = 0;
      if      (phase < 0.2)  y = 0;
      else if (phase < 0.25) y = -(phase - 0.2) / 0.05 * H * 0.3;
      else if (phase < 0.30) y =  (phase - 0.25)/ 0.05 * H * 0.6;
      else if (phase < 0.32) y = -(phase - 0.30)/ 0.02 * H * 0.55;
      else if (phase < 0.38) y =  (phase - 0.32)/ 0.06 * H * 0.15;
      else if (phase < 0.42) y = -(phase - 0.38)/ 0.04 * H * 0.15;
      else if (phase < 0.5)  y = 0;
      return y;
    }

    function drawBeat() {
      hCtx.clearRect(0, 0, W, H);
      t += 0.4;

      // Draw multiple echo lines (fading)
      for (let e = 3; e >= 0; e--) {
        hCtx.beginPath();
        hCtx.strokeStyle = `rgba(0,245,255,${0.07 - e * 0.015})`;
        hCtx.lineWidth   = 1.5 - e * 0.3;
        for (let x = 0; x < W; x++) {
          const baseY = H * 0.5;
          const dy    = ecgY(x - e * 12);
          if (x === 0) hCtx.moveTo(x, baseY + dy);
          else         hCtx.lineTo(x, baseY + dy);
        }
        hCtx.stroke();
      }
      // Main bright line
      hCtx.beginPath();
      hCtx.strokeStyle = 'rgba(0,245,255,0.6)';
      hCtx.lineWidth   = 1.5;
      hCtx.shadowColor = 'rgba(0,245,255,0.8)';
      hCtx.shadowBlur  = 10;
      for (let x = 0; x < W; x++) {
        const baseY = H * 0.5;
        const dy    = ecgY(x);
        if (x === 0) hCtx.moveTo(x, baseY + dy);
        else         hCtx.lineTo(x, baseY + dy);
      }
      hCtx.stroke();
      hCtx.shadowBlur = 0;

      raf = requestAnimationFrame(drawBeat);
    }

    function startBeat() {
      if (!active) {
        active = true;
        hCanvas.classList.add('active');
        drawBeat();
      }
    }
    function stopBeat() {
      active = false;
      hCanvas.classList.remove('active');
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      hCtx.clearRect(0, 0, W, H);
    }

    trigger.addEventListener('mouseenter', startBeat);
    trigger.addEventListener('mouseleave', stopBeat);

    // Also trigger from marathon value
    const mv = document.getElementById('marathonVal');
    if (mv) {
      mv.parentElement.addEventListener('mouseenter', startBeat);
      mv.parentElement.addEventListener('mouseleave', stopBeat);
    }
  })();


  /* ══════════════════════════════════════════════
     10. BPM FLICKER
  ═════════════════════════════════════════════ */
  (function initBpm() {
    const bpm = document.getElementById('bpmDisplay');
    if (!bpm) return;
    const values = [152, 158, 163, 168, 171, 164, 158, 155, 162, 169, 173];
    let i = 0;
    setInterval(() => {
      bpm.textContent = values[i % values.length];
      i++;
    }, 900 + Math.random() * 400);
  })();


  /* ══════════════════════════════════════════════
     11. NAV GLITCH SCRAMBLE
  ═════════════════════════════════════════════ */
  (function initNavGlitch() {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01_#@!';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const orig = link.textContent.trim();
      let iv = null, frame = 0;
      link.addEventListener('mouseenter', () => {
        frame = 0; clearInterval(iv);
        iv = setInterval(() => {
          link.textContent = orig.split('').map((c, i) => {
            if (c === ' ') return ' ';
            return i < frame ? orig[i] : CHARS[Math.random() * CHARS.length | 0];
          }).join('');
          frame += 0.45;
          if (frame > orig.length) { link.textContent = orig; clearInterval(iv); }
        }, 35);
      });
      link.addEventListener('mouseleave', () => { clearInterval(iv); link.textContent = orig; });
    });
  })();


  /* ══════════════════════════════════════════════
     12. ACTIVE NAV SECTION HIGHLIGHT
  ═════════════════════════════════════════════ */
  (function initActiveNav() {
    const secs = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-links a');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          links.forEach(a => {
            const active = a.getAttribute('href') === '#' + id;
            a.classList.toggle('active', active);
          });
        }
      });
    }, { threshold: 0.45 });
    secs.forEach(s => obs.observe(s));
  })();


  /* ══════════════════════════════════════════════
     13. FORM / GLOW BUTTON
  ═════════════════════════════════════════════ */
  (function initForm() {
    // Input focus glow
    document.querySelectorAll('.fi').forEach(inp => {
      const lbl = inp.previousElementSibling;
      if (!lbl) return;
      inp.addEventListener('focus', () => {
        lbl.style.color       = 'var(--cx)';
        lbl.style.textShadow  = '0 0 10px rgba(0,245,255,0.5)';
      });
      inp.addEventListener('blur', () => {
        lbl.style.color      = '';
        lbl.style.textShadow = '';
      });
    });

    // Send button
    const btn  = document.getElementById('sendBtn');
    const btxt = btn?.querySelector('.gb-txt');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (btxt) {
        const orig = btxt.textContent;
        btxt.textContent = 'XABAR_YUBORILDI ✓';
        btn.style.background = '#39ff14';
        btn.style.color = '#030609';
        setTimeout(() => {
          btxt.textContent = orig;
          btn.style.background = '';
          btn.style.color = '';
        }, 2800);
      }
    });
  })();

})();
