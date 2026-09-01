/**
 * acc-repno-store.js — 制表公式清单存储模块
 * 负责：billcommon/GetAccRepNoList 制表公式清单的拉取与缓存（内存 + localStorage，按公司隔离）
 * 数据链路（Round 60）：打开 Online 资产负债表/利润表之前先拉公式清单，
 * 把 REPNO 文本框换装成下拉选单（免手输、防输错）；拉取失败 = 警告「没有报表公式，无法进行查询」
 * 并中止打开该报表（用户 2026-09-01 决策：拉不到公式即无资料可查，手填必错）。
 * 依赖：Api 模块 (js/api.js)、Auth 模块 (js/auth.js)
 * 实测（Round 60 PoC）：code === 0 为成功；数据在 data.Table（REP_NO/NAME，14 条，
 * 文档示例只节选前 4 条；AT02/AT03 清单一致）；请求体空对象 {}；端点不带 api/ 前缀（带前缀 404）。
 */

var AccRepNoStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_acc_repno';

  // 内存缓存：{ [compno]: { list, fetchedAt, status } }，status ∈ ok
  // 仅 status === 'ok' 视为已成功加载；失败不写缓存（下次打开重试）
  var _cache = {};
  var _pending = null;   // 进行中的拉取 Promise（并发去重；请求无参数，同一时刻只允许一个）
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
      return all[compno] || null;   // { list, fetchedAt, status }
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
   * 拉取制表公式清单（POST billcommon/GetAccRepNoList，请求体逐字取自《制表公式-列表查询.md》：空对象 {}）
   * @returns {Promise<Array<object>>} [{ REP_NO, NAME }]（REP_NO 强制字符串，防服务端回数字）
   */
  function fetchList() {
    return Api.post('billcommon/GetAccRepNoList', {}).then(function(response) {
      if (response.code !== 0) {
        throw new Error(response.message || ('billcommon/GetAccRepNoList code ' + response.code));
      }
      var rows = (response.data && response.data.Table) ? response.data.Table : [];
      return rows.map(function(r) {
        return { REP_NO: String(r.REP_NO), NAME: String(r.NAME || '') };
      });
    });
  }

  /** 拉取失败重试一次（设计规则 5：失败 ≠ 空清单，勿误报） */
  function _attempt(tries) {
    return fetchList().then(function(list) {
      return { ok: true, list: list, error: '' };
    }).catch(function(err) {
      if (tries <= 1) return _attempt(tries + 1);
      return { ok: false, list: [], error: err ? err.message : 'unknown' };
    });
  }

  /**
   * 确保制表公式清单已成功加载（内存缓存命中直接返回，否则拉取+失败重试一次）
   * 打开 Online 资产负债表/利润表前必须调用：ok:false → Dialog.alert 警告并中止打开
   * @returns {Promise<{ok: boolean, list: Array, error: string}>}
   */
  function ensureLoaded() {
    var compno = _compno();
    var cached = _cache[compno];
    if (cached && cached.status === 'ok') {
      return Promise.resolve({ ok: true, list: cached.list, error: '' });
    }
    if (_pending) return _pending;   // 并发去重（无参数请求，共享进行中的拉取）
    var p = _attempt(1).then(function(result) {
      _pending = null;
      var gen = _gen;
      if (result.ok) {
        var entry = { list: result.list, fetchedAt: Date.now(), status: 'ok' };
        if (gen === _gen) {   // 登出作废的旧响应不回写
          _cache[compno] = entry;
          _save(compno, entry);
        }
      }
      return result;
    }, function(err) {
      _pending = null;
      return { ok: false, list: [], error: err ? err.message : 'unknown' };
    });
    _pending = p;
    return p;
  }

  /**
   * 退出登录时调用：作废内存缓存与进行中的拉取（世代 +1）
   * localStorage 按 compno 隔离保留，不受影响
   */
  function reset() {
    _gen++;
    _cache = {};
    _pending = null;
  }

  /** 制表公式清单（内存缓存；未加载返回 []，须先 ensureLoaded） */
  function getList() {
    var cached = _cache[_compno()];
    return (cached && cached.status === 'ok') ? cached.list : [];
  }

  /**
   * 读 localStorage 缓存（跨会话兜底；离线时内存缓存为空可用它回显，不自动采用）
   * @returns {Array|null}
   */
  function getCachedList() {
    var entry = _load(_compno());
    return entry ? entry.list : null;
  }

  return {
    fetchList: fetchList,
    ensureLoaded: ensureLoaded,
    reset: reset,
    getList: getList,
    getCachedList: getCachedList
  };

})();
