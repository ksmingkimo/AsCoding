/**
 * utils.js — 通用工具模块
 * 提供：Toast 通知、HTML 转义、时间格式化、剪贴板操作
 * 依赖：无外部依赖，仅浏览器 DOM API
 */

var Utils = (function() {
  'use strict';

  var _toastTimer = null;

  /**
   * 显示 Toast 消息（右下角浮现，3 秒自动消失）
   * @param {string} msg - 消息文本
   * @param {string} [type='success'] - 类型：'success' | 'error' | 'warning'
   */
  function showToast(msg, type) {
    var t = document.getElementById('toast');
    if (!t) return;

    // 清除上一个定时器，避免旧 toast 意外关闭新 toast
    if (_toastTimer) {
      clearTimeout(_toastTimer);
      _toastTimer = null;
    }

    // 如果当前有 toast 显示中，先隐藏再显示新消息（避免生硬跳变）
    if (t.classList.contains('visible')) {
      t.classList.remove('visible');
      setTimeout(function() {
        _showToastNow(t, msg, type);
      }, 280); // 等待滑出动画完成（略短于 CSS transition 300ms）
    } else {
      _showToastNow(t, msg, type);
    }
  }

  function _showToastNow(t, msg, type) {
    t.textContent = msg;
    t.className = 'toast toast-' + (type || 'success') + ' visible';
    _toastTimer = setTimeout(function() {
      t.classList.remove('visible');
      _toastTimer = null;
    }, 3000);
  }

  /**
   * HTML 转义，防止 XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /**
   * 格式化 ISO 时间字符串为可读格式
   * @param {string} isoStr
   * @returns {string} "YYYY-MM-DD HH:mm"
   */
  function formatTime(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  }

  /**
   * 复制文本到剪贴板（优先使用现代 Clipboard API）
   * @param {string} text
   */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast(I18n.t('已复制到剪贴板'));
      }).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  /**
   * 降级复制方案（textarea + execCommand）
   * @param {string} text
   */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(I18n.t('已复制到剪贴板'));
    } catch (e) {
      showToast(I18n.t('复制失败，请手动选择文本'), 'error');
    }
    document.body.removeChild(ta);
  }

  /* ================================================================
     Public API
     ================================================================ */
  /**
   * 深拷贝对象（JSON 序列化方式）
   * @param {*} obj
   * @returns {*}
   */
  function deepClone(obj) {
    if (obj === undefined || obj === null) return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      return obj;
    }
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    showToast: showToast,
    escapeHtml: escapeHtml,
    formatTime: formatTime,
    copyToClipboard: copyToClipboard,
    fallbackCopy: fallbackCopy,
    deepClone: deepClone
  };

})();
