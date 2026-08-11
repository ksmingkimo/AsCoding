/**
 * reports.js — 报表查询引擎
 * 负责：报表配置、SEARCH_INFO 构造、API 调用、动态表格渲染、分页
 * 依赖：Api 模块 (js/api.js)、Auth 模块 (js/auth.js)
 *
 * 6 个报表的差异通过 ReportConfig 集中管理，调用方只需传入 reportKey + 筛选值
 */

var ReportEngine = (function() {
  'use strict';

  /* ================================================================
     CONFIG — 每个报表的元数据（对照 API 文档逐字段验证）
     ================================================================ */

  var REPORT_CONFIG = {
    invpo: {
      name: '采购报表',
      endpoint: 'invpo',
      pgm: 'REP_POLIST',
      dateField: 'OS_DD',
      deptField: 'PO_DEP',
      fixCondition: { REPORT_DD_FIELD: 'OS_DD' },
      displayFields: [
        'CUS_NO','CUS_NAME','OS_DD','OS_NO','PRD_NO','PRD_NAME',
        'WH_NAME','UNIT','QTY','UP','DIS_CNT','AMT_DIS_CNT',
        'AMTN','AMTN_NET','TAX','AMTN_WITHTAX','EST_DD',
        'QTY_PRE','QTY_PRE_UNSH','QTY_PS','QTY_PS_UNSH','QTY_UNPS',
        'REM','SAL_NO','SAL_NAME'
      ],
      filters: [
        { index: 4, field: 'CUS_NO',   operator: 'in',    checkUnder: 'T', label: '厂商代号' },
        { index: 5, field: 'PRD_NO',   operator: 'in',    checkUnder: null, label: '货品代号' },
        { index: 6, field: 'PO_DEP',   operator: 'in',    checkUnder: null, label: '采购部门' },
        { index: 7, field: 'WH',       operator: 'in',    checkUnder: 'T', label: '仓库' },
        { index: 8, field: 'CHK_STATUS',operator: 'equal', checkUnder: null, label: '审核状态' }
      ]
    },

    invpc: {
      name: '进货报表',
      endpoint: 'invpc',
      pgm: 'REP_PCLIST',
      dateField: 'PS_DD',
      deptField: 'DEP',
      fixCondition: { SA_BILLS: 'PC;PB;PD', REPORT_DD_FIELD: 'PS_DD', SUB_CUS: '' },
      displayFields: [
        'CUS_NO','CUS_NAME','PS_DD','PS_NO','PRD_NO','PRD_NAME',
        'PRD_MARK','A001','WH_NAME','UNIT','UP','QTY','DIS_CNT',
        'AMT_DIS_CNT','AMTN','AMTN_NET','TAX','REM_T'
      ],
      filters: [
        { index: 4, field: 'CUS_NO',   operator: 'in',    checkUnder: 'T', label: '厂商代号' },
        { index: 5, field: 'PRD_NO',   operator: 'in',    checkUnder: null, label: '货品代号' },
        { index: 6, field: 'DEP',      operator: 'in',    checkUnder: 'T', label: '部门' },
        { index: 7, field: 'WH',       operator: 'in',    checkUnder: 'T', label: '仓库' },
        { index: 8, field: 'CHK_STATUS',operator: 'equal', checkUnder: null, label: '审核状态' }
      ]
    },

    invSO: {
      name: '受订报表',
      endpoint: 'invso',
      pgm: 'REP_SOLIST',
      dateField: 'OS_DD',
      deptField: 'DEP',
      fixCondition: { REPORT_DD_FIELD: 'OS_DD', SUB_CUS: '' },
      displayFields: [
        'CUS_NO','CUS_NAME','OS_DD','OS_NO','PRD_NO','PRD_NAME',
        'PRD_MARK','A001','WH_NAME','UNIT','UP','QTY','DIS_CNT',
        'AMT_DIS_CNT','AMTN','AMTN_NET','TAX','AMTN_WITHTAX',
        'QTY_PS','QTY_PS_UNSH','QTY_JH','QTY_UNPS','QTY_PRE',
        'QTY_PRE_UNSH','QTY_RK','QTY_RK_UNSH','EST_DD','REM_B'
      ],
      filters: [
        { index: 4, field: 'CUS_NO',   operator: 'in',    checkUnder: 'T', label: '客户代号' },
        { index: 5, field: 'PRD_NO',   operator: 'in',    checkUnder: null, label: '货品代号' },
        { index: 6, field: 'DEP',      operator: 'in',    checkUnder: 'T', label: '部门' },
        { index: 7, field: 'WH',       operator: 'in',    checkUnder: 'T', label: '仓库' },
        { index: 8, field: 'CHK_STATUS',operator: 'equal', checkUnder: null, label: '审核状态' }
      ]
    },

    invSa: {
      name: '销货报表',
      endpoint: 'invSa',
      pgm: 'REP_SALIST',
      dateField: 'PS_DD',
      deptField: 'DEP',
      fixCondition: {
        SA_BILLS: 'SA;SB;SD',
        REPORT_DD_FIELD: 'PS_DD',
        SEND_GROUP_FIELD: '',
        SUB_CUS: ''
      },
      displayFields: [
        'CUS_NO','CUS_NAME','PS_DD','PS_NO','PRD_NO','PRD_NAME',
        'A001','PRD_MARK','WH_NAME','UNIT','UP','QTY','DIS_CNT',
        'AMT_DIS_CNT','AMTN','AMTN_NET','TAX','AMTN_WITHTAX',
        'REM_T','SAL_NO'
      ],
      filters: [
        { index: 4, field: 'CUS_NO',   operator: 'in',    checkUnder: 'T', label: '客户代号' },
        { index: 5, field: 'PRD_NO',   operator: 'in',    checkUnder: null, label: '货品代号' },
        { index: 6, field: 'DEP',      operator: 'in',    checkUnder: 'T', label: '部门' },
        { index: 7, field: 'WH',       operator: 'in',    checkUnder: 'T', label: '仓库' },
        { index: 8, field: 'CHK_STATUS',operator: 'equal', checkUnder: null, label: '审核状态' }
      ]
    },

    monAA: {
      name: '收款明细表',
      endpoint: 'monAA',
      pgm: 'REP_RTLIST',
      dateField: 'RP_DD',
      deptField: 'DEP',
      fixCondition: {
        LINE: '',
        REPORT_DD_FIELD: 'RP_DD',
        SHOW_LSIT: '1',
        INCLUDESON: 'F',
        SHOW_LSIT_TF_MON3: '1',
        SHOW_LSIT_TF_MON4: '1'
      },
      displayFields: [
        'CUS_NO','CUS_NAME','RP_DD','RP_NO','YW_TYPE','KB',
        'AMTN_BC','AMTN_BB','AMTN_CHK','AMTN_OTHER','AMTN_IRP',
        'AMTN_ARP','AMTN_ZRP','AMTN','REM'
      ],
      // 收款报表的 SEARCH_INFO 只有 9 个元素 [0]~[8]，没有 CHK_STATUS 在 [8]
      // [5]=DEP, [6]=YW_TYPE, [7]=KB, [8]=orderBy
      filters: [
        { index: 4, field: 'CUS_NO',  operator: 'in',    checkUnder: 'T', label: '客户代号' },
        { index: 5, field: 'DEP',     operator: 'in',    checkUnder: 'T', label: '部门' },
        { index: 6, field: 'YW_TYPE', operator: 'in',    checkUnder: null,label: '业务类型' },
        { index: 7, field: 'KB',      operator: 'in',    checkUnder: null,label: '收款方式' }
      ]
    },

    monBA: {
      name: '付款明细表',
      endpoint: 'monBA',
      pgm: 'REP_PTLIST',
      dateField: 'RP_DD',
      deptField: 'DEP',
      fixCondition: {
        LINE: '',
        SHOW_LSIT: '1',
        INCLUDESON: 'F',
        SHOW_LSIT_TF_MON3: '1',
        SHOW_LSIT_TF_MON4: '1',
        REPORT_DD_FIELD: 'RP_DD'
      },
      displayFields: [
        'CUS_NO','CUS_NAME','RP_DD','RP_NO','YW_TYPE','KB',
        'AMTN_BC','AMTN_BB','AMTN_CHK','AMTN_OTHER','AMTN_IRP',
        'AMTN_ARP','AMTN_ZRP','AMTN','REM'
      ],
      filters: [
        { index: 4, field: 'CUS_NO',  operator: 'in',    checkUnder: 'T', label: '客户代号' },
        { index: 5, field: 'DEP',     operator: 'in',    checkUnder: 'T', label: '部门' },
        { index: 6, field: 'YW_TYPE', operator: 'in',    checkUnder: null,label: '业务类型' },
        { index: 7, field: 'KB',      operator: 'in',    checkUnder: null,label: '付款方式' }
      ]
    }
  };

  /* ================================================================
     Column metadata — human-readable labels for common fields
     ================================================================ */

  var COLUMN_LABELS = {
    'CUS_NO':       '客户/厂商代号',
    'CUS_NAME':     '客户/厂商名称',
    'OS_DD':        '单据日期',
    'OS_NO':        '单据号',
    'PS_DD':        '单据日期',
    'PS_NO':        '单据号',
    'RP_DD':        '单据日期',
    'RP_NO':        '单据号',
    'PRD_NO':       '货品代号',
    'PRD_NAME':     '货品名称',
    'PRD_MARK':     '货品标记',
    'A001':         '自定义字段',
    'WH_NAME':      '仓库名称',
    'UNIT':         '单位',
    'UP':           '单价',
    'QTY':          '数量',
    'DIS_CNT':      '折扣率',
    'AMT_DIS_CNT':  '折扣金额',
    'AMTN':         '含税金额',
    'AMTN_NET':     '不含税金额',
    'TAX':          '税额',
    'AMTN_WITHTAX': '价税合计',
    'AMTN_BC':      '收款金额',
    'AMTN_BB':      '拨入金额',
    'AMTN_CHK':     '票据金额',
    'AMTN_OTHER':   '其他金额',
    'AMTN_IRP':     '转入收入',
    'AMTN_ARP':     '转入应收',
    'AMTN_ZRP':     '转入应付',
    'QTY_PS':       '已交数量',
    'QTY_PS_UNSH':  '未出库已交',
    'QTY_JH':       '交货数量',
    'QTY_UNPS':     '未交数量',
    'QTY_PRE':      '预交数量',
    'QTY_PRE_UNSH': '未出库预交',
    'QTY_RK':       '入库数量',
    'QTY_RK_UNSH':  '未出库入库',
    'EST_DD':       '预计交货日',
    'REM_B':        '备注B',
    'REM':          '备注',
    'REM_T':        '备注',
    'SAL_NO':       '销售员代号',
    'SAL_NAME':     '销售员名称',
    'YW_TYPE':      '业务类型',
    'KB':           '收/付款方式',
    'CHK_STATUS':   '审核状态'
  };

  // Decimal-type fields (right-aligned, numeric formatting)
  var DECIMAL_FIELDS = [
    'UP','QTY','DIS_CNT','AMT_DIS_CNT','AMTN','AMTN_NET','TAX','AMTN_WITHTAX',
    'AMTN_BC','AMTN_BB','AMTN_CHK','AMTN_OTHER','AMTN_IRP','AMTN_ARP','AMTN_ZRP',
    'QTY_PS','QTY_PS_UNSH','QTY_JH','QTY_UNPS','QTY_PRE','QTY_PRE_UNSH',
    'QTY_RK','QTY_RK_UNSH','AMT','AMT_NET','AMT_TAX','AMT_WITHTAX',
    'CSTN_SAL','QTY_SL','EXC_RTO','TAX_RTO','QTY1','QTY_PO','QTY_PO_UNSH',
    'QTY_JD','RATE_JH','QTY_DELAY','AMTN_NET_ZDZK','TAX_ZDZK','AMT_ZDZK',
    'RATE_PC_UNPS','RATE_PC_OVER','RATE_RK','RATE_CST_PO','QTY_YS','QTY_YS_UNSH',
    'UP_TYDJ','AMTN_TYDJ','UP_EXPECT','SUP_REP_QTY1','SUP_REP_QTY2','SUP_REP_QTY3',
    'PAK_EXC','PAK_NW','PAK_GW','PAK_MEAST','UP_QTY1','QTY1_SPLIT','QTY2_SPLIT','QTY3_SPLIT'
  ];

  // Currency fields (prefix with ¥)
  var CURRENCY_FIELDS = [
    'UP','AMT_DIS_CNT','AMTN','AMTN_NET','TAX','AMTN_WITHTAX',
    'AMTN_BC','AMTN_BB','AMTN_CHK','AMTN_OTHER','AMTN_IRP','AMTN_ARP','AMTN_ZRP',
    'AMT','AMT_NET','AMT_TAX','AMT_WITHTAX','AMT_DIS_CNT','CSTN_SAL',
    'AMTN_NET_ZDZK','TAX_ZDZK','AMT_ZDZK','AMTN_TYDJ','UP_TYDJ','UP_EXPECT'
  ];

  /* ================================================================
     Current state
     ================================================================ */

  var _currentReportKey = 'invSO';
  var _currentPage = 1;
  var _currentPageSize = 20;
  var _currentData = [];            // full fetched data
  var _currentColumnInfo = [];      // from API COLUMN_INFO.REPORT__TAB
  var _currentFilters = {};
  var _isLoading = false;

  /* ================================================================
     PUBLIC API
     ================================================================ */

  /**
   * Get config for a report key
   */
  function getConfig(reportKey) {
    return REPORT_CONFIG[reportKey] || null;
  }

  /**
   * Get all report keys
   */
  function getReportKeys() {
    return Object.keys(REPORT_CONFIG);
  }

  /**
   * Get human-readable column label
   */
  function getColumnLabel(fieldName) {
    return COLUMN_LABELS[fieldName] || fieldName;
  }

  /**
   * Check if field is a decimal/numeric type
   */
  function isDecimalField(fieldName) {
    return DECIMAL_FIELDS.indexOf(fieldName) >= 0;
  }

  /**
   * Check if field should be formatted as currency
   */
  function isCurrencyField(fieldName) {
    return CURRENCY_FIELDS.indexOf(fieldName) >= 0;
  }

  /**
   * Format a cell value for display
   * @param {*} value Raw value from API
   * @param {string} fieldName
   * @returns {string} Formatted display string
   */
  function formatCellValue(value, fieldName) {
    if (value === null || value === undefined) return '';

    // Date fields
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return value.substring(0, 10);
    }

    // Decimal/Number fields — format with locale
    if (typeof value === 'number' && isDecimalField(fieldName)) {
      if (isCurrencyField(fieldName)) {
        return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
    }

    // Boolean CHK_STATUS
    if (fieldName === 'CHK_STATUS') {
      return value === 'Y' ? '已审核' : (value === 'N' ? '未审核' : String(value));
    }

    return String(value);
  }

  /**
   * Get CSS class for a table cell
   */
  function getCellClass(fieldName) {
    if (isCurrencyField(fieldName)) return 'currency';
    if (isDecimalField(fieldName)) return 'num';
    if (fieldName === 'CHK_STATUS') return 'status-cell';
    return '';
  }

  /**
   * Get badge HTML for CHK_STATUS
   */
  function getStatusBadge(value) {
    if (value === 'Y') return '<span class="badge badge-success">已审核</span>';
    if (value === 'N') return '<span class="badge badge-warning">未审核</span>';
    return '';
  }

  /**
   * Build the SEARCH_INFO array for a given report + filters
   * @param {string} reportKey
   * @param {object} filters { dateFrom, dateTo, cust, prd, dep, wh, status, ywType, kb }
   * @param {number} page 1-indexed
   * @param {number} pageSize
   * @returns {object} { PGM, SEARCH_INFO, DISPLAY_FIELDS }
   */
  function buildRequest(reportKey, filters, page, pageSize) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) { throw new Error('Unknown report: ' + reportKey); }

    filters = filters || {};
    page = page || 1;
    pageSize = pageSize || 20;

    // Pagination offsets (0-based, inclusive end)
    var offsetStart = (page - 1) * pageSize;
    var offsetEnd = offsetStart + pageSize - 1;

    // SEARCH_INFO [0] — pagination
    var searchInfo = [
      { offset: [offsetStart, offsetEnd], temp: true }
    ];

    // SEARCH_INFO [1] — display fields config
    searchInfo.push({
      showLadder: 'F',
      displayFields: cfg.displayFields.slice(),
      sumFields: []
    });

    // SEARCH_INFO [2] — fixCondition
    searchInfo.push({ fixCondition: cfg.fixCondition });

    // SEARCH_INFO [3] — date range
    var dateFrom = filters.dateFrom || '';
    var dateTo = filters.dateTo || '';
    searchInfo.push({
      field: cfg.dateField,
      operator: 'range',
      fieldType: 'date',
      need: true,
      fieldDisabled: true,
      value: [dateFrom || null, dateTo || null]
    });

    // SEARCH_INFO [4]~[8] — dynamic filters from config
    cfg.filters.forEach(function(f) {
      var filterObj = {
        field: f.field,
        operator: f.operator,
        fieldDisabled: false
      };
      if (f.checkUnder) { filterObj.checkUnder = f.checkUnder; }

      // Map filter values
      var val = '';
      if (f.field === 'CUS_NO')       { val = filters.cust  || ''; }
      else if (f.field === 'PRD_NO')  { val = filters.prd   || ''; }
      else if (f.field === 'DEP' || f.field === 'PO_DEP') { val = filters.dep || ''; }
      else if (f.field === 'WH')      { val = filters.wh    || ''; }
      else if (f.field === 'CHK_STATUS') { val = filters.status || ''; }
      else if (f.field === 'YW_TYPE') { val = filters.ywType || ''; }
      else if (f.field === 'KB')      { val = filters.kb     || ''; }

      filterObj.value = val;
      searchInfo.push(filterObj);
    });

    // Last element — orderBy
    var orderBy = {};
    orderBy[cfg.dateField] = 'asc';
    searchInfo.push({ orderBy: orderBy });

    return {
      PGM: cfg.pgm,
      SEARCH_INFO: searchInfo,
      DISPLAY_FIELDS: cfg.displayFields.join(',')
    };
  }

  /**
   * Query a report via API
   * @param {string} reportKey
   * @param {object} filters
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<{data: Array, columnInfo: Array, totalEstimate: number}>}
   */
  function query(reportKey, filters, page, pageSize) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) { return Promise.reject(new Error('Unknown report: ' + reportKey)); }

    var request = buildRequest(reportKey, filters, page, pageSize);

    return Api.getReport(cfg.endpoint, request).then(function(response) {
      if (response.code !== 0) {
        throw new Error(response.message || '查询失败 (code: ' + response.code + ')');
      }

      var data = (response.data && response.data.REPORT__TAB) ? response.data.REPORT__TAB : [];
      var columnInfo = (response.data && response.data.COLUMN_INFO && response.data.COLUMN_INFO.REPORT__TAB)
        ? response.data.COLUMN_INFO.REPORT__TAB : [];

      return {
        data: data,
        columnInfo: columnInfo,
        // API doesn't return total count; we estimate if we got a full page
        totalEstimate: data.length >= pageSize ? (page * pageSize + 1) : ((page - 1) * pageSize + data.length)
      };
    });
  }

  /**
   * Extract the visible/display columns from COLUMN_INFO + displayFields order
   * Uses displayFields order from config to determine column order
   */
  function getVisibleColumns(reportKey) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) return [];

    return cfg.displayFields.map(function(field) {
      return {
        field: field,
        label: getColumnLabel(field),
        isDecimal: isDecimalField(field),
        isCurrency: isCurrencyField(field)
      };
    });
  }

  /**
   * Render the data table with dynamic columns
   * @param {HTMLElement} tbody — the <tbody> to render into
   * @param {Array} data — REPORT__TAB rows
   * @param {string} reportKey
   * @param {object} options { hideTable, hideEmpty, showTable }
   */
  function renderTableBody(tbody, data, reportKey) {
    var columns = getVisibleColumns(reportKey);
    if (!columns.length) { return; }

    tbody.innerHTML = data.map(function(row) {
      return '<tr>' + columns.map(function(col) {
        var raw = row[col.field];
        var display = formatCellValue(raw, col.field);
        var cssClass = getCellClass(col.field);

        if (col.field === 'CHK_STATUS') {
          return '<td class="' + cssClass + '">' + getStatusBadge(raw) + '</td>';
        }

        return '<td class="' + cssClass + '">' + escapeHtml(display) + '</td>';
      }).join('') + '</tr>';
    }).join('');
  }

  /**
   * Render the table header with dynamic columns
   * @param {HTMLElement} theadRow — the <tr> inside <thead>
   * @param {string} reportKey
   */
  function renderTableHead(theadRow, reportKey) {
    var columns = getVisibleColumns(reportKey);
    theadRow.innerHTML = columns.map(function(col) {
      return '<th class="' + (col.isDecimal ? 'num' : '') + '">' + escapeHtml(col.label) + '</th>';
    }).join('');
  }

  /**
   * Read filter values from the current filter panel DOM
   */
  function readFilters() {
    return {
      dateFrom: (document.getElementById('filterDateFrom') || {}).value || '',
      dateTo:   (document.getElementById('filterDateTo') || {}).value || '',
      cust:     (document.getElementById('filterCust') || {}).value || '',
      prd:      (document.getElementById('filterPrd') || {}).value || '',
      dep:      (document.getElementById('filterDep') || {}).value || '',
      wh:       (document.getElementById('filterWh') || {}).value || '',
      status:   (document.getElementById('filterStatus') || {}).value || '',
      ywType:   (document.getElementById('filterYwType') || {}).value || '',
      kb:       (document.getElementById('filterKb') || {}).value || ''
    };
  }

  /**
   * Update the filter panel visibility based on report type
   * 进销存报表 (invpo/invpc/invSO/invSa): CUS_NO, PRD_NO, DEP, WH, CHK_STATUS
   * 收付款报表 (monAA/monBA): CUS_NO, DEP, YW_TYPE, KB
   */
  function updateFilterPanel(reportKey) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) return;

    // Find filter groups
    var groups = {
      prd:    document.querySelector('.filter-group-prd'),
      wh:     document.querySelector('.filter-group-wh'),
      status: document.querySelector('.filter-group-status'),
      ywType: document.querySelector('.filter-group-ywtype'),
      kb:     document.querySelector('.filter-group-kb')
    };

    var isPayment = (reportKey === 'monAA' || reportKey === 'monBA');

    // Toggle visibility
    if (groups.prd)    groups.prd.style.display    = isPayment ? 'none' : '';
    if (groups.wh)     groups.wh.style.display     = isPayment ? 'none' : '';
    if (groups.status) groups.status.style.display = isPayment ? 'none' : '';
    if (groups.ywType) groups.ywType.style.display = isPayment ? '' : 'none';
    if (groups.kb)     groups.kb.style.display     = isPayment ? '' : 'none';

    // Update label for CUS_NO (客户 vs 厂商)
    var custLabel = document.querySelector('label[for="filterCust"]');
    if (custLabel) {
      var isPurchase = (reportKey === 'invpo' || reportKey === 'invpc');
      custLabel.textContent = isPurchase ? '厂商代号' : '客户代号';
    }
  }

  /* ================================================================
     Helper
     ================================================================ */

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ================================================================
     EXPORT
     ================================================================ */

  return {
    REPORT_CONFIG: REPORT_CONFIG,
    getConfig:        getConfig,
    getReportKeys:    getReportKeys,
    getColumnLabel:   getColumnLabel,
    isDecimalField:   isDecimalField,
    isCurrencyField:  isCurrencyField,
    formatCellValue:  formatCellValue,
    getCellClass:     getCellClass,
    buildRequest:     buildRequest,
    query:            query,
    getVisibleColumns:   getVisibleColumns,
    renderTableBody:     renderTableBody,
    renderTableHead:     renderTableHead,
    readFilters:         readFilters,
    updateFilterPanel:   updateFilterPanel,

    // State accessors
    get currentReportKey()  { return _currentReportKey; },
    set currentReportKey(v) { _currentReportKey = v; },
    get currentPage()       { return _currentPage; },
    set currentPage(v)      { _currentPage = v; },
    get currentPageSize()   { return _currentPageSize; },
    set currentPageSize(v)  { _currentPageSize = v; },
    get currentData()       { return _currentData; },
    set currentData(v)      { _currentData = v; },
    get isLoading()         { return _isLoading; },
    set isLoading(v)        { _isLoading = v; }
  };

})();
