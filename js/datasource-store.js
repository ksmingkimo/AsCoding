/**
 * datasource-store.js — 数据源存储模块
 * 负责：报表数据源的 localStorage CRUD 操作（上限 20 个）
 * 依赖：无外部依赖，仅浏览器 localStorage
 */

var DataSourceStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_data_sources';

  /**
   * 获取所有数据源
   * @returns {Array<object>}
   */
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 保存数据源列表
   * @param {Array<object>} sources
   */
  function saveAll(sources) {
    localStorage.setItem(LS_KEY, JSON.stringify(sources));
  }

  /**
   * 添加数据源（自动生成 ID 和时间戳，超过 20 个自动裁剪）
   * @param {object} source - { reportName, pgm, filterSummary, data, columnInfo, columnProp, displayFields, recordCount }
   * @returns {object} 添加后的 source（含 id + createdAt）
   */
  function add(source) {
    var sources = getAll();
    source.id = 'ds_' + Date.now();
    source.createdAt = new Date().toISOString();
    sources.unshift(source);
    // 上限 20 个
    if (sources.length > 20) {
      sources = sources.slice(0, 20);
    }
    saveAll(sources);
    return source;
  }

  /**
   * 按 ID 删除数据源
   * @param {string} id
   */
  function remove(id) {
    var sources = getAll().filter(function(s) { return s.id !== id; });
    saveAll(sources);
  }

  /**
   * 清空所有数据源
   */
  function clearAll() {
    saveAll([]);
  }

  /**
   * 按 ID 查找数据源
   * @param {string} id
   * @returns {object|undefined}
   */
  function getById(id) {
    return getAll().find(function(s) { return s.id === id; });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    getAll: getAll,
    saveAll: saveAll,
    add: add,
    remove: remove,
    clearAll: clearAll,
    getById: getById
  };

})();
