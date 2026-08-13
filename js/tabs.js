/**
 * tabs.js — Tab 页签切换模块
 * 负责：数据查询 / AI数据分析 两个 Tab 的切换逻辑
 * 依赖：DatasourceList（切换到 AI Tab 时自动刷新数据源列表）
 */

var Tabs = (function() {
  'use strict';

  /**
   * 切换到指定 Tab
   * @param {string} tabId - 'tabQuery' 或 'tabAI'
   */
  function switchTab(tabId) {
    // 更新 tab 按钮激活态
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // 更新 tab 面板显示
    document.querySelectorAll('.tab-panel').forEach(function(panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });

    // 切换到 AI Tab 时刷新数据源列表
    if (tabId === 'tabAI') {
      DatasourceList.renderDataSourceList();
    }

    // 切换到记事本 Tab 时刷新事件列表
    if (tabId === 'tabNotepad' && typeof NotepadUI !== 'undefined') {
      NotepadUI.render();
    }
  }

  /**
   * 绑定 Tab 按钮点击事件（在 DOM ready 后调用）
   */
  function init() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        switchTab(this.getAttribute('data-tab'));
      });
    });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    switchTab: switchTab,
    init: init
  };

})();
