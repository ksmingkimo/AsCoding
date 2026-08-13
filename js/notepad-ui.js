/**
 * notepad-ui.js — 记事本 UI 模块
 * 负责：事件卡片渲染、保存/加载/删除交互
 * 依赖：NotepadStore、DataSourceStore、DatasourceList、ChatUI、Tabs、Utils
 */

var NotepadUI = (function() {
  'use strict';

  /**
   * 渲染记事本事件卡片列表
   */
  function render() {
    var npList = document.getElementById('notepadList');
    var npEmpty = document.getElementById('notepadEmpty');
    if (!npList) return;

    var events = NotepadStore.getAll();

    // 移除现有卡片（保留空状态元素）
    npList.querySelectorAll('.notepad-card').forEach(function(c) { c.remove(); });

    if (events.length === 0) {
      if (npEmpty) npEmpty.style.display = '';
      return;
    }

    if (npEmpty) npEmpty.style.display = 'none';

    events.forEach(function(event) {
      var card = document.createElement('div');
      card.className = 'notepad-card';
      card.setAttribute('data-note-id', event.id);

      // 构建数据源描述
      var dsDesc = '';
      if (event.dataSource) {
        dsDesc = Utils.escapeHtml(event.dataSource.reportName || '未知报表');
        if (event.dataSource.filterSummary) {
          dsDesc += ' — ' + Utils.escapeHtml(event.dataSource.filterSummary);
        }
        if (event.dataSource.recordCount) {
          dsDesc += ', ' + event.dataSource.recordCount.toLocaleString() + '条记录';
        }
      }

      var convCount = event.conversationCount || 0;

      card.innerHTML =
        '<button class="np-delete" title="删除此事件">&times;</button>' +
        '<div class="np-title">' + Utils.escapeHtml(event.title || '未命名事件') + '</div>' +
        '<div class="np-source">' +
          '<span class="np-source-label">数据源</span>' +
          '<span>' + (dsDesc || '无') + '</span>' +
        '</div>' +
        '<div class="np-source">' +
          '<span class="np-source-label">对话</span>' +
          '<span>' + convCount + ' 轮对话</span>' +
        '</div>' +
        '<div class="np-time">' + Utils.formatTime(event.createdAt) + '</div>';

      // 点击卡片 → 加载事件
      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('np-delete')) return;
        loadEvent(event.id);
      });

      // 删除按钮
      var delBtn = card.querySelector('.np-delete');
      if (delBtn) {
        delBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          deleteEvent(event.id);
        });
      }

      npList.appendChild(card);
    });
  }

  /**
   * 保存当前数据源 + 对话到记事本
   */
  function saveCurrent() {
    try {
      var activeDSId = window.AppState ? window.AppState.activeDSId : null;

      // 如果没有活跃 ID，尝试自动选择
      if (!activeDSId) {
        var allDS = DataSourceStore.getAll();
        // 过滤掉 loading/error 状态的
        var readyDS = allDS.filter(function(ds) { return ds.status === 'ready' || !ds.status; });
        if (readyDS.length === 1) {
          activeDSId = readyDS[0].id;
          if (window.AppState) window.AppState.activeDSId = activeDSId;
        } else if (readyDS.length > 1) {
          // 多个数据源但没选中：自动选第一个
          activeDSId = readyDS[0].id;
          if (window.AppState) window.AppState.activeDSId = activeDSId;
        }
      }

      if (!activeDSId) {
        Utils.showToast('请先在数据源面板中选择一个数据源', 'warning');
        return;
      }

      var chatHistory = window.AppState ? window.AppState.chatHistory : [];
      if (!chatHistory || chatHistory.length === 0) {
        Utils.showToast('暂无对话内容可保存', 'warning');
        return;
      }

      var dataSource = DataSourceStore.getById(activeDSId);
      if (!dataSource) {
        Utils.showToast('未找到选中的数据源', 'error');
        return;
      }

      // 弹出命名对话框
      var defaultName = (dataSource.reportName || '未知报表') + ' — ' + (dataSource.filterSummary || '');
      var title = prompt('请输入事件名称：', defaultName);
      if (title === null) return; // 用户取消
      title = title.trim();
      if (!title) {
        Utils.showToast('事件名称不能为空', 'warning');
        return;
      }

      // 深拷贝后保存
      var clonedDS = Utils.deepClone(dataSource);
      var clonedChat = Utils.deepClone(chatHistory);

      var saved = NotepadStore.add({
        title: title,
        dataSource: clonedDS,
        chatHistory: clonedChat,
        conversationCount: Math.floor(chatHistory.length / 2)
      });

      render();
      Utils.showToast('已保存到记事本');
    } catch (e) {
      Utils.showToast('保存失败：' + e.message, 'error');
    }
  }

  /**
   * 从记事本加载事件（恢复数据源 + 对话）
   * @param {string} id
   */
  function loadEvent(id) {
    var event = NotepadStore.getById(id);
    if (!event) {
      Utils.showToast('事件不存在或已被删除', 'error');
      return;
    }

    if (!confirm('确定加载事件 "' + event.title + '"？\n当前数据源和对话将被替换。')) {
      return;
    }

    // 替换数据源
    DataSourceStore.clearAll();
    if (event.dataSource) {
      DataSourceStore.add(Utils.deepClone(event.dataSource));
    }

    // 替换聊天历史
    if (window.AppState) {
      window.AppState.chatHistory = Utils.deepClone(event.chatHistory || []);
      window.AppState.activeDSId = null; // 让 DatasourceList 自动选中第一个
    }

    // 重新渲染聊天
    ChatUI.clearAllMessages();
    if (event.chatHistory && event.chatHistory.length > 0) {
      ChatUI.renderHistory(event.chatHistory);
    }

    // 刷新数据源列表
    DatasourceList.renderDataSourceList();

    // 刷新记事本（更新时间排序可能变化）
    render();

    // 跳转到 AI 数据分析 tab
    Tabs.switchTab('tabAI');

    Utils.showToast('已从记事本加载');
  }

  /**
   * 删除单个事件
   * @param {string} id
   */
  function deleteEvent(id) {
    var event = NotepadStore.getById(id);
    if (!event) return;

    if (!confirm('确定删除事件 "' + event.title + '" 吗？')) return;

    NotepadStore.remove(id);
    render();
    Utils.showToast('记事本事件已删除');
  }

  /**
   * 清空全部记事本事件
   */
  function clearAll() {
    if (NotepadStore.getAll().length === 0) return;
    if (!confirm('确定清空全部记事本事件吗？此操作不可恢复。')) return;

    NotepadStore.clearAll();
    render();
    Utils.showToast('已清空全部记事本');
  }

  /**
   * 绑定按钮事件（在 DOM ready 后调用）
   */
  function init() {
    // 保存到记事本按钮
    var btnSave = document.getElementById('btnSaveToNotepad');
    if (btnSave) {
      btnSave.addEventListener('click', saveCurrent);
    }

    // 清空记事本按钮
    var btnClear = document.getElementById('btnClearAllNotepad');
    if (btnClear) {
      btnClear.addEventListener('click', clearAll);
    }

    // 初始渲染
    render();
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    render: render,
    saveCurrent: saveCurrent,
    loadEvent: loadEvent,
    deleteEvent: deleteEvent,
    clearAll: clearAll,
    init: init
  };

})();
