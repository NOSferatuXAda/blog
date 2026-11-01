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

  var items = posts.map(function (post, index) {
    var categories = getCategories(post);
    return [
      '<a class="surreal-work" href="' + getPostUrl(post) + '">',
      '  <span class="surreal-work__index">' + String(index + 1).padStart(2, '0') + '</span>',
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

  return '<div class="surreal-portfolio">\n' +
    '  <p class="surreal-portfolio__intro">文字、随笔与实验记录。</p>\n' +
    '  <div class="surreal-portfolio__list">\n' +
    items.join('\n') + '\n' +
    '  </div>\n' +
    '</div>';
}, { ends: false });
