#!/usr/bin/env node
/*
 * blog-console.js — Creationism 博客发布控制台
 * ------------------------------------------------------------
 * 用途：交互式地选择分类、新建/排序文章、上传部署，并随仓库更新保持一致。
 *
 * 用法（在博客仓库根目录，或任意位置）：
 *   node tools/blog-console.js
 *
 * 设计原则（"随着网站更新保持使用"）：
 *   1. 所有路径都基于本脚本所在仓库的根目录（__dirname 向上两级）。
 *   2. 分类、部署目标等一律动态读取 _config.yml / 现有文章，不做硬编码。
 *   3. 不依赖本机绝对路径、不写死文章文件名；新增分类只需改 _config.yml。
 *   4. 用 Node 内置模块（fs/path/readline/child_process）实现，跨 Windows / Linux / macOS。
 *
 * 文章 front-matter 与现有两篇作品（《论水课的解渴功能》/《树莓派 5 部署工作日志》）
 * 保持一致：title / date / categories / tags / description / comments。
 * 公告日志写入 source/_logs/，文章写入 source/_posts/，二者仓库完全分离。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

// ---------- 仓库根目录解析 ----------
const SCRIPT_DIR = __dirname;                 // tools/
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const POSTS_DIR = path.join(REPO_ROOT, 'source', '_posts');
const LOGS_DIR = path.join(REPO_ROOT, 'source', '_logs');
const CONFIG_PATH = path.join(REPO_ROOT, '_config.yml');

// ---------- 控制台 ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function pad2(n) { return String(n).padStart(2, '0'); }

function nowLocal() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

function todaySlug() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function slugify(text) {
  return String(text || '').trim().toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'untitled';
}

// ---------- 配置读取 ----------
function readYamlScalars(filePath) {
  const out = {};
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (m && !m[1].startsWith('#')) out[m[1]] = m[2].replace(/['"]/g, '').trim();
    }
  } catch (e) { /* 读取失败则返回空 */ }
  return out;
}

function detectCategories() {
  const cfg = readYamlScalars(CONFIG_PATH);
  const set = new Set();
  if (cfg.category_map) {
    const names = cfg.category_map.match(/[\u4e00-\u9fa5A-Za-z0-9_-]+/g) || [];
    names.forEach((n) => set.add(n));
  }
  try {
    for (const f of fs.readdirSync(POSTS_DIR)) {
      if (!/\.md$/i.test(f)) continue;
      const fm = readFrontMatter(path.join(POSTS_DIR, f));
      if (fm.categories) {
        String(fm.categories).split(/[\s,，]+/).filter(Boolean).forEach((c) => set.add(c));
      }
    }
  } catch (e) { /* ignore */ }
  for (const d of ['技术', '日常', '公告']) set.add(d);
  return Array.from(set);
}

// ---------- front-matter 解析 ----------
function readFrontMatter(filePath) {
  const out = { title: '', date: '', categories: '', tags: [], description: '', raw: '' };
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    out.raw = txt;
    const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) {
      const block = m[1];
      for (const line of block.split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
        if (!kv) continue;
        const key = kv[1];
        let val = kv[2].trim();
        if (key === 'tags') continue;
        out[key] = val.replace(/^['"]|['"]$/g, '');
      }
      const tagsMatch = block.match(/^tags\s*:\s*([\s\S]*?)(?=^[A-Za-z0-9_]+\s*:|\s*$)/m);
      if (tagsMatch) {
        out.tags = tagsMatch[1].split(/[\r\n]/)
          .map((s) => s.trim().replace(/^-\s*/, '')).filter(Boolean);
      }
    }
  } catch (e) { /* ignore */ }
  return out;
}

function buildPostFrontMatter(_o) {
  const tagLines = (_o.tags || []).map((t) => '  - ' + t).join('\n');
  return [
    '---',
    'title: ' + _o.title,
    'date: ' + _o.date,
    'categories: ' + _o.category,
    'tags:',
    tagLines || '  - 随笔',
    'description: ' + (_o.description || ''),
    'comments: false',
    '---',
    '',
    '<div class="surreal-essay-marker" hidden></div>',
    '',
    '<!-- 正文从这里开始 -->',
    '',
  ].join('\n');
}

