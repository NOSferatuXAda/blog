#!/usr/bin/env node
/*
 * design-audit.js — Creationism 设计系统审计工具
 * ------------------------------------------------------------
 * 扫描仓库，检查是否遵循 docs/design-system.md 的 Surreal 视觉语言：
 *   1. 硬编码颜色（应使用 --surreal-* token）
 *   2. unknown 占位符残留
 *   3. 孤立 CSS 类（styles.styl 定义了但源码里没用到）
 *   4. 内联 style
 *   5. token 同步（variables.styl 与 styles.styl 的色板一致性）
 * 用法：node tools/design-audit.js
 */

'use strict';

var fs = require('fs');
var path = require('path');

var REPO = path.resolve(__dirname, '..');
var SOURCE = path.join(REPO, 'source');
var STYLES = path.join(SOURCE, '_data', 'styles.styl');
var VARIABLES = path.join(SOURCE, '_data', 'variables.styl');

// 设计系统 token（唯一色板）
var TOKENS = {
  '#050505': '--surreal-black',
  '#0b0b0b': '--surreal-black-soft',
  '#121212': '--surreal-panel',
  '#181818': '--surreal-panel-2',
  '#2b2b2b': '--surreal-line',
  '#3a3a3a': '--surreal-line-light',
  '#8a8a8a': '--surreal-grey',
  '#5c5c5c': '--surreal-grey-dark',
  '#f5f5f5': '--surreal-white',
  '#ff1d1d': '--surreal-red',
  '#a80c0c': '--surreal-red-deep'
};

// 已知允许的硬编码色（阴影底色等，标记为「例外」）
var CUSTOM_ONLY = { 'surreal-panel-2': true, 'surreal-line-light': true, 'surreal-grey-dark': true };

var ALLOWED_HEX = {
  '#0e0e0e': '错位硬阴影底色（可考虑 token 化）'
};

var report = [];
var issues = 0;

function fail(msg) { issues++; report.push('  ⚠️ ' + msg); }
function ok(msg) { report.push('  ✅ ' + msg); }

function readSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; }
}

function walk(dir, out) {
  out = out || [];
  var items = fs.readdirSync(dir);
  items.forEach(function (name) {
    var p = path.join(dir, name);
    var st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === '.git' || name === 'node_modules' || name === 'public' || name === '.deploy_git') return;
      walk(p, out);
    } else {
      out.push(p);
    }
  });
  return out;
}

function rel(p) { return path.relative(REPO, p); }

function section(title) { report.push(''); report.push('【' + title + '】'); }

// ---------- 1. 硬编码颜色 ----------
section('1. 硬编码颜色（应使用 --surreal-* token）');
var styl = readSafe(STYLES) || '';
var hexRe = /#[0-9a-fA-F]{3,8}/g;
var seen = {};
var hexHits = [];
var m;
while ((m = hexRe.exec(styl)) !== null) {
  var hex = m[0].toLowerCase();
  if (seen[hex]) continue;
  seen[hex] = true;
  var line = styl.slice(0, m.index).split('\n').length;
  if (!TOKENS[hex]) {
    hexHits.push(hex + ' (styles.styl:' + line + ')' + (ALLOWED_HEX[hex] ? ' — ' + ALLOWED_HEX[hex] : ''));
  }
}
if (hexHits.length === 0) ok('无硬编码颜色');
else hexHits.forEach(function (h) { fail(h + ' — 建议改为 var(token)'); });

// ---------- 2. unknown 占位符 ----------
section('2. unknown 占位符残留（排除 _logs 历史与 _posts 正文）');
var unknownHits = [];
var allFiles = walk(SOURCE, []);
allFiles.forEach(function (p) {
  var r = rel(p);
  if (r.indexOf('_logs') === 0 || r.indexOf('_posts') === 0) return;
  if (!/\.(md|html|njk|styl|yml|js)$/.test(p)) return;
  var txt = readSafe(p) || '';
  var lines = txt.split('\n');
  lines.forEach(function (line, i) {
    if (line.indexOf('unknown') >= 0 && line.indexOf('surreal-essay-marker') < 0 && line.indexOf('surreal-panel-mark') < 0 && line.indexOf('unknown-token') < 0 && line.indexOf('unknownBreathe') < 0 && line.indexOf('surreal-about-unknown') < 0 && line.indexOf('/*') < 0) {
      unknownHits.push(r + ':' + (i + 1) + '  ' + line.trim().slice(0, 60));
    }
  });
});
if (unknownHits.length === 0) ok('无残留 unknown 占位');
else unknownHits.forEach(function (h) { fail(h); });

