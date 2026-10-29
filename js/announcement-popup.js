/*!
 * Latest announcement popup
 * ------------------------------------------------------------
 * 数据来源：/logs.json（由 scripts/logs.js 生成，按日期倒序）
 * 版本控制：localStorage 记录“不再提醒”的公告 version
 * - 与当前最新公告 version 相同 → 不再弹出
 * - 出现新公告（version 改变）→ 重新弹出
 * 性能：只在页面加载后请求一次小 JSON，不参与 rAF，不影响背景动画
 */
(function () {
  'use strict';

  var CONFIG = window.__SURREAL_ANNOUNCEMENT__ || {};
  var modal = document.getElementById('surreal-announcement');
  if (!modal || !CONFIG.jsonUrl) return;

  var STORAGE_KEY = 'surreal-announcement-dismissed';
  var SHOW_DELAY = 900;

  var el = {
    title: modal.querySelector('.surreal-announcement__title'),
    date: modal.querySelector('.surreal-announcement__date'),
    body: modal.querySelector('.surreal-announcement__body'),
    more: modal.querySelector('.surreal-announcement__more'),
    close: modal.querySelector('.surreal-announcement__close')
  };

  var currentVersion = null;
  var isOpen = false;
  var lastFocus = null;
  var hideTimer = null;
  var started = false;

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* localStorage 不可用时静默失败 */
    }
  }

  function isLogsPage() {
    return /(^|\/)logs(\/|$|\/index\.html$)/.test(window.location.pathname);
  }

  function openModal(item) {
    if (!item || !item.version) return;

    currentVersion = item.version;
    el.title.textContent = item.title || '最新公告';
    el.date.textContent = item.dateText || '';
    el.body.innerHTML = item.content || '';
    if (item.url && el.more) el.more.href = item.url;

    lastFocus = document.activeElement;
    modal.hidden = false;
    isOpen = true;

    document.documentElement.classList.add('announcement-open');

    // 强制 reflow，确保过渡动画生效
    /* eslint-disable no-unused-expressions */
    modal.offsetWidth;
    /* eslint-enable no-unused-expressions */
    modal.classList.add('is-open');

    if (el.close && el.close.focus) {
      try {
        el.close.focus({ preventScroll: true });
      } catch (err) {
        el.close.focus();
      }
    }
  }

  function closeModal(dismiss) {
    if (!isOpen) return;

    if (dismiss && currentVersion) {
      storageSet(STORAGE_KEY, currentVersion);
    }

    isOpen = false;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('announcement-open');

    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(function () {
      modal.hidden = true;
    }, 280);

    if (lastFocus && lastFocus.focus) {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (err) {
        lastFocus.focus();
      }
    }
  }

  function fetchLogs(callback) {
    var url = CONFIG.jsonUrl;

    if (window.fetch) {
      window.fetch(url, { cache: 'no-store', credentials: 'same-origin' })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(callback)
        .catch(function () {
          callback(null);
        });
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          callback(JSON.parse(xhr.responseText));
        } catch (err) {
          callback(null);
        }
      } else {
        callback(null);
      }
    };
    xhr.onerror = function () {
      callback(null);
    };
    xhr.send(null);
  }

  function init() {
    if (started) return;
    started = true;

    // 公告页本身不弹，避免遮挡用户正在阅读的时间轴
    if (isLogsPage()) return;

    fetchLogs(function (logs) {
      if (!logs || !logs.length) return;

      var latest = logs[0];
      if (!latest || !latest.version) return;

      // 只有“新的公告版本”才弹出
      if (storageGet(STORAGE_KEY) === latest.version) return;

      window.setTimeout(function () {
        openModal(latest);
      }, SHOW_DELAY);
    });
  }

  // 关闭交互
  modal.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    if (target.closest('[data-dismiss]')) {
      event.preventDefault();
      closeModal(true);
      return;
    }

    if (target.closest('[data-close]')) {
      event.preventDefault();
      closeModal(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (!isOpen) return;
    if (event.key === 'Escape' || event.keyCode === 27) {
      closeModal(false);
    }
  });

  // 页面加载完成后再请求，不阻塞首屏渲染
  function scheduleInit() {
    window.setTimeout(init, 300);
  }

  if (document.readyState === 'complete') {
    scheduleInit();
  } else {
    window.addEventListener('load', scheduleInit, false);
  }
})();
