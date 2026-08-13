/* ============================================================
   ReportMenuStore — 报表菜单状态（收藏持久化 + 分组折叠会话内）
   localStorage key: sunlike_report_menu
   数据结构：{ "favorites": ["invSO","monAA"] }
   分组折叠仅存内存：默认全部折叠，刷新/重新登录即复位（简洁利落）
   ============================================================ */
var ReportMenuStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_report_menu';

  /** 会话内"已展开"的分组名单。
      存展开名单而非折叠名单：默认（未展开）即折叠——
      新分组、刷新、重新登录后都回到折叠态 */
  var _expandedGroups = [];

  function _defaultData() {
    return { favorites: [] };
  }

  /**
   * 读取收藏；localStorage 损坏/缺失时回退空结构，
   * 并对 favorites 剪枝（过滤已不存在的报表 key，防孤儿条目）
   */
  function _read() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return _defaultData();
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return _defaultData();

      var favorites = Array.isArray(data.favorites) ? data.favorites : [];

      var validKeys = [];
      if (typeof ReportEngine !== 'undefined' && typeof ReportEngine.getReportKeys === 'function') {
        validKeys = ReportEngine.getReportKeys();
      }
      favorites = favorites.filter(function(k) {
        return validKeys.length === 0 || validKeys.indexOf(k) !== -1;
      });

      return { favorites: favorites };
    } catch (e) {
      return _defaultData();
    }
  }

  function _write(data) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ favorites: data.favorites }));
    } catch (e) {
      // 存储不可用（隐私模式等），静默降级为会话内状态
    }
  }

  /** 收藏列表（保持收藏先后顺序） */
  function getFavorites() {
    return _read().favorites.slice();
  }

  function isFavorite(key) {
    return _read().favorites.indexOf(key) !== -1;
  }

  /**
   * 切换收藏状态
   * @returns {boolean} 操作后是否已收藏
   */
  function toggleFavorite(key) {
    var data = _read();
    var idx = data.favorites.indexOf(key);
    if (idx !== -1) {
      data.favorites.splice(idx, 1);
    } else {
      data.favorites.unshift(key);   // 新收藏排在最前（置顶）
    }
    _write(data);
    return idx === -1;
  }

  /** 分组默认折叠；仅展开过的分组算"未折叠"（刷新/重新登录即复位） */
  function isGroupCollapsed(group) {
    return _expandedGroups.indexOf(group) === -1;
  }

  /**
   * 切换分组折叠状态（仅会话内有效，不持久化）
   * @returns {boolean} 操作后是否已展开
   */
  function toggleGroup(group) {
    var idx = _expandedGroups.indexOf(group);
    if (idx !== -1) {
      _expandedGroups.splice(idx, 1);
    } else {
      _expandedGroups.push(group);
    }
    return idx === -1;
  }

  return {
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    isGroupCollapsed: isGroupCollapsed,
    toggleGroup: toggleGroup
  };
})();
