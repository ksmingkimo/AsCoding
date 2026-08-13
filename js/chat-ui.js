/**
 * chat-ui.js — Chat 界面渲染模块
 * 负责：消息气泡创建、操作按钮添加、欢迎语显隐、滚动控制
 * 依赖：Utils
 */

var ChatUI = (function() {
  'use strict';

  /**
   * 获取 Chat 消息容器（延迟查询，调用时才查 DOM）
   * @returns {HTMLElement|null}
   */
  function getContainer() {
    return document.getElementById('chatMessages');
  }

  /**
   * 获取欢迎语元素
   * @returns {HTMLElement|null}
   */
  function getWelcome() {
    return document.getElementById('chatWelcome');
  }

  /**
   * 隐藏欢迎语
   */
  function hideWelcome() {
    var el = getWelcome();
    if (el) { el.style.display = 'none'; }
  }

  /**
   * 显示欢迎语
   */
  function showWelcome() {
    var el = getWelcome();
    if (el) { el.style.display = ''; }
  }

  /**
   * 添加消息气泡
   * @param {string} role - 'user' | 'assistant'
   * @param {string} content - HTML 内容
   * @param {string} [msgId] - 可选的 DOM ID
   * @returns {HTMLElement} 创建的消息元素
   */
  function addMessageBubble(role, content, msgId) {
    hideWelcome();
    var container = getContainer();
    if (!container) return document.createElement('div');

    var div = document.createElement('div');
    div.className = 'chat-message ' + (role === 'user' ? 'user' : 'assistant');
    if (msgId) { div.id = msgId; }
    div.innerHTML = '<div class="msg-bubble">' + content + '</div>';
    container.appendChild(div);
    scrollToBottom();
    return div;
  }

  /**
   * 添加操作按钮组（复制 / 延申问答 / 导出 Excel / 导出 HTML / 导出 PPTX）
   * @param {HTMLElement} msgDiv - 消息容器元素
   * @param {string} rawText - 原始回复文本
   */
  function addActionButtons(msgDiv, rawText) {
    var actions = document.createElement('div');
    actions.className = 'msg-actions';
    actions.innerHTML =
      '<button class="action-btn" data-action="copy" title="' + I18n.t('复制回复内容') + '">📋 ' + I18n.t('复制') + '</button>' +
      '<button class="action-btn" data-action="extend" title="' + I18n.t('基于此回复继续提问') + '">💬 ' + I18n.t('延申问答') + '</button>' +
      '<button class="action-btn" data-action="excel" title="' + I18n.t('导出为 Excel') + '">📥 Excel</button>' +
      '<button class="action-btn" data-action="html" title="' + I18n.t('导出为 HTML 报告') + '">📄 HTML</button>' +
      '<button class="action-btn" data-action="pdf" title="' + I18n.t('导出为 PDF（浏览器打印）') + '">📑 PDF</button>' +
      '<button class="action-btn" data-action="pptx" title="' + I18n.t('导出为 PPTX（真正的 PowerPoint）') + '">📊 PPTX</button>';

    // 复制按钮
    actions.querySelector('[data-action="copy"]').addEventListener('click', function() {
      Utils.copyToClipboard(rawText);
    });

    // 延申问答按钮
    actions.querySelector('[data-action="extend"]').addEventListener('click', function() {
      var input = document.getElementById('chatInput');
      if (input) {
        input.value = I18n.t('请进一步分析上述结论，找出更多洞察和细节');
        input.focus();
      }
    });

    // Excel 导出按钮 — 延迟依赖 Export 模块
    actions.querySelector('[data-action="excel"]').addEventListener('click', function() {
      if (typeof Export !== 'undefined' && Export.toExcel) {
        Export.toExcel(rawText);
      } else {
        Utils.showToast(I18n.t('导出模块未加载'), 'error');
      }
    });

    // HTML 导出按钮 — 延迟依赖 Export 模块
    actions.querySelector('[data-action="html"]').addEventListener('click', function() {
      if (typeof Export !== 'undefined' && Export.toHTML) {
        Export.toHTML(rawText, msgDiv);
      } else {
        Utils.showToast(I18n.t('导出模块未加载'), 'error');
      }
    });

    // PDF 导出按钮 — 内容与 HTML 一致，通过浏览器打印为 PDF
    actions.querySelector('[data-action="pdf"]').addEventListener('click', function() {
      if (typeof Export !== 'undefined' && Export.toPDF) {
        Export.toPDF(rawText, msgDiv);
      } else {
        Utils.showToast(I18n.t('导出模块未加载'), 'error');
      }
    });

    // PPTX 导出按钮 — 生成真正的 .pptx 文件
    actions.querySelector('[data-action="pptx"]').addEventListener('click', function() {
      if (typeof Export !== 'undefined' && Export.toPPTX) {
        Export.toPPTX(rawText, msgDiv);
      } else {
        Utils.showToast(I18n.t('导出模块未加载'), 'error');
      }
    });

    msgDiv.appendChild(actions);
  }

  /**
   * 滚动 Chat 消息列表到底部
   */
  function scrollToBottom() {
    var container = getContainer();
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * 清空所有已渲染的聊天消息（保留欢迎语）
   */
  function clearAllMessages() {
    var container = getContainer();
    if (!container) return;
    // 移除所有 .chat-message 元素
    container.querySelectorAll('.chat-message').forEach(function(msg) {
      msg.remove();
    });
    showWelcome();
  }

  /**
   * 从聊天历史数组重新渲染整个对话
   * @param {Array<{role: string, content: string}>} chatHistory
   */
  function renderHistory(chatHistory) {
    if (!chatHistory || chatHistory.length === 0) return;

    hideWelcome();

    chatHistory.forEach(function(msg) {
      var escapedContent = Utils.escapeHtml(msg.content).replace(/\n/g, '<br>');
      var msgDiv = addMessageBubble(msg.role, escapedContent);

      // 对 assistant 消息：重新解析内容（表格、图表等）并添加操作按钮
      if (msg.role === 'assistant' && typeof AIParser !== 'undefined') {
        // 替换气泡内容为解析后的 HTML
        var parsed = AIParser.parse(msg.content);
        var bubble = msgDiv.querySelector('.msg-bubble');
        if (bubble && parsed && parsed.html) {
          bubble.innerHTML = parsed.html;
        }
        // 添加操作按钮
        addActionButtons(msgDiv, msg.content);
        // 渲染图表
        if (parsed && parsed.charts && parsed.charts.length > 0 && typeof AIChart !== 'undefined') {
          parsed.charts.forEach(function(chartConfig, i) {
            AIChart.render(msgDiv, chartConfig, i);
          });
        }
      }
    });

    scrollToBottom();
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    hideWelcome: hideWelcome,
    showWelcome: showWelcome,
    addMessageBubble: addMessageBubble,
    addActionButtons: addActionButtons,
    scrollToBottom: scrollToBottom,
    clearAllMessages: clearAllMessages,
    renderHistory: renderHistory
  };

})();
