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
    },

    // ─── 生产制造报表 (v2 API) ──────────────────────────────────────

    mrpPK: {
      name: '工单完成情况表',
      endpoint: 'mrppk',
      apiPath: 'mrppk/getReport',
      pgm: 'MRPPK',
      dateField: 'MO_DD',
      deptField: 'DEP',
      filterLayout: 'mrpPK',
      fixCondition: { REPORT_DD_FIELD: 'MO_DD' },
      orderBy: { MO_DD: 'asc', MO_NO: 'asc', ZC_ITM: 'asc' },
      displayFields: [
        'MO_NO','MO_DD','MRP_NO','MRP_NAME','SPC','UNIT','ZC_ITM',
        'TZ_NO','ZC_NO','ZC_NAME','DEP_NAME','CUS_NAME_TW','QTY_MO',
        'QTY_PRC','QTY_FIN','QTY_LOST','QTY_MV','QTY_WWG','STA_DD',
        'OPN_DD','REM'
      ],
      filters: [
        { index: 4, field: 'MO_NO',  operator: 'in', checkUnder: null, label: '生产子工单', filterId: 'filterDocNo' },
        { index: 5, field: 'MRP_NO', operator: 'in', checkUnder: null, label: '生产成品',   filterId: 'filterMrpNo' },
        { index: 6, field: 'DEP',    operator: 'in', checkUnder: 'T',  label: '部门/产线',  filterId: 'filterDep' }
      ]
    },

    mrpPS: {
      name: '完工入库报表',
      endpoint: 'mrpafc',
      apiPath: 'mrpafc/getReport',
      pgm: 'MRPPS',
      dateField: 'MM_DD',
      deptField: 'DEP',
      filterLayout: 'mrpPS',
      fixCondition: {
        REPORT_DD_FIELD: 'MM_DD',
        COMBOFCP: '1',
        WL_CHK: 'F',
        COMBODATE: '1'
      },
      displayFields: [
        'MM_NO','MM_DD','MRP_NO','MRP_NAME','MRP_SPC','PRD_MARK',
        'A001','ID_NO','QTY','UNIT','USED_TIME','QTY_MO','QTY_MO_FIN',
        'QTY_LOST','CST_MAKE','CST_PRD','CST_MAN','CST_OUT','CST',
        'CST_ALL','REM_B'
      ],
      filters: [
        { index: 4, field: 'MM_NO',      operator: 'in',    checkUnder: null, label: '入库单号', filterId: 'filterDocNo',  extra: { fieldType: 'bilNo' } },
        { index: 5, field: 'MRP_NO',     operator: 'in',    checkUnder: null, label: '成品代号', filterId: 'filterMrpNo' },
        { index: 6, field: 'DEP',        operator: 'in',    checkUnder: 'T',  label: '部门',     filterId: 'filterDep' },
        { index: 7, field: 'WH',         operator: 'in',    checkUnder: 'T',  label: '仓库',     filterId: 'filterWh' },
        { index: 8, field: 'CHK_STATUS', operator: 'equal', checkUnder: null, label: '审核状态', filterId: 'filterStatus' }
      ]
    },

    mrppu: {
      name: '产品成本分析表',
      endpoint: 'mrppu',
      apiPath: 'mrppu/getList',
      apiMethod: 'getList',
      pgm: 'MRPPU',
      dateField: 'DATE_CST',
      deptField: 'DEP',
      filterLayout: 'mrppu',
      hasDisplayFields: false,
      responseDataKey: 'TRANS',
      otherInfo: { DEP_GROUP: '00000000', INCLUDESON: 'F' },
      fixCondition: { CHK_ALL: 'F' },
      displayFields: [
        'BIL_DD','BIL_NO','ITM','PRD_NO','PRD_NAME','A001','BAT_NO',
        'WH','UNIT_NAME','QTY','QTY1','CST','CST_OUT','CST_ALL',
        'SO_NO','JH_NO','MO_NO','TW_NO','TZ_NO','DATE_CST','CST_MAN1','CST_MAK1'
      ],
      filters: [
        { index: 6, field: 'DEP',    operator: 'in', checkUnder: 'T',  label: '部门',       filterId: 'filterDep' },
        { index: 7, field: 'PRD_NO', operator: 'in', checkUnder: null, label: '生产货品',   filterId: 'filterPrd' }
      ],
      searchInfoExtra: [
        { field: 'DEP_GROUP', operator: 'contain', fieldDisabled: true, value: '' },
        { field: 'BIL_ID',    operator: 'in',      fieldType: 'select', fieldDisabled: true, value: '' },
        { field: 'DATE_CST',  operator: 'equal',   fieldType: 'date',   fieldDisabled: true, value: '' },
        { field: 'CLOSE_ID',  operator: 'equal',   fieldType: 'string', fieldDisabled: true, value: '' }
      ]
    },

    // ─── 人力资源报表 (v2 API) ──────────────────────────────────────

    wagCG3: {
      name: '员工年度薪资清册',
      endpoint: 'rptwagcg3',
      apiPath: 'rptwagcg3/getReport',
      pgm: 'REP_WAGCG3',
      dateField: 'YEARS',
      deptField: null,
      filterLayout: 'wagCG3',
      showLadder: 'T',
      dateFilter: { operator: 'equal', singleValue: true, fieldDisabled: true, operatorDisabled: true, value: '2025' },
      fixCondition: {
        SZ_NO_TYPE: '2',
        SZ_NO: 'AMTN_ADD;AMTN_SUB;AMTN_TAX;AMTN_NET',
        CHK_TYPE: 'T',
        LOCK_TYPE: '',
        OTR_NO_TYPE: '1',
        OTR_NO: '',
        REPORT_DD_FIELD: 'YEARS'
      },
      displayFields: [
        'YG_NO','NAME','DEP_NAME','SZ_NAME_1',
        'AMTN_1','AMTN_2','AMTN_3','AMTN_4','AMTN_5','AMTN_6',
        'AMTN_7','AMTN_8','AMTN_9','AMTN_10','AMTN_11','AMTN_12',
        'AMTN_TOTAL'
      ],
      filters: [
        { index: 4, field: 'YG_NO',        operator: 'equal', checkUnder: null, label: '员工代号', filterId: 'filterYgNo', defaultValue: '' },
        { index: 5, field: 'OUT_DAY_TYPE',  operator: 'equal', checkUnder: null, label: '在职状态', filterId: 'filterOutDayType', defaultValue: '1' }
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
    'CHK_STATUS':   '审核状态',
    // 工单完成情况表 (mrpPK)
    'MO_NO':        '工单号',
    'MO_DD':        '工单日期',
    'MRP_NO':       'MRP单号',
    'MRP_NAME':     'MRP名称',
    'SPC':          '规格',
    'ZC_ITM':       '制程项次',
    'TZ_NO':        '图号',
    'ZC_NO':        '制程代号',
    'ZC_NAME':      '制程名称',
    'DEP_NAME':     '部门名称',
    'CUS_NAME_TW':  '客户名称',
    'QTY_MO':       '工单数量',
    'QTY_PRC':      '加工数量',
    'QTY_FIN':      '完成数量',
    'QTY_LOST':     '损耗数量',
    'QTY_MV':       '移转数量',
    'QTY_WWG':      '委外加工量',
    'STA_DD':       '开工日期',
    'OPN_DD':       '结案日期',
    // 完工入库报表 (mrpPS)
    'MM_NO':        '入库单号',
    'MM_DD':        '入库日期',
    'MRP_SPC':      'MRP规格',
    'ID_NO':        '识别号',
    'USED_TIME':    '耗用工时',
    'QTY_MO_FIN':   '工单完成数',
    'CST_MAKE':     '制造费用',
    'CST_PRD':      '生产成本',
    'CST_MAN':      '管理费用',
    'CST_OUT':      '外包费用',
    'CST':          '单位成本',
    'CST_ALL':      '总成本',
    // 产品成本分析表 (mrppu)
    'BIL_DD':       '单据日期',
    'BIL_NO':       '单据号',
    'BAT_NO':       '批号',
    'UNIT_NAME':    '单位',
    'SO_NO':        '受订单号',
    'JH_NO':        '交货单号',
    'TW_NO':        '托工单号',
    'DATE_CST':     '成本年月',
    'CST_MAN1':     '人工成本',
    'CST_MAK1':     '制造费用',
    // 员工年度薪资清册 (wagCG3)
    'YG_NO':        '员工代号',
    'NAME':         '姓名',
    'SZ_NAME_1':    '薪资项目',
    'AMTN_1':       '一月金额',
    'AMTN_2':       '二月金额',
    'AMTN_3':       '三月金额',
    'AMTN_4':       '四月金额',
    'AMTN_5':       '五月金额',
    'AMTN_6':       '六月金额',
    'AMTN_7':       '七月金额',
    'AMTN_8':       '八月金额',
    'AMTN_9':       '九月金额',
    'AMTN_10':      '十月金额',
    'AMTN_11':      '十一月金额',
    'AMTN_12':      '十二月金额',
    'AMTN_TOTAL':   '年度合计'
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
    'PAK_EXC','PAK_NW','PAK_GW','PAK_MEAST','UP_QTY1','QTY1_SPLIT','QTY2_SPLIT','QTY3_SPLIT',
    // 生产制造报表
    'QTY_MO','QTY_PRC','QTY_FIN','QTY_LOST','QTY_MV','QTY_WWG',
    'USED_TIME','QTY_MO_FIN',
    'CST_MAKE','CST_PRD','CST_MAN','CST_OUT','CST','CST_ALL',
    // 产品成本分析
    'CST_MAN1','CST_MAK1',
    // 薪资报表 (AMTN_1 ~ AMTN_12, AMTN_TOTAL)
    'AMTN_1','AMTN_2','AMTN_3','AMTN_4','AMTN_5','AMTN_6',
    'AMTN_7','AMTN_8','AMTN_9','AMTN_10','AMTN_11','AMTN_12','AMTN_TOTAL'
  ];

  // Currency fields (prefix with ¥)
  var CURRENCY_FIELDS = [
    'UP','AMT_DIS_CNT','AMTN','AMTN_NET','TAX','AMTN_WITHTAX',
    'AMTN_BC','AMTN_BB','AMTN_CHK','AMTN_OTHER','AMTN_IRP','AMTN_ARP','AMTN_ZRP',
    'AMT','AMT_NET','AMT_TAX','AMT_WITHTAX','AMT_DIS_CNT','CSTN_SAL',
    'AMTN_NET_ZDZK','TAX_ZDZK','AMT_ZDZK','AMTN_TYDJ','UP_TYDJ','UP_EXPECT',
    'CST_MAKE','CST_PRD','CST_MAN','CST_OUT','CST','CST_ALL'
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
   * @param {object} filters { dateFrom, dateTo, cust, prd, dep, wh, status, ywType, kb, mono, mrpno, mmno, ygno, outDayType }
   * @param {number} page 1-indexed
   * @param {number} pageSize
   * @returns {object} { PGM, SEARCH_INFO, DISPLAY_FIELDS } (mrppu also has OTHERINFO, PAGE_INFO; no DISPLAY_FIELDS)
   */
  function buildRequest(reportKey, filters, page, pageSize) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) { throw new Error('Unknown report: ' + reportKey); }

    filters = filters || {};
    page = page || 1;
    pageSize = pageSize || 20;

    // ── MRPPU special case: completely different body structure ──
    if (cfg.apiMethod === 'getList') {
      return buildRequestMrppu(cfg, filters);
    }

    // ── Standard getReport-style reports (v1 + v2) ──
    var offsetStart = (page - 1) * pageSize;
    var offsetEnd = offsetStart + pageSize;

    // SEARCH_INFO [0] — pagination
    var searchInfo = [
      { offset: [offsetStart, offsetEnd], temp: true }
    ];

    // SEARCH_INFO [1] — display fields config (use configurable showLadder)
    var showLadder = cfg.showLadder || 'F';
    searchInfo.push({
      showLadder: showLadder,
      displayFields: cfg.displayFields.slice(),
      sumFields: cfg.sumFields || []
    });

    // SEARCH_INFO [2] — fixCondition
    searchInfo.push({ fixCondition: cfg.fixCondition });

    // SEARCH_INFO [3] — date filter (configurable via cfg.dateFilter for non-standard types)
    if (cfg.dateField) {
      var dFilter = cfg.dateFilter || {};
      var dateElem = {
        field: cfg.dateField,
        operator: dFilter.operator || 'range',
        fieldType: dFilter.fieldType || 'date',
        need: dFilter.need !== false,
        fieldDisabled: dFilter.fieldDisabled === true
      };
      if (dFilter.operatorDisabled) { dateElem.operatorDisabled = true; }
      // Resolve value: use dateFilter.value if set, otherwise read from filters
      if (dFilter.value !== undefined) {
        dateElem.value = dFilter.value;
      } else if (dFilter.singleValue) {
        dateElem.value = (filters.dateFrom || filters[cfg.dateField] || '');
      } else {
        var dateFrom = filters.dateFrom || '';
        var dateTo = filters.dateTo || '';
        dateElem.value = [dateFrom || null, dateTo || null];
      }
      searchInfo.push(dateElem);
    }

    // SEARCH_INFO [4]~[N] — dynamic filters from config
    cfg.filters.forEach(function(f) {
      var filterObj = {
        field: f.field,
        operator: f.operator,
        fieldDisabled: false
      };
      if (f.checkUnder) { filterObj.checkUnder = f.checkUnder; }
      if (f.fieldType)  { filterObj.fieldType = f.fieldType; }
      if (f.operatorDisabled) { filterObj.operatorDisabled = true; }
      // Extra properties (e.g. fieldType: 'bilNo' for MM_NO)
      if (f.extra) {
        Object.keys(f.extra).forEach(function(k) { filterObj[k] = f.extra[k]; });
      }

      // Resolve value via filterId mapping
      var val = resolveFilterValue(f, filters);
      filterObj.value = val;
      searchInfo.push(filterObj);
    });

    // Last element — orderBy (configurable)
    var orderBy = cfg.orderBy || {};
    if (Object.keys(orderBy).length === 0 && cfg.dateField) {
      orderBy[cfg.dateField] = 'asc';
    }
    searchInfo.push({ orderBy: orderBy });

    var body = {
      PGM: cfg.pgm,
      SEARCH_INFO: searchInfo,
      DISPLAY_FIELDS: cfg.displayFields.join(',')
    };

    return body;
  }

  /**
   * Resolve a filter's value from the filters object
   * Uses filterId mapping if present, falls back to field name
   */
  function resolveFilterValue(f, filters) {
    // Map by filterId first, then by field name
    var filterId = f.filterId;
    var val = '';
    if (filterId && filters[filterId] !== undefined) {
      val = filters[filterId];
    }
    if (!val) {
      // Fallback: map by field name (for legacy v1 reports)
      var fieldToKey = {
        'CUS_NO': 'cust', 'PRD_NO': 'prd', 'PO_DEP': 'dep', 'DEP': 'dep',
        'WH': 'wh', 'CHK_STATUS': 'status', 'YW_TYPE': 'ywType', 'KB': 'kb',
        'MO_NO': 'filterDocNo', 'MRP_NO': 'filterMrpNo', 'MM_NO': 'filterDocNo',
        'YG_NO': 'filterYgNo', 'OUT_DAY_TYPE': 'filterOutDayType'
      };
      var key = fieldToKey[f.field];
      if (key && filters[key] !== undefined) {
        val = filters[key];
      }
    }
    // Use defaultValue only as fallback when value is truly empty
    if (!val && f.defaultValue !== undefined && f.defaultValue !== null) {
      return f.defaultValue;
    }
    return val || '';
  }

  /**
   * Build request body for the MRPPU report (getList endpoint, different structure)
   */
  function buildRequestMrppu(cfg, filters) {
    filters = filters || {};

    var searchInfo = [];

    // [0] — showBody + displayFields config (NO offset/temp)
    searchInfo.push({
      showBody: 'T',
      showLadder: 'F',
      displayFields: cfg.displayFields.slice()
    });

    // [1] — fixCondition (only CHK_ALL)
    searchInfo.push({ fixCondition: cfg.fixCondition });

    // [2]~[5] — fixed disabled filters (from searchInfoExtra)
    if (cfg.searchInfoExtra) {
      cfg.searchInfoExtra.forEach(function(extra) {
        var elem = {};
        Object.keys(extra).forEach(function(k) { elem[k] = extra[k]; });
        // Resolve DATE_CST value from filters
        if (extra.field === 'DATE_CST') {
          elem.value = filters.dateCst || extra.value || '';
        }
        searchInfo.push(elem);
      });
    }

    // [6]~[7] — user-editable filters
    cfg.filters.forEach(function(f) {
      var filterObj = {
        field: f.field,
        operator: f.operator,
        fieldType: f.fieldType || 'string',
        fieldDisabled: f.fieldDisabled !== false
      };
      if (f.checkUnder) { filterObj.checkUnder = f.checkUnder; }
      filterObj.value = resolveFilterValue(f, filters);
      searchInfo.push(filterObj);
    });

    // NO orderBy for mrppu

    return {
      PGM: cfg.pgm,
      OTHERINFO: cfg.otherInfo,
      SEARCH_INFO: searchInfo,
      PAGE_INFO: { PAGE_SIZE: -1, CURRENT_PAGE: 1 }
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

    // Choose API method: apiPath (v2 non-standard) > endpoint (v1 standard)
    var promise;
    if (cfg.apiPath) {
      promise = Api.post(cfg.apiPath, request);
    } else {
      promise = Api.getReport(cfg.endpoint, request);
    }

    return promise.then(function(response) {
      if (response.code !== 0) {
        throw new Error(response.message || '查询失败 (code: ' + response.code + ')');
      }

      var data, columnInfo;

      // MRPPU uses TRANS instead of REPORT__TAB, and flat COLUMN_INFO
      var dataKey = cfg.responseDataKey || 'REPORT__TAB';
      data = (response.data && response.data[dataKey]) ? response.data[dataKey] : [];

      if (cfg.apiMethod === 'getList') {
        // MRPPU: flat COLUMN_INFO array
        columnInfo = (response.data && response.data.COLUMN_INFO) ? response.data.COLUMN_INFO : [];
      } else {
        // Standard: nested COLUMN_INFO.REPORT__TAB
        columnInfo = (response.data && response.data.COLUMN_INFO && response.data.COLUMN_INFO.REPORT__TAB)
          ? response.data.COLUMN_INFO.REPORT__TAB : [];
      }

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
    function _val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
    return {
      dateFrom:  _val('filterDateFrom'),
      dateTo:    _val('filterDateTo'),
      cust:      _val('filterCust'),
      prd:       _val('filterPrd'),
      dep:       _val('filterDep'),
      wh:        _val('filterWh'),
      status:    _val('filterStatus'),
      ywType:    _val('filterYwType'),
      kb:        _val('filterKb'),
      // v2 新增筛选器
      filterDocNo:     _val('filterDocNo'),
      filterMrpNo:     _val('filterMrpNo'),
      filterYgNo:      _val('filterYgNo'),
      filterOutDayType:_val('filterOutDayType'),
      dateCst:         _val('filterDateCst')
    };
  }

  /**
   * Update the filter panel visibility based on report type
   * Uses cfg.filterLayout to determine which filter groups to show/hide
   */
  function updateFilterPanel(reportKey) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) return;

    var layout = cfg.filterLayout;
    // Fallback to heuristic for backward compatibility
    if (!layout) {
      layout = (reportKey === 'monAA' || reportKey === 'monBA') ? 'payment' : 'inv';
    }

    // All filter groups by CSS class
    var allGroups = {
      cust:    document.querySelector('.filter-group-cust'),
      prd:     document.querySelector('.filter-group-prd'),
      wh:      document.querySelector('.filter-group-wh'),
      status:  document.querySelector('.filter-group-status'),
      ywType:  document.querySelector('.filter-group-ywtype'),
      kb:      document.querySelector('.filter-group-kb'),
      docNo:   document.querySelector('.filter-group-docno'),
      mrpNo:   document.querySelector('.filter-group-mrpno'),
      ygNo:    document.querySelector('.filter-group-ygno'),
      outDay:  document.querySelector('.filter-group-outdaytype'),
      dateCst: document.querySelector('.filter-group-datecst'),
      dateRange: document.querySelector('.filter-date-group')
    };

    // Hide all optional groups first
    Object.keys(allGroups).forEach(function(k) {
      if (allGroups[k]) allGroups[k].style.display = 'none';
    });

    // Layout → visible groups
    var layoutMap = {
      'inv':     ['cust','prd','wh','status','dateRange'],
      'payment': ['cust','ywType','kb','dateRange'],
      'mrpPK':   ['docNo','mrpNo','dateRange'],
      'mrpPS':   ['docNo','mrpNo','wh','status','dateRange'],
      'mrppu':   ['prd','dateCst'],
      'wagCG3':  ['ygNo','outDay']
    };

    var visible = layoutMap[layout] || [];
    visible.forEach(function(key) {
      if (allGroups[key]) allGroups[key].style.display = '';
    });
    // DEP is always visible (present in all layouts)
    // Date range: shown for inv/payment/mrpPK/mrpPS, hidden for mrppu/wagCG3

    // Update label for filterCust
    var custLabel = document.querySelector('label[for="filterCust"]');
    if (custLabel) {
      var isPurchase = (reportKey === 'invpo' || reportKey === 'invpc');
      custLabel.textContent = isPurchase ? '厂商代号' : '客户代号';
    }

    // Update label for filterDocNo based on active report
    var docNoLabel = document.querySelector('label[for="filterDocNo"]');
    if (docNoLabel) {
      if (reportKey === 'mrpPK') { docNoLabel.textContent = '生产子工单'; }
      else if (reportKey === 'mrpPS') { docNoLabel.textContent = '入库单号'; }
      else { docNoLabel.textContent = '单号'; }
    }

    // Update label for filterPrd based on active report
    var prdLabel = document.querySelector('label[for="filterPrd"]');
    if (prdLabel) {
      if (reportKey === 'mrppu') { prdLabel.textContent = '生产货品'; }
      else if (reportKey === 'mrpPK' || reportKey === 'mrpPS') { prdLabel.textContent = '成品代号'; }
      else { prdLabel.textContent = '货品代号'; }
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
