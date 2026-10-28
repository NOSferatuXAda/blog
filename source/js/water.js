/*!
 * Surreal water ripple background
 * 轻量级 Canvas 水波纹：鼠标移动泛起小涟漪，点击泛起大浪花
 * - 固定底层（z-index: -2），pointer-events: none，不阻挡任何交互
 * - 尊重 prefers-reduced-motion
 */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'water-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  var width = 0;
  var height = 0;
  var dpr = 1;
  var ripples = [];
  var rafId = null;
  var time = 0;
  var ambientTimer = 0;
  var AMBIENT_INTERVAL = 2400;
  var MAX_RIPPLES = 48;
  var lastMove = 0;
  var lastX = 0;
  var lastY = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (prefersReduced) drawFrame(true);
  }

  function addRipple(x, y, strength) {
    var base = Math.min(Math.max(width, height) * 0.16, 260);
    var maxRadius = strength === 2 ? base : base * 0.62;
    ripples.push({
      x: x,
      y: y,
      r: 2,
      max: maxRadius,
      alpha: strength === 2 ? 0.4 : 0.2,
      speed: strength === 2 ? 3.1 : 2.1,
      strong: strength === 2
    });
    if (ripples.length > MAX_RIPPLES) ripples.shift();
  }

  function drawWaterLines() {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < 3; i++) {
      var baseY = height * (0.26 + i * 0.24);
      ctx.beginPath();
      for (var x = 0; x <= width; x += 14) {
        var y = baseY +
          Math.sin(x * 0.006 + time * 0.00035 + i * 1.7) * 15 +
          Math.sin(x * 0.013 - time * 0.0006 + i * 0.9) * 6;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = i === 1 ? 'rgba(255, 29, 29, 0.05)' : 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRipples() {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i];
      rp.r += rp.speed;
      rp.alpha *= 0.986;
      var progress = rp.r / rp.max;
      if (progress >= 1 || rp.alpha < 0.01) {
        ripples.splice(i, 1);
        continue;
      }
      var fade = 1 - progress;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (rp.alpha * fade).toFixed(3) + ')';
      ctx.lineWidth = rp.strong ? 1.6 : 1.1;
      ctx.stroke();

      if (rp.r > 10) {
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 29, 29, ' + (rp.alpha * fade * 0.32).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFrame(staticOnly) {
    ctx.clearRect(0, 0, width, height);
    drawWaterLines();
    if (!staticOnly) drawRipples();
  }

  function frame() {
    time += 16;
    ambientTimer += 16;
    if (ambientTimer > AMBIENT_INTERVAL) {
      ambientTimer = 0;
      addRipple(Math.random() * width, Math.random() * height, 1);
    }
    drawFrame(false);
    rafId = window.requestAnimationFrame(frame);
  }

  function onMove(event) {
    if (prefersReduced) return;
    var now = performance.now();
    var x = event.clientX;
    var y = event.clientY;
    if (now - lastMove < 70) return;
    if (Math.hypot(x - lastX, y - lastY) < 24) return;
    lastMove = now;
    lastX = x;
    lastY = y;
    addRipple(x, y, 1);
  }

  function onPointerDown(event) {
    if (prefersReduced) return;
    addRipple(event.clientX, event.clientY, 2);
  }

  function stop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function start() {
    if (!rafId && !prefersReduced) rafId = window.requestAnimationFrame(frame);
  }

  function onVisibilityChange() {
    if (document.hidden) stop();
    else start();
  }

  resize();
  if (prefersReduced) {
    drawFrame(true);
  } else {
    start();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
})();
