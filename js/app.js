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
    var page = ReportEngine.currentPage || 1;
    var pageSizeSelect = document.getElementById('pageSizeSelect');
    var pageSize = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) || 20 : 20;
    ReportEngine.currentPageSize = pageSize;

    ReportEngine.isLoading = true;
    var loadingEl = document.getElementById('tableLoading');
    var tbody = document.getElementById('tableBody');
    var emptyState = document.getElementById('emptyState');
    var pagination = document.querySelector('.pagination');
    if (loadingEl) loadingEl.style.display = 'flex';

    ReportEngine.query(reportKey, filters, page, pageSize)
      .then(function(result) {
        ReportEngine.currentData = result.data;

        var cfg = ReportEngine.getConfig(reportKey);
        AppState.lastQueryData = {
          pgm: cfg ? cfg.pgm : '',
          data: result.data,
          columnInfo: result.columnInfo || [],
          columnProp: {},
          displayFields: cfg ? cfg.displayFields.join(',') : ''
        };

        if (tbody) ReportEngine.renderTableBody(tbody, result.data, reportKey);

        var tableCount = document.getElementById('tableCount');
        if (tableCount) tableCount.textContent = result.data.length;

        var tableWrapper = document.getElementById('tableWrapper');
        if (result.data.length === 0) {
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

        updatePagination(page, pageSize, result.data.length);
      })
      .catch(function(err) {
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
   * 更新分页控件
   */
  function updatePagination(page, pageSize, dataLength) {
    var infoEl = document.getElementById('paginationInfo');
    var controlsEl = document.getElementById('paginationControls');

    if (dataLength === 0) {
      if (infoEl) infoEl.textContent = '无记录';
      if (controlsEl) controlsEl.innerHTML = '';
      return;
    }

    var start = (page - 1) * pageSize + 1;
    var end = start + dataLength - 1;
    if (infoEl) infoEl.textContent = '第 ' + start + '-' + end + ' 条（当前页）';

    var hasMore = dataLength >= pageSize;
    var html = '';
    html += '<button class="page-btn" title="首页" ' + (page <= 1 ? 'disabled' : '') +
            ' data-page="1">&lt;&lt;</button>';
    html += '<button class="page-btn" title="上一页" ' + (page <= 1 ? 'disabled' : '') +
            ' data-page="' + (page - 1) + '">&lt;</button>';

    var startPage = Math.max(1, page - 2);
    for (var i = startPage; i < startPage + 5; i++) {
      if (i > page && !hasMore) break;
      html += '<button class="page-btn' + (i === page ? ' active' : '') +
              '" data-page="' + i + '">' + i + '</button>';
    }

    html += '<button class="page-btn" title="下一页" ' + (!hasMore ? 'disabled' : '') +
            ' data-page="' + (page + 1) + '">&gt;</button>';
    html += '<button class="page-btn" title="末页" ' + (!hasMore ? 'disabled' : '') +
            ' data-page="' + (page + 1) + '">&gt;&gt;</button>';

    if (controlsEl) {
      controlsEl.innerHTML = html;
      controlsEl.querySelectorAll('.page-btn[data-page]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (this.disabled) return;
          var targetPage = parseInt(this.getAttribute('data-page'), 10);
          if (targetPage && targetPage !== ReportEngine.currentPage) {
            ReportEngine.currentPage = targetPage;
            doQuery();
            var activePanel = document.querySelector('.tab-panel.active .content-body');
            if (activePanel) activePanel.scrollTop = 0;
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
      if (!AppState.lastQueryData || !AppState.lastQueryData.data ||
          AppState.lastQueryData.data.length === 0) {
        Utils.showToast('请先查询数据后再转入数据源', 'error');
        return;
      }

      var source = {
        reportName: AppState.currentReportName,
        pgm: AppState.lastQueryData.pgm || '',
        filterSummary: DatasourceList.buildFilterSummary(),
        data: AppState.lastQueryData.data,
        columnInfo: AppState.lastQueryData.columnInfo || {},
        columnProp: AppState.lastQueryData.columnProp || {},
        displayFields: AppState.lastQueryData.displayFields || '',
        recordCount: AppState.lastQueryData.data.length
      };

      DataSourceStore.add(source);
      Utils.showToast('数据源已保存：' + source.reportName + ' - ' +
        source.filterSummary + '，共 ' + source.recordCount.toLocaleString() + ' 条');

      if (typeof Tabs !== 'undefined') Tabs.switchTab('tabAI');
    });
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
                      'filterDocNo', 'filterMrpNo', 'filterYgNo'];
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
        doQuery();
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
