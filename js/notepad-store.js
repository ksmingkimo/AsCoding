/**
 * notepad-store.js — 记事本 localStorage CRUD 模块
 * 负责：事件存储、读取、删除（类似 DataSourceStore 的 IIFE 模式）
 * Round 56：全容器透明压缩（记事本快照含数据源全量数据，同一条配额路径）——
 *   JSON > 50KB 时以信封 {_z:1, d:压缩串} 存储；旧格式（裸数组）完全兼容。
 * 依赖：Utils（compressText/decompressText）
 * localStorage key: sunlike_notepad
 */

var NotepadStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_notepad';
  var MAX_EVENTS = 50;
  var COMPRESS_THRESHOLD = 50000;

  /**
   * 读取全部事件
   * @returns {Array<object>}
   */
  function getAll() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      // Round 56 压缩信封：{_z:1, d:压缩串} → 解压还原
      if (parsed && parsed._z === 1 && typeof parsed.d === 'string') {
        parsed = JSON.parse(Utils.decompressText(parsed.d));
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 覆盖写入全部事件
   * @param {Array<object>} events
   */
  function saveAll(events) {
    try {
      var json = JSON.stringify(events);
      var stored;
      if (json.length > COMPRESS_THRESHOLD) {
        var z = Utils.compressText(json);
        stored = (z !== json) ? JSON.stringify({ _z: 1, d: z }) : json;
      } else {
        stored = json;
      }
      localStorage.setItem(LS_KEY, stored);
    } catch (e) {
      Utils.showToast(I18n.t('记事本存储空间不足，请清理旧事件'), 'error');
    }
  }

  /**
   * 添加事件（自动生成 id + createdAt，插入头部，裁剪上限）
   * @param {object} event — { title, dataSources, activeDSId, chatHistory, conversationCount }
   *   dataSources — 全部数据源快照数组（含 loading/error 状态，Round 41 起）
   *   activeDSId  — 保存时选中的数据源 id（回存时恢复选中态）
   *   旧事件（Round 40 之前）为单数 dataSource 字段，读取端兼容迁移
   * @returns {object} 完整事件对象（含 id + createdAt）
   */
  function add(event) {
    var fullEvent = {
      id: 'note_' + Date.now(),
      createdAt: new Date().toISOString(),
      title: event.title,
      dataSources: event.dataSources,
      activeDSId: event.activeDSId,
      chatHistory: event.chatHistory,
      conversationCount: event.conversationCount
    };

    var events = getAll();
    events.unshift(fullEvent);

    // 裁剪到 MAX_EVENTS
    if (events.length > MAX_EVENTS) {
      events = events.slice(0, MAX_EVENTS);
    }

    saveAll(events);
    return fullEvent;
  }

  /**
   * 按 ID 删除事件
   * @param {string} id
   */
  function remove(id) {
    var events = getAll();
    events = events.filter(function(e) { return e.id !== id; });
    saveAll(events);
  }

  /**
   * 清空全部事件
   */
  function clearAll() {
    saveAll([]);
  }

  /**
   * 按 ID 查找事件
   * @param {string} id
   * @returns {object|undefined}
   */
  function getById(id) {
    return getAll().find(function(e) { return e.id === id; });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    getAll: getAll,
    add: add,
    remove: remove,
    clearAll: clearAll,
    getById: getById
  };

})();
