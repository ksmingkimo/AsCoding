/**
 * book-store.js — 账簿清单存储模块
 * 负责：AccBook/GetList 账簿清单的拉取与缓存（内存 + localStorage，按公司隔离）
 * 依赖：Api 模块 (js/api.js)、Auth 模块 (js/auth.js)
 * 实测（API服务调用说明文档 第十节）：code === 0 为成功；数据在 data.ACC_BOOK_BS；
 * PAGE_INFO.CURRENT_PAGE 从 1 开始；端点大小写变体全通。
 */

var BookStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_books';

  // 内存缓存：{ [compno]: { books, fetchedAt, status } }，status ∈ ok
  // 仅 status === 'ok' 视为已成功加载；失败不写缓存（打开报表时重试）
  var _cache = {};
  var _pending = null;   // 进行中的拉取 Promise（并发去重）
  var _gen = 0;          // 世代计数：登出 reset() 时 +1，作废进行中的旧拉取（防旧账套数据串入新登录）

  function _compno() {
    if (typeof Auth !== 'undefined' && Auth.getUser) {
      var user = Auth.getUser();
      if (user && user.compno) return user.compno;
    }
    return '_global';
  }

  function _load(compno) {
    try {
      var all = JSON.parse(localStorage.getItem(LS_KEY)) || {};
      return all[compno] || null;
    } catch (e) { return null; }
  }

  function _save(compno, entry) {
    try {
      var all = JSON.parse(localStorage.getItem(LS_KEY)) || {};
      all[compno] = entry;
      localStorage.setItem(LS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  /**
   * 拉取账簿清单（POST AccBook/GetList）
   * @returns {Promise<Array<object>>} [{ BOOK_NO, NAME, BOOK_XZ, ... }]
   */
  function fetchBooks() {
    var compno = _compno();
    var gen = _gen;   // 捕获当前世代：登出后返回的旧结果一律丢弃，不写缓存
    var body = {
      DEP: '00000000',
      SEARCH_INFO: [
        { showBody: 'F', showLadder: null, showSumField: null,
          displayFields: ['BOOK_NO','NAME','BOOK_XZ','ACC_MD','CUR_ID','CUR_NAME','TYPE_NO','TYPE_NAME','DEP','DEP_NAME','START_DD','STOP_DD','YEARS','IPERIOD','USR_NAME','SYS_DATE','MODIFY_MAN_NAME','MODIFY_DD'],
          sumFields: [] },
        { fixCondition: {} },
        { field: 'BOOK_NO', operator: 'in', fieldType: 'string', fieldDisabled: false, value: '' },
        { field: 'NAME', operator: 'contain', fieldType: 'string', fieldDisabled: false, value: '' }
      ],
      PAGE_INFO: { PAGE_SIZE: 200, CURRENT_PAGE: 1 }
    };
    return Api.post('AccBook/GetList', body).then(function(response) {
      if (response.code !== 0) {
        throw new Error(response.message || ('AccBook/GetList code ' + response.code));
      }
      var books = (response.data && response.data.ACC_BOOK_BS) ? response.data.ACC_BOOK_BS : [];
      var entry = { books: books, fetchedAt: Date.now(), status: 'ok' };
      if (gen === _gen) {   // 登出作废的旧响应不回写
        _cache[compno] = entry;
        _save(compno, entry);
      }
      return books.slice();
    });
  }

  /** 拉取失败重试一次（设计规则 5：失败 ≠ 0 账簿，勿误报） */
  function _attempt(tries) {
    return fetchBooks().then(function(books) {
      return { ok: true, books: books, error: '' };
    }).catch(function(err) {
      if (tries <= 1) return _attempt(tries + 1);
      return { ok: false, books: [], error: err ? err.message : 'unknown' };
    });
  }

  /**
   * 确保账簿清单已成功加载（内存缓存命中直接返回，否则拉取+失败重试一次）
   * 打开总分类账前必须调用：ok:false → toast 报错；books:[] → 「未启用总账」警告
   * @returns {Promise<{ok: boolean, books: Array, error: string}>}
   */
  function ensureLoaded() {
    var compno = _compno();
    var cached = _cache[compno];
    if (cached && cached.status === 'ok') {
      return Promise.resolve({ ok: true, books: cached.books, error: '' });
    }
    if (_pending) return _pending;   // 并发去重（登录预取与打开报表同时发生）
    var p = _attempt(1).then(function(result) {
      if (_pending === p) _pending = null;   // 仅清除自己的句柄（reset 后新 pending 不受影响）
      return result;
    }, function(err) {
      if (_pending === p) _pending = null;
      return { ok: false, books: [], error: err ? err.message : 'unknown' };
    });
    _pending = p;
    return p;
  }

  /**
   * 登录成功 / 会话恢复后的预取（不阻塞、失败静默——打开总分类账时 ensureLoaded 会重试）
   * 走 ensureLoaded 与 openReport 的并发去重共享同一个拉取
   */
  function prefetch() {
    ensureLoaded().catch(function() { /* 静默 */ });
  }

  /**
   * 退出登录时调用：作废内存缓存与进行中的拉取（世代 +1）
   * 防「旧账套账簿串到新登录」；localStorage 按 compno 隔离保留，不受影响
   */
  function reset() {
    _gen++;
    _cache = {};
    _pending = null;
  }

  /**
   * 读 localStorage 缓存（跨会话兜底；离线时内存缓存为空可用它回显，不自动采用）
   * @returns {Array|null}
   */
  function getCachedBooks() {
    var entry = _load(_compno());
    return entry ? entry.books : null;
  }

  return {
    fetchBooks: fetchBooks,
    ensureLoaded: ensureLoaded,
    prefetch: prefetch,
    reset: reset,
    getCachedBooks: getCachedBooks
  };

})();
