/**
 * ai-suggestions.js — AI 推荐提问模块
 * 负责：根据数据源列表，调用 AI 动态生成推荐问题
 * 依赖：AIClient, Utils
 */

var AISuggestions = (function() {
  'use strict';

  var isLoading = false;

  /* ================================================================
     UI — 面板显示/隐藏/渲染
     ================================================================ */

  function showPanel() {
    if (isLoading) return;

    var panel = document.getElementById('suggestionsPanel');
    var body = document.getElementById('suggestionsBody');
    var btn = document.getElementById('btnBrain');
    if (!panel || !body) return;

    // 如果已显示，关闭
    if (panel.classList.contains('visible')) {
      hidePanel();
      return;
    }

    isLoading = true;
    if (btn) btn.disabled = true;
    panel.classList.add('visible');
    body.innerHTML = '<div class="suggestions-loading">⏳ ' + I18n.t('正在分析数据源，生成推荐问题...') + '</div>';

    AIClient.suggestQuestions(function(err, questions) {
      isLoading = false;
      if (btn) btn.disabled = false;

      if (err) {
        body.innerHTML = '<div class="suggestions-loading" style="color:var(--color-error)">❌ ' +
          Utils.escapeHtml(err) + '</div>';
        return;
      }

      if (!questions || questions.length === 0) {
        body.innerHTML = '<div class="suggestions-loading">' + I18n.t('暂无推荐，请尝试更换数据源') + '</div>';
        return;
      }

      renderQuestions(questions);
    });
  }

  function hidePanel() {
    var panel = document.getElementById('suggestionsPanel');
    if (panel) panel.classList.remove('visible');
  }

  function renderQuestions(questions) {
    var body = document.getElementById('suggestionsBody');
    if (!body) return;

    var icons = ['📊', '📈', '🔍', '⚡', '💡'];
    var html = '<div class="suggestions-list">';
    questions.forEach(function(q, i) {
      var icon = icons[i % icons.length];
      // 用 data-index 避免属性注入，取问题时从数组索引拿
      html += '<button class="suggestion-item" data-idx="' + i + '">' +
        '<span class="suggestion-icon">' + icon + '</span>' +
        Utils.escapeHtml(q) + '</button>';
    });
    html += '</div>';
    body.innerHTML = html;

    // 绑定点击事件，用闭包捕获 questions 数组
    body.querySelectorAll('.suggestion-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (!isNaN(idx) && questions[idx]) {
          fillInput(questions[idx]);
        }
      });
    });
  }

  function fillInput(question) {
    var chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = question;
      chatInput.focus();
      // 触发 input 事件调整高度
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    hidePanel();
  }

  /* ================================================================
     Init — 绑定大脑按钮事件
     ================================================================ */

  function init() {
    var btnBrain = document.getElementById('btnBrain');
    var btnClose = document.getElementById('btnSuggestionsClose');

    if (btnBrain) {
      btnBrain.addEventListener('click', showPanel);
    }

    if (btnClose) {
      btnClose.addEventListener('click', hidePanel);
    }

    // 点击面板外部关闭
    document.addEventListener('click', function(e) {
      var panel = document.getElementById('suggestionsPanel');
      if (!panel || !panel.classList.contains('visible')) return;
      var btnBrain = document.getElementById('btnBrain');
      // 不是面板内、也不是大脑按钮 → 关闭
      if (!panel.contains(e.target) && e.target !== btnBrain && !(btnBrain && btnBrain.contains(e.target))) {
        hidePanel();
      }
    });

    // ESC 关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var panel = document.getElementById('suggestionsPanel');
        if (panel && panel.classList.contains('visible')) {
          hidePanel();
        }
      }
    });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    show: showPanel,
    hide: hidePanel,
    init: init
  };

})();
