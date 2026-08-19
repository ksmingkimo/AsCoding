/**
 * rpt-style-store.js — 报表样式存储模块
 * 负责：accRptStyle/getlist 报表样式清单的拉取与缓存（内存 + localStorage，按公司+账簿隔离）
 * 数据链路（用户指定，Round 52 修正）：AccBook/GetList 账簿行 TYPE_NO → accRptStyle/getlist(TYPE_NO) → 样式清单；
 * 账簿一改变，样式清单必须重新获取——缓存键含 BOOK_NO，不是按公司。
 * AccType/getlist 不在链路内（仅将来需要 TYPE_NAME 时才查）。
 * 依赖：Api 模块 (js/api.js)、Auth 模块 (js/auth.js)
 * 实测（Round 52 PoC）：code === 0 为成功；账簿响应行直接带 TYPE_NO（实测 "1"）/TYPE_NAME；
 * 样式数据在 data.MF_RPTSTYLE_BS（RPT_NO/RPT_TYPE/NAME/TYPE_NO/TYPE_NAME）。
 */

var RptStyleStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_rpt_styles';

  // 内存缓存：{ [compno]: { [bookNo]: { styles, fetchedAt, status } } }，status ∈ ok
  // 仅 status === 'ok' 视为已成功加载；失败不写缓存（下次切换/打开重试）
  var _cache = {};
  var _pending = {};   // { [compno:bookNo]: Promise } 进行中的拉取（并发去重，按账簿）
  var _gen = 0;        // 世代计数：登出 reset() 时 +1，作废进行中的旧拉取（防旧账套数据串入新登录）

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
      return all[compno] || null;   // { [bookNo]: { styles, fetchedAt, status } }
    } catch (e) { return null; }
  }

  function _save(compno, byBook) {
    try {
      var all = JSON.parse(localStorage.getItem(LS_KEY)) || {};
      all[compno] = byBook;
      localStorage.setItem(LS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  /**
   * 拉取报表样式清单（POST accRptStyle/getlist，请求体逐字取自《报表样式 列表查询.md》）
   * 顶层 TYPE_NO = 账簿行的科目表代号（AccBook/GetList 响应自带，实测 "1"，非写死——
   * 写死错误值时三报表回「报表样式[STD001]不存在或无访问权限」）
   * @param {string} typeNo 账簿行 TYPE_NO
   * @returns {Promise<Array<object>>} [{ RPT_NO, RPT_TYPE, NAME, TYPE_NO, TYPE_NAME }]
   */
  function fetchStyles(typeNo) {
    var body = {
      PGM: 'ACCRPTSTYLE',
      SEARCH_INFO: [
        { showBody: 'F', showLadder: 'F', showSumField: 'F',
          displayFields: ['RPT_NO','NAME','RPT_TYPE','REM','STOP_DD','USR_NAME','SYS_DATE'],
          sumFields: [] },
        { fixCondition: {} },
        { field: 'RPT_NO', operator: 'in', fieldType: 'string', need: true, fieldDisabled: false, value: '' },
        { field: 'NAME', operator: 'contain', fieldType: 'string', fieldDisabled: false, value: '' },
        { orderBy: { RPT_NO: 'asc' } }
      ],
      PAGE_INFO: { PAGE_SIZE: 200, CURRENT_PAGE: 1 },
      TYPE_NO: typeNo
    };
    return Api.post('accRptStyle/getlist', body).then(function(response) {
      if (response.code !== 0) {
        throw new Error(response.message || ('accRptStyle/getlist code ' + response.code));
      }
      var rows = (response.data && response.data.MF_RPTSTYLE_BS) ? response.data.MF_RPTSTYLE_BS : [];
      return rows.map(function(r) {
        return { RPT_NO: r.RPT_NO, RPT_TYPE: r.RPT_TYPE, NAME: r.NAME, TYPE_NO: r.TYPE_NO, TYPE_NAME: r.TYPE_NAME };
      });
    });
  }

  /** 拉取失败重试一次（设计规则 5：失败 ≠ 0 样式，勿误报） */
  function _attempt(typeNo, tries) {
    return fetchStyles(typeNo).then(function(styles) {
      return { ok: true, styles: styles, error: '' };
    }).catch(function(err) {
      if (tries <= 1) return _attempt(typeNo, tries + 1);
      return { ok: false, styles: [], error: err ? err.message : 'unknown' };
    });
  }

  /**
   * 确保某账簿的样式清单已成功加载（内存缓存命中直接返回，否则拉取+失败重试一次）
   * 账簿改变必须用新 bookNo 重调——缓存按账簿隔离（用户指定链路）
   * 打开财务报表/切换账簿前必须调用：ok:false → toast 报错
   * @param {string} bookNo 当前账簿（缓存键）
   * @param {string} typeNo 账簿行 TYPE_NO（必填；空 → ok:false，调用方 toast）
   * @returns {Promise<{ok: boolean, styles: Array, error: string}>}
   */
  function ensureLoaded(bookNo, typeNo) {
    var compno = _compno();
    if (!bookNo || !typeNo) {
      return Promise.resolve({ ok: false, styles: [], error: 'missing TYPE_NO' });
    }
    var cached = _cache[compno] && _cache[compno][bookNo];
    if (cached && cached.status === 'ok') {
      return Promise.resolve({ ok: true, styles: cached.styles, error: '' });
    }
    var key = compno + ':' + bookNo;
    if (_pending[key]) return _pending[key];   // 并发去重（同账簿同时触发）
    var p = _attempt(typeNo, 1).then(function(result) {
      delete _pending[key];
      var gen = _gen;
      if (result.ok) {
        var entry = { styles: result.styles, fetchedAt: Date.now(), status: 'ok' };
        if (gen === _gen) {   // 登出作废的旧响应不回写
          if (!_cache[compno]) _cache[compno] = {};
          _cache[compno][bookNo] = entry;
          var byBook = _load(compno) || {};
          byBook[bookNo] = entry;
          _save(compno, byBook);
        }
      }
      return result;
    }, function(err) {
      delete _pending[key];
      return { ok: false, styles: [], error: err ? err.message : 'unknown' };
    });
    _pending[key] = p;
    return p;
  }

  /**
   * 退出登录时调用：作废内存缓存与进行中的拉取（世代 +1）
   * localStorage 按 compno 隔离保留，不受影响
   */
  function reset() {
    _gen++;
    _cache = {};
    _pending = {};
  }

  /** 某账簿全部样式清单（内存缓存；未加载返回 []，须先 ensureLoaded） */
  function getStyles(bookNo) {
    var cached = _cache[_compno()] && _cache[_compno()][bookNo];
    return (cached && cached.status === 'ok') ? cached.styles : [];
  }

  /** 按账簿 + RPT_NO 查样式行（拿 TYPE_NO/NAME；查不到返回 null） */
  function getStyle(bookNo, rptNo) {
    var styles = getStyles(bookNo);
    for (var i = 0; i < styles.length; i++) {
      if (styles[i].RPT_NO === rptNo) return styles[i];
    }
    return null;
  }

  /**
   * 读 localStorage 缓存（跨会话兜底；离线时内存缓存为空可用它回显，不自动采用）
   * @returns {Array|null}
   */
  function getCachedStyles(bookNo) {
    var byBook = _load(_compno());
    var entry = byBook && byBook[bookNo];
    return entry ? entry.styles : null;
  }

  return {
    fetchStyles: fetchStyles,
    ensureLoaded: ensureLoaded,
    reset: reset,
    getStyles: getStyles,
    getStyle: getStyle,
    getCachedStyles: getCachedStyles
  };

})();
