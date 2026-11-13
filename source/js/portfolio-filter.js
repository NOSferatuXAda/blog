(function () {
  'use strict';

  // 分类归档页不再使用 Hexo 默认版式，统一进入作品集筛选视图。
  var path = window.location.pathname;
  var categoryMatch = path.match(/\/categories\/([^/]+)\/?$/);
  if (categoryMatch) {
    try {
      var siteRoot = path.split('/categories/')[0] + '/';
      var categoryName = decodeURIComponent(categoryMatch[1]);
      if (categoryName) {
        window.location.replace(siteRoot + 'archives/?category=' + encodeURIComponent(categoryName));
        return;
      }
    } catch (err) {
      // 路径异常时继续使用当前页面。
    }
  }

  // 文章页的分类链接指向筛选后的作品集，而不是默认分类归档页。
  document.querySelectorAll('.post-meta a[href*="/categories/"]').forEach(function (link) {
    try {
      var url = new URL(link.getAttribute('href'), window.location.href);
      var marker = '/categories/';
      var index = url.pathname.indexOf(marker);
      if (index === -1) return;
      var name = decodeURIComponent(url.pathname.slice(index + marker.length).replace(/\/$/, ''));
      var root = url.pathname.slice(0, index) + '/';
      if (name) link.href = root + 'archives/?category=' + encodeURIComponent(name);
    } catch (err) {
      // 忽略无法解析的链接。
    }
  });

  var portfolio = document.querySelector('[data-portfolio]');
  if (!portfolio) return;

  var cards = Array.prototype.slice.call(portfolio.querySelectorAll('.surreal-work'));
  var filterLinks = Array.prototype.slice.call(portfolio.querySelectorAll('[data-filter]'));
  var status = portfolio.querySelector('.surreal-portfolio__status');
  var current = '';

  function cardCategories(card) {
    try {
      var value = JSON.parse(card.getAttribute('data-categories') || '[]');
      return Array.isArray(value) ? value : [];
    } catch (err) {
      return [];
    }
  }

  function setActive(name) {
    filterLinks.forEach(function (link) {
      var active = (link.getAttribute('data-filter') || '') === name;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function apply(name, updateUrl) {
    current = name || '';
    var visible = 0;

    cards.forEach(function (card) {
      var show = !current || cardCategories(card).indexOf(current) !== -1;
      card.hidden = !show;
      if (show) visible += 1;
    });

    setActive(current);

    if (status) {
      status.textContent = current
        ? current + ' · ' + visible + ' 件作品'
        : '共 ' + visible + ' 件作品';
    }

    if (updateUrl) {
      var url = new URL(window.location.href);
      if (current) url.searchParams.set('category', current);
      else url.searchParams.delete('category');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }

  filterLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      apply(link.getAttribute('data-filter') || '', true);
    });
  });

  var initial = '';
  try {
    initial = new URLSearchParams(window.location.search).get('category') || '';
  } catch (err) {
    initial = '';
  }

  if (initial) {
    var known = false;
    cards.forEach(function (card) {
      if (cardCategories(card).indexOf(initial) !== -1) known = true;
    });
    if (!known) initial = '';
  }

  apply(initial, false);
})();
