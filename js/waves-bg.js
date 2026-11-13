/*!
 * Wodniack-style wave field background
 * ------------------------------------------------------------
 * 灵感来源：wodniack.dev 的 AWaves（SVG 线场 + Perlin noise + 鼠标拨弦）
 * 本项目改为 Canvas 2D 实现（更轻、更流畅）：
 * - 满屏细密竖线，Perlin noise 让线条缓慢起伏
 * - 鼠标在附近"拨动"线条，形成弹性回弹（string tension）
 * - 纯背景层：z-index:-2 / pointer-events:none，不阻挡交互
 * - 尊重 prefers-reduced-motion，页面隐藏时暂停
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'waves-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  // ---------- Perlin noise（2D） ----------
  var perm = new Uint8Array(512);
  (function buildPerm() {
    var p = new Uint8Array(256);
    for (var i = 0; i < 256; i++) p[i] = i;
    var seed = 1987;
    for (var j = 255; j > 0; j--) {
      seed = (seed * 16807) % 2147483647;
      var k = seed % (j + 1);
      var tmp = p[j]; p[j] = p[k]; p[k] = tmp;
    }
    for (var m = 0; m < 512; m++) perm[m] = p[m & 255];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad2(h, x, y) {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }
  function perlin2(x, y) {
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    var u = fade(x);
    var v = fade(y);
    var aa = perm[perm[X] + Y];
    var ab = perm[perm[X] + Y + 1];
    var ba = perm[perm[X + 1] + Y];
    var bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad2(aa, x, y), grad2(ba, x - 1, y), u),
      lerp(grad2(ab, x, y - 1), grad2(bb, x - 1, y - 1), u),
      v
    );
  }

  // ---------- 线场 ----------
  var GAP_X = 14;    // 竖线间距
  var GAP_Y = 26;    // 采样点间距
  var PADDING = 180; // 两侧外扩，保证鼠标拨动时不出边
  var MOUSE_RADIUS = 90;

  var width = 0;
  var height = 0;
  var dpr = 1;
  var lines = [];
  var rafId = null;
  var time = 0;

  var mouse = {
    x: -9999, y: -9999,   // 目标位置（CSS px）
    sx: -9999, sy: -9999, // 平滑位置
    lx: -9999, ly: -9999, // 上一帧位置
    v: 0, vs: 0, a: 0,
    set: false
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildLines();
    drawFrame();
  }

  function buildLines() {
    lines = [];
    var xStart = -Math.ceil(PADDING / GAP_X) * GAP_X;
    var yStart = -GAP_Y * 2;
    var totalLines = Math.ceil((width + PADDING * 2) / GAP_X);
    var totalPoints = Math.ceil((height + GAP_Y * 4) / GAP_Y);

    for (var i = 0; i <= totalLines; i++) {
      var baseX = xStart + i * GAP_X;
      var points = [];
      for (var j = 0; j <= totalPoints; j++) {
        points.push({
          x: baseX,
          y: yStart + j * GAP_Y,
          waveX: 0,
          waveY: 0,
          cx: 0, cy: 0,       // 鼠标拨动偏移
          vx: 0, vy: 0        // 弹性速度
        });
      }
      lines.push(points);
    }
  }

  function updatePoints(dt) {
    var noiseT = time * 0.009;
    var noiseT2 = time * 0.004;

    for (var li = 0; li < lines.length; li++) {
      var points = lines[li];
      for (var pi = 0; pi < points.length; pi++) {
        var p = points[pi];

        // 1) 缓慢的波场起伏
        var move = perlin2((p.x + noiseT) * 0.002, (p.y + noiseT2) * 0.0015) * 12;
        p.waveX = Math.cos(move) * 26;
        p.waveY = Math.sin(move) * 12;

        // 2) 鼠标拨弦（只在交互半径内施加冲量）
        if (mouse.set) {
          var dx = p.x - mouse.sx;
          var dy = p.y - mouse.sy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            var s = 1 - dist / MOUSE_RADIUS;
            var f = Math.cos(dist * 0.01) * s;
            p.vx += Math.cos(mouse.a) * f * MOUSE_RADIUS * mouse.vs * 0.00032;
            p.vy += Math.sin(mouse.a) * f * MOUSE_RADIUS * mouse.vs * 0.00032;
          }
        }

        // 3) 弹簧回归
        p.vx += -p.cx * 0.008;
        p.vy += -p.cy * 0.008;
        p.vx *= 0.90;
        p.vy *= 0.90;
        p.cx += p.vx * 2;
        p.cy += p.vy * 2;
        p.cx = Math.max(-70, Math.min(70, p.cx));
        p.cy = Math.max(-70, Math.min(70, p.cy));
      }
    }

    if (!dt) { /* noop */ }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    for (var li = 0; li < lines.length; li++) {
      var points = lines[li];
      if (!points || !points.length) continue;

      // 距离鼠标越近，线条越亮（形成局部聚光）
      var lineX = points[0].x;
      var proximity = 0;
      if (mouse.set) {
        proximity = Math.max(0, 1 - Math.abs(lineX - mouse.sx) / 320);
      }
      var alpha = 0.065 + proximity * 0.16;

      ctx.beginPath();
      for (var pi = 0; pi < points.length; pi++) {
        var p = points[pi];
        var x = p.x + p.waveX + p.cx;
        var y = p.y + p.waveY + p.cy;
        if (pi === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (li % 11 === 0) {
        ctx.strokeStyle = 'rgba(255, 240, 235, ' + (alpha * 0.55).toFixed(3) + ')';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'rgba(255, 29, 29, ' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }
  }

  function tick(now) {
    if (!time) time = now;
    var dt = now - time;
    time = now;

    // 平滑鼠标 + 速度/角度
    if (mouse.set) {
      mouse.sx += (mouse.x - mouse.sx) * 0.07;
      mouse.sy += (mouse.y - mouse.sy) * 0.07;

      var dx = mouse.x - mouse.lx;
      var dy = mouse.y - mouse.ly;
      var d = Math.sqrt(dx * dx + dy * dy);
      mouse.v = d;
      mouse.vs += (d - mouse.vs) * 0.1;
      mouse.vs = Math.min(60, mouse.vs);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);
    }

    updatePoints(dt);
    drawFrame();

    if (rafId !== null) rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onMove(e) {
    if (reduced) return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!mouse.set) {
      mouse.sx = mouse.x;
      mouse.sy = mouse.y;
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.set = true;
    }
  }

  function onTouch(e) {
    if (reduced || !e.touches || !e.touches[0]) return;
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
    if (!mouse.set) {
      mouse.sx = mouse.x;
      mouse.sy = mouse.y;
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.set = true;
    }
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  if (reduced) {
    // 仅渲染静态波场
    updatePoints(0);
    drawFrame();
  } else {
    start();
  }

  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
})();
