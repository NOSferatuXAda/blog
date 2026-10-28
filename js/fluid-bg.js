/*!
 * Surreal liquid background — red fluid / liquid metal
 * ------------------------------------------------------------
 * 基于原生 WebGL 的全屏流体背景（无第三方库）：
 * - 黑底 + 暗红液态流场，缓慢蠕动
 * - 鼠标划过：局部涡旋 + 亮度扰动；点击：扩散涟漪
 * - 固定底层（z-index:-2）、pointer-events:none，不阻挡任何交互
 * - 尊重 prefers-reduced-motion；页面隐藏时暂停
 */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'fluid-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  var gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power'
  }) || canvas.getContext('experimental-webgl');

  if (!gl) {
    canvas.remove();
    return;
  }

  var VERT = [
    'attribute vec2 aPos;',
    'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform vec2 uMouse;',
    'uniform vec2 uVel;',
    'uniform vec3 uClick;',
    '',
    'float hash21(vec2 p) {',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float vnoise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0, 0.0));',
    '  float c = hash21(i + vec2(0.0, 1.0));',
    '  float d = hash21(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);',
    '  for (int i = 0; i < 4; i++) {',
    '    v += a * vnoise(p);',
    '    p = rot * p * 2.03;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;',
    '  float t = uTime * 0.04;',
    '',
    '  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);',
    '  float d = length(uv - m);',
    '  float near = exp(-d * d * 9.0);',
    '  float vel = length(uVel);',
    '',
    '  // 鼠标附近形成局部涡旋，移动越快扰动越强',
    '  float ang = near * (0.8 + clamp(vel * 3.0, 0.0, 1.4));',
    '  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));',
    '  vec2 p = rot * (uv * 1.25);',
    '  p += vec2(t * 0.55, -t * 0.38);',
    '',
    '  // domain warping：液态金属/流体感的核心',
    '  vec2 q = vec2(',
    '    fbm(p + vec2(0.0, t)),',
    '    fbm(p + vec2(5.2, 1.3) - t * 0.8)',
    '  );',
    '  vec2 r = vec2(',
    '    fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.7),',
    '    fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.6)',
    '  );',
    '  float f = fbm(p + 2.8 * r);',
    '',
    '  // 点击涟漪',
    '  if (uClick.z > 0.0) {',
    '    vec2 cm = (uClick.xy - 0.5) * vec2(uRes.x / uRes.y, 1.0);',
    '    float age = max(uTime - uClick.z, 0.0);',
    '    float ring = abs(length(uv - cm) - age * 0.48);',
    '    f += smoothstep(0.10, 0.0, ring) * exp(-age * 2.0) * 0.42;',
    '  }',
    '',
    '  float liquid = smoothstep(0.26, 0.78, f + near * 0.07);',
    '  float glow = pow(liquid, 2.0);',
    '',
    '  vec3 deep = vec3(0.006, 0.003, 0.003);',
    '  vec3 red = vec3(0.85, 0.035, 0.035);',
    '  vec3 hot = vec3(1.0, 0.22, 0.16);',
    '  float edge = smoothstep(0.62, 0.80, liquid) * (1.0 - smoothstep(0.84, 0.96, liquid));',
    '  vec3 col = deep + red * glow * 0.60 + hot * pow(liquid, 6.0) * 0.13 + hot * edge * 0.07;',
    '  col += red * 0.028 * (0.5 + 0.5 * f);',
    '  col += vec3(0.9, 0.86, 0.86) * smoothstep(0.88, 1.0, liquid) * 0.04;',
    '',
    '  // 暗角 + 颗粒，保证读文字时不抢视觉',
    '  col *= clamp(1.0 - 0.45 * dot(uv, uv), 0.0, 1.0);',
    '  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 13.0) * 43758.5453);',
    '  col += (g - 0.5) * 0.02;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[fluid-bg] shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  var vertShader = compile(gl.VERTEX_SHADER, VERT);
  var fragShader = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vertShader || !fragShader) {
    canvas.remove();
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[fluid-bg] program error:', gl.getProgramInfoLog(program));
    canvas.remove();
    return;
  }
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ]), gl.STATIC_DRAW);

  var aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(program, 'uRes');
  var uTime = gl.getUniformLocation(program, 'uTime');
  var uMouse = gl.getUniformLocation(program, 'uMouse');
  var uVel = gl.getUniformLocation(program, 'uVel');
  var uClick = gl.getUniformLocation(program, 'uClick');

  var width = 1;
  var height = 1;
  var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 };
  var click = { x: 0.5, y: 0.5, t: -1000 };
  var startTime = performance.now();
  var seconds = 0;
  var rafId = null;
  var running = false;

  function resize() {
    var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7;
    width = Math.max(2, Math.floor(window.innerWidth * scale));
    height = Math.max(2, Math.floor(window.innerHeight * scale));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, width, height);
    if (reduced) renderAt(0);
  }

  function renderAt(now) {
    seconds = Math.max(0, (now - startTime) / 1000);
    mouse.vx *= 0.9;
    mouse.vy *= 0.9;
    mouse.x += (mouse.tx - mouse.x) * 0.14;
    mouse.y += (mouse.ty - mouse.y) * 0.14;

    gl.uniform2f(uRes, width, height);
    gl.uniform1f(uTime, seconds);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform2f(uVel, mouse.vx, mouse.vy);
    gl.uniform3f(uClick, click.x, click.y, click.t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function loop(now) {
    renderAt(now);
    if (running) rafId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = window.requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onMove(event) {
    if (reduced) return;
    var nx = event.clientX / Math.max(window.innerWidth, 1);
    var ny = 1 - event.clientY / Math.max(window.innerHeight, 1);
    mouse.vx += (nx - mouse.tx) * 8;
    mouse.vy += (ny - mouse.ty) * 8;
    mouse.tx = nx;
    mouse.ty = ny;
  }

  function onDown(event) {
    if (reduced) return;
    click.x = event.clientX / Math.max(window.innerWidth, 1);
    click.y = 1 - event.clientY / Math.max(window.innerHeight, 1);
    click.t = seconds;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  if (reduced) renderAt(0);
  else start();

  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
})();
