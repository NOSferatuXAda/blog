/*!
 * Surreal message board
 * ------------------------------------------------------------
 * 后端：Supabase Postgres + REST + RLS（匿名 anon key，前端不接触 service_role）
 * 未配置 Supabase 时自动进入「演示模式」：数据仅保存在当前浏览器 localStorage。
 * 与公告弹窗、波场背景完全解耦：独立 IIFE / 独立 DOM 作用域 / 无全局变量冲突。
 */
(function () {
  'use strict';

  var root = document.getElementById('surreal-message');
  if (!root) return;

  var CONFIG = window.__SURREAL_MESSAGE__ || {};
  var TABLE = CONFIG.table || 'messages';
  var MAX_LENGTH = CONFIG.maxLength || 500;
  var DEMO_KEY = 'surreal-message-demo';
  var LAST_KEY = 'surreal-message-last';
  var COOLDOWN = 10000;
  var configured = !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);

  var form = root.querySelector('#surreal-message-form');
  var namedInput = root.querySelector('#surreal-message-named');
  var nameField = root.querySelector('[data-name-field]');
  var nameInput = root.querySelector('#surreal-message-name');
  var contentInput = root.querySelector('#surreal-message-content');
  var websiteInput = root.querySelector('#surreal-message-website');
  var counter = root.querySelector('[data-counter]');
  var switchLabel = root.querySelector('[data-switch-label]');
  var submitBtn = root.querySelector('.surreal-message-form__submit');
  var statusEl = root.querySelector('#surreal-message-status');
  var itemsEl = root.querySelector('#surreal-message-items');
  var emptyEl = root.querySelector('[data-empty]');
  var loadingEl = root.querySelector('[data-loading]');
  var countEl = root.querySelector('[data-count]');
  var noticeEl = root.querySelector('[data-mode-notice]');

  var submitting = false;
  var lastSubmit = 0;

  /* ---------------- 工具函数 ---------------- */

  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function pad3(num) {
    var s = String(num);
    while (s.length < 3) s = '0' + s;
    return s;
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.getFullYear() + '.' + pad2(date.getMonth() + 1) + '.' + pad2(date.getDate()) +
      ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
  }

  function setStatus(text, kind) {
    statusEl.textContent = text || '';
    statusEl.className = 'surreal-message-form__status' +
      (kind ? ' is-' + kind : '');
  }

  function getStored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function setStored(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* 隐私模式下静默失败 */
    }
  }

  function removeStored(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      /* ignore */
    }
  }

  /* ---------------- 网络层（fetch + XHR 兜底） ---------------- */

  function request(method, url, body, headers) {
    return new Promise(function (resolve, reject) {
      if (window.fetch) {
        window.fetch(url, {
          method: method,
          headers: headers || {},
          body: body ? JSON.stringify(body) : undefined,
          cache: 'no-store',
          credentials: 'same-origin'
        })
          .then(function (response) {
            return response.text().then(function (text) {
              var data = null;
              try { data = text ? JSON.parse(text) : null; } catch (err) { data = text; }
              if (!response.ok) {
                var message = data && (data.message || data.hint || data.error_description);
                reject(new Error(message || ('HTTP ' + response.status)));
                return;
              }
              resolve(data);
            });
          })
          .catch(reject);
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      Object.keys(headers || {}).forEach(function (key) {
        xhr.setRequestHeader(key, headers[key]);
      });
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        var data = null;
        try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch (err) { data = xhr.responseText; }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error((data && (data.message || data.hint)) || ('HTTP ' + xhr.status)));
      };
      xhr.onerror = function () { reject(new Error('Network error')); };
      xhr.send(body ? JSON.stringify(body) : null);
    });
  }

  function apiBase() {
    return String(CONFIG.supabaseUrl || '').replace(/\/+$/, '') +
      '/rest/v1/' + encodeURIComponent(TABLE);
  }

  function apiHeaders(extra) {
    var headers = {
      apikey: CONFIG.supabaseAnonKey,
      Authorization: 'Bearer ' + CONFIG.supabaseAnonKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        headers[key] = extra[key];
      });
    }
    return headers;
  }

  function fetchMessages() {
    if (!configured) {
      return Promise.resolve(readDemoMessages());
    }

    var url = apiBase() +
      '?select=id,name,anonymous,content,created_at' +
      '&order=created_at.desc&limit=100';

    return request('GET', url, null, apiHeaders()).then(function (rows) {
      return Array.isArray(rows) ? rows : [];
    });
  }

  function postMessage(payload) {
    if (!configured) {
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          var messages = readDemoMessages();
          messages.unshift({
            id: 'demo-' + Date.now(),
            name: payload.name,
            anonymous: payload.anonymous,
            content: payload.content,
            created_at: new Date().toISOString()
          });
          messages = messages.slice(0, 100);
          setStored(DEMO_KEY, JSON.stringify(messages));
          resolve(messages[0]);
        }, 240);
      });
    }

    return request('POST', apiBase(), payload, apiHeaders({
      Prefer: 'return=representation'
    })).then(function (rows) {
      return Array.isArray(rows) && rows.length ? rows[0] : payload;
    });
  }

  /* ---------------- 演示模式 ---------------- */

  function readDemoMessages() {
    var raw = getStored(DEMO_KEY);
    if (!raw) return [];
    try {
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list.sort(function (a, b) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } catch (err) {
      return [];
    }
  }

  /* ---------------- 渲染列表 ---------------- */

  function createMessageCard(item, total, index) {
    var anonymous = item.anonymous === true;
    var card = document.createElement('article');
    card.className = 'surreal-message-card';

    var meta = document.createElement('header');
    meta.className = 'surreal-message-card__meta';

    var number = document.createElement('span');
    number.className = 'surreal-message-card__index';
    number.textContent = '#' + pad3(total - index);

    var time = document.createElement('time');
    time.className = 'surreal-message-card__time';
    if (item.created_at) time.setAttribute('datetime', item.created_at);
    time.textContent = formatDate(item.created_at);

    meta.appendChild(number);
    meta.appendChild(time);

    var name = document.createElement('p');
    name.className = 'surreal-message-card__name' + (anonymous ? ' is-anon' : '');
    name.textContent = anonymous ? '匿名用户' : (item.name || '匿名用户');

    if (anonymous) {
      var badge = document.createElement('span');
      badge.className = 'surreal-message-card__badge';
      badge.textContent = 'ANON';
      name.appendChild(badge);
    }

    var body = document.createElement('p');
    body.className = 'surreal-message-card__body';
    body.textContent = item.content || '';

    card.appendChild(meta);
    card.appendChild(name);
    card.appendChild(body);
    return card;
  }

  function renderMessages(messages) {
    var list = Array.isArray(messages) ? messages.slice() : [];

    list.sort(function (a, b) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    itemsEl.textContent = '';

    list.forEach(function (item, index) {
      itemsEl.appendChild(createMessageCard(item, list.length, index));
    });

    countEl.textContent = list.length + ' 条';
    emptyEl.hidden = list.length !== 0;
    loadingEl.hidden = true;
  }

  function loadMessages() {
    loadingEl.hidden = false;

    fetchMessages()
      .then(function (messages) {
        renderMessages(messages);
      })
      .catch(function (err) {
        loadingEl.hidden = true;
        setStatus('留言列表读取失败：' + (err && err.message ? err.message : '未知错误'), 'error');
      });
  }

  /* ---------------- 表单交互 ---------------- */

  function syncNameField() {
    var named = namedInput.checked;

    nameField.hidden = !named;
    nameInput.disabled = !named;
    switchLabel.textContent = named ? '留名' : '匿名';

    if (!named) nameInput.value = '';
  }

  function updateCounter() {
    var length = contentInput.value.length;
    counter.textContent = length + ' / ' + MAX_LENGTH;
    counter.className = 'surreal-message-form__counter' +
      (length > MAX_LENGTH - 40 ? ' is-near-limit' : '');
  }

  function validate(named, name, content) {
    if (!content) {
      return '留言内容不能为空。';
    }
    if (content.length > MAX_LENGTH) {
      return '留言不能超过 ' + MAX_LENGTH + ' 个字符。';
    }
    if (named && !name) {
      return '你选择了留名，请填写名字。';
    }
    if (named && name.length > 20) {
      return '名字不能超过 20 个字符。';
    }
    return '';
  }

  function handleSubmit() {
    if (submitting) return;

    if (websiteInput.value) {
      // 蜜罐命中：假装成功，不发送
      setStatus('留言已发布。', 'success');
      return;
    }

    var named = namedInput.checked;
    var name = named ? nameInput.value.trim() : '';
    var content = contentInput.value.trim();
    var error = validate(named, name, content);

    if (error) {
      setStatus(error, 'error');
      if (!content) contentInput.focus();
      else if (named && !name) nameInput.focus();
      return;
    }

    var now = Date.now();
    if (lastSubmit && now - lastSubmit < COOLDOWN) {
      setStatus('刚刚提交过，请稍后再试。', 'error');
      return;
    }

    submitting = true;
    submitBtn.disabled = true;
    setStatus('发送中…', '');

    postMessage({
      name: named ? name : null,
      anonymous: !named,
      content: content
    })
      .then(function () {
        lastSubmit = Date.now();
        setStored(LAST_KEY, String(lastSubmit));
        contentInput.value = '';
        updateCounter();
        setStatus('留言已发布。', 'success');
        loadMessages();
      })
      .catch(function (err) {
        setStatus('发送失败：' + (err && err.message ? err.message : '请稍后再试'), 'error');
      })
      .then(function () {
        submitting = false;
        submitBtn.disabled = false;
      });
  }

  /* ---------------- 初始化 ---------------- */

  lastSubmit = parseInt(getStored(LAST_KEY) || '0', 10) || 0;

  namedInput.addEventListener('change', syncNameField);
  contentInput.addEventListener('input', updateCounter);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSubmit();
  });

  syncNameField();
  updateCounter();

  if (!configured) {
    noticeEl.hidden = false;
    noticeEl.textContent = '演示模式：留言只保存在当前浏览器，仅本机可见。配置 Supabase 后，所有访客都能看到并留言（接入步骤见 README「留言板」章节）。';
  }

  loadMessages();

  // 调试/测试钩子（不参与页面逻辑，不与其它功能冲突）
  window.__SURREAL_MESSAGE_APP__ = {
    isConfigured: function () { return configured; },
    refresh: loadMessages,
    clearDemo: function () { removeStored(DEMO_KEY); removeStored(LAST_KEY); lastSubmit = 0; loadMessages(); }
  };
})();
