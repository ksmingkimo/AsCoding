/**
 * datasource-list.js — 数据源列表 UI 模块
 * 负责：渲染数据源卡片列表、筛选条件摘要、按钮事件绑定
 * 依赖：DataSourceStore、Utils
 */

var DatasourceList = (function() {
  'use strict';

  /**
   * 构建当前筛选条件的可读摘要
   * @returns {string}
   */
  function buildFilterSummary() {
    var parts = [];
    var dateFrom = document.getElementById('filterDateFrom');
    var dateTo = document.getElementById('filterDateTo');
    if (dateFrom && dateTo) {
      var fromVal = dateFrom.value;
      var toVal = dateTo.value;
      if (fromVal || toVal) {
        parts.push(I18n.t('日期') + (fromVal || '...') + I18n.t('至') + (toVal || '...'));
      }
    }
    var cust = document.getElementById('filterCust');
    if (cust && cust.value.trim()) { parts.push(I18n.t('客户/厂商') + '=' + cust.value.trim()); }
    var prd = document.getElementById('filterPrd');
    if (prd && prd.value.trim()) { parts.push(I18n.t('货品') + '=' + prd.value.trim()); }
    var dep = document.getElementById('filterDep');
    if (dep && dep.value.trim()) { parts.push(I18n.t('部门') + '=' + dep.value.trim()); }
    var wh = document.getElementById('filterWh');
    if (wh && wh.value.trim()) { parts.push(I18n.t('仓库') + '=' + wh.value.trim()); }
    var status = document.getElementById('filterStatus');
    if (status && status.value) { parts.push(I18n.t('审核') + '=' + (status.value === 'Y' ? I18n.t('已审核') : I18n.t('未审核'))); }
    var ywType = document.getElementById('filterYwType');
    if (ywType && ywType.value.trim()) { parts.push(I18n.t('业务类型') + '=' + ywType.value.trim()); }
    var kb = document.getElementById('filterKb');
    if (kb && kb.value.trim()) { parts.push(I18n.t('收付款方式') + '=' + kb.value.trim()); }
    // v4/v5 总账报表：账簿 + 会计期间（filterBookNo 显示下拉选中的 BOOK_NO 值）
    var bookNo = document.getElementById('filterBookNo');
    if (bookNo && bookNo.value) { parts.push(I18n.t('账簿') + '=' + bookNo.value); }
    // v6 三财务报表：报表样式（显示选中 option 文本 "RPT_NO · NAME"，比裸 RPT_NO 可读）
    var rptNo = document.getElementById('filterRptNo');
    if (rptNo && rptNo.value) {
      var rptOpt = rptNo.options[rptNo.selectedIndex];
      parts.push(I18n.t('报表样式') + '=' + (rptOpt && rptOpt.textContent ? rptOpt.textContent : rptNo.value));
    }
    var dateCst = document.getElementById('filterDateCst');
    if (dateCst && dateCst.value.trim()) { parts.push(I18n.t('会计期间') + '=' + dateCst.value.trim()); }
    return parts.length > 0 ? parts.join(', ') : I18n.t('全部条件');
  }

  /**
   * 渲染数据源列表（由外部调用或事件触发）
   */
  function renderDataSourceList() {
    var dsList = document.getElementById('dsList');
    var dsEmpty = document.getElementById('dsEmpty');
    if (!dsList) return;

    var sources = DataSourceStore.getAll();

    // 移除现有卡片（保留空状态元素）
    dsList.querySelectorAll('.ds-card').forEach(function(c) { c.remove(); });

    if (sources.length === 0) {
      if (dsEmpty) dsEmpty.style.display = '';
      return;
    }

    if (dsEmpty) dsEmpty.style.display = 'none';

    sources.forEach(function(ds) {
      var card = document.createElement('div');
      var isLoading = ds.status === 'loading';
      var isError = ds.status === 'error';
      card.className = 'ds-card' +
        (window.AppState && window.AppState.activeDSId === ds.id ? ' active' : '') +
        (isLoading ? ' ds-loading' : '') +
        (isError ? ' ds-error' : '');
      card.setAttribute('data-dsid', ds.id);

      if (isLoading) {
        card.innerHTML =
          '<div class="ds-name">' + Utils.escapeHtml(ds.reportName) + '</div>' +
          '<div class="ds-summary">' + Utils.escapeHtml(ds.filterSummary || '') + '</div>' +
          '<div class="ds-meta">' +
            '<span class="ds-status-loading"><span class="spinner"></span> ' + I18n.t('正在加载数据...') + '</span>' +
          '</div>';
      } else if (isError) {
        card.innerHTML =
          '<button class="ds-delete" title="' + I18n.t('删除此数据源') + '">&times;</button>' +
          '<div class="ds-name">' + Utils.escapeHtml(ds.reportName) + '</div>' +
          '<div class="ds-summary">' + Utils.escapeHtml(ds.filterSummary || '') + '</div>' +
          '<div class="ds-meta">' +
            '<span class="ds-status-error">❌ ' + Utils.escapeHtml(ds.errorMsg || I18n.t('加载失败')) + '</span>' +
          '</div>';
      } else {
        card.innerHTML =
          '<button class="ds-delete" title="' + I18n.t('删除此数据源') + '">&times;</button>' +
          '<div class="ds-name">' + Utils.escapeHtml(ds.reportName) + '</div>' +
          '<div class="ds-summary">' + Utils.escapeHtml(ds.filterSummary) + '</div>' +
          '<div class="ds-meta">' +
            '<span>' + I18n.t('{0} 条记录', (ds.recordCount || 0).toLocaleString()) + '</span>' +
            '<span>' + Utils.formatTime(ds.createdAt) + '</span>' +
          '</div>';
      }

      // 点击卡片选中（loading 状态也可选中但不可操作）
      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('ds-delete')) return;
        document.querySelectorAll('.ds-card').forEach(function(c) { c.classList.remove('active'); });
        card.classList.add('active');
        if (window.AppState) window.AppState.activeDSId = ds.id;
      });

      // 删除按钮（仅非 loading 状态有）
      var delBtn = card.querySelector('.ds-delete');
      if (delBtn) {
        delBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          Dialog.confirm(I18n.t('确定删除数据源 "{0}" 吗？', ds.reportName + ' - ' + ds.filterSummary)).then(function(ok) {
            if (!ok) return;
            DataSourceStore.remove(ds.id);
            if (window.AppState && window.AppState.activeDSId === ds.id) {
              window.AppState.activeDSId = null;
            }
            renderDataSourceList();
            Utils.showToast(I18n.t('数据源已删除'));
          });
        });
      }

      dsList.appendChild(card);
    });

    // 默认选中第一个
    if (window.AppState && !window.AppState.activeDSId && sources.length > 0) {
      window.AppState.activeDSId = sources[0].id;
      var firstCard = dsList.querySelector('.ds-card');
      if (firstCard) firstCard.classList.add('active');
    }
  }

  /**
   * 绑定清空按钮事件（在 DOM ready 后调用）
   */
  function init() {
    var btnClearAll = document.getElementById('btnClearAllDS');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', function() {
        if (DataSourceStore.getAll().length === 0) return;
        Dialog.confirm(I18n.t('确定清空全部数据源吗？此操作不可恢复。'), { danger: true }).then(function(ok) {
          if (!ok) return;
          DataSourceStore.clearAll();
          if (window.AppState) window.AppState.activeDSId = null;
          renderDataSourceList();
          Utils.showToast(I18n.t('已清空全部数据源'));
        });
      });
    }
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    buildFilterSummary: buildFilterSummary,
    renderDataSourceList: renderDataSourceList,
    init: init
  };

})();
