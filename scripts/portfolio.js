/* global hexo */
'use strict';

/*
 * 作品集列表（只读取 _posts，不包含 source/_logs 公告日志）
 * 用法：在任意页面写 {% portfolio %}
 */

function escapeHtml(input) {
  return String(input == null ? '' : input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pad2(num) {
  return String(num).padStart(2, '0');
}

function formatDate(date) {
  if (date && typeof date.format === 'function') {
    return date.format('YYYY.MM.DD');
  }
  var d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
}

function stripHtml(input) {
  return String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function getExcerpt(post) {
  var text = post.description ? String(post.description) : stripHtml(post.excerpt || post.content || '');
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > 96 ? text.slice(0, 96) + '…' : text;
}

function getPostUrl(post) {
  var root = hexo.config.root || '/';
  var path = String(post.path || '').replace(/index\.html$/, '');
  return root + path;
}

function getCategories(post) {
  try {
    if (!post.categories || typeof post.categories.toArray !== 'function') return [];
    return post.categories.toArray().map(function (item) {
      return item.name;
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function getCategoryCounts(posts) {
  var counts = {};
  posts.forEach(function (post) {
    getCategories(post).forEach(function (name) {
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
}

function renderFilter(counts, total) {
  var names = Object.keys(counts).sort();
  if (names.length < 2) return '';

  var links = [
    '<a class="surreal-portfolio__filter-item is-active" href="?" data-filter="" aria-current="true">' +
      '<span>全部</span><span class="surreal-portfolio__filter-count">' + pad2(total) + '</span>' +
    '</a>'
  ];

  names.forEach(function (name) {
    links.push(
      '<a class="surreal-portfolio__filter-item" href="?category=' + encodeURIComponent(name) + '" data-filter="' + escapeHtml(name) + '">' +
        '<span>' + escapeHtml(name) + '</span>' +
        '<span class="surreal-portfolio__filter-count">' + pad2(counts[name]) + '</span>' +
      '</a>'
    );
  });

  return '<nav class="surreal-portfolio__filter" aria-label="按分类筛选作品">' + links.join('') + '</nav>';
}

hexo.extend.tag.register('portfolio', function () {
  var posts = (hexo.locals.get('posts') || []).toArray()
    .filter(function (post) {
      return post && post.title && post.published !== false;
    })
    .sort(function (a, b) {
      return b.date - a.date;
    });

  if (!posts.length) {
    return '<div class="surreal-archive-empty">' +
      '<span class="surreal-archive-empty-mark">unknown</span>' +
      '</div>';
  }

  var counts = getCategoryCounts(posts);
  var filter = renderFilter(counts, posts.length);

  var items = posts.map(function (post, index) {
    var categories = getCategories(post);
    return [
      '<a class="surreal-work" href="' + getPostUrl(post) + '" data-categories="' + escapeHtml(JSON.stringify(categories)) + '">',
      '  <span class="surreal-work__index">' + pad2(index + 1) + '</span>',
      '  <span class="surreal-work__main">',
      '    <span class="surreal-work__meta">',
      '      <time datetime="' + post.date.toISOString() + '">' + formatDate(post.date) + '</time>',
      categories.length ? '      <span class="surreal-work__category">' + escapeHtml(categories.join(' / ')) + '</span>' : '',
      '    </span>',
      '    <span class="surreal-work__title">' + escapeHtml(post.title) + '</span>',
      '    <span class="surreal-work__excerpt">' + escapeHtml(getExcerpt(post)) + '</span>',
      '  </span>',
      '  <span class="surreal-work__arrow" aria-hidden="true">→</span>',
      '</a>'
    ].filter(Boolean).join('\n');
  });

  return '<div class="surreal-portfolio" data-portfolio>\n' +
    (filter ? '  <div class="surreal-portfolio__head">\n    ' + filter + '\n  </div>\n' : '') +
    '  <p class="surreal-portfolio__status" aria-live="polite">共 ' + pad2(posts.length) + ' 件作品</p>\n' +
    '  <div class="surreal-portfolio__list">\n' +
    items.join('\n') + '\n' +
    '  </div>\n' +
    '</div>';
}, { ends: false });
