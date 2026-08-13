/* ============================================================
   ReportMenu — 报表菜单（搜索 / 折叠分组 / 收藏置顶）
   动态渲染侧边栏导航，数据源为 REPORT_CONFIG(group/icon/pinyin)。
   一条 render() 代码路径覆盖 搜索 × 折叠 × 收藏 × active 四种状态。
   ============================================================ */
var ReportMenu = (function() {
  'use strict';

  /* 分组顺序与组内顺序（与旧静态侧边栏保持一致）。
     不在 MENU_ORDER 中的新 key 兜底追加到其 group 末尾；
     group 不在 MENU_GROUPS 中则新分组追加到侧边栏最底部。
     即：新增报表只需在 REPORT_CONFIG 加一条含 group/icon/pinyin 的配置。 */
  var MENU_GROUPS = ['进销存报表','财务管理','库存管理','采购与价格','生产制造','人力资源','固定资产'];
  var MENU_ORDER = ['invpo','invpc','invSO','invSa','monAA','monBA','accabgt','rptsarp','monbx','monjk',
    'monCA','monCB','rptinvdo','rptinvdl','rptinvswa','invic','invij','scmdrpti','invpopc','invtwpc',
    'invhp','invhs','mrpPK','mrpPS','mrppu','mrpag','mrpcf','wagCG3','rptwagyg0','rptwagyg','fixaa'];

  var _query = '';   // 当前搜索词（已 trim + 小写）

  /* ---------- 工具 ---------- */

  function _nav() { return document.getElementById('sidebarNav'); }
  function _searchInput() { return document.getElementById('reportSearch'); }
  function _isSidebarCollapsed() {
    var sb = document.getElementById('sidebar');
    return !!(sb && sb.classList.contains('collapsed'));
  }
  function _currentKey() {
    return (window.AppState && window.AppState.currentReport) || '';
  }

  /** 菜单排序后的 key 列表：MENU_ORDER 优先，未收录的新 key 兜底追加 */
  function _orderedKeys() {
    var keys = [];
    if (typeof ReportEngine !== 'undefined' && typeof ReportEngine.getReportKeys === 'function') {
      keys = ReportEngine.getReportKeys();
    }
    var seen = {};
    var ordered = [];
    MENU_ORDER.forEach(function(k) {
      if (keys.indexOf(k) !== -1 && !seen[k]) { seen[k] = true; ordered.push(k); }
    });
    keys.forEach(function(k) {
      if (!seen[k]) { seen[k] = true; ordered.push(k); }
    });
    return ordered;
  }

  /** 全部分组：MENU_GROUPS + 配置里出现的新分组（兜底追加到底部） */
  function _allGroups() {
    var groups = MENU_GROUPS.slice();
    _orderedKeys().forEach(function(k) {
      var cfg = ReportEngine.getConfig(k);
      if (cfg && cfg.group && groups.indexOf(cfg.group) === -1) groups.push(cfg.group);
    });
    return groups;
  }

  function _keysOfGroup(group) {
    return _orderedKeys().filter(function(k) {
      var cfg = ReportEngine.getConfig(k);
      return cfg && cfg.group === group;
    });
  }

  /** 搜索匹配：中文名模糊 / 拼音首字母两路 contains；
      key 匹配仅作兜底（名称/拼音全部无命中时才生效，开发者便利） */

  /* ---------- HTML 构建 ---------- */

  function _buildItemHtml(key, cfg) {
    var isActive = key === _currentKey();
    var isFav = ReportMenuStore.isFavorite(key);
    // 显示名走 I18n.t()；收藏 key / data-report / 折叠 key 均保留简体规范值
    var name = Utils.escapeHtml(I18n.t(cfg.name || key));
    var starTitle = I18n.t(isFav ? '取消收藏' : '收藏');
    return '<a href="#report-' + key + '" class="nav-item' + (isActive ? ' active' : '') + '" data-report="' + key + '" title="' + name + '">' +
      '<span class="nav-icon">' + (cfg.icon || '📄') + '</span>' +
      '<span class="nav-text">' + name + '</span>' +
      '<span class="nav-star' + (isFav ? ' faved' : '') + '" data-star="' + key + '" role="button" aria-label="' + starTitle + '" title="' + starTitle + '">' +
        (isFav ? '★' : '☆') +
      '</span>' +
    '</a>';
  }

  function _buildGroupHtml(group) {
    var collapsed = ReportMenuStore.isGroupCollapsed(group);
    var keys = _keysOfGroup(group);
    var html =
      '<div class="nav-section nav-section-toggleable' + (collapsed ? ' collapsed' : '') + '"' +
        ' data-group="' + Utils.escapeHtml(group) + '" role="button" tabindex="0" aria-expanded="' + (!collapsed) + '">' +
        '<span class="nav-caret">▾</span>' + Utils.escapeHtml(I18n.t(group)) +
        '<span class="nav-count">' + keys.length + '</span>' +
      '</div>';
    if (!collapsed) {
      keys.forEach(function(k) {
        html += _buildItemHtml(k, ReportEngine.getConfig(k));
      });
    }
    return html;
  }

  /** 搜索模式：跨分组扁平列表（保持 MENU_ORDER 顺序），分组标题与收藏区隐藏。
      名称/拼音有命中时忽略 key 匹配，避免 key 字母偶合造成干扰（如 "cg" 误中 wagCG3） */
  function _renderSearch(q) {
    var namePinyinHits = [];
    var keyHits = [];
    _orderedKeys().forEach(function(k) {
      var cfg = ReportEngine.getConfig(k);
      if (!cfg) return;
      var name = String(cfg.name || '').toLowerCase();
      var tName = I18n.t(cfg.name || '').toLowerCase();  // 当前语言译名（zh-cn 与 name 相同）
      var pinyin = String(cfg.pinyin || '').toLowerCase();
      if (name.indexOf(q) !== -1 || tName.indexOf(q) !== -1 || pinyin.indexOf(q) !== -1) { namePinyinHits.push(k); return; }
      if (String(k).toLowerCase().indexOf(q) !== -1) keyHits.push(k);
    });

    var list = namePinyinHits.length > 0 ? namePinyinHits : keyHits;
    var html = '';
    list.forEach(function(k) {
      html += _buildItemHtml(k, ReportEngine.getConfig(k));
    });
    return html ? html : '<div class="nav-empty">' + I18n.t('无匹配报表') + '</div>';
  }

  /** 折叠态（56px）：忽略分组折叠状态，全部报表 emoji 平铺（同旧版无分组效果），
      收藏去重置顶，组与组之间细分割线，不渲染分组标题 */
  function _renderCollapsed() {
    var html = '';
    var favs = ReportMenuStore.getFavorites().filter(function(k) {
      return !!ReportEngine.getConfig(k);
    });
    var favSet = {};
    favs.forEach(function(k) { favSet[k] = true; });
    if (favs.length > 0) {
      favs.forEach(function(k) {
        html += _buildItemHtml(k, ReportEngine.getConfig(k));
      });
      html += '<div class="nav-divider" aria-hidden="true"></div>';
    }
    var first = true;
    _allGroups().forEach(function(group) {
      var keys = _keysOfGroup(group).filter(function(k) { return !favSet[k]; });
      if (keys.length === 0) return;   // 该组条目已全部收藏置顶，跳过防孤儿分割线
      if (!first) html += '<div class="nav-divider" aria-hidden="true"></div>';
      first = false;
      keys.forEach(function(k) {
        html += _buildItemHtml(k, ReportEngine.getConfig(k));
      });
    });
    return html;
  }

  /** 普通模式：收藏区（无收藏时隐藏，不可折叠）+ 分组视图；
      侧边栏折叠时走全量平铺模式（_renderCollapsed） */
  function _renderNormal() {
    if (_isSidebarCollapsed()) return _renderCollapsed();
    var html = '';
    var favs = ReportMenuStore.getFavorites().filter(function(k) {
      return !!ReportEngine.getConfig(k);
    });
    if (favs.length > 0) {
      html += '<div class="nav-section nav-fav-header">★ ' + I18n.t('收藏') + '</div>';
      favs.forEach(function(k) {
        html += _buildItemHtml(k, ReportEngine.getConfig(k));
      });
    }
    _allGroups().forEach(function(group) {
      html += _buildGroupHtml(group);
    });
    return html;
  }

  /* ---------- 渲染 ---------- */

  /** 全量重渲染侧边栏（31 条成本可忽略），active 态按 AppState 统一写入 */
  function render() {
    var nav = _nav();
    if (!nav) return;
    nav.innerHTML = _query ? _renderSearch(_query) : _renderNormal();
  }

  /* ---------- 交互 ---------- */

  function init() {
    var nav = _nav();
    var input = _searchInput();

    if (nav) {
      // 容器级事件委托（一次绑定，动态渲染后依然生效）
      nav.addEventListener('click', function(e) {
        // ① 收藏星标：优先处理，不触发报表跳转
        var star = e.target.closest('.nav-star');
        if (star) {
          e.preventDefault();
          e.stopPropagation();
          ReportMenuStore.toggleFavorite(star.getAttribute('data-star'));
          render();   // 保持当前搜索词与折叠态，重渲染
          return;
        }
        // ② 分组标题折叠（56px 折叠态下禁用，防误触）
        var sec = e.target.closest('.nav-section-toggleable');
        if (sec) {
          if (_isSidebarCollapsed()) return;
          ReportMenuStore.toggleGroup(sec.getAttribute('data-group'));
          render();
          return;
        }
        // ③ .nav-item 点击交给 app.js 的委托监听（openReport）
      });

      // 键盘可达性：分组标题 Enter/Space 切换折叠
      nav.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var sec = e.target.closest('.nav-section-toggleable');
        if (!sec) return;
        e.preventDefault();
        if (_isSidebarCollapsed()) return;
        ReportMenuStore.toggleGroup(sec.getAttribute('data-group'));
        render();
      });
    }

    if (input) {
      input.addEventListener('input', function() {
        _query = input.value.trim().toLowerCase();
        render();
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {   // Esc 仅在搜索框焦点内生效，不劫持其他场景
          e.preventDefault();
          clearSearch();
        }
      });
    }

    // Ctrl+K / Cmd+K 聚焦搜索框（登录页由元素存在性天然守卫）
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
      }
    });

    render();
  }

  /** 清空搜索：恢复分组视图并收起焦点 */
  function clearSearch() {
    var input = _searchInput();
    _query = '';
    if (input) {
      input.value = '';
      input.blur();
    }
    render();
  }

  /** Ctrl+K：聚焦并全选；侧边栏折叠时先程序化展开（复用 app.js 现有折叠切换）。
      登录页（loginPage 未隐藏）不响应，避免焦点落进隐藏面板 */
  function focusSearch() {
    var input = _searchInput();
    if (!input) return;
    var login = document.getElementById('loginPage');
    if (login && !login.classList.contains('hidden')) return;
    if (_isSidebarCollapsed()) {
      var toggle = document.getElementById('sidebarToggle');
      if (toggle) toggle.click();
    }
    input.focus();
    input.select();
  }

  return {
    init: init,
    render: render,
    clearSearch: clearSearch,
    focusSearch: focusSearch
  };
})();
