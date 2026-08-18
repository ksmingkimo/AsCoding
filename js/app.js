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
    currentReport: 'invSO',
    currentReportName: '受订报表',
    lastQueryData: null,       // { pgm, data, columnInfo, columnProp, displayFields }
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
    // 0 账簿拦截兜底：按钮已禁用时查询也不该跑（键盘/其他路径）
    if (_ledgerBlocked) return;

    var reportKey = AppState.currentReport;
    var cfg = ReportEngine.getConfig(reportKey);
    var filters = ReportEngine.readFilters();
    var isStream = !!(cfg && cfg.apiMethod === 'getReportStream');

    // BOOK_NO 铁律（实测：空值 → 服务端 406；前端先拦，不发请求）
    if (isStream && !filters.filterBookNo) {
      Utils.showToast(I18n.t('请选择账簿'), 'error');
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
          data: _allData,
          columnInfo: result.columnInfo || [],
          columnProp: {},
          displayFields: cfg ? cfg.displayFields.join(',') : ''
        };

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
    renderCurrentTableHead();

    // 报表标题（AppState.currentReportName 保持简体规范值，渲染点翻译）
    var reportTitle = document.getElementById('reportTitle');
    var cfg = ReportEngine.getConfig(AppState.currentReport);
    if (reportTitle && cfg) reportTitle.textContent = I18n.t(cfg.name);

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

  /** 账簿下拉填充：BOOK_NO · NAME；保持已选值，无效/未选则预选第一个 */
  function populateBookSelect(books) {
    var sel = document.getElementById('filterBookNo');
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '';
    books.forEach(function(b) {
      var o = document.createElement('option');
      o.value = b.BOOK_NO;
      o.textContent = b.BOOK_NO + ' · ' + b.NAME;
      sel.appendChild(o);
    });
    var keepCurrent = books.some(function(b) { return b.BOOK_NO === current; });
    if (current && keepCurrent) {
      sel.value = current;
    } else {
      sel.selectedIndex = 0;
    }
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
        _openReportCore(reportKey);
      });
      return;
    }
    _openReportCore(reportKey);
  }

  /** openReport 主体（无账簿检查；进入即恢复被禁用的按钮） */
  function _openReportCore(reportKey) {
    var cfg = ReportEngine.getConfig(reportKey);
    if (!cfg) return;
    if (_ledgerBlocked) unblockLedgerReport();   // 切换到其他报表 → 按钮恢复

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
    doQuery();
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
          // 总分类账：摘要类型 REM_TYPE 映射成语义文字（1=期初余额/2=本期合计/3=本年合计），
          // AI 数据源里存的是「期初余额」而不是原始数字「1」（用户 2026-08-18 指定，API 文档 9.1）
          rows = rows.map(function(row) {
            if (!row || row.REM_TYPE === null || row.REM_TYPE === undefined) return row;
            var copy = {};
            for (var k in row) { copy[k] = row[k]; }
            copy.REM_TYPE = ReportEngine.formatCellValue(row.REM_TYPE, 'REM_TYPE');
            return copy;
          });
          DataSourceStore.update(pendingDS.id, {
            status: 'ready',
            data: rows,
            columnInfo: result.columnInfo || {},
            recordCount: rows.length
          });
          DatasourceList.renderDataSourceList();
          Utils.showToast(I18n.t('数据源已就绪：{0} 条', result.data ? result.data.length.toLocaleString() : '0'), 'success');
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
        if (filterDateFrom) filterDateFrom.value = '2026-01-01';
        if (filterDateTo) filterDateTo.value = '2026-12-31';
        var filterDateCst = document.getElementById('filterDateCst');
        if (filterDateCst) {
          // 总分类账：会计期间重置回当前月（YYYY-MM）；其余报表保持默认成本年月
          if (AppState.currentReport === 'accgl') {
            var now = new Date();
            var mm = String(now.getMonth() + 1);
            if (mm.length === 1) mm = '0' + mm;
            filterDateCst.value = now.getFullYear() + '-' + mm;
          } else {
            filterDateCst.value = '2025-07';
          }
        }
        // 账簿下拉：重置回第一个账簿（若有选项；0 账簿时保持空）
        var filterBookNo = document.getElementById('filterBookNo');
        if (filterBookNo && filterBookNo.options.length > 0) filterBookNo.selectedIndex = 0;

        ReportEngine.currentPage = 1;
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
  /** 登出/过期时清账簿状态：内存缓存作废 + 下拉回占位 + 解除按钮阻断
      （否则重登后下拉还挂上一次登录的账簿） */
  function resetLedgerBooksState() {
    if (typeof BookStore !== 'undefined') BookStore.reset();
    var bookSel = document.getElementById('filterBookNo');
    if (bookSel) {
      bookSel.innerHTML = '<option value="">' + I18n.t('加载中...') + '</option>';
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

            // 登录后走 openReport 全链路（重登场景：账簿下拉重填/筛选面板重置/按钮解除阻断），
            // 不再裸 doQuery——否则下拉还挂着上一次登录的账簿
            openReport(AppState.currentReport);
            DatasourceList.renderDataSourceList();
            Utils.showToast(I18n.t('登录成功'), 'success');
            SettingsUI.checkFirstRun();
            // 后台预拉账簿清单（总分类账下拉），失败静默，不阻塞登录
            if (typeof BookStore !== 'undefined') BookStore.prefetch();
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

    // 初始化默认报表的表头和筛选面板
    if (typeof ReportEngine !== 'undefined') {
      renderCurrentTableHead();
      ReportEngine.updateFilterPanel(AppState.currentReport);
    }

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
          // 会话恢复后按当前语言重渲染表头（init 渲染的语言即 boot 语言，此处双保险）
          renderCurrentTableHead();
          doQuery();
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