function buildLogFrontMatter(_o) {
  return ['---', 'title: ' + _o.title, 'date: ' + _o.date, '---', '', '- '].join('\n');
}

// ---------- 列表 ----------
function listPosts() {
  let files = [];
  try { files = fs.readdirSync(POSTS_DIR).filter((f) => /\.md$/i.test(f)); } catch (e) {}
  return files.map((f) => {
    const fm = readFrontMatter(path.join(POSTS_DIR, f));
    return { file: f, title: fm.title || f, date: fm.date || '', category: fm.categories || '' };
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// ---------- 动作 ----------
async function actionNewPost() {
  const cats = detectCategories();
  console.log('\n选择分类（文章进入 source/_posts/）：');
  cats.forEach((c, i) => console.log('  ' + (i + 1) + '. ' + c));
  const ci = await ask('输入序号（或直接输入新分类名）: ');
  let category = cats[Number(ci) - 1] || ci.trim();
  if (!category) { console.log('未选择分类，取消。'); return; }

  const title = (await ask('标题: ')).trim();
  if (!title) { console.log('标题不能为空，取消。'); return; }

  console.log('\n文章顺序由 date 决定（date 越新，排在越靠前）。');
  console.log('留空 = 使用当前时间 ' + nowLocal());
  const date = (await ask('日期 [' + nowLocal() + ']: ')).trim() || nowLocal();

  const tagsIn = (await ask('标签（逗号分隔，留空 = 随笔）: ')).trim();
  const tags = tagsIn ? tagsIn.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : ['随笔'];

  const description = (await ask('一句话描述（description，可留空）: ')).trim();

  const filename = slugify(title) + '.md';
  const content = buildPostFrontMatter({ title: title, date: date, category: category, tags: tags, description: description });
  const target = path.join(POSTS_DIR, filename);

  if (fs.existsSync(target)) {
    const ans = (await ask('文件 ' + filename + ' 已存在，覆盖？(y/N): ')).trim().toLowerCase();
    if (ans !== 'y') { console.log('取消。'); return; }
  }
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  console.log('\n✅ 已创建文章: source/_posts/' + filename);
  console.log('   分类=' + category + '  日期=' + date + '  标签=' + tags.join(', '));
  await maybeEdit(target);
}

async function actionNewLog() {
  const title = (await ask('公告标题: ')).trim();
  if (!title) { console.log('标题不能为空，取消。'); return; }
  const date = (await ask('日期 [' + nowLocal() + ']: ')).trim() || nowLocal();
  const body = (await ask('公告内容（一行或几句话，可用 - 列点）: ')).trim();

  const filename = todaySlug() + '-' + slugify(title) + '.md';
  const content = buildLogFrontMatter({ title: title, date: date }) + (body ? '\n- ' + body.replace(/\r?\n/g, '\n- ') + '\n' : '\n');
  const target = path.join(LOGS_DIR, filename);

  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  console.log('\n✅ 已创建公告日志: source/_logs/' + filename);
  console.log('   （公告会自动进入 /logs/ 时间轴，并按 date 倒序，最新在最上）');
}

async function actionReorder() {
  const posts = listPosts();
  if (!posts.length) { console.log('暂无文章。'); return; }
  console.log('\n当前文章（按 date 倒序，最新在最上）：');
  posts.forEach((p, i) => console.log('  ' + (i + 1) + '. [' + (p.date || '无日期') + '] ' + p.title + '  (' + (p.category || '未分类') + ')  ← ' + p.file));
  const idx = Number(await ask('选择要调整顺序的文章序号: ')) - 1;
  const p = posts[idx];
  if (!p) { console.log('序号无效。'); return; }
  console.log('\n当前日期: ' + p.date);
  const newDate = (await ask('新日期（越新越靠前）[' + nowLocal() + ']: ')).trim() || nowLocal();
  const fp = path.join(POSTS_DIR, p.file);
  let txt = fs.readFileSync(fp, 'utf8');
  txt = txt.replace(/^date\s*:\s*.*$/m, 'date: ' + newDate);
  fs.writeFileSync(fp, txt, 'utf8');
  console.log('✅ 已更新 ' + p.file + ' 的 date → ' + newDate);
}

async function actionDeploy() {
  console.log('\n部署流程: npx hexo clean && npx hexo generate && npx hexo deploy');
  console.log('（部署会把构建产物推送到 gh-pages 分支，GitHub Pages 从该分支发布）');
  const ans = (await ask('确认部署？(y/N): ')).trim().toLowerCase();
  if (ans !== 'y') { console.log('已取消。'); return; }
  console.log('正在构建并部署，请稍候…');
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const res = spawnSync(cmd, ['hexo', 'clean'], { cwd: REPO_ROOT, stdio: 'inherit' });
  if (res.status !== 0) { console.log('hexo clean 失败，中止。'); return; }
  const gen = spawnSync(cmd, ['hexo', 'generate'], { cwd: REPO_ROOT, stdio: 'inherit' });
  if (gen.status !== 0) { console.log('hexo generate 失败，中止。'); return; }
  const dep = spawnSync(cmd, ['hexo', 'deploy'], { cwd: REPO_ROOT, stdio: 'inherit' });
  if (dep.status === 0) console.log('\n✅ 部署完成: https://nosferatuxada.github.io/blog/');
  else console.log('\n⚠️  hexo deploy 返回非零，请检查 Git 凭据 / 网络 / 代理。');
}

async function actionBackup() {
  const stamp = nowLocal().replace(/[-: ]/g, '').slice(0, 14);
  const backupDir = path.join(REPO_ROOT, '.backup', stamp);
  fs.mkdirSync(backupDir, { recursive: true });
  for (const sub of ['source', '_config.yml', '_config.next.yml', 'scaffolds', 'scripts']) {
    const src = path.join(REPO_ROOT, sub);
    if (fs.existsSync(src)) fs.cpSync(src, backupDir, { recursive: true });
  }
  console.log('✅ 已备份关键数据到 .backup/' + stamp + '/');
  console.log('   （若已配置 git，建议同时运行 git add + commit）');
}

async function maybeEdit(filePath) {
  const ans = (await ask('是否现在用编辑器打开撰写正文？(y/N): ')).trim().toLowerCase();
  if (ans !== 'y') return;
  const editor = process.env.VISUAL || process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'nano');
  console.log('打开 ' + editor + ' ...（保存并退出后回到菜单）');
  spawnSync(editor, [filePath], { stdio: 'inherit' });
}

// ---------- 主菜单 ----------
async function mainMenu() {
  for (;;) {
    console.log('\n==============================================');
    console.log('  Creationism 博客控制台');
    console.log('==============================================');
    console.log('  1. 新建文章（选择分类 → 写入 source/_posts/）');
    console.log('  2. 新建公告（写入 source/_logs/）');
    console.log('  3. 调整文章顺序（改 date）');
    console.log('  4. 列出当前文章');
    console.log('  5. 部署上线（hexo clean + generate + deploy）');
    console.log('  6. 备份关键数据');
    console.log('  0. 退出');
    console.log('----------------------------------------------');
    const choice = (await ask('请选择: ')).trim();
    switch (choice) {
      case '1': await actionNewPost(); break;
      case '2': await actionNewLog(); break;
      case '3': await actionReorder(); break;
      case '4': {
        const posts = listPosts();
        if (!posts.length) console.log('暂无文章。');
        else posts.forEach((p, i) => console.log('  ' + (i + 1) + '. [' + (p.date || '无日期') + '] ' + p.title + '  (' + (p.category || '未分类') + ')'));
        break;
      }
      case '5': await actionDeploy(); break;
      case '6': await actionBackup(); break;
      case '0': rl.close(); return;
      default: console.log('未知选项，请重试。');
    }
  }
}

// ---------- 启动 ----------
console.log('仓库根目录: ' + REPO_ROOT);
if (!fs.existsSync(POSTS_DIR)) {
  console.warn('⚠️  未找到 source/_posts/，请确认在博客仓库内运行本脚本（tools/blog-console.js）。');
}
mainMenu().catch((e) => { console.error(e); rl.close(); });
