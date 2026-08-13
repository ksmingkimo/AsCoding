/* ============================================================
   I18n — 多语言核心模块（简 / 繁 / 英）
   gettext 风格：简体中文原文即 key；字典缺失优雅回退原文（简体）。
   依赖：i18n-data.js（I18nData）必须在本文件之后、boot 调用之前加载。
   语言值 = 服务器 LANG_ID_DATA 的 LangTag：'zh-cn' | 'zh-tw' | 'en'。
   ============================================================ */
var I18n = (function() {
  'use strict';

  var LS_KEY   = 'sunlike_lang';        // 用户显式选择的语言（LangTag）
  var LANGS    = ['zh-cn', 'zh-tw', 'en'];
  var FALLBACK = 'zh-cn';

  var _lang    = null;                  // 内存态；boot 前为 null
  var _missing = {};                    // 审计：首次遇到的缺失 key（debug 模式记录）
  var debug    = false;                 // 控制台开启：I18n.debug = true

  // ── Private ──────────────────────────────────────

  /** 归一化语言代码 → 合法 LangTag；非法输入返回 null */
  function normalize(l) {
    if (!l) return null;
    var s = String(l).toLowerCase().replace(/_/g, '-');
    if (LANGS.indexOf(s) !== -1) return s;
    if (s === 'zh' || s === 'zh-hans' || s === 'zh-sg') return 'zh-cn';
    if (s === 'zh-hant' || s === 'zh-hk' || s === 'zh-mo') return 'zh-tw';
    if (s === 'en' || s === 'en-us' || s === 'en-gb' || s === 'en-au') return 'en';
    return null;
  }

  /** OS 语言检测：navigator.language → LangTag（兜底 zh-cn） */
  function detectOSLang() {
    var raw = '';
    if (typeof navigator !== 'undefined') {
      raw = navigator.language || navigator.userLanguage || '';
    }
    var s = String(raw).toLowerCase();
    if (/^zh-(tw|hk|mo|hant)/i.test(s)) return 'zh-tw';
    if (/^zh/i.test(s)) return 'zh-cn';
    if (/^en/i.test(s)) return 'en';
    return FALLBACK;
  }

  /** 初始语言解析：已存偏好（校验）→ OS 检测 → zh-cn */
  function resolveInitial() {
    try {
      var n = normalize(localStorage.getItem(LS_KEY));
      if (n) return n;
    } catch(e) { /* localStorage 不可用（隐私模式等）时忽略 */ }
    return detectOSLang();
  }

  /** 占位符替换：format('第 {0}-{1} 条', [a, b]) */
  function format(key, args) {
    if (!args || args.length === 0) return key;
    return String(key).replace(/\{(\d+)\}/g, function(m, i) {
      var v = args[Number(i)];
      return (v === undefined || v === null) ? m : String(v);
    });
  }

  /** debug 模式：缺失 key 每 (语言+key) 只告警一次 */
  function trackMissing(lang, key) {
    if (!debug) return;
    var id = lang + '::' + key;
    if (!_missing[id]) {
      _missing[id] = true;
      console.warn('[i18n] missing ' + lang + ': "' + key + '"');
    }
  }

  // ── Public ────────────────────────────────────────

  /** 当前语言（LangTag） */
  function getLang() {
    return _lang || resolveInitial();
  }

  /** 设置语言；opts.persist=true 时写入 localStorage */
  function setLang(l, opts) {
    var n = normalize(l);
    if (!n) return getLang();
    _lang = n;
    if (opts && opts.persist) {
      try { localStorage.setItem(LS_KEY, n); } catch(e) {}
    }
    if (document.documentElement) document.documentElement.lang = n;
    try {
      window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: n } }));
    } catch(e) { /* 无 CustomEvent 支持的旧浏览器忽略 */ }
    return n;
  }

  /**
   * 翻译：简体原文 → 当前语言译文；{0}{1}… 按参数替换。
   * 当前语言为 zh-cn 或 key 缺失时，返回原文（含占位符替换）。
   */
  function t(key /*, args... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (!key) return format(key, args);
    var lang = getLang();
    if (lang === FALLBACK) return format(key, args);
    var dict = (typeof I18nData !== 'undefined' && I18nData[lang]) || {};
    var val = dict[key];
    if (val === undefined) { trackMissing(lang, key); return format(key, args); }
    return format(val, args);
  }

  /**
   * 静态文字扫描（约定：data-i18n 只放无子元素的叶子节点，
   * 否则 textContent 会摧毁子元素）：
   *   [data-i18n]             → textContent = t(属性值)
   *   [data-i18n-placeholder] → placeholder = t(属性值)
   *   [data-i18n-title]       → title       = t(属性值)
   *   [data-i18n-aria-label]  → aria-label  = t(属性值)
   */
  function applyStatic(root) {
    var scope = root || document;
    var i;
    var els = scope.querySelectorAll('[data-i18n]');
    for (i = 0; i < els.length; i++) {
      els[i].textContent = t(els[i].getAttribute('data-i18n'));
    }
    var phs = scope.querySelectorAll('[data-i18n-placeholder]');
    for (i = 0; i < phs.length; i++) {
      phs[i].placeholder = t(phs[i].getAttribute('data-i18n-placeholder'));
    }
    var tls = scope.querySelectorAll('[data-i18n-title]');
    for (i = 0; i < tls.length; i++) {
      tls[i].title = t(tls[i].getAttribute('data-i18n-title'));
    }
    var als = scope.querySelectorAll('[data-i18n-aria-label]');
    for (i = 0; i < als.length; i++) {
      als[i].setAttribute('aria-label', t(als[i].getAttribute('data-i18n-aria-label')));
    }
  }

  /** 更新 #langSwitch 按钮的选中态与 aria-checked */
  function initSwitchUI() {
    var sw = document.getElementById('langSwitch');
    if (!sw) return;
    var lang = getLang();
    var btns = sw.querySelectorAll('[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-lang') === lang;
      btns[i].classList.toggle('active', on);
      btns[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  /** 登录页语言切换器：点击 → 持久化 + 全文重扫 + 菜单重渲染 */
  function bindLangSwitch() {
    var sw = document.getElementById('langSwitch');
    if (!sw) return;
    sw.addEventListener('click', function(e) {
      var btn = e.target.closest ? e.target.closest('[data-lang]') : null;
      if (!btn || !sw.contains(btn)) return;
      setLang(btn.getAttribute('data-lang'), { persist: true });
      applyStatic();
      initSwitchUI();
      // 侧边栏为动态渲染，语言变化后即时重渲染
      if (typeof ReportMenu !== 'undefined') ReportMenu.render();
    });
  }

  /**
   * 开发审计（控制台 I18n.audit()）：
   *  (a) 输出缺失 key 汇总；(b) 非 zh-cn 时扫描可见 CJK 文本节点
   *      （排除 ERP 数据区与 AI 回复区）→ 找出绕过 t() 的漏网之鱼。
   */
  function audit() {
    var ids = Object.keys(_missing);
    console.log('[i18n] audit — missing keys: ' + ids.length);
    ids.forEach(function(id) { console.log('  ' + id.replace('::', ' [').replace('$', '] ')); });

    if (getLang() === FALLBACK) {
      console.log('[i18n] audit — 当前为 zh-cn，跳过 DOM CJK 扫描');
      return;
    }
    var EXCLUDE = '#tableBody, .chat-message';
    var hits = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (!node.nodeValue || !/[一-鿿]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var el = node.parentElement;
        if (!el || el.closest(EXCLUDE)) return NodeFilter.FILTER_REJECT;
        // 仅统计可见节点（display:none 的隐藏面板不计）
        var r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      hits.push((n.parentElement.tagName || '?') + ' · ' + n.nodeValue.trim().slice(0, 40));
    }
    console.log('[i18n] audit — 可见 CJK 文本节点: ' + hits.length);
    hits.forEach(function(h) { console.log('  ' + h); });
  }

  /** 启动：解析语言 → 应用静态文字 → 绑定切换器（不写存储） */
  function boot() {
    _lang = resolveInitial();
    setLang(_lang);          // 更新 <html lang>；persist 不写
    applyStatic();
    bindLangSwitch();
    initSwitchUI();
  }

  // ── Expose ────────────────────────────────────────

  var api = {
    boot: boot,
    getLang: getLang,
    setLang: setLang,
    t: t,
    applyStatic: applyStatic,
    detectOSLang: detectOSLang,
    audit: audit,
    LANGS: LANGS,
    LS_KEY: LS_KEY
  };
  // debug 暴露为可写属性（I18n.debug = true）
  Object.defineProperty(api, 'debug', {
    get: function() { return debug; },
    set: function(v) { debug = !!v; }
  });
  return api;

})();
