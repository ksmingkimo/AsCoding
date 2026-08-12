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
      Utils.showToast('报表引擎未加载', 'error');
      return;
    }
    if (ReportEngine.isLoading) return;

    var reportKey = AppState.currentReport;
    var filters = ReportEngine.readFilters();
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

    // API 不认 offset start，始终用 [0, 5000] 取全量数据
    ReportEngine.query(reportKey, filters, 1, 5000)
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
        Utils.showToast('查询失败: ' + (err.message || '未知错误'), 'error');
        if (tbody) tbody.innerHTML = '';
        var tableCount = document.getElementById('tableCount');
        if (tableCount) tableCount.textContent = '0';
        if (emptyState) emptyState.style.display = '';
        var pagination = document.querySelector('.pagination');
        if (pagination) pagination.style.display = 'none';
      })
      .finally(function() {
        ReportEngine.isLoading = false;
        if (loadingEl) loadingEl.style.display = 'none';
      });
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
    var tableCount = document.getElementById('tableCount');
    if (tableCount) tableCount.textContent = pageData.length;
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
      if (infoEl) infoEl.textContent = '无记录';
      if (controlsEl) controlsEl.innerHTML = '';
      return;
    }

    var totalPages = Math.ceil(totalCount / pageSize);
    var start = (page - 1) * pageSize + 1;
    var end = Math.min(start + pageSize - 1, totalCount);
    if (infoEl) infoEl.textContent = '第 ' + start + '-' + end + ' 条，共 ' + totalCount.toLocaleString() + ' 条';

    var html = '';
    html += '<button class="page-btn" title="首页" ' + (page <= 1 ? 'disabled' : '') +
            ' data-page="1">&lt;&lt;</button>';
    html += '<button class="page-btn" title="上一页" ' + (page <= 1 ? 'disabled' : '') +
            ' data-page="' + (page - 1) + '">&lt;</button>';

    var startPage = Math.max(1, page - 2);
    for (var i = startPage; i <= Math.min(startPage + 4, totalPages); i++) {
      html += '<button class="page-btn' + (i === page ? ' active' : '') +
              '" data-page="' + i + '">' + i + '</button>';
    }

    html += '<button class="page-btn" title="下一页" ' + (page >= totalPages ? 'disabled' : '') +
            ' data-page="' + (page + 1) + '">&gt;</button>';
    html += '<button class="page-btn" title="末页" ' + (page >= totalPages ? 'disabled' : '') +
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
     Sidebar Navigation
     ================================================================ */
  function initSidebarNav() {
    document.querySelectorAll('.nav-item').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(function(l) { l.classList.remove('active'); });
        this.classList.add('active');

        var navText = this.querySelector('.nav-text');
        AppState.currentReportName = navText ? navText.textContent.trim() : this.textContent.trim();
        AppState.currentReport = this.getAttribute('data-report');

        var reportTitle = document.getElementById('reportTitle');
        if (reportTitle) reportTitle.textContent = AppState.currentReportName;

        // 切换回到数据查询 Tab
        if (typeof Tabs !== 'undefined') Tabs.switchTab('tabQuery');

        if (typeof ReportEngine !== 'undefined') {
          ReportEngine.updateFilterPanel(AppState.currentReport);
          ReportEngine.renderTableHead(document.getElementById('tableHeadRow'), AppState.currentReport);
        }

        ReportEngine.currentPage = 1;
        doQuery();
      });
    });
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
        Utils.showToast('请先选择报表', 'error');
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
          DataSourceStore.update(pendingDS.id, {
            status: 'ready',
            data: result.data || [],
            columnInfo: result.columnInfo || {},
            recordCount: result.data ? result.data.length : 0
          });
          DatasourceList.renderDataSourceList();
          Utils.showToast('数据源已就绪：' + (result.data ? result.data.length.toLocaleString() : '0') + ' 条', 'success');
        })
        .catch(function(err) {
          DataSourceStore.update(pendingDS.id, {
            status: 'error',
            errorMsg: err.message || '未知错误'
          });
          DatasourceList.renderDataSourceList();
          Utils.showToast('获取数据失败: ' + (err.message || '未知错误'), 'error');
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
        if (filterDateCst) filterDateCst.value = '2025-07';

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
            loginError.textContent = '请填写公司代码和用户代号';
            loginError.classList.add('visible');
          }
          return;
        }

        var loginBtn = document.getElementById('loginBtn');
        var origHTML = loginBtn ? loginBtn.innerHTML : '';
        if (loginBtn) {
          loginBtn.disabled = true;
          loginBtn.innerHTML = '<span class="spinner"></span> 登录中...';
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

            doQuery();
            DatasourceList.renderDataSourceList();
            Utils.showToast('登录成功', 'success');
            SettingsUI.checkFirstRun();
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
        if (dashboardPage) dashboardPage.classList.remove('active');
        if (loginPage) loginPage.classList.remove('hidden');
        Utils.showToast('已退出登录', 'success');
      });
    }

    // 监听 auth:expired 事件
    window.addEventListener('auth:expired', function() {
      if (dashboardPage) dashboardPage.classList.remove('active');
      if (loginPage) loginPage.classList.remove('hidden');
      Utils.showToast('登录已过期，请重新登录', 'error');
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
        sidebarToggle.title = '展开侧边栏';
      } else {
        if (sidebar) sidebar.classList.remove('collapsed');
        if (mainContent) mainContent.classList.remove('sidebar-collapsed');
        sidebarToggle.textContent = '◀';
        sidebarToggle.title = '折叠侧边栏';
      }
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
      var tableHeadRow = document.getElementById('tableHeadRow');
      if (tableHeadRow) ReportEngine.renderTableHead(tableHeadRow, AppState.currentReport);
      ReportEngine.updateFilterPanel(AppState.currentReport);
    }

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
          doQuery();
          DatasourceList.renderDataSourceList();
          SettingsUI.checkFirstRun();
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