// ---------- 3. 孤立 CSS 类 ----------
section('3. 孤立 CSS 类（styles.styl 定义但源码未使用）');
var classRe = /\.[a-zA-Z][a-zA-Z0-9_-]*/g;
var defined = {};
var m2;
while ((m2 = classRe.exec(styl)) !== null) {
  var cn = m2[0].slice(1);
  if (cn.indexOf('surreal') === 0 || cn.indexOf('gyre') === 0) defined[cn] = true;
}
var used = {};
var sourceFiles = walk(SOURCE, []).concat([path.join(REPO, '_config.next.yml')]).concat(walk(path.join(REPO, 'scripts'), []));
sourceFiles.forEach(function (p) {
  if (!/\.(md|html|njk|yml|js)$/.test(p)) return;
  var txt = readSafe(p) || '';
  var attrRe = /class="([^"]*)"|class='([^']*)'|className\s*=\s*['"]([^'"]+)['"]/g;
  var m3;
  while ((m3 = attrRe.exec(txt)) !== null) {
    var cls = m3[1] || m3[2] || m3[3] || '';
    cls.split(/\s+/).forEach(function (c) { if (c) used[c] = true; });
  }
});
var orphans = Object.keys(defined).filter(function (c) { return !used[c]; });
if (orphans.length === 0) ok('无孤立 CSS 类');
else orphans.forEach(function (c) { fail('孤立类 .' + c + '（定义了但源码里没出现）'); });

// ---------- 4. 内联 style ----------
section('4. 内联 style 属性');
var inlineHits = [];
allFiles.forEach(function (p) {
  var r = rel(p);
  if (!/\.(md|html|njk)$/.test(p)) return;
  var txt = readSafe(p) || '';
  var lines = txt.split('\n');
  lines.forEach(function (line, i) {
    if (line.indexOf('style="') >= 0) inlineHits.push(r + ':' + (i + 1));
  });
});
if (inlineHits.length === 0) ok('无内联 style');
else inlineHits.forEach(function (h) { fail(h + ' — 建议移入 styles.styl'); });

// ---------- 5. token 同步 ----------
section('5. token 同步（variables.styl ↔ styles.styl）');
var vars = readSafe(VARIABLES) || '';
var syncMiss = [];
Object.keys(TOKENS).forEach(function (hex) {
  var tokenName = TOKENS[hex].slice(2); // 去 -- 前缀
  var stylusVar = '$' + tokenName;
  // 检查 variables.styl 是否也有同值变量
  var hasStylus = vars.indexOf(stylusVar) >= 0;
  var hasCss = styl.indexOf(TOKENS[hex]) >= 0;
  if (!hasStylus && !CUSTOM_ONLY[tokenName]) syncMiss.push(tokenName + '：variables.styl 缺 ' + stylusVar);
  if (!hasCss) syncMiss.push(tokenName + '：styles.styl :root 缺 ' + TOKENS[hex]);
});
if (syncMiss.length === 0) ok('两套 token 基本同步');
else syncMiss.forEach(function (s) { fail(s); });

// ---------- 总结 ----------
report.push('');
report.push('══════════════════════════════════════');
report.push('审计完成：' + issues + ' 处需处理');
report.push('══════════════════════════════════════');

console.log('');
console.log('  Creationism 设计系统审计');
console.log('  仓库: ' + REPO);
console.log('  规则: docs/design-system.md');
console.log(report.join('\n'));
console.log('');

process.exit(issues > 0 ? 1 : 0);
