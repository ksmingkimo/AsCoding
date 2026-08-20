/**
 * app.js — 应用主入口模块
 * 负责：AppState 管理、查询/分页逻辑、侧边栏导航、登录/登出接线、初始化
 * 依赖：所有其他 JS 模块 + Auth, Api, ReportEngine
 */

var App = (function() {
  'use strict';

  /* ================================================================
     App State（全局共享状态）
     ================================================================ */
  window.AppState = {
    currentReport: '',          // 入口待机态为 ''：登录/会话恢复不预选报表，等用户从搜索/菜单选择
    currentReportName: '',
    lastQueryData: null,       // { pgm, reportKey, filters, data, columnInfo, columnProp, displayFields }
    chatHistory: [],           // { role, content }
    activeDSId: null
  };

  var _allData = [];           // 客户端分页：缓存全量数据（API 不认 offset start）

  /* ================================================================
     Report Query
     ================================================================ */

  /**
   * 执行报表查询
   */
  function doQuery() {
    if (typeof ReportEngine === 'undefined') {
      Utils.showToast(I18n.t('报表引擎未加载'), 'error');
      return;
    }
    if (ReportEngine.isLoading) return;
    // 入口待机态：未选报表不发请求（按钮已禁用时的键盘/其他路径兜底）
    if (_entryIdle) {
      Utils.showToast(I18n.t('请先选择报表'), 'error');
      return;
    }
    // 0 账簿拦截兜底：按钮已禁用时查询也不该跑（键盘/其他路径）
    if (_ledgerBlocked) return;

    var reportKey = AppState.currentReport;
    var cfg = ReportEngine.getConfig(reportKey);
    var filters = ReportEngine.readFilters();
    var isStream = !!(cfg && cfg.apiMethod === 'getReportStream');

    // BOOK_NO 铁律（仅 needsBook 的流式报表；实测 API5：空值 → 200 + SSE ERR「账簿不能为空」，
    // API4 总分类账：空值 → HTTP 406；前端先拦，不发请求）
    if (isStream && cfg.needsBook && !filters.filterBookNo) {
      Utils.showToast(I18n.t('请选择账簿'), 'error');
      return;
    }

    // RPT_NO 铁律（三财务报表）：未选样式不发请求（样式加载失败/该类型无样式都会拦住）
    if (isStream && cfg.needsRptStyle && !filters.filterRptNo) {
      Utils.showToast(I18n.t('请选择报表样式'), 'error');
      return;
    }
    // TYPE_NO 注入：所选样式所属科目表代号（按账簿+样式查样式行，账簿切换后必为新清单）
    if (isStream && cfg.needsRptStyle) {
      var style = (typeof RptStyleStore !== 'undefined') ? RptStyleStore.getStyle(filters.filterBookNo, filters.filterRptNo) : null;
      if (!style) {
        Utils.showToast(I18n.t('请选择报表样式'), 'error');
        return;
      }
      filters.styleTypeNo = style.TYPE_NO;
    }

    // MRPCU 铁律（物料分析明细表）：母件代号为空 → 服务端 SQL Server 8623
    // 「查询处理器用尽了内部资源」（Round 54 实测 AT04 复现：MO_NO/BOM_NO/MRP_NO 全空触发；
    // 母件代号非空 → 正常返回 3 行；仅工单号 → 0 行无数据）。前端先拦，不发请求。
    if (isStream && reportKey === 'mrpcu' && !filters.filterMrpNo) {
      Utils.showToast(I18n.t('请输入母件代号'), 'error');
      return;
    }

    var viewPage = ReportEngine.currentPage || 1;
    var pageSizeSelect = document.getElementById('pageSizeSelect');
    var pageSize = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) || 20 : 20;
    ReportEngine.currentPageSize = pageSize;

    // 无效化缓存（查询/重置/切换报表时重新拉取）
    _allData = [];

    ReportEngine.isLoading = true;
    var loadingEl = document.getElementById('tableLoading');
    var tbody = document.getElementById('tableBody');
    var emptyState = document.getElementById('emptyState');
    var pagination = document.querySelector('.pagination');
    if (loadingEl) loadingEl.style.display = 'flex';

    // 长连接流式报表：显示进度条（PERCENT 消息实时驱动）
    if (isStream) resetStreamProgress();

    // API 不认 offset start，始终用 [0, 5000] 取全量数据
    ReportEngine.query(reportKey, filters, 1, 5000, isStream ? onStreamProgress : null)
      .then(function(result) {
        _allData = result.data;
        ReportEngine.currentData = _allData;

        var cfg = ReportEngine.getConfig(reportKey);
        AppState.lastQueryData = {
          pgm: cfg ? cfg.pgm : '',
          reportKey: reportKey,     // 转入数据源 0 笔前置判断用
          filters: filters,         // 查询时的筛选快照（转入前比对是否变化）
          data: _allData,
          columnInfo: result.columnInfo || [],
          columnProp: {},
          displayFields: cfg ? cfg.displayFields.join(',') : ''
        };

        // 财务报表动态列（COLUMN_INFO）异步到达 → 先重渲染表头再切片渲染行
        renderCurrentTableHead();

        // 客户端切片当前页
        renderPageSlice(viewPage, pageSize);

        var tableWrapper = document.getElementById('tableWrapper');
        if (_allData.length === 0) {
          if (emptyState) emptyState.style.display = '';
          if (tableWrapper) {
            var table = tableWrapper.querySelector('table');
            if (table) table.style.display = 'none';
          }
          if (pagination) pagination.style.display = 'none';
        } else {
          if (emptyState) emptyState.style.display = 'none';
          if (tableWrapper) {
            var table = tableWrapper.querySelector('table');
            if (table) table.style.display = '';
          }
          if (pagination) pagination.style.display = '';
        }

        updatePagination(viewPage, pageSize, _allData.length);
      })
      .catch(function(err) {
        _allData = [];
        Utils.showToast(I18n.t('查询失败: {0}', err.message || I18n.t('未知错误')), 'error');
        if (tbody) tbody.innerHTML = '';
        var tableInfo = document.getElementById('tableInfoText');
        if (tableInfo) tableInfo.textContent = I18n.t('共 {0} 条记录', 0);
        if (emptyState) emptyState.style.display = '';
        var pagination = document.querySelector('.pagination');
        if (pagination) pagination.style.display = 'none';
      })
      .finally(function() {
        ReportEngine.isLoading = false;
        if (loadingEl) loadingEl.style.display = 'none';
        var streamProgress = document.getElementById('streamProgress');
        if (streamProgress) streamProgress.style.display = 'none';
      });
  }

  /* ================================================================
     长连接流式报表 — 进度条 UI（PERCENT 消息实时驱动）
     ================================================================ */

  /** 查询开始时：进度条归零并显示（仅流式报表调用） */
  function resetStreamProgress() {
    var box = document.getElementById('streamProgress');
    var fill = document.getElementById('streamProgressFill');
    var text = document.getElementById('streamProgressText');
    if (box) box.style.display = '';
    if (fill) fill.style.width = '0%';
    if (text) text.textContent = '0%';
  }

  /** 每条流消息回调：PERCENT → 宽度/文字；TITLE 原样显示不翻译（实测含混合内容） */
  function onStreamProgress(percent, title) {
    var fill = document.getElementById('streamProgressFill');
    var text = document.getElementById('streamProgressText');
    var p = Math.round(percent);
    if (fill) fill.style.width = p + '%';
    if (text) text.textContent = p + '%' + (title ? ' · ' + title : '');
  }

  /**
   * 从缓存 _allData 切片渲染当前页（无 API 调用）
   */
  function renderPageSlice(viewPage, pageSize) {
    var tbody = document.getElementById('tableBody');
    if (!tbody) return;
    // 边界保护：数据变少时自动修正到最后一页
    var maxPage = Math.max(1, Math.ceil(_allData.length / pageSize));
    if (viewPage > maxPage) { viewPage = maxPage; ReportEngine.currentPage = viewPage; }
    var start = (viewPage - 1) * pageSize;
    var pageData = _allData.slice(start, start + pageSize);
    ReportEngine.renderTableBody(tbody, pageData, AppState.currentReport);
    var tableInfo = document.getElementById('tableInfoText');
    if (tableInfo) tableInfo.textContent = I18n.t('共 {0} 条记录', pageData.length);
  }

  /**
   * 翻页（优先从缓存渲染，缓存失效时调用 API）
   */
  function goToPage(targetPage) {
    if (targetPage === ReportEngine.currentPage) return;
    ReportEngine.currentPage = targetPage;
    var pageSizeSelect = document.getElementById('pageSizeSelect');
    var pageSize = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) || 20 : 20;

    if (_allData.length > 0) {
      // 缓存命中：直接切片渲染
      renderPageSlice(targetPage, pageSize);
      updatePagination(targetPage, pageSize, _allData.length);
      var activePanel = document.querySelector('.tab-panel.active .content-body');
      if (activePanel) activePanel.scrollTop = 0;
    } else {
      // 缓存失效：走 API
      doQuery();
    }
  }

  /**
   * 更新分页控件
   */
  function updatePagination(page, pageSize, totalCount) {
    var infoEl = document.getElementById('paginationInfo');
    var controlsEl = document.getElementById('paginationControls');

    if (totalCount === 0) {
      if (infoEl) infoEl.textContent = I18n.t('无记录');
      if (controlsEl) controlsEl.innerHTML = '';
      return;
    }

    var totalPages = Math.ceil(totalCount / pageSize);
    var start = (page - 1) * pageSize + 1;
    var end = Math.min(start + pageSize - 1, totalCount);
    if (infoEl) infoEl.textContent = I18n.t('第 {0}-{1} 条，共 {2} 条', start, end, totalCount.toLocaleString());

    var html = '';
    html += '<button class="page-btn" title="' + I18n.t('首页') + '" ' + (page <= 1 ? 'disabled' : '') +
            ' data-page="1">&lt;&lt;</button>';
    html += '<button class="page-btn" title="' + I18n.t('上一页') + '" ' + (page <= 1 ? 'disabled' : '') +
            ' data-page="' + (page - 1) + '">&lt;</button>';

    var startPage = Math.max(1, page - 2);
    for (var i = startPage; i <= Math.min(startPage + 4, totalPages); i++) {
      html += '<button class="page-btn' + (i === page ? ' active' : '') +
              '" data-page="' + i + '">' + i + '</button>';
    }

    html += '<button class="page-btn" title="' + I18n.t('下一页') + '" ' + (page >= totalPages ? 'disabled' : '') +
            ' data-page="' + (page + 1) + '">&gt;</button>';
    html += '<button class="page-btn" title="' + I18n.t('末页') + '" ' + (page >= totalPages ? 'disabled' : '') +
            ' data-page="' + totalPages + '">&gt;&gt;</button>';

    if (controlsEl) {
      controlsEl.innerHTML = html;
      controlsEl.querySelectorAll('.page-btn[data-page]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (this.disabled) return;
          var targetPage = parseInt(this.getAttribute('data-page'), 10);
          if (targetPage) {
            goToPage(targetPage);
          }
        });
      });
    }
  }

  /* ================================================================
     i18n 动态内容刷新
     表头 <th> 是 JS 动态渲染的 HTML，不带 data-i18n 属性，
     不在 I18n.applyStatic 扫描范围内 → 语言变化时必须显式重渲染。
     ================================================================ */

  /** 用当前语言重渲染当前报表表头（唯一入口，三处时机共用） */
  function renderCurrentTableHead() {
    var tableHeadRow = document.getElementById('tableHeadRow');
    if (tableHeadRow && typeof ReportEngine !== 'undefined') {
      ReportEngine.renderTableHead(tableHeadRow, AppState.currentReport);
    }
  }

  /**
   * i18n:changed 监听回调：重刷所有 JS 动态渲染的文字。
   * 静态文字（data-i18n 属性）由 I18n.applyStatic 覆盖，不在此处理。
   */
  function refreshDynamicI18n() {
    if (typeof ReportEngine === 'undefined') return;

    // 待机态：标题/空状态的 data-i18n 已被摘除，applyStatic 不再覆盖，这里按新语言重写
    if (_entryIdle) {
      var idleTitle = document.getElementById('reportTitle');
      if (idleTitle) idleTitle.textContent = I18n.t('请选择报表');
      setEmptyStateText(I18n.t('请选择报表'), I18n.t('在左侧搜索并选择一张报表开始查询'));
      return;
    }

    renderCurrentTableHead();

    // 报表标题（AppState.currentReportName 保持简体规范值，渲染点翻译）
    var reportTitle = document.getElementById('reportTitle');
    var cfg = ReportEngine.getConfig(AppState.currentReport);
    if (reportTitle && cfg) reportTitle.textContent = I18n.t(cfg.name);

    // 0 笔时空状态文案（data-i18n 已在待机态摘除，语言切换后需手动重写）
    if (_allData.length === 0) {
      setEmptyStateText(I18n.t('暂无数据'), I18n.t('请调整查询条件后重试'));
    }

    // 已有数据时用当前语言重刷当前页切片（审核徽章等动态文字）+ 分页控件 title
    if (_allData.length > 0) {
      var pageSizeSelect = document.getElementById('pageSizeSelect');
      var pageSize = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) || 20 : 20;
      var page = ReportEngine.currentPage || 1;
      renderPageSlice(page, pageSize);
      updatePagination(page, pageSize, _allData.length);
    }
  }

  /* ================================================================
     Sidebar Navigation
     ================================================================ */
  function initSidebarNav() {
    var nav = document.querySelector('.sidebar-nav');
    if (!nav) return;

    // 容器级事件委托：兼容静态 HTML 与 ReportMenu 动态渲染的 .nav-item
    nav.addEventListener('click', function(e) {
      if (e.target.closest('.nav-star')) return;   // 星标交互交给 ReportMenu（双保险兜底）
      var link = e.target.closest('.nav-item');
      if (!link) return;
      e.preventDefault();
      openReport(link.getAttribute('data-report'));
    });
  }

  /* ================================================================
     账簿依赖报表（总分类账）— 0 账簿拦截 + 按钮禁用
     设计规则（API服务调用说明文档 10.3）：
       · 打开前 ensureLoaded（失败重试一次；失败 ≠ 0 账簿，toast 报错不切换）
       · code===0 且 0 账簿 → 弹警告 + 【查询】【转入】禁用，不调流不切换
       · 切换到其他报表时按钮恢复
     ================================================================ */
  var _ledgerBlocked = false;   // 0 账簿警告后为 true，直到切换报表

  function setLedgerButtonsDisabled(disabled) {
    var queryBtn = document.getElementById('queryBtn');
    var transferBtn = document.getElementById('transferBtn');
    if (queryBtn) queryBtn.disabled = disabled;
    if (transferBtn) transferBtn.disabled = disabled;
  }

  function blockLedgerReport() {
    _ledgerBlocked = true;
    setLedgerButtonsDisabled(true);
  }

  function unblockLedgerReport() {
    _ledgerBlocked = false;
    setLedgerButtonsDisabled(false);
  }

  /* ================================================================
     入口待机态（未选报表）
     登录/会话恢复后进入：不预选报表、不自动查询，焦点停【搜索报表】，
     避免一进来画面未看清就发起查询（浪费资源 + 首屏卡顿）。
     用户从搜索框/侧边栏选中报表 → openReport → _openReportCore 退出待机态。
     ================================================================ */
  var _entryIdle = true;

  function setEntryButtonsDisabled(disabled) {
    ['queryBtn', 'transferBtn', 'resetBtn', 'refreshBtn'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
  }

  /** 空状态文案统一入口（待机态摘除 data-i18n 后由 JS 驱动，语言切换也走这里） */
  function setEmptyStateText(title, hint) {
    var emptyState = document.getElementById('emptyState');
    if (!emptyState) return;
    var ps = emptyState.querySelectorAll('p');
    if (ps[0]) ps[0].textContent = title;
    if (ps[1]) ps[1].textContent = hint;
  }

  function enterEntryIdle() {
    _entryIdle = true;
    setEntryButtonsDisabled(true);

    var reportTitle = document.getElementById('reportTitle');
    if (reportTitle) {
      reportTitle.textContent = I18n.t('请选择报表');
      // 摘除 data-i18n：语言切换的 applyStatic 重扫会把它覆盖回静态默认报表名
      reportTitle.removeAttribute('data-i18n');
    }

    var filterPanel = document.querySelector('.filter-panel');
    if (filterPanel) filterPanel.style.display = 'none';

    var tableWrapper = document.getElementById('tableWrapper');
    if (tableWrapper) tableWrapper.style.display = 'none';

    var pagination = document.querySelector('.pagination');
    if (pagination) pagination.style.display = 'none';

    setEmptyStateText(I18n.t('请选择报表'), I18n.t('在左侧搜索并选择一张报表开始查询'));
    var emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = '';
      emptyState.querySelectorAll('p').forEach(function(p) { p.removeAttribute('data-i18n'); });
    }

    AppState.currentReport = '';
    AppState.currentReportName = '';
    if (typeof ReportMenu !== 'undefined') {
      ReportMenu.render();     // 菜单高亮清零（currentReport 为空天然无 active）
      ReportMenu.focusSearch();
    }
  }

  /** 账簿下拉填充：BOOK_NO · NAME；保持已选值，无效/未选则预选第一个
      option 带 data-type-no（账簿行 TYPE_NO）——报表样式清单按账簿获取时从选中项读取 */
  function populateBookSelect(books) {
    var sel = document.getElementById('filterBookNo');
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '';
    books.forEach(function(b) {
      var o = document.createElement('option');
      o.value = b.BOOK_NO;
      o.textContent = b.BOOK_NO + ' · ' + b.NAME;
      if (b.TYPE_NO !== null && b.TYPE_NO !== undefined) { o.dataset.typeNo = String(b.TYPE_NO); }
      sel.appendChild(o);
    });
    var keepCurrent = books.some(function(b) { return b.BOOK_NO === current; });
    if (current && keepCurrent) {
      sel.value = current;
    } else {
      sel.selectedIndex = 0;
    }
  }

  /** 报表样式下拉填充：按账簿 + 报表类型过滤（RPT_TYPE），选项 "RPT_NO · NAME"；预选第一个匹配样式 */
  function populateRptStyleSelect(reportKey, bookNo) {
    var cfg = ReportEngine.getConfig(reportKey);
    var sel = document.getElementById('filterRptNo');
    if (!sel || !cfg || !cfg.rptTypeFilter) return;
    var styles = (typeof RptStyleStore !== 'undefined') ? RptStyleStore.getStyles(bookNo) : [];
    var matched = styles.filter(function(s) { return String(s.RPT_TYPE) === cfg.rptTypeFilter; });
    sel.innerHTML = '';
    if (matched.length === 0) {
      // 该报表类型无可用样式：空值占位（doQuery 会拦「请选择报表样式」）
      var o0 = document.createElement('option');
      o0.value = '';
      o0.textContent = I18n.t('无可用样式');
      sel.appendChild(o0);
      return;
    }
    matched.forEach(function(s) {
      var o = document.createElement('option');
      o.value = s.RPT_NO;
      o.textContent = s.RPT_NO + ' · ' + s.NAME;
      // 样式所属科目表代号随选项走（readFilters 读取）：
      // 转入数据源走独立全量请求（不经过 doQuery 注入），TYPE_NO 必须能从下拉读出
      if (s.TYPE_NO !== null && s.TYPE_NO !== undefined) { o.dataset.typeNo = String(s.TYPE_NO); }
      sel.appendChild(o);
    });
    sel.selectedIndex = 0;   // 预选匹配类型的第一个样式
  }

  /**
   * 账簿 → 报表样式联动加载：账簿改变样式清单必须重取（用户指定链路）
   * TYPE_NO 取自账簿下拉选中 option（populateBookSelect 时写入 data-type-no，来自账簿行）
   * @param {string} reportKey 目标报表（下拉按该报表的类型过滤——绝不能读 AppState.currentReport，
   *   异步完成时用户可能已切换报表，会填错过滤条件）
   * @param {string} bookNo 当前账簿
   * @param {Function} [onOk] 样式就绪回调（含预选第一项）
   * @param {Function} [onFail] 失败回调（toast 已弹）
   */
  function loadRptStylesForBook(reportKey, bookNo, onOk, onFail) {
    var bookSel = document.getElementById('filterBookNo');
    var opt = bookSel && bookSel.options[bookSel.selectedIndex];
    var typeNo = opt ? (opt.dataset.typeNo || '') : '';
    if (!typeNo) {
      Utils.showToast(I18n.t('报表样式加载失败: {0}', I18n.t('账簿无科目表代号')), 'error');
      if (onFail) onFail();
      return;
    }
    RptStyleStore.ensureLoaded(bookNo, typeNo).then(function(res) {
      if (!res.ok) {
        // 拉取失败 ≠ 0 样式：toast 报错，走失败分支
        Utils.showToast(I18n.t('报表样式加载失败: {0}', res.error), 'error');
        if (onFail) onFail();
        return;
      }
      populateRptStyleSelect(reportKey, bookNo);
      if (onOk) onOk();
    });
  }

  /**
   * 打开指定报表：更新状态/标题/菜单高亮/筛选面板并执行查询
   * @param {string} reportKey — REPORT_CONFIG 的 key
   */
  function openReport(reportKey) {
    var cfg = ReportEngine.getConfig(reportKey);
    if (!cfg) return;

    // 账簿依赖报表：先确保账簿清单已加载
    if (cfg.needsBook && typeof BookStore !== 'undefined') {
      BookStore.ensureLoaded().then(function(res) {
        if (!res.ok) {
          // 拉取失败 ≠ 0 账簿：toast 报错，不切换报表、不调流
          Utils.showToast(I18n.t('账簿清单加载失败: {0}', res.error), 'error');
          return;
        }
        if (res.books.length === 0) {
          // 0 账簿：警告 + 禁用【查询】【转入】，不调流、不切换
          blockLedgerReport();
          Dialog.alert(I18n.t('你的账套没有启用总账，所以你不能操作这个查询'));
          return;
        }
        populateBookSelect(res.books);
        // 报表样式依赖（三财务报表）：先打开报表渲染面板（下拉停在「加载中...」占位），
        // 再异步按账簿拉样式清单填充（TYPE_NO 来自账簿行），样式就绪后才自动查询。
        // 顺序不能反：若先填充再 _openReportCore，updateFilterPanel 会重建下拉把
        // 填充覆盖掉（曾致「加载中」卡死）；若先查后填，filterRptNo 为空会被 doQuery 拦下
        if (cfg.needsRptStyle && typeof RptStyleStore !== 'undefined') {
          var bookEl = document.getElementById('filterBookNo');
          var styleEl0 = document.getElementById('filterRptNo');
          if (styleEl0) { styleEl0.innerHTML = '<option value="">' + I18n.t('加载中...') + '</option>'; }
          _openReportCore(reportKey, true);   // 跳过自动查询，等样式就绪再查
          loadRptStylesForBook(reportKey, bookEl ? bookEl.value : '', function() {
            ReportEngine.currentPage = 1;
            doQuery();
          }, function() {
            var s = document.getElementById('filterRptNo');
            if (s) { s.innerHTML = '<option value="">' + I18n.t('无可用样式') + '</option>'; }
          });
          return;
        }
        _openReportCore(reportKey);
      });
      return;
    }
    _openReportCore(reportKey);
  }

  /** openReport 主体（无账簿检查；进入即恢复被禁用的按钮）
   *  @param {boolean} [skipAutoQuery] 跳过末尾自动查询（报表样式等异步就绪后再查时用） */
  function _openReportCore(reportKey, skipAutoQuery) {
    var cfg = ReportEngine.getConfig(reportKey);
    if (!cfg) return;
    if (_ledgerBlocked) unblockLedgerReport();   // 切换到其他报表 → 按钮恢复
    if (_entryIdle) {                            // 退出待机态 → 按钮/面板/表格恢复
      _entryIdle = false;
      setEntryButtonsDisabled(false);
      var idleFilterPanel = document.querySelector('.filter-panel');
      if (idleFilterPanel) idleFilterPanel.style.display = '';
      var idleTableWrapper = document.getElementById('tableWrapper');
      if (idleTableWrapper) idleTableWrapper.style.display = '';
      var idleEmptyState = document.getElementById('emptyState');
      if (idleEmptyState) idleEmptyState.style.display = 'none';
      setEmptyStateText(I18n.t('暂无数据'), I18n.t('请调整查询条件后重试'));
    }

    AppState.currentReport = reportKey;
    AppState.currentReportName = cfg.name;   // 从配置取名，不依赖 DOM 文本

    var reportTitle = document.getElementById('reportTitle');
    if (reportTitle) reportTitle.textContent = I18n.t(cfg.name);

    // 菜单高亮：按 data-report 全量更新（收藏区 + 分组内两份条目同亮）
    document.querySelectorAll('.nav-item').forEach(function(l) {
      l.classList.remove('active');
      if (l.getAttribute('data-report') === reportKey) l.classList.add('active');
    });

    // 切换回到数据查询 Tab
    if (typeof Tabs !== 'undefined') Tabs.switchTab('tabQuery');

    if (typeof ReportEngine !== 'undefined') {
      ReportEngine.updateFilterPanel(reportKey);
      renderCurrentTableHead();
    }

    ReportEngine.currentPage = 1;
    if (!skipAutoQuery) doQuery();
  }

  /* ================================================================
     Transfer to Data Source
     ================================================================ */
  function initTransferBtn() {
    var transferBtn = document.getElementById('transferBtn');
    if (!transferBtn) return;

    transferBtn.addEventListener('click', function() {
      var reportKey = AppState.currentReport;
      var cfg = ReportEngine.getConfig(reportKey);
      if (!cfg) {
        Utils.showToast(I18n.t('请先选择报表'), 'error');
        return;
      }

      // 0 笔拒绝（前置快查）：最近一次查询结果为空，且报表与筛选条件都没变 →
      // 重新转入必然还是 0 笔，直接拒绝、不发请求（用户 2026-08-19 指定）
      var lastQuery = AppState.lastQueryData;
      if (lastQuery && lastQuery.reportKey === reportKey &&
          JSON.stringify(lastQuery.filters || {}) === JSON.stringify(ReportEngine.readFilters()) &&
          (!lastQuery.data || lastQuery.data.length === 0)) {
        Utils.showToast(I18n.t('查无数据，所以无法为您进行转入数据源'), 'warning');
        return;
      }

      var origHTML = transferBtn.innerHTML;

      // ① 立即创建占位数据源 + 切换到 AI Tab
      var pendingSource = {
        reportName: AppState.currentReportName,
        pgm: cfg.pgm || '',
        filterSummary: DatasourceList.buildFilterSummary(),
        columnProp: {},
        displayFields: cfg.displayFields ? cfg.displayFields.join(',') : ''
      };
      var pendingDS = DataSourceStore.addPending(pendingSource);

      if (typeof Tabs !== 'undefined') Tabs.switchTab('tabAI');
      DatasourceList.renderDataSourceList();

      // ② Tab 按钮加上加载指示器
      var aiTabBtn = document.querySelector('.tab-btn[data-tab="tabAI"]');
      if (aiTabBtn) setTabBadge(aiTabBtn, true);

      // ③ 异步拉取全量数据
      ReportEngine.query(reportKey, ReportEngine.readFilters(), 1, 5000)
        .then(function(result) {
          var rows = result.data || [];
          // API5 MRPCE 汇总行剔除：_SKIP_STAT="T" 的小计/合计行不转入数据源（用户决策）；
          // 其他报表无此字段恒通过
          rows = rows.filter(function(r) { return !r || r._SKIP_STAT !== 'T'; });
          // 0 笔拒绝（查询后兜底）：重新拉取后仍是 0 笔 → 撤销占位数据源、切回查询页
          // 并告知，不留下无意义的空数据源（用户 2026-08-19 指定）
          if (rows.length === 0) {
            DataSourceStore.remove(pendingDS.id);
            DatasourceList.renderDataSourceList();
            Utils.showToast(I18n.t('查无数据，所以无法为您进行转入数据源'), 'warning');
            if (typeof Tabs !== 'undefined') Tabs.switchTab('tabQuery');
            return;
          }
          // 总分类账：摘要类型 REM_TYPE 映射成语义文字（1=期初余额/2=本期合计/3=本年合计），
          // AI 数据源里存的是「期初余额」而不是原始数字「1」（用户 2026-08-18 指定，API 文档 9.1）
          rows = rows.map(function(row) {
            if (!row || row.REM_TYPE === null || row.REM_TYPE === undefined) return row;
            var copy = {};
            for (var k in row) { copy[k] = row[k]; }
            copy.REM_TYPE = ReportEngine.formatCellValue(row.REM_TYPE, 'REM_TYPE');
            return copy;
          });
          // Round 56 超大拆分（用户 2026-08-20 指定）：行数超过 MAX_DS_ROWS 拆多张卡片，
          // 卡片名称加后缀 _1/_2/_3…（localStorage 配额 ~5MB，mrpcx 26996 行整卡 10MB 必爆；
          // 存储层另有透明压缩，26996 行拆 6 卡后共 ~1.3MB）
          var MAX_DS_ROWS = 5000;
          if (rows.length > MAX_DS_ROWS) {
            DataSourceStore.remove(pendingDS.id);
            var chunkCount = Math.ceil(rows.length / MAX_DS_ROWS);
            var existingSources = DataSourceStore.getAll();
            // 手工构造卡片 + 一次性 saveAll（避免循环 add 每步重复压缩全量；id 加序号保唯一）
            // 升序构造 → 存储顺序即 _1/_2/… 在前
            var newCards = [];
            for (var ci = 0; ci < chunkCount; ci++) {
              newCards.push({
                id: 'ds_' + Date.now() + '_' + ci,
                createdAt: new Date().toISOString(),
                status: 'ready',
                reportName: AppState.currentReportName + '_' + (ci + 1),
                pgm: cfg.pgm || '',
                filterSummary: DatasourceList.buildFilterSummary(),
                columnInfo: result.columnInfo || {},
                displayFields: cfg.displayFields ? cfg.displayFields.join(',') : '',
                data: rows.slice(ci * MAX_DS_ROWS, (ci + 1) * MAX_DS_ROWS),
                recordCount: Math.min(MAX_DS_ROWS, rows.length - ci * MAX_DS_ROWS)
              });
            }
            var merged = newCards.concat(existingSources);
            if (merged.length > 20) merged = merged.slice(0, 20);   // 与 add() 同款 20 卡上限
            DataSourceStore.saveAll(merged);
            if (window.AppState) window.AppState.activeDSId = null;
            DatasourceList.renderDataSourceList();
            Utils.showToast(I18n.t('数据共 {0} 行，已拆分为 {1} 张卡片转入', rows.length.toLocaleString(), chunkCount), 'success');
          } else {
            DataSourceStore.update(pendingDS.id, {
              status: 'ready',
              data: rows,
              columnInfo: result.columnInfo || {},
              recordCount: rows.length
            });
            DatasourceList.renderDataSourceList();
            Utils.showToast(I18n.t('数据源已就绪：{0} 条', result.data ? result.data.length.toLocaleString() : '0'), 'success');
          }
        })
        .catch(function(err) {
          DataSourceStore.update(pendingDS.id, {
            status: 'error',
            errorMsg: err.message || I18n.t('未知错误')
          });
          DatasourceList.renderDataSourceList();
          Utils.showToast(I18n.t('获取数据失败: {0}', err.message || I18n.t('未知错误')), 'error');
        })
        .finally(function() {
          if (aiTabBtn) setTabBadge(aiTabBtn, false);
          transferBtn.disabled = false;
          transferBtn.innerHTML = origHTML;
        });
    });
  }

  /**
   * Tab 按钮上的加载/完成指示器
   * @param {HTMLElement} tabBtn
   * @param {boolean} show — true 显示加载中，false 移除
   */
  function setTabBadge(tabBtn, show) {
    var badge = tabBtn.querySelector('.tab-badge');
    if (show) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tab-badge';
        badge.innerHTML = '<span class="spinner"></span>';
        tabBtn.appendChild(badge);
      }
    } else {
      if (badge) badge.remove();
    }
  }

  /* ================================================================
     Query / Reset / Refresh / PageSize buttons
     ================================================================ */
  function initQueryButtons() {
    var queryBtn = document.getElementById('queryBtn');
    var resetBtn = document.getElementById('resetBtn');
    var refreshBtn = document.getElementById('refreshBtn');
    var pageSizeSelect = document.getElementById('pageSizeSelect');

    if (queryBtn) {
      queryBtn.addEventListener('click', function() {
        ReportEngine.currentPage = 1;
        doQuery();
      });
    }

    // 账簿切换 → 报表样式清单必须重取（用户指定链路：样式按账簿获取）
    var bookSel = document.getElementById('filterBookNo');
    if (bookSel) {
      bookSel.addEventListener('change', function() {
        var cfg = ReportEngine.getConfig(AppState.currentReport);
        if (!cfg || !cfg.needsRptStyle || typeof RptStyleStore === 'undefined') return;
        var styleSel = document.getElementById('filterRptNo');
        if (styleSel) { styleSel.innerHTML = '<option value="">' + I18n.t('加载中...') + '</option>'; }
        loadRptStylesForBook(AppState.currentReport, bookSel.value, null, function() {
          var s2 = document.getElementById('filterRptNo');
          if (s2) { s2.innerHTML = '<option value="">' + I18n.t('无可用样式') + '</option>'; }
        });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        var fields = ['filterCust', 'filterPrd', 'filterDep', 'filterWh',
                      'filterYwType', 'filterKb',
                      'filterDocNo', 'filterMrpNo', 'filterYgNo',
                      'filterBatNo', 'filterPrdMark', 'filterFxKnd'];
        fields.forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        var filterStatus = document.getElementById('filterStatus');
        if (filterStatus) filterStatus.value = '';
        var filterOutDayType = document.getElementById('filterOutDayType');
        if (filterOutDayType) filterOutDayType.value = '1';

        var filterDateFrom = document.getElementById('filterDateFrom');
        var filterDateTo = document.getElementById('filterDateTo');
        // Round 54：写死 2026/2025-07 会让老账套（如 AT04 2022）重置后必查空；
        // 改为动态当前年/月（日期区间按当前年，成本年月按当前月 YYYY-MM）
        var nowReset = new Date();
        var curYear = nowReset.getFullYear();
        if (filterDateFrom) filterDateFrom.value = curYear + '-01-01';
        if (filterDateTo) filterDateTo.value = curYear + '-12-31';
        var filterDateCst = document.getElementById('filterDateCst');
        if (filterDateCst) {
          var mm = String(nowReset.getMonth() + 1);
          if (mm.length === 1) mm = '0' + mm;
          filterDateCst.value = nowReset.getFullYear() + '-' + mm;
        }
        // 账簿下拉：重置回第一个账簿（若有选项；0 账簿时保持空）
        var filterBookNo = document.getElementById('filterBookNo');
        if (filterBookNo && filterBookNo.options.length > 0) filterBookNo.selectedIndex = 0;
        ReportEngine.currentPage = 1;
        // 财务报表：账簿可能已变 → 样式清单须按账簿重取；就绪/失败后再 doQuery
        var resetRcfg = ReportEngine.getConfig(AppState.currentReport);
        if (resetRcfg && resetRcfg.needsRptStyle && typeof RptStyleStore !== 'undefined') {
          var styleSel = document.getElementById('filterRptNo');
          if (styleSel) { styleSel.innerHTML = '<option value="">' + I18n.t('加载中...') + '</option>'; }
          loadRptStylesForBook(AppState.currentReport, filterBookNo ? filterBookNo.value : '', doQuery, doQuery);
          return;
        }
        // 报表样式下拉：重置回第一个匹配样式（非账簿联动报表无此下拉，此处兜底）
        var filterRptNo = document.getElementById('filterRptNo');
        if (filterRptNo && filterRptNo.options.length > 0) filterRptNo.selectedIndex = 0;

        doQuery();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() { doQuery(); });
    }

    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', function() {
        ReportEngine.currentPage = 1;
        var newSize = parseInt(pageSizeSelect.value, 10) || 20;
        ReportEngine.currentPageSize = newSize;
        if (_allData.length > 0) {
          // 缓存命中：只改切片大小，不走 API
          renderPageSlice(1, newSize);
          updatePagination(1, newSize, _allData.length);
        } else {
          doQuery();
        }
      });
    }
  }

  /* ================================================================
     Login Form Prefill
     ================================================================ */

  /**
   * 从 localStorage 回填上次登录的账号信息
   * 密码仅在非空时回填，防止空字符串覆盖用户输入
   */
  function prefillLoginForm() {
    if (typeof Auth === 'undefined') return;

    var prefill = Auth.getLoginPrefill();
    if (!prefill) return;

    if (prefill.compno) {
      var compnoEl = document.getElementById('compno');
      if (compnoEl) compnoEl.value = prefill.compno;
    }
    if (prefill.usr) {
      var usrEl = document.getElementById('usr');
      if (usrEl) usrEl.value = prefill.usr;
    }
    // 密码只在有值时才回填，防止填入空字符串或垃圾数据
    if (prefill.pwd) {
      var pwdEl = document.getElementById('pwd');
      if (pwdEl) pwdEl.value = prefill.pwd;
    }
  }

  /* ================================================================
     Login / Logout
     ================================================================ */
  /** 登出/过期时清账簿+报表样式状态：内存缓存作废 + 下拉回占位 + 解除按钮阻断
      （否则重登后下拉还挂上一次登录的账簿/样式） */
  function resetLedgerBooksState() {
    if (typeof BookStore !== 'undefined') BookStore.reset();
    var bookSel = document.getElementById('filterBookNo');
    if (bookSel) {
      bookSel.innerHTML = '<option value="">' + I18n.t('加载中...') + '</option>';
    }
    if (typeof RptStyleStore !== 'undefined') RptStyleStore.reset();
    var styleSel = document.getElementById('filterRptNo');
    if (styleSel) {
      styleSel.innerHTML = '<option value="">' + I18n.t('加载中...') + '</option>';
    }
    unblockLedgerReport();
  }

  function initAuth() {
    var loginPage = document.getElementById('loginPage');
    var dashboardPage = document.getElementById('dashboardPage');
    var loginForm = document.getElementById('loginForm');
    var loginError = document.getElementById('loginError');

    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var compno = document.getElementById('compno').value.trim();
        var usr = document.getElementById('usr').value.trim();
        var pwd = document.getElementById('pwd').value;

        if (!compno || !usr) {
          if (loginError) {
            loginError.textContent = I18n.t('请填写公司代码和用户代号');
            loginError.classList.add('visible');
          }
          return;
        }

        // 系统设置前置检查（别的机器浏览器 localStorage 为空时拦截）：
        // 服务器地址未保存/格式非法 → 不发起登录请求（避免必然失败的错误请求），
        // 提示原因并自动打开系统设置面板引导配置
        if (typeof SettingsStore !== 'undefined' && !SettingsStore.isConfigured()) {
          if (loginError) {
            loginError.textContent = I18n.t('请先进行系统设置，配置服务器地址后再登录');
            loginError.classList.add('visible');
          }
          if (typeof SettingsUI !== 'undefined') SettingsUI.open();
          return;
        }

        var loginBtn = document.getElementById('loginBtn');
        var origHTML = loginBtn ? loginBtn.innerHTML : '';
        if (loginBtn) {
          loginBtn.disabled = true;
          loginBtn.innerHTML = '<span class="spinner"></span> ' + I18n.t('登录中...');
        }
        if (loginError) loginError.classList.remove('visible');

        Auth.login(compno, usr, pwd).then(function(result) {
          if (result.success) {
            if (loginPage) loginPage.classList.add('hidden');
            if (dashboardPage) dashboardPage.classList.add('active');

            var userNameEl = document.getElementById('userName');
            var userAvatarEl = document.getElementById('userAvatar');
            var userCompanyEl = document.getElementById('userCompany');
            if (userNameEl) userNameEl.textContent = result.data.USR_NAME || usr;
            if (userAvatarEl) userAvatarEl.textContent = usr.substring(0, 2).toUpperCase();
            if (userCompanyEl) userCompanyEl.textContent = compno;

            // 入口待机态：不自动打开/查询任何报表，焦点停【搜索报表】，
            // 用户从搜索/菜单选中后才走 openReport 全链路
            enterEntryIdle();
            DatasourceList.renderDataSourceList();
            Utils.showToast(I18n.t('登录成功'), 'success');
            SettingsUI.checkFirstRun();
            // 后台预拉账簿清单（总分类账下拉），失败静默，不阻塞登录
            if (typeof BookStore !== 'undefined') BookStore.prefetch();
            // 报表样式清单按账簿获取（TYPE_NO 来自账簿行），登录时不预取——
            // 打开财务报表/切换账簿时由 loadRptStylesForBook 加载
          } else {
            if (loginError) {
              loginError.textContent = result.error;
              loginError.classList.add('visible');
            }
          }
        }).finally(function() {
          if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = origHTML;
          }
        });
      });
    }

    // 退出登录
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        Auth.logout();
        AppState.chatHistory = [];
        AppState.lastQueryData = null;
        resetLedgerBooksState();
        if (dashboardPage) dashboardPage.classList.remove('active');
        if (loginPage) loginPage.classList.remove('hidden');
        Utils.showToast(I18n.t('已退出登录'), 'success');
      });
    }

    // 监听 auth:expired 事件
    window.addEventListener('auth:expired', function() {
      resetLedgerBooksState();
      if (dashboardPage) dashboardPage.classList.remove('active');
      if (loginPage) loginPage.classList.remove('hidden');
      Utils.showToast(I18n.t('登录已过期，请重新登录'), 'error');
    });
  }

  /* ================================================================
     Sidebar Collapse
     ================================================================ */
  function initSidebarCollapse() {
    var sidebar = document.getElementById('sidebar');
    var sidebarToggle = document.getElementById('sidebarToggle');
    var mainContent = document.querySelector('.main-content');
    var sidebarCollapsed = false;

    if (!sidebarToggle) return;

    sidebarToggle.addEventListener('click', function() {
      sidebarCollapsed = !sidebarCollapsed;
      if (sidebarCollapsed) {
        if (sidebar) sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
        sidebarToggle.textContent = '▶';
        sidebarToggle.title = I18n.t('展开侧边栏');
      } else {
        if (sidebar) sidebar.classList.remove('collapsed');
        if (mainContent) mainContent.classList.remove('sidebar-collapsed');
        sidebarToggle.textContent = '◀';
        sidebarToggle.title = I18n.t('折叠侧边栏');
      }
      // 折叠态变化 → 即时重渲染报表菜单（折叠态全量 emoji 平铺 / 展开态分组视图）
      if (typeof ReportMenu !== 'undefined') ReportMenu.render();
      // 延迟 resize 图表实例
      setTimeout(function() {
        if (window._chartInstances) {
          window._chartInstances.forEach(function(c) { if (c.resize) c.resize(); });
        }
      }, 250);
    });
  }

  /* ================================================================
     Clock
     ================================================================ */
  function updateClock() {
    var now = new Date();
    var el = document.getElementById('currentTime');
    if (!el) return;
    el.textContent =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
  }

  /* ================================================================
     Init — 应用入口
     ================================================================ */
  function init() {
    // 回填上次登录凭据（必须在 initAuth 之前）
    prefillLoginForm();

    // 初始化子模块
    if (typeof DatasourceList !== 'undefined') DatasourceList.init();
    if (typeof Tabs !== 'undefined') Tabs.init();
    if (typeof ChatCore !== 'undefined') ChatCore.init();
    if (typeof AISuggestions !== 'undefined') AISuggestions.init();
    if (typeof SettingsUI !== 'undefined') SettingsUI.init();
    if (typeof NotepadUI !== 'undefined') NotepadUI.init();

    // 报表菜单（动态渲染侧边栏：搜索/折叠/收藏；未加载时守卫跳过）
    if (typeof ReportMenu !== 'undefined') ReportMenu.init();

    // 绑定 UI 事件
    initSidebarNav();
    initTransferBtn();
    initQueryButtons();
    initAuth();
    initSidebarCollapse();

    // 时钟
    updateClock();
    setInterval(updateClock, 1000);

    // Round 54：日期输入初始值动态化（index.html 写死 2026/2025-07 会逐年过期；
    // 老账套用户按需自行改日期，报表日期条件已全部支持用户输入）
    var nowInit = new Date();
    var initYear = nowInit.getFullYear();
    var dateFromEl = document.getElementById('filterDateFrom');
    var dateToEl = document.getElementById('filterDateTo');
    if (dateFromEl) dateFromEl.value = initYear + '-01-01';
    if (dateToEl) dateToEl.value = initYear + '-12-31';
    var dateCstEl = document.getElementById('filterDateCst');
    if (dateCstEl) {
      var im = String(nowInit.getMonth() + 1);
      if (im.length === 1) im = '0' + im;
      dateCstEl.value = initYear + '-' + im;
    }

    // 入口不再预渲染默认报表：登录/会话恢复后进入待机态（enterEntryIdle），
    // 报表表头与筛选面板在用户选中报表后由 openReport 渲染

    // 语言切换：重刷动态渲染内容（表头/表体切片/标题/分页），静态文字由 applyStatic 覆盖
    window.addEventListener('i18n:changed', refreshDynamicI18n);

    // 会话恢复
    Auth.checkAuth().then(function(valid) {
      var loginPage = document.getElementById('loginPage');
      var dashboardPage = document.getElementById('dashboardPage');

      if (valid) {
        var user = Auth.getUser();
        if (user) {
          var userNameEl = document.getElementById('userName');
          var userAvatarEl = document.getElementById('userAvatar');
          var userCompanyEl = document.getElementById('userCompany');
          if (userNameEl) userNameEl.textContent = user.usrName || user.usr;
          if (userAvatarEl) userAvatarEl.textContent = (user.usr || 'SA').substring(0, 2).toUpperCase();
          if (userCompanyEl) userCompanyEl.textContent = user.compno;
          if (dashboardPage) dashboardPage.classList.add('active');
          if (loginPage) loginPage.classList.add('hidden');
          // 入口待机态：不自动查询任何报表，焦点停【搜索报表】
          enterEntryIdle();
          DatasourceList.renderDataSourceList();
          SettingsUI.checkFirstRun();
          // 后台预拉账簿清单（总分类账下拉），失败静默，不阻塞登录
          if (typeof BookStore !== 'undefined') BookStore.prefetch();
        } else {
          if (loginPage) loginPage.classList.remove('hidden');
        }
      } else {
        if (loginPage) loginPage.classList.remove('hidden');
      }
    });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    doQuery: doQuery,
    updatePagination: updatePagination,
    updateClock: updateClock,
    init: init
  };

})();

// ── DOM Ready 后自动启动 ──────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
