/**
 * notepad-ui.js — 记事本 UI 模块
 * 负责：事件卡片渲染、保存/加载/删除交互
 * 依赖：NotepadStore、DataSourceStore、DatasourceList、ChatUI、Tabs、Utils
 */

var NotepadUI = (function() {
  'use strict';

  /**
   * 取事件的全部数据源快照数组（旧事件单数 dataSource 字段兼容迁移）
   * @param {object} event
   * @returns {Array}
   */
  function getEventSources(event) {
    if (event.dataSources && event.dataSources.length > 0) return event.dataSources;
    if (event.dataSource) return [event.dataSource];
    return [];
  }

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

      // 构建数据源描述（多源快照 + 旧单源事件兼容）
      var eventSources = getEventSources(event);
      var dsDesc = '';
      if (eventSources.length === 1) {
        var only = eventSources[0];
        dsDesc = Utils.escapeHtml(I18n.t(only.reportName || '未知报表'));
        if (only.filterSummary) {
          dsDesc += ' — ' + Utils.escapeHtml(only.filterSummary);
        }
        if (only.recordCount) {
          dsDesc += ', ' + I18n.t('{0}条记录', only.recordCount.toLocaleString());
        }
      } else if (eventSources.length > 1) {
        // 多源：显示保存时选中的源 + 总数（id 未命中回退第一个）
        var active = null;
        for (var k = 0; k < eventSources.length; k++) {
          if (eventSources[k].id === event.activeDSId) { active = eventSources[k]; break; }
        }
        active = active || eventSources[0];
        dsDesc = Utils.escapeHtml(
          I18n.t('{0}（共 {1} 个数据源）', I18n.t(active.reportName || '未知报表'), eventSources.length)
        );
      }

      var convCount = event.conversationCount || 0;

      card.innerHTML =
        '<button class="np-delete" title="' + I18n.t('删除此事件') + '">&times;</button>' +
        '<div class="np-title">' + Utils.escapeHtml(event.title || I18n.t('未命名事件')) + '</div>' +
        '<div class="np-source">' +
          '<span class="np-source-label">' + I18n.t('数据源') + '</span>' +
          '<span>' + (dsDesc || I18n.t('无')) + '</span>' +
        '</div>' +
        '<div class="np-source">' +
          '<span class="np-source-label">' + I18n.t('对话') + '</span>' +
          '<span>' + I18n.t('{0} 轮对话', convCount) + '</span>' +
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
      var allDS = DataSourceStore.getAll();
      if (allDS.length === 0) {
        Utils.showToast(I18n.t('请先添加数据源'), 'warning');
        return;
      }

      var activeDSId = window.AppState ? window.AppState.activeDSId : null;

      // 如果没有活跃 ID，尝试自动选择（优先 ready，否则第一个）
      if (!activeDSId) {
        var readyDS = allDS.filter(function(ds) { return ds.status === 'ready' || !ds.status; });
        activeDSId = readyDS.length > 0 ? readyDS[0].id : allDS[0].id;
        if (window.AppState) window.AppState.activeDSId = activeDSId;
      }

      var chatHistory = window.AppState ? window.AppState.chatHistory : [];
      if (!chatHistory || chatHistory.length === 0) {
        Utils.showToast(I18n.t('暂无对话内容可保存'), 'warning');
        return;
      }

      var dataSource = DataSourceStore.getById(activeDSId);
      if (!dataSource) {
        Utils.showToast(I18n.t('未找到选中的数据源'), 'error');
        return;
      }

      // 弹出命名对话框（应用内弹窗，随语言显示）
      var defaultName = I18n.t(dataSource.reportName || '未知报表') + ' — ' + (dataSource.filterSummary || '');
      Dialog.prompt(I18n.t('请输入事件名称：'), { value: defaultName, maxLength: 50 }).then(function(title) {
        if (title === null) return; // 用户取消
        title = title.trim();
        if (!title) {
          Utils.showToast(I18n.t('事件名称不能为空'), 'warning');
          return;
        }

        // 深拷贝后保存：全部数据源快照（保存瞬间重新读取，含 loading/error）+ 选中 id + 对话
        var clonedSources = DataSourceStore.getAll().map(function(ds) { return Utils.deepClone(ds); });
        var clonedChat = Utils.deepClone(chatHistory);

        NotepadStore.add({
          title: title,
          dataSources: clonedSources,
          activeDSId: activeDSId,
          chatHistory: clonedChat,
          conversationCount: Math.floor(chatHistory.length / 2)
        });

        render();
        Utils.showToast(I18n.t('已保存到记事本'));
      });
    } catch (e) {
      Utils.showToast(I18n.t('保存失败：{0}', e.message), 'error');
    }
  }

  /**
   * 从记事本加载事件（恢复数据源 + 对话）
   * @param {string} id
   */
  function loadEvent(id) {
    var event = NotepadStore.getById(id);
    if (!event) {
      Utils.showToast(I18n.t('事件不存在或已被删除'), 'error');
      return;
    }

    Dialog.confirm(I18n.t('确定加载事件 "{0}"？', event.title) + '\n' + I18n.t('当前数据源和对话将被替换。')).then(function(ok) {
      if (!ok) return;
      loadEventConfirmed(event);
    });
  }

  /** Dialog.confirm 通过后的加载执行体 */
  function loadEventConfirmed(event) {

    // 替换数据源：全量快照恢复（saveAll 保留快照原始 id/状态/createdAt；旧单源事件兼容迁移）
    var sources = getEventSources(event).map(function(ds) { return Utils.deepClone(ds); });
    DataSourceStore.clearAll();
    if (sources.length > 0) {
      DataSourceStore.saveAll(sources);
    }

    // 替换聊天历史
    if (window.AppState) {
      window.AppState.chatHistory = Utils.deepClone(event.chatHistory || []);
      // 恢复保存时选中的数据源（id 随快照保留；校验存在性，缺失回退第一个）
      var restoredActiveId = event.activeDSId;
      var activeExists = sources.some(function(s) { return s.id === restoredActiveId; });
      window.AppState.activeDSId = activeExists ? restoredActiveId : (sources[0] ? sources[0].id : null);
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

    Utils.showToast(I18n.t('已从记事本加载'));
  }

  /**
   * 删除单个事件
   * @param {string} id
   */
  function deleteEvent(id) {
    var event = NotepadStore.getById(id);
    if (!event) return;

    Dialog.confirm(I18n.t('确定删除事件 "{0}" 吗？', event.title), { danger: true }).then(function(ok) {
      if (!ok) return;
      NotepadStore.remove(id);
      render();
      Utils.showToast(I18n.t('记事本事件已删除'));
    });
  }

  /**
   * 清空全部记事本事件
   */
  function clearAll() {
    if (NotepadStore.getAll().length === 0) return;
    Dialog.confirm(I18n.t('确定清空全部记事本事件吗？此操作不可恢复。'), { danger: true }).then(function(ok) {
      if (!ok) return;
      NotepadStore.clearAll();
      render();
      Utils.showToast(I18n.t('已清空全部记事本'));
    });
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
