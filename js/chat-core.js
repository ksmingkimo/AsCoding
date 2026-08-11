/**
 * chat-core.js — Chat 对话核心逻辑模块
 * 负责：发送消息流程编排（校验→调 AI→解析→渲染→操作按钮）
 * 依赖：ChatUI, AIClient, AIParser, AIChart, SettingsStore, DataSourceStore, Utils
 */

var ChatCore = (function() {
  'use strict';

  var isStreaming = false;

  /**
   * 发送聊天消息（完整流程）
   */
  function sendChatMessage() {
    if (isStreaming) return;

    var chatInput = document.getElementById('chatInput');
    var btnSend = document.getElementById('btnSend');
    if (!chatInput) return;

    var text = chatInput.value.trim();
    if (!text) return;

    // 校验 API Key（AIClient 内部也会校验，这里提前提示）
    var apiKey = SettingsStore.getAIKey();
    if (!apiKey) {
      Utils.showToast('请先在系统设置中配置 API Key', 'error');
      if (typeof SettingsUI !== 'undefined') SettingsUI.open();
      return;
    }

    // 校验数据源
    var sources = DataSourceStore.getAll();
    if (sources.length === 0) {
      Utils.showToast('请先在数据查询中转入数据源', 'error');
      return;
    }

    // 清空输入框
    chatInput.value = '';
    chatInput.style.height = 'auto';
    isStreaming = true;
    if (btnSend) btnSend.disabled = true;

    // 显示用户消息
    ChatUI.addMessageBubble('user', Utils.escapeHtml(text).replace(/\n/g, '<br>'));

    // 同步到 AppState（如果存在）
    if (window.AppState && window.AppState.chatHistory) {
      window.AppState.chatHistory.push({ role: 'user', content: text });
    }

    // 显示加载动画
    var loadingId = 'msg-loading-' + Date.now();
    var loadingDiv = ChatUI.addMessageBubble('assistant',
      '<div class="typing-indicator"><span></span><span></span><span></span></div>',
      loadingId);
    if (loadingDiv) loadingDiv.classList.add('loading');

    // 调用 AI（AIClient 自动根据设置选择 provider + key）
    AIClient.call(text, [], function(err, fullResponse) {
      isStreaming = false;
      if (btnSend) btnSend.disabled = false;

      // 移除加载动画
      var loadEl = document.getElementById(loadingId);
      if (loadEl) { loadEl.remove(); }

      if (err) {
        ChatUI.addMessageBubble('assistant',
          '<span style="color:var(--color-error)">❌ ' + Utils.escapeHtml(err) + '</span>');
        return;
      }

      // 解析回复
      var parsed = AIParser.parse(fullResponse);
      var msgDiv = ChatUI.addMessageBubble('assistant', parsed.html);

      // 同步到 AppState
      if (window.AppState && window.AppState.chatHistory) {
        window.AppState.chatHistory.push({ role: 'assistant', content: fullResponse });
      }

      // 渲染图表
      if (parsed.charts && parsed.charts.length > 0) {
        parsed.charts.forEach(function(chartConfig, i) {
          AIChart.render(msgDiv, chartConfig, i);
        });
      }

      // 添加操作按钮
      ChatUI.addActionButtons(msgDiv, fullResponse);
    });
  }

  /**
   * 绑定 Chat 输入框和发送按钮事件（在 DOM ready 后调用）
   */
  function init() {
    var chatInput = document.getElementById('chatInput');
    var btnSend = document.getElementById('btnSend');

    if (chatInput) {
      // 自适应高度
      chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });

      // Enter 发送 (Shift+Enter 换行)
      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChatMessage();
        }
      });
    }

    if (btnSend) {
      btnSend.addEventListener('click', sendChatMessage);
    }
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    send: sendChatMessage,
    init: init
  };

})();
