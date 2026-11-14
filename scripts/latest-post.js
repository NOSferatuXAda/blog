/* global hexo */
'use strict';

/*
 * 首页「最近更新」标签：自动指向最新一篇文章（按 date 倒序取第一篇）
 * 用法：{% latest_post %}
 * 输出：<p class="surreal-home-recent">最近更新 · <a href="...">标题</a></p>
 */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

hexo.extend.tag.register('latest_post', function () {
  var posts = hexo.locals.get('posts');
  var latest = posts ? posts.sort('date', -1).first() : null;
  if (!latest) return '';
  var href = String(latest.path || '').replace(/index\.html$/, '');
  return '<p class="surreal-home-recent">最近更新 · <a href="' + href + '">' + esc(latest.title) + '</a></p>';
});
