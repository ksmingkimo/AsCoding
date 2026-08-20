/**
 * datasource-store.js — 数据源存储模块
 * 负责：报表数据源的 localStorage CRUD 操作（上限 20 个）
 * Round 56：大 payload 透明压缩（LZString UTF16，Utils.compressText/decompressText）。
 *   存储层：ready 数据源 data 数组 JSON > 50KB 时压缩存串 + _z:1 标志；
 *   读取层：getAll 解压还原为数组，调用方无感知。旧格式（无 _z）完全兼容。
 *   实测：mrpcx 26996 行原始 10.19MB → 压缩后 6 卡片共 1.3MB（配额富余）。
 *   内存缓存：同一会话 getAll 零解析开销；'storage' 事件（跨页签）失效缓存。
 * 依赖：Utils（compressText/decompressText）
 */

var DataSourceStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_data_sources';
  var COMPRESS_THRESHOLD = 50000;   // data JSON 超过 50KB 才压缩（小数据源不压缩，兼容旧格式）

  // 内存缓存：{ raw: localStorage 原始串, list: 解压后的数据源数组 }
  var _cache = null;

  /** 压缩序列化单个数据源（不改原对象，返回可存储副本） */
  function _serializeSource(s) {
    if (s && s.status === 'ready' && Array.isArray(s.data) && s.data.length > 0) {
      var json = JSON.stringify(s.data);
      if (json.length > COMPRESS_THRESHOLD) {
        var z = Utils.compressText(json);
        if (z !== json) {   // 确实压缩了（LZString 可用且成功）
          var copy = {};
          for (var k in s) {
            if (Object.prototype.hasOwnProperty.call(s, k)) copy[k] = s[k];
          }
          copy.data = z;
          copy._z = 1;
          return copy;
        }
      }
    }
    return s;
  }

  /** 反序列化：_z 标志 → 解压还原 data 数组（就地还原，之后同一对象不再重复解压） */
  function _deserializeSource(s) {
    if (s && s._z === 1 && typeof s.data === 'string') {
      try {
        s.data = JSON.parse(Utils.decompressText(s.data));
      } catch (e) {
        s.data = [];
      }
      delete s._z;
    }
    return s;
  }

  /**
   * 获取所有数据源（会话内走内存缓存；跨页签 storage 事件自动失效）
   * @returns {Array<object>}
   */
  function getAll() {
    var raw;
    try {
      raw = localStorage.getItem(LS_KEY) || '[]';
    } catch (e) {
      return [];
    }
    if (_cache && _cache.raw === raw) return _cache.list;

    var list;
    try {
      var parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed.map(_deserializeSource) : [];
    } catch (e) {
      list = [];
    }
    _cache = { raw: raw, list: list };
    return list;
  }

  /**
   * 保存数据源列表（大 data 透明压缩；配额不足抛友好错误）
   * @param {Array<object>} sources
   */
  function saveAll(sources) {
    var out = sources.map(_serializeSource);
    var raw;
    try {
      raw = JSON.stringify(out);
      localStorage.setItem(LS_KEY, raw);
    } catch (e) {
      // QuotaExceededError 等 → 友好文案（原样抛给调用方显示）
      throw new Error(I18n.t('本地存储空间不足，数据源保存失败，请清理旧数据源'));
    }
    _cache = { raw: raw, list: sources };
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
    source.status = 'ready';
    sources.unshift(source);
    if (sources.length > 20) { sources = sources.slice(0, 20); }
    saveAll(sources);
    return source;
  }

  /**
   * 添加一个"加载中"的占位数据源（立即返回，后续用 update() 填充）
   * @param {object} source - 占位信息 { reportName, filterSummary, displayFields, ... }
   * @returns {object} 含 id 的占位 source
   */
  function addPending(source) {
    var sources = getAll();
    source.id = 'ds_' + Date.now();
    source.createdAt = new Date().toISOString();
    source.status = 'loading';
    source.data = [];
    source.recordCount = 0;
    sources.unshift(source);
    if (sources.length > 20) { sources = sources.slice(0, 20); }
    saveAll(sources);
    return source;
  }

  /**
   * 更新已有数据源的字段（用于异步加载完成后填充数据）
   * @param {string} id
   * @param {object} updates — 要更新的键值对
   */
  function update(id, updates) {
    var sources = getAll();
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].id === id) {
        for (var k in updates) {
          if (Object.prototype.hasOwnProperty.call(updates, k)) {
            sources[i][k] = updates[k];
          }
        }
        break;
      }
    }
    saveAll(sources);
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

  // 跨页签同步：其他页签写入 → 失效本页缓存（下次 getAll 重读）
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', function(e) {
      if (e.key === LS_KEY) _cache = null;
    });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    getAll: getAll,
    saveAll: saveAll,
    add: add,
    addPending: addPending,
    update: update,
    remove: remove,
    clearAll: clearAll,
    getById: getById
  };

})();
