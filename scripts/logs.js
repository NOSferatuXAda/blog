/* global hexo */
'use strict';

/*
 * 公告更新日志（独立于文章系统）
 * ------------------------------------------------------------
 * 日志源文件目录：source/_logs/*.md（以下划线开头，Hexo 不会把它当页面生成）
 * 用法：在任意页面 Markdown 中写 {% logs %}，会输出倒序时间轴。
 * 排序：按 front-matter 的 date 从新到旧（最新在最上）。
 */

const fs = require('fs');
const path = require('path');
const frontMatter = require('hexo-front-matter');

let cachedLogs = null;

function escapeHtml(input) {
  return String(input == null ? '' : input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatDate(date) {
  return date.getFullYear() + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate());
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function loadLogs() {
  const dir = path.join(hexo.base_dir, 'source', '_logs');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(file => /\.md$/i.test(file))
    .map(file => {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = frontMatter.parse(raw) || {};
      const body = data._content || '';
      delete data._content;

      const date = data.date ? new Date(data.date) : fs.statSync(filePath).mtime;

      let rendered = '';
      try {
        rendered = hexo.render.renderSync({ text: body, engine: 'markdown' });
      } catch (err) {
        hexo.log.warn('logs: 渲染 %s 失败：%s', file, err.message);
        rendered = '<p>' + escapeHtml(body) + '</p>';
      }

      const title = data.title || 'unknown';
      const version = date.toISOString() + '-' + hashString(file + '|' + title);

      return {
        version: version,
        title: title,
        date: date,
        rendered: rendered
      };
    })
    .filter(item => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => b.date - a.date); // 最新在最上
}

hexo.extend.filter.register('before_generate', function () {
  cachedLogs = loadLogs();
}, 9);

// 输出静态 JSON：供“最新公告自动弹窗”等前端功能读取
hexo.extend.generator.register('logs-json', function () {
  const logs = cachedLogs || loadLogs();
  const root = hexo.config.root || '/';
  const payload = logs.map(item => ({
    version: item.version,
    title: item.title,
    date: item.date.toISOString(),
    dateText: formatDate(item.date),
    content: item.rendered,
    url: root + 'logs/'
  }));

  return {
    path: 'logs.json',
    data: JSON.stringify(payload)
  };
});

hexo.extend.tag.register('logs', function () {
  const logs = cachedLogs || loadLogs();

  if (!logs.length) {
    return '<div class="surreal-timeline surreal-timeline-empty">' +
      '<span class="surreal-archive-empty-mark">unknown</span>' +
      '</div>';
  }

  const items = logs.map(item => {
    return [
      '<article class="surreal-timeline-item">',
      '  <div class="surreal-timeline-dot" aria-hidden="true"></div>',
      '  <div class="surreal-timeline-meta">',
      '    <time datetime="' + item.date.toISOString() + '">' + formatDate(item.date) + '</time>',
      '  </div>',
      '  <h3 class="surreal-timeline-title">' + escapeHtml(item.title) + '</h3>',
      '  <div class="surreal-timeline-body">' + item.rendered + '</div>',
      '</article>'
    ].join('\n');
  });

  return '<div class="surreal-timeline">\n' + items.join('\n') + '\n</div>';
}, { ends: false });
