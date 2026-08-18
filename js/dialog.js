/* ============================================================
   Dialog — 应用内 confirm / prompt 弹窗
   替代原生 confirm()/prompt()：原生弹窗的按钮语言跟随浏览器 OS，
   会破坏「选英文后所有界面文字都是英文」的承诺。
   Promise API；消息 textContent 防注入；Enter 确认 / Esc 取消；
   关闭后焦点回归触发元素；按钮带 data-i18n 可随语言即时刷新。
   样式：复用 ai-analysis.css 的 .modal-* 体系 + .dialog-card/.btn-danger。
   依赖：I18n（可选——缺失时按钮回退简体）；CSS 的 .modal-* 类。
   ============================================================ */
var Dialog = (function() {
  'use strict';

  /** 翻译（I18n 未加载时回退原文，保证模块可独立使用） */
  function _t(key) {
    return (typeof I18n !== 'undefined' && I18n.t) ? I18n.t(key) : key;
  }

  /** 关闭所有 Dialog 实例（同一时刻只允许一个） */
  function _removeExisting() {
    var el = document.querySelector('.dialog-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /** 构建骨架：overlay → card → body；返回 body */
  function _build() {
    var ov = document.createElement('div');
    ov.className = 'modal-overlay dialog-overlay';
    var card = document.createElement('div');
    card.className = 'modal-card dialog-card';
    var body = document.createElement('div');
    body.className = 'modal-body';
    card.appendChild(body);
    ov.appendChild(card);
    document.body.appendChild(ov);
    return { overlay: ov, body: body };
  }

  /** body 下追加 footer，返回 footer */
  function _footer(body) {
    var f = document.createElement('div');
    f.className = 'modal-footer';
    body.parentNode.appendChild(f);
    return f;
  }

  /** 按钮：data-i18n 属性让 I18n.applyStatic 语言切换时自动刷新 */
  function _btn(labelKey, cls, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('data-i18n', labelKey);
    b.textContent = _t(labelKey);
    b.addEventListener('click', onClick);
    return b;
  }

  /** Esc 取消；Enter 确认（prompt 输入框内 Enter 由自身冒泡到这里，同样确认） */
  function _bindKeys(overlay, onEnter, onEsc) {
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onEsc(); }
      else if (e.key === 'Enter') { e.stopPropagation(); onEnter(); }
    });
  }

  /** 点击遮罩空白处 = 取消（mousedown 防止从卡片内拖出误触发 click） */
  function _bindBackdrop(overlay, onCancel) {
    overlay.addEventListener('mousedown', function(e) {
      if (e.target === overlay) onCancel();
    });
  }

  /** 关闭：移除 DOM → 焦点回归触发元素 → resolve */
  function _close(overlay, lastFocus, resolve, value) {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch(e) {}
    }
    resolve(value);
  }

  /**
   * 确认弹窗：确认 → true；取消/Esc/点遮罩 → false。
   * opts.danger=true 时确认按钮为红色（删除类操作）。
   */
  function confirm(message, opts) {
    opts = opts || {};
    return new Promise(function(resolve) {
      _removeExisting();
      var lastFocus = document.activeElement;
      var ui = _build();
      var msg = document.createElement('p');
      msg.className = 'dialog-message';
      msg.textContent = message;
      ui.body.appendChild(msg);
      var footer = _footer(ui.body);
      var okCls = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
      var ok = _btn('确定', okCls, function() { _close(ui.overlay, lastFocus, resolve, true); });
      var cancel = _btn('取消', 'btn btn-secondary', function() { _close(ui.overlay, lastFocus, resolve, false); });
      footer.appendChild(ok);
      footer.appendChild(cancel);
      _bindKeys(ui.overlay, function() { _close(ui.overlay, lastFocus, resolve, true); },
                           function() { _close(ui.overlay, lastFocus, resolve, false); });
      _bindBackdrop(ui.overlay, function() { _close(ui.overlay, lastFocus, resolve, false); });
      ok.focus();
    });
  }

  /**
   * 输入弹窗：确认 → 输入值（可空串）；取消/Esc/点遮罩 → null。
   * opts.value 为输入框初始值；opts.maxLength 限制长度。
   */
  function prompt(message, opts) {
    opts = opts || {};
    return new Promise(function(resolve) {
      _removeExisting();
      var lastFocus = document.activeElement;
      var ui = _build();
      var msg = document.createElement('p');
      msg.className = 'dialog-message';
      msg.textContent = message;
      ui.body.appendChild(msg);
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input dialog-input';
      if (opts.value !== undefined) input.value = opts.value;
      if (opts.maxLength) input.maxLength = opts.maxLength;
      ui.body.appendChild(input);
      var footer = _footer(ui.body);
      var ok = _btn('确定', 'btn btn-primary', function() { _close(ui.overlay, lastFocus, resolve, input.value); });
      var cancel = _btn('取消', 'btn btn-secondary', function() { _close(ui.overlay, lastFocus, resolve, null); });
      footer.appendChild(ok);
      footer.appendChild(cancel);
      _bindKeys(ui.overlay, function() { _close(ui.overlay, lastFocus, resolve, input.value); },
                           function() { _close(ui.overlay, lastFocus, resolve, null); });
      _bindBackdrop(ui.overlay, function() { _close(ui.overlay, lastFocus, resolve, null); });
      input.focus();
      input.select();
    });
  }

  /**
   * 警告弹窗：单按钮「确定」；Enter/Esc/点遮罩均可关闭。
   * @param {string} message
   * @returns {Promise<void>}
   */
  function alert(message) {
    return new Promise(function(resolve) {
      _removeExisting();
      var lastFocus = document.activeElement;
      var ui = _build();
      var msg = document.createElement('p');
      msg.className = 'dialog-message';
      msg.textContent = message;
      ui.body.appendChild(msg);
      var footer = _footer(ui.body);
      var close = function() { _close(ui.overlay, lastFocus, resolve, undefined); };
      var ok = _btn('确定', 'btn btn-primary', close);
      footer.appendChild(ok);
      _bindKeys(ui.overlay, close, close);
      _bindBackdrop(ui.overlay, close);
      ok.focus();
    });
  }

  return {
    confirm: confirm,
    prompt: prompt,
    alert: alert
  };
})();
