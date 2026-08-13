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
      group: '进销存报表',
      icon: '📋',
      pinyin: 'cgbb',
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
      group: '进销存报表',
      icon: '📦',
      pinyin: 'jhbb',
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
      group: '进销存报表',
      icon: '📝',
      pinyin: 'sdbb',
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
      group: '进销存报表',
      icon: '💵',
      pinyin: 'xhbb',
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
      group: '财务管理',
      icon: '💰',
      pinyin: 'skmxb',
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
      group: '财务管理',
      icon: '💳',
      pinyin: 'fkmxb',
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
      group: '生产制造',
      icon: '🏭',
      pinyin: 'gdwcqkb',
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
      group: '生产制造',
      icon: '📥',
      pinyin: 'wgrkbb',
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
      group: '生产制造',
      icon: '📈',
      pinyin: 'cpcbfxb',
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
      group: '人力资源',
      icon: '👤',
      pinyin: 'ygndxzqc',
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
    },

    // ─── 财务管理报表 (v3 API) ──────────────────────────────────────

    accabgt: {
      name: '科目预算报表',
      group: '财务管理',
      icon: '📒',
      pinyin: 'kmysbb',
      apiPath: 'ACCABGT/GetReport',
      pgm: 'REP_ACCABGTLIST',
      dateField: 'YEARS',
      filterLayout: 'accabgt',
      dateFilter: { operator: 'equal', singleValue: true },
      fixCondition: { REPORT_DD_FIELD: 'YEARS' },
      displayFields: ['BOOK_NO','BOOK_NO_NAME','YEARS','ACC_NO','ACC_NO_NAME','FZHS_TITLE','AMTN_TOTAL','AMTN_ACTUL','AMTN1','AMTN_1','AMTN2','AMTN_2','AMTN3','AMTN_3','AMTN4','AMTN_4','AMTN5','AMTN_5','AMTN6','AMTN_6','AMTN7','AMTN_7','AMTN8','AMTN_8','AMTN9','AMTN_9','AMTN10','AMTN_10','AMTN11','AMTN_11','AMTN12','AMTN_12'],
      filters: [
        { index: 4, field: 'BOOK_NO', operator: 'equal', label: '帐册代号', filterId: 'filterMrpNo' },
        { index: 5, field: 'ACC_NO',  operator: 'equal', checkUnder: 'T', label: '科目代号', filterId: 'filterPrd' }
      ]
    },

    rptsarp: {
      name: '信用额度查询表',
      group: '财务管理',
      icon: '🛡️',
      pinyin: 'xyedcxb',
      apiPath: 'Rptsarplist/GetReport',
      pgm: 'RPTSARPLIST',
      dateField: null,
      hasPagination: false,
      filterLayout: 'rptsarp',
      fixCondition: { CHK_TYPE: '0', REPORT_DD_FIELD: '' },
      displayFields: ['CUS_NAME','IDX_NAME','CAS_NAME','BIL_TYPE_NAME','AMTN_CRD','AMTN_CRDED','AMTN_CHK','AMTN_SO','AMTN_IRP','AMTN_TRP','AMTN_BALANCE'],
      filters: [
        { index: 2, field: 'CUS_NO', operator: 'in', checkUnder: 'T', label: '客户代号', filterId: 'filterCust' }
      ]
    },

    monbx: {
      name: '报销报表',
      group: '财务管理',
      icon: '🧾',
      pinyin: 'bxbb',
      apiPath: 'monbx/getReport',
      pgm: 'REP_BXLIST',
      dateField: 'BX_DD',
      filterLayout: 'financeBase',
      dateFilter: { operator: 'last_year', fieldDisabled: true },
      fixCondition: { SHOW_LSIT: '1', REPORT_DD_FIELD: 'BX_DD' },
      displayFields: ['USR_NO','USRBX_NAME','BX_DD','BX_NO','PAY_ID','FEE_ID','FEE_NAME','AMTN','AMTN_CHK','AMTN_CJK','AMTN_SH','AMTN_UNSH','SAL_NO','SAL_NAME','INV_NO','REM_B','REM_A'],
      filters: [
        { index: 4, field: 'USR_NO', operator: 'in', label: '员工代号', filterId: 'filterCust' },
        { index: 5, field: 'DEP',    operator: 'in', checkUnder: 'T', label: '部门', filterId: 'filterDep' }
      ]
    },

    monjk: {
      name: '员工借款报表',
      group: '财务管理',
      icon: '💸',
      pinyin: 'ygjkbb',
      apiPath: 'monjk/getReport',
      pgm: 'REP_JKLIST',
      dateField: 'JK_DD',
      showBody: 'T',
      filterLayout: 'monjk',
      dateFilter: { operator: 'this_year', fieldDisabled: false },
      fixCondition: { REPORT_DD_FIELD: 'JK_DD' },
      displayFields: ['REPORT_DD','JK_DD','JK_NO','SAL_NO','SAL_NAME','REASON','CUR_ID','CUR_NAME','EXC_RTO','AMT','AMTN','AMT_BACK','AMTN_BACK','FEE_ID','FEE_NAME','CAS_NO','CAS_NAME','TASK_ID','BACC_NO','BACC_NAME','BIL_NO','BB_NO','EST_DD','DEP','DEP_NAME','SAL_NO1','SAL_NAME1','VOH_ID','VOH_NO','CHK_NO','BOX_CHK_NO','CHK_STA_NUM','CHK_END_NUM','CHK_KND','CHK_KND_NAME','END_DD','BIL_TYPE','BIL_TYPE_NAME','SYS_DATE','CLS_DATE','USR_NAME','CHK_MAN','CHK_MAN_NAME','CHK_STATUS','CLS_ID','REM','MODIFY_DD','MODIFY_MAN','MODIFY_MAN_NAME'],
      filters: [
        { index: 4, field: 'JK_NO', operator: 'in', fieldType: 'bilNo', label: '借款单号', filterId: 'filterDocNo' }
      ]
    },

    monCA: {
      name: '应收票据报表',
      group: '财务管理',
      icon: '📄',
      pinyin: 'yspjbb',
      apiPath: 'monCA/getReport',
      pgm: 'REP_CALIST',
      dateField: 'RCV_DD',
      filterLayout: 'monCA',
      dateFilter: { operator: 'last_year', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'RCV_DD', END_DD: '', INT_STS_LST: '0' },
      displayFields: ['CHK_NO','RCV_DD','CHK_KND_NAME','CHK_STS','AMT','AMTN','END_DD','CAH_DD','BACC_NO','BACC_NAME','BACC_ID_CODE','RP_NO','CUS_NO','CUS_NAME','SAL_NO','SAL_NAME','REM'],
      filters: [
        { index: 4, field: 'CHK_NO', operator: 'in', fieldType: 'bilNo', label: '票据号码', filterId: 'filterDocNo' },
        { index: 5, field: 'DEP',    operator: 'in', checkUnder: 'T', label: '部门', filterId: 'filterDep' }
      ]
    },

    monCB: {
      name: '应付票据报表',
      group: '财务管理',
      icon: '📑',
      pinyin: 'yfpjbb',
      apiPath: 'monCB/getReport',
      pgm: 'REP_CBLIST',
      dateField: 'RCV_DD',
      filterLayout: 'monCA',
      dateFilter: { operator: 'last_year', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'RCV_DD', END_DD: '', INT_STS_LST: '0' },
      displayFields: ['CHK_NO','RCV_DD','CHK_KND_NAME','CHK_STS','AMT','AMTN','END_DD','CAH_DD','BACC_NO','BACC_NAME','BACC_ID_CODE','RP_NO','CUS_NO','CUS_NAME','SAL_NO','SAL_NAME','REM'],
      filters: [
        { index: 4, field: 'CHK_NO', operator: 'in', fieldType: 'bilNo', label: '票据号码', filterId: 'filterDocNo' },
        { index: 5, field: 'DEP',    operator: 'in', checkUnder: 'T', label: '部门', filterId: 'filterDep' }
      ]
    },

    // ─── 库存管理报表 (v3 API) ──────────────────────────────────────

    rptinvdo: {
      name: '过期货品预警表',
      group: '库存管理',
      icon: '⚠️',
      pinyin: 'gqhpyjb',
      apiPath: 'rptinvdo/getReport',
      pgm: 'RPT_INVDO',
      dateField: null,
      filterLayout: 'stockDate',
      fixCondition: { ZL_DAYS: 0, WASTERCHANGE: 'F', REPORT_DD_FIELD: '' },
      searchInfoExtra: [
        { field: 'BASE_DD', operator: 'equal', fieldType: 'date', need: true, fieldDisabled: true, operatorDisabled: true, dateOperator: 'today' },
        { field: 'ZL_TYPE', operator: 'equal', need: true, fieldDisabled: true, operatorDisabled: true, value: '1' }
      ],
      displayFields: ['WH','WH_NAME','PRD_NO','PRD_NAME','PRD_MARK','A001','BAT_NO','LST_SFD','UNIT_NAME','QTY','UP_AVG_CST','CST_AMT'],
      filters: [
        { index: 5, field: 'PRD_NO',   operator: 'in', label: '货品代号', filterId: 'filterPrd' },
        { index: 6, field: 'WH',       operator: 'in', checkUnder: 'T', label: '仓库', filterId: 'filterWh' },
        { index: 7, field: 'BAT_NO',   operator: 'in', label: '批号', filterId: 'filterBatNo' },
        { index: 8, field: 'PRD_MARK', operator: 'in', label: '货品特征', filterId: 'filterPrdMark' }
      ]
    },

    rptinvdl: {
      name: '安全存量预警表',
      group: '库存管理',
      icon: '🔒',
      pinyin: 'aqclyjb',
      apiPath: 'rptinvdl/getReport',
      pgm: 'RPT_INVDL',
      dateField: null,
      filterLayout: 'stockNodate',
      fixCondition: { SEL_KYKC: '', INVALID: 'F', LISTQTYIS0: '1', ISLC: 'F', SUMBOX: '1', CHK_NOUSE: 'F', REPORT_DD_FIELD: '' },
      displayFields: ['WH_NAME','PRD_NAME','PRD_MARK','A001','BAT_NO','UNIT','QTY','QTY_MIN','QTY_CHK','QTY_OUT','QTY_NOW','QTY_END'],
      filters: [
        { index: 3, field: 'WH',       operator: 'in', checkUnder: 'T', label: '仓库', filterId: 'filterWh' },
        { index: 4, field: 'PRD_NO',   operator: 'in', label: '货品代号', filterId: 'filterPrd' },
        { index: 5, field: 'PRD_MARK', operator: 'in', label: '货品特征', filterId: 'filterPrdMark' },
        { index: 6, field: 'BAT_NO',   operator: 'in', label: '批号', filterId: 'filterBatNo' }
      ]
    },

    rptinvswa: {
      name: '负库存预警表',
      group: '库存管理',
      icon: '📉',
      pinyin: 'fkcyjb',
      apiPath: 'rptinvswa/getReport',
      pgm: 'RPT_INVSWA',
      dateField: null,
      filterLayout: 'stockNodate',
      fixCondition: { SEL_KYKC: '1;2', INVALID: 'F', LISTQTYIS0: '1', ISLC: 'F', SUMBOX: '1', CHK_NOUSE: 'F', REPORT_DD_FIELD: '' },
      displayFields: ['WH','WH_NAME','PRD_NO','PRD_NAME','PRD_MARK','A001','BAT_NO','LST_SFD','UNIT','QTY','QTY_END','QTY_MIN','QTY_MAX'],
      filters: [
        { index: 3, field: 'WH',       operator: 'in', checkUnder: 'T', label: '仓库', filterId: 'filterWh' },
        { index: 4, field: 'PRD_NO',   operator: 'in', label: '货品代号', filterId: 'filterPrd' },
        { index: 5, field: 'PRD_MARK', operator: 'in', label: '货品特征', filterId: 'filterPrdMark' },
        { index: 6, field: 'BAT_NO',   operator: 'in', label: '批号', filterId: 'filterBatNo' }
      ]
    },

    invic: {
      name: '库存调拨报表',
      group: '库存管理',
      icon: '🔄',
      pinyin: 'kcdbbb',
      apiPath: 'invic/getReport',
      pgm: 'DRPIC_REP',
      dateField: 'IC_DD',
      filterLayout: 'docDate',
      dateFilter: { operator: 'today', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'IC_DD' },
      displayFields: ['IC_DD','IC_NO','IDX_NAME','PRD_NO','PRD_NAME','SPC','WH1','WH1_NAME','WH2','WH2_NAME','UNIT_NAME','QTY','QTY_ID','QTY_DIV','QTY_CFM','QTY_LOST','REM','M_REM'],
      filters: [
        { index: 4, field: 'IC_NO', operator: 'range', fieldType: 'bilNo', label: '调拨单号', filterId: 'filterDocNo' }
      ]
    },

    invij: {
      name: '库存调整报表',
      group: '库存管理',
      icon: '🔧',
      pinyin: 'kctzbb',
      apiPath: 'invij/getReport',
      pgm: 'REP_IJLIST',
      dateField: 'IJ_DD',
      filterLayout: 'invij',
      dateFilter: { operator: 'range', dateOperator: 'this_month', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'IJ_DD' },
      displayFields: ['IJ_NO','IJ_DD','IDX_NAME','PRD_NO','PRD_NAME','SPC','QTY','CST_UP','CST','DEP','DEP_NAME','WH','WH_NAME','REM','SALM_NAME'],
      filters: [
        { index: 4, field: 'IJ_NO',  operator: 'range', label: '调整单号', filterId: 'filterDocNo' },
        { index: 5, field: 'PRD_NO', operator: 'range', label: '货品代号', filterId: 'filterPrd' },
        { index: 6, field: 'DEP',    operator: 'range', label: '部门', filterId: 'filterDep' }
      ]
    },

    // ─── 采购与价格报表 (v3 API) ───────────────────────────────────

    scmdrpti: {
      name: '送货单报表',
      group: '采购与价格',
      icon: '🚚',
      pinyin: 'shdbb',
      apiPath: 'scmdrpti/getReport',
      pgm: 'REPTILIST',
      dateField: 'TI_DD',
      showBody: 'T',
      filterLayout: 'docDate',
      dateFilter: { operator: 'this_year', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'TI_DD' },
      displayFields: ['REPORT_DD','TI_DD','TI_NO','CUS_NO','CUS_SNM','CUS_NAME','OS_ID','OS_NO','BAT_NO','BAT_NAME','BIL_ID','BIL_NO','CHK_STATUS','CHK_MAN','CHK_MAN_NAME','CANCEL_ID','FREE_ID','CLS_DATE','REM_H','MODIFY_DD','MODIFY_MAN','MODIFY_MAN_NAME','CLOSE_ID','SL_NO','CUS_OS_NO','ITM','PRD_NO','PRD_NAME','BAT_NO_B','BAT_NAME_B','WH','WH_NAME','UNIT_NAME','QTY','QTY1','QTY_RTN','QTY_RTN_UNSH','QTY_UNPS','QTY_PS','QTY_PS_UNSH','QTY_RCK','QTY_RCK_UNSH','QTY_CUS','CHKTY_ID','B_DD','E_DD','NAME_ENG','REM','CUS_OS_NO_B','SAL_NO','SAL_NAME','PRD_MARK','A001','SPC','DEP','DEP_NAME','BIL_TYPE','BIL_TYPE_NAME','ID_NO','VALID_DD','CNT_NEED','CNT_FLAG','CAS_NO','CAS_NAME'],
      filters: [
        { index: 4, field: 'TI_NO', operator: 'contain', fieldType: 'bilNo', operatorDisabled: true, label: '送货单号', filterId: 'filterDocNo' }
      ]
    },

    invpopc: {
      name: '采购交货状况表',
      group: '采购与价格',
      icon: '📊',
      pinyin: 'cgjhzkb',
      apiPath: 'InvPoPcStatus/GetReport',
      pgm: 'INVPOPCSTATUS',
      dateField: 'OS_DD',
      showBody: 'T',
      filterLayout: 'docDate',
      dateFilter: { operator: 'last_week', fieldDisabled: true },
      fixCondition: { SH_TYPE: 'T' },
      displayFields: ['REPORT_DD','OS_DD','OS_NO','CUS_NO','CUS_NAME','SNM','CLS_STATUS','PRD_NO','PRD_NAME','NAME_ENG','SPC','IDX1','QTY','QTY1','UNIT','UP','UP_QTY1','BAT_NO','EST_DD','QTY_RK','QTY_PENDING_QC','QTY_NOT_QC','QTY_QC_OK','QTY_QC_FAILING','QTY_QC_BACK','QTY_IN','QTY_QC_NOT_IN','QTY_BACK','QTY_LATER','QTY_AHEAD','QTY_PRE','QTY_NOT_COME','SUP_PRD_NO','MRP_NOS','MRP_NAME','MRP_SPC','MARK_NAME','QT_NO','REM','CUS_OS_NO'],
      filters: [
        { index: 4, field: 'OS_NO', operator: 'in', fieldType: 'bilNo', label: '采购单号', filterId: 'filterDocNo' }
      ]
    },

    invtwpc: {
      name: '委外交货状况表',
      group: '采购与价格',
      icon: '🏗️',
      pinyin: 'wjjhzkb',
      apiPath: 'InvTwPcStatus/GetReport',
      pgm: 'INVTWPCSTATUS',
      dateField: 'TW_DD',
      showBody: 'T',
      filterLayout: 'docDate',
      dateFilter: { operator: 'range', dateOperator: 'this_month', fieldDisabled: true },
      fixCondition: { SH_TYPE: 'T' },
      displayFields: ['REPORT_DD','TW_DD','TW_NO','CUS_NO','CUS_NAME','SNM','PRD_NO','PRD_NAME','NAME_ENG','SPC','QTY','QTY1','UP','UP_QTY1','UNIT','EST_DD','QTY_RK','QTY_DY','QTY_MJ','QTY_CHK','QTY_LOST','QTY_PRE','QTY_RTN','QTY_WJK','QTY_TC','QTY_CJ','QTY_ZJ','QTY_WD','QTY_ML','MARK_NAME','MO_NO','SO_NO','CUS_OS_NO','REM','CUS_NAME','STA_DD','WT_NO','CLS_STATUS'],
      filters: [
        { index: 4, field: 'TW_NO', operator: 'in', fieldType: 'bilNo', label: '托工单号', filterId: 'filterDocNo' }
      ]
    },

    invhp: {
      name: '采购政策价格表',
      group: '采购与价格',
      icon: '🏷️',
      pinyin: 'cgzcjgb',
      apiPath: 'invhp/GetReport',
      pgm: 'REP_HPLIST',
      dateField: 'SYS_DATE',
      hideDateUI: true,
      filterLayout: 'priceChk',
      dateFilter: { operator: 'range', dateOperator: 'this_month', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'SYS_DATE' },
      displayFields: ['CUR_NAME','PRD_NO','PRD_NAME','SPC','UNIT','QTY','UP','S_DD','E_DD','PRD_NO_DZ','PRD_NAME_DZ','QTY_DZ','UNIT_DZ','HJ_DD','HJ_NO','REM'],
      filters: [
        { index: 4, field: 'HJ_NO',      operator: 'in',    fieldType: 'bilNo', fieldDisabled: true, label: '询价单号', filterId: 'filterDocNo' },
        { index: 5, field: 'IS_PUB',     operator: 'equal', label: '公开状态', filterId: 'filterYwType' },
        { index: 6, field: 'PRD_NO',     operator: 'in',    label: '货品代号', filterId: 'filterPrd' },
        { index: 7, field: 'CHK_STATUS', operator: 'equal', label: '审核状态', filterId: 'filterStatus' }
      ]
    },

    invhs: {
      name: '售价政策价格表',
      group: '采购与价格',
      icon: '💲',
      pinyin: 'sjzcjgb',
      apiPath: 'invhs/GetReport',
      pgm: 'REP_HSLIST',
      dateField: 'SYS_DATE',
      hideDateUI: true,
      filterLayout: 'priceCust',
      dateFilter: { operator: 'today', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'SYS_DATE' },
      displayFields: ['CUS_NO','CUS_NAME','CUR_NAME','PRD_NO','PRD_NAME','SPC','UNIT','QTY','UP','S_DD','E_DD','PRD_NO_DZ','PRD_NAME_DZ','UNIT_DZ','QTY_DZ','HJ_DD','HJ_NO','REM'],
      filters: [
        { index: 4, field: 'HJ_NO',      operator: 'in',    fieldType: 'bilNo', fieldDisabled: true, label: '询价单号', filterId: 'filterDocNo' },
        { index: 5, field: 'IS_PUB',     operator: 'equal', label: '公开状态', filterId: 'filterYwType' },
        { index: 6, field: 'CUS_NO',     operator: 'in',    checkUnder: 'T', label: '客户代号', filterId: 'filterCust' },
        { index: 7, field: 'PRD_NO',     operator: 'in',    label: '货品代号', filterId: 'filterPrd' },
        { index: 8, field: 'CHK_STATUS', operator: 'equal', label: '审核状态', filterId: 'filterStatus' }
      ]
    },

    // ─── 生产制造报表 (v3 API) ──────────────────────────────────────

    mrpag: {
      name: '领退补料报表',
      group: '生产制造',
      icon: '📤',
      pinyin: 'ltblbb',
      apiPath: 'mrpag/getReport',
      pgm: 'REP_MLLIST',
      dateField: 'ML_DD',
      filterLayout: 'mrpag',
      dateFilter: { operator: 'last_year', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'ML_DD' },
      displayFields: ['CUS_NO','CUS_NAME','ML_DD','ML_NO','PRD_NO','PRD_NAME','BAT_NO','QTY','UNIT','CST','CST_STD','WH_NAME','CHUW_NAME','TZ_NO','MO_NO','QL_NO','REM'],
      filters: [
        { index: 4, field: 'CUS_NO',     operator: 'in',    checkUnder: 'T', label: '厂商代号', filterId: 'filterCust' },
        { index: 5, field: 'DEP',        operator: 'in',    checkUnder: 'T', label: '部门', filterId: 'filterDep' },
        { index: 6, field: 'CHK_STATUS', operator: 'equal', label: '审核状态', filterId: 'filterStatus' }
      ]
    },

    mrpcf: {
      name: '单位成本分析表',
      group: '生产制造',
      icon: '🧮',
      pinyin: 'dwcbfxb',
      apiPath: 'mrpcf/getReport',
      pgm: 'MRPCF',
      dateField: 'BIL_DD',
      filterLayout: 'price',
      dateFilter: { operator: 'this_year', fieldDisabled: true },
      fixCondition: { REPORT_DD_FIELD: 'BIL_DD', COMBOFCP: '1', COMBOUNIT: '1', CHKPRDT_CST: 'F', WASTERCHANGE: '', COMBODATE: '1' },
      displayFields: ['BIL_NO','PRD_NO','PRD_NAME','SPC','UNIT_NAME','QTY','CST_PRD1','CST_PRD1_RT','CST_MAN','CST_MAN_RT','CST_MAKE','CST_MK_RT','CST_OUT','CST_OUT_RT','CST_PRD2','CST_PRD2_RT','CST','UP'],
      filters: [
        { index: 4, field: 'PRD_NO', operator: 'in', label: '货品代号', filterId: 'filterPrd' }
      ]
    },

    // ─── 人力资源报表 (v3 API) ──────────────────────────────────────

    rptwagyg0: {
      name: '人事资料分析表',
      group: '人力资源',
      icon: '📋',
      pinyin: 'rszlfxb',
      apiPath: 'rptwagyg/getReport',
      pgm: 'REP_WAGYG0',
      dateField: null,
      showBody: 'T',
      filterLayout: 'hrNoDate',
      fixCondition: { CALC_IN_DAY: '1', CALC_RESET_DD: '1' },
      displayFields: ['YG_NO','NAME','DEP','DEP_NAME','DEP_ORG','DEP_ORG_NAME','YG_NO_UP','YG_NO_UP_NAME','LV_NO','LV_NO_NAME','IN_DAY','TEST_OK_DAY','HT_NO','CONTRACT_DD','OUT_DAY','CZ_ID','RESET_DD','RESET_REASON','YG_TEST_T','OUT_DAY_TYPE','YG_NZ','ID_USR','ID_USR_NAME','ENG_NAME','SEX_ID','BTH_DAY','MARRY_ID','OTH_COUNTRY','BTH_PLS','ID_NO','SFZ_BDD','SFZ_EDD','STUDY_LEVEL','GRAD_SCH','STYDY_PR','POS_NAME','CG_NO','CG_NO_NAME','WORK_KIND','YGXZ','CNT_TEL1','CNT_TEL2','EMAIL','BANK1_NO','BANK1_NO_NAME','BACC1_NO','ADR2','ADR1','LANG_LEVEL1','LANG_LEVEL2','LANG_LEVEL3','LANG_LEVEL4','CELL_NO','REL_NAME','TEL','ADR','TEL_WORK','CONTACT_MAN1','CELL_NO1','REL_NAME1','TEL1','ADR3','TEL_WORK1','IS_CUST','LOGON','USR','USR_NAME','SYS_DATE','MODIFY_MAN','MODIFY_MAN_NAME','MODIFY_DD','PRT_USR','PRT_USR_NAME','PRT_DATE','CHK_STATUS','YG_INT'],
      filters: [
        { index: 3, field: 'YG_NO', operator: 'in', label: '员工代号', filterId: 'filterYgNo' },
        { index: 4, field: 'DEP',   operator: 'in', checkUnder: 'T', label: '部门', filterId: 'filterDep' }
      ]
    },

    rptwagyg: {
      name: '员工明细表',
      group: '人力资源',
      icon: '👥',
      pinyin: 'ygmxb',
      apiPath: 'rptwagyg/getReport',
      pgm: 'REP_WAGYG',
      dateField: 'SYS_DATE',
      hideDateUI: true,
      filterLayout: 'hrDate',
      dateFilter: { operator: 'today', fieldDisabled: true },
      fixCondition: { CALC_IN_DAY: '1', CALC_RESET_DD: '1', REPORT_DD_FIELD: 'SYS_DATE' },
      displayFields: ['YG_NO','NAME','YG_NO_UP_NAME','DEP_NAME','IN_DAY','HT_NO','CONTRACT_DD','YG_TEST_T','OUT_DAY_TYPE','YG_NZ','SEX_ID','BTH_DAY','BTH_PLS','STYDY_PR','POS_NAME','CG_NO_NAME','WORK_KIND','YGXZ'],
      filters: [
        { index: 3, field: 'YG_NO',        operator: 'in',    label: '员工代号', filterId: 'filterYgNo' },
        { index: 4, field: 'DEP',           operator: 'in',    checkUnder: 'T', label: '部门', filterId: 'filterDep' },
        { index: 5, field: 'OUT_DAY_TYPE',  operator: 'equal', label: '在职状态', filterId: 'filterOutDayType' },
        { index: 6, field: 'CHK_STATUS',    operator: 'equal', label: '审核状态', filterId: 'filterStatus' }
      ]
    },

    // ─── 固定资产报表 (v3 API) ──────────────────────────────────────

    fixaa: {
      name: '财产目录',
      group: '固定资产',
      icon: '🏢',
      pinyin: 'ccml',
      apiPath: 'fixaa/getReport',
      pgm: 'FIXCE',
      dateField: 'GR_DD',
      filterLayout: 'fixAsset',
      dateFilter: { operator: 'range', dateOperator: 'range', fieldDisabled: true },
      fixCondition: { GR_TYPE: '1', BD_TYPE: '1', BJT_TYPE: '1', ZJ_TYPE: '2', BQZJ_TYPE: '2', BQZJFS_TYPE: '1', INCLUDE_SUB: 'F', B_DD: '', E_DD: '', FX_NO: '', FX_NO_B: '', FX_NO_E: '', END_DD: '', B_DD_ZJ: null, E_DD_ZJ: '', REPORT_DD_FIELD: 'GR_DD' },
      searchInfoExtra: [
        { field: 'END_DD', operator: 'equal', fieldType: 'date', need: true, fieldDisabled: true, operatorDisabled: true, value: '' },
        { field: 'ZJ_DD', operator: 'range', fieldType: 'date', need: true, fieldDisabled: true, operatorDisabled: true, dateOperator: 'this_month', value: [null, ''] }
      ],
      displayFields: ['FX_NO','FX_NAME','FX_SPC','QTY','UNIT','STS_ID','FX_KND_NAME','USE_DEP_NAME','GR_DD','AMTN','AMTN_JZ','AMTN_SHARE','AMTN_NET','AMTN_REST','SHARE_MTH','USE_YEARS','USE_MONTH','ZJ_MONTH','WZJ_MONTH','AMTN_QQ_SHARE','AMTN_BQ_SHARE','AMTN_BQLJ_SHARE','AMTN_NET_BQ','REM','ACC_NO_FX_NAME','ACC_NO_FY_NAME','ACC_NO_SHARE_NAME','ACC_NO_CAS_NAME','ACC_NO_JZ_NAME','ACC_NO_QL_NAME'],
      filters: [
        { index: 5, field: 'FX_NO',  operator: 'in', label: '资产代号', filterId: 'filterDocNo' },
        { index: 6, field: 'STS_ID', operator: 'in', label: '资产状况', filterId: 'filterStatus' },
        { index: 7, field: 'FX_KND', operator: 'in', checkUnder: 'T', label: '资产类别', filterId: 'filterFxKnd' }
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
    'AMTN_TOTAL':   '年度合计',
    // ─── v3 API 列标签 ─────────────────────────────────
    // 科目预算报表
    'BOOK_NO':      '帐册代号',
    'BOOK_NO_NAME': '帐册名称',
    'YEARS':        '年度',
    'ACC_NO':       '科目代号',
    'ACC_NO_NAME':  '科目名称',
    'FZHS_TITLE':   '辅助核算',
    'AMTN_TOTAL':   '总预算金额',
    'AMTN_ACTUL':   '实际金额',
    'AMTN1':'一月预算','AMTN_1':'一月实际',
    'AMTN2':'二月预算','AMTN_2':'二月实际',
    'AMTN3':'三月预算','AMTN_3':'三月实际',
    'AMTN4':'四月预算','AMTN_4':'四月实际',
    'AMTN5':'五月预算','AMTN_5':'五月实际',
    'AMTN6':'六月预算','AMTN_6':'六月实际',
    'AMTN7':'七月预算','AMTN_7':'七月实际',
    'AMTN8':'八月预算','AMTN_8':'八月实际',
    'AMTN9':'九月预算','AMTN_9':'九月实际',
    'AMTN10':'十月预算','AMTN_10':'十月实际',
    'AMTN11':'十一月预算','AMTN_11':'十一月实际',
    'AMTN12':'十二月预算','AMTN_12':'十二月实际',
    // 信用额度查询表
    'IDX_NAME':     '索引名称',
    'CAS_NAME':     '现金名称',
    'BIL_TYPE_NAME':'单据类型',
    'AMTN_CRD':     '信用额度',
    'AMTN_CRDED':   '已用额度',
    'AMTN_CHK':     '支票金额',
    'AMTN_SO':      '受订金额',
    'AMTN_IRP':     '转入应收',
    'AMTN_TRP':     '转入应付',
    'AMTN_BALANCE': '余额',
    // 报销报表
    'USR_NO':       '员工代号',
    'USRBX_NAME':   '员工姓名',
    'BX_DD':        '报销日期',
    'BX_NO':        '报销单号',
    'PAY_ID':       '支付方式',
    'FEE_ID':       '费用代号',
    'FEE_NAME':     '费用名称',
    'AMTN_CHK':     '票据金额',
    'AMTN_CJK':     '冲借款金额',
    'AMTN_SH':      '审核金额',
    'AMTN_UNSH':    '未审金额',
    'INV_NO':       '发票号',
    'REM_B':        '备注B',
    'REM_A':        '备注A',
    // 员工借款
    'AMT':          '金额',
    'AMT_BACK':     '还款金额',
    'AMTN_BACK':    '还款本位币',
    'CUR_ID':       '币别',
    'CUR_NAME':     '币别名称',
    'TASK_ID':      '任务ID',
    'BACC_NO':      '银行账号',
    'BACC_NAME':    '银行名称',
    'BIL_NO':       '单据号',
    'BB_NO':        '编号',
    'EST_DD':       '预计日期',
    'VOH_ID':       '凭证类型',
    'VOH_NO':       '凭证号',
    'BOX_CHK_NO':   '箱号',
    'CHK_STA_NUM':  '起始票号',
    'CHK_END_NUM':  '结束票号',
    'CHK_KND':      '票据种类',
    'CHK_KND_NAME': '票据种类名称',
    'END_DD':       '截止日期',
    'BIL_TYPE':     '单据类型',
    'BIL_TYPE_NAME':'单据类型名称',
    'USR_NAME':     '用户名称',
    'CHK_MAN':      '审核人',
    'CHK_MAN_NAME': '审核人名称',
    'CLS_ID':       '结案标识',
    'MODIFY_DD':    '修改日期',
    'MODIFY_MAN':   '修改人',
    'MODIFY_MAN_NAME':'修改人名称',
    // 应收/应付票据
    'CHK_NO':       '票据号码',
    'RCV_DD':       '收/付票日期',
    'CHK_STS':      '票据状态',
    'CAH_DD':       '兑现日期',
    'BACC_ID_CODE': '银行代码',
    // 库存报表
    'BAT_NO':       '批号',
    'LST_SFD':      '最后异动日',
    'UP_AVG_CST':   '平均成本',
    'CST_AMT':      '成本金额',
    'QTY_MIN':      '最低存量',
    'QTY_CHK':      '盘点数量',
    'QTY_OUT':      '出库数量',
    'QTY_NOW':      '当前库存',
    'QTY_END':      '期末库存',
    'QTY_MAX':      '最高存量',
    // 库存调拨
    'IC_DD':        '调拨日期',
    'IC_NO':        '调拨单号',
    'WH1':          '来源仓库',
    'WH1_NAME':     '来源仓库名称',
    'WH2':          '目标仓库',
    'WH2_NAME':     '目标仓库名称',
    'QTY_ID':       '申请数量',
    'QTY_DIV':      '分配数量',
    'QTY_CFM':      '确认数量',
    'QTY_LOST':     '损耗数量',
    'M_REM':        '备注M',
    // 库存调整
    'IJ_NO':        '调整单号',
    'IJ_DD':        '调整日期',
    'CST_UP':       '成本单价',
    // 送货单
    'TI_DD':        '送货日期',
    'TI_NO':        '送货单号',
    'CUS_SNM':      '客户简称',
    'OS_ID':        '订单标识',
    'BAT_NAME':     '批号名称',
    'BAT_NAME_B':   '批号名称B',
    'BIL_ID':       '单据标识',
    'CANCEL_ID':    '作废标识',
    'FREE_ID':      '免费标识',
    'CLS_DATE':     '结案日期',
    'CLOSE_ID':     '结案标识',
    'SL_NO':        '明细号',
    'CUS_OS_NO':    '客户订单号',
    'ITM':          '项次',
    'BAT_NO_B':     '批号B',
    'QTY_RTN':      '退货数量',
    'QTY_RTN_UNSH': '未出退货',
    'QTY_PS':       '已交数量',
    'QTY_PS_UNSH':  '未出已交',
    'QTY_RCK':      '收货数量',
    'QTY_RCK_UNSH': '未出收货',
    'QTY_CUS':      '客户数量',
    'CHKTY_ID':     '审核类型',
    'B_DD':         '开始日期',
    'E_DD':         '结束日期',
    'NAME_ENG':     '英文名称',
    'CUS_OS_NO_B':  '客户订单号B',
    'ID_NO':        '识别号',
    'VALID_DD':     '有效日期',
    'CNT_NEED':     '联系人需求',
    'CNT_FLAG':     '联系人标识',
    // 采购交货
    'SNM':          '简称',
    'CLS_STATUS':   '结案状态',
    'IDX1':         '索引1',
    'QTY_PENDING_QC':'待质检数量',
    'QTY_NOT_QC':   '未质检数量',
    'QTY_QC_OK':    '质检合格',
    'QTY_QC_FAILING':'质检不合格',
    'QTY_QC_BACK':  '质检退货',
    'QTY_IN':       '入库数量',
    'QTY_QC_NOT_IN':'质检未入库',
    'QTY_BACK':     '退货数量',
    'QTY_LATER':    '延期数量',
    'QTY_AHEAD':    '提前数量',
    'QTY_NOT_COME': '未到数量',
    'SUP_PRD_NO':   '供应商货品',
    'MRP_NOS':      'MRP编号',
    'MRP_SPC':      'MRP规格',
    'MARK_NAME':    '标记名称',
    'QT_NO':        '报价单号',
    // 委外交货
    'TW_DD':        '托工日期',
    'QTY_DY':       '打印数量',
    'QTY_MJ':       '模具数量',
    'QTY_WJK':      '未交库数量',
    'QTY_TC':       '退仓数量',
    'QTY_CJ':       '车间数量',
    'QTY_ZJ':       '质检数量',
    'QTY_WD':       '委外待发',
    'QTY_ML':       '模流数量',
    'STA_DD':       '开工日期',
    'WT_NO':        '委外单号',
    // 采购/售价政策价格
    'S_DD':         '生效日期',
    'PRD_NO_DZ':    '对照货品',
    'PRD_NAME_DZ':  '对照货品名称',
    'QTY_DZ':       '对照数量',
    'UNIT_DZ':      '对照单位',
    'HJ_DD':        '询价日期',
    'HJ_NO':        '询价单号',
    // 领退补料
    'ML_DD':        '领料日期',
    'ML_NO':        '领料单号',
    'CST_STD':      '标准成本',
    'CHUW_NAME':    '储位名称',
    'QL_NO':        '请料单号',
    // 单位成本分析
    'CST_PRD1':     '生产成本1',
    'CST_PRD1_RT':  '生产成本1比率',
    'CST_MAN_RT':   '管理费用比率',
    'CST_MAKE':     '制造费用',
    'CST_MK_RT':    '制造费用比率',
    'CST_OUT_RT':   '外包费用比率',
    'CST_PRD2':     '生产成本2',
    'CST_PRD2_RT':  '生产成本2比率',
    // 人事资料分析表
    'DEP_ORG':      '部门组织',
    'DEP_ORG_NAME': '部门组织名称',
    'YG_NO_UP':     '上级员工',
    'YG_NO_UP_NAME':'上级员工姓名',
    'LV_NO':        '级别代号',
    'LV_NO_NAME':   '级别名称',
    'IN_DAY':       '入职日期',
    'TEST_OK_DAY':  '转正日期',
    'HT_NO':        '合同号',
    'CONTRACT_DD':  '合同日期',
    'OUT_DAY':      '离职日期',
    'CZ_ID':        '操作标识',
    'RESET_DD':     '复职日期',
    'RESET_REASON': '复职原因',
    'YG_TEST_T':    '试用期',
    'OUT_DAY_TYPE': '离职类型',
    'YG_NZ':        '员工年资',
    'ID_USR':       '身份证用户',
    'ID_USR_NAME':  '身份证用户名称',
    'ENG_NAME':     '英文名',
    'SEX_ID':       '性别',
    'BTH_DAY':      '生日',
    'MARRY_ID':     '婚姻状态',
    'OTH_COUNTRY':  '其他国家',
    'BTH_PLS':      '出生地',
    'SFZ_BDD':      '身份证开始日期',
    'SFZ_EDD':      '身份证结束日期',
    'STUDY_LEVEL':  '教育程度',
    'GRAD_SCH':     '毕业学校',
    'STYDY_PR':     '专业',
    'POS_NAME':     '职位名称',
    'CG_NO':        '成本中心代号',
    'CG_NO_NAME':   '成本中心名称',
    'WORK_KIND':    '工种',
    'YGXZ':         '员工性质',
    'CNT_TEL1':     '联系电话1',
    'CNT_TEL2':     '联系电话2',
    'EMAIL':        '电子邮箱',
    'BANK1_NO':     '银行代号',
    'BANK1_NO_NAME':'银行名称',
    'BACC1_NO':     '银行帐号',
    'ADR1':         '地址1',
    'ADR2':         '地址2',
    'LANG_LEVEL1':  '语言水平1',
    'LANG_LEVEL2':  '语言水平2',
    'LANG_LEVEL3':  '语言水平3',
    'LANG_LEVEL4':  '语言水平4',
    'CELL_NO':      '手机号',
    'REL_NAME':     '联系人姓名',
    'TEL':          '电话',
    'ADR':          '地址',
    'TEL_WORK':     '工作电话',
    'CONTACT_MAN1': '紧急联系人1',
    'CELL_NO1':     '手机1',
    'REL_NAME1':    '联系人姓名1',
    'TEL1':         '电话1',
    'ADR3':         '地址3',
    'TEL_WORK1':    '工作电话1',
    'IS_CUST':      '是否客户',
    'LOGON':        '登录标识',
    'USR':          '用户代号',
    'PRT_USR':      '打印用户',
    'PRT_USR_NAME': '打印用户名称',
    'PRT_DATE':     '打印日期',
    'YG_INT':       '员工整数',
    // 财产目录
    'FX_NO':        '资产代号',
    'FX_NAME':      '资产名称',
    'FX_SPC':       '资产规格',
    'STS_ID':       '资产状况',
    'FX_KND_NAME':  '资产类别',
    'USE_DEP_NAME': '使用部门',
    'GR_DD':        '取得日期',
    'AMTN_JZ':      '净值金额',
    'AMTN_SHARE':   '折旧金额',
    'AMTN_NET':     '净额',
    'AMTN_REST':    '剩余金额',
    'SHARE_MTH':    '折旧月份',
    'USE_YEARS':    '使用年限',
    'USE_MONTH':    '使用月数',
    'ZJ_MONTH':     '折旧月数',
    'WZJ_MONTH':    '未折旧月数',
    'AMTN_QQ_SHARE':'期初折旧',
    'AMTN_BQ_SHARE':'本期折旧',
    'AMTN_BQLJ_SHARE':'本期累计折旧',
    'AMTN_NET_BQ':  '本期净额',
    'ACC_NO_FX_NAME':'资产科目',
    'ACC_NO_FY_NAME':'费用科目',
    'ACC_NO_SHARE_NAME':'折旧科目',
    'ACC_NO_CAS_NAME':'现金科目',
    'ACC_NO_JZ_NAME':'净值科目',
    'ACC_NO_QL_NAME':'清理科目'
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
    'AMTN_7','AMTN_8','AMTN_9','AMTN_10','AMTN_11','AMTN_12','AMTN_TOTAL',
    // v3 API 数值字段
    'AMTN_ACTUL','AMTN_CRD','AMTN_CRDED','AMTN_CHK','AMTN_SO','AMTN_IRP','AMTN_TRP','AMTN_BALANCE',
    'AMTN_CJK','AMTN_SH','AMTN_UNSH','AMT_BACK','AMTN_BACK','AMT',
    'QTY_ID','QTY_DIV','QTY_CFM','QTY_LOST','QTY_MIN','QTY_CHK','QTY_OUT','QTY_NOW','QTY_END','QTY_MAX',
    'UP_AVG_CST','CST_AMT','CST_UP','CST_STD','QTY_RTN','QTY_RTN_UNSH','QTY_PS','QTY_PS_UNSH',
    'QTY_RCK','QTY_RCK_UNSH','QTY_CUS','QTY_PENDING_QC','QTY_NOT_QC','QTY_QC_OK','QTY_QC_FAILING',
    'QTY_QC_BACK','QTY_IN','QTY_QC_NOT_IN','QTY_BACK','QTY_LATER','QTY_AHEAD','QTY_NOT_COME',
    'QTY_DY','QTY_MJ','QTY_WJK','QTY_TC','QTY_CJ','QTY_ZJ','QTY_WD','QTY_ML',
    'AMTN_JZ','AMTN_SHARE','AMTN_NET','AMTN_REST','AMTN_QQ_SHARE','AMTN_BQ_SHARE','AMTN_BQLJ_SHARE','AMTN_NET_BQ',
    'CST_PRD1','CST_PRD1_RT','CST_MAN_RT','CST_MK_RT','CST_OUT_RT','CST_PRD2','CST_PRD2_RT',
    'QTY_DZ','QTY_UNPS','QTY_PRE','QTY_PRE_UNSH','QTY_RK','QTY_RK_UNSH','QTY_JH','ITM'
  ];

  // Currency fields (prefix with ¥)
  var CURRENCY_FIELDS = [
    'UP','AMT_DIS_CNT','AMTN','AMTN_NET','TAX','AMTN_WITHTAX',
    'AMTN_BC','AMTN_BB','AMTN_CHK','AMTN_OTHER','AMTN_IRP','AMTN_ARP','AMTN_ZRP',
    'AMT','AMT_NET','AMT_TAX','AMT_WITHTAX','AMT_DIS_CNT','CSTN_SAL',
    'AMTN_NET_ZDZK','TAX_ZDZK','AMT_ZDZK','AMTN_TYDJ','UP_TYDJ','UP_EXPECT',
    'CST_MAKE','CST_PRD','CST_MAN','CST_OUT','CST','CST_ALL',
    // v3 API 金额字段
    'AMTN_CRD','AMTN_CRDED','AMTN_CHK','AMTN_SO','AMTN_IRP','AMTN_TRP','AMTN_BALANCE',
    'AMTN_CJK','AMTN_SH','AMTN_UNSH','AMT_BACK','AMTN_BACK','AMT',
    'AMTN_JZ','AMTN_SHARE','AMTN_NET','AMTN_REST','AMTN_QQ_SHARE','AMTN_BQ_SHARE','AMTN_BQLJ_SHARE','AMTN_NET_BQ',
    'CST_PRD1','CST_PRD2','CST_STD','CST_AMT','UP_AVG_CST','CST_UP'
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
  /**
   * Compute preset date values for date operators
   * Supports: last_year, this_year, today, last_week, this_month, range, equal
   */
  function computeDateValue(operator) {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var today = y + '-' + m + '-' + d;

    switch (operator) {
      case 'last_year':
        return [(y - 1) + '-01-01', (y - 1) + '-12-31'];
      case 'this_year':
        return [y + '-01-01', y + '-12-31'];
      case 'today':
        return today;
      case 'last_week':
        var weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        var wm = String(weekAgo.getMonth() + 1).padStart(2, '0');
        var wd = String(weekAgo.getDate()).padStart(2, '0');
        return [weekAgo.getFullYear() + '-' + wm + '-' + wd, today];
      case 'this_month':
        var firstDay = y + '-' + m + '-01';
        var lastDay = new Date(y, now.getMonth() + 1, 0);
        var lm = String(lastDay.getMonth() + 1).padStart(2, '0');
        var ld = String(lastDay.getDate()).padStart(2, '0');
        return [firstDay, lastDay.getFullYear() + '-' + lm + '-' + ld];
      default:
        return null;
    }
  }

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

    // ── Standard getReport-style reports (v1 + v2 + v3) ──
    var offsetStart = (page - 1) * pageSize;
    var offsetEnd = offsetStart + pageSize;

    var searchInfo = [];

    // SEARCH_INFO [0] — pagination (conditional: some reports have no offset)
    if (cfg.hasPagination !== false) {
      searchInfo.push({ offset: [offsetStart, offsetEnd], temp: true });
    }

    // SEARCH_INFO [1] — display fields config (support showBody)
    var showLadder = cfg.showLadder || 'F';
    var displayCfg = {
      showLadder: showLadder,
      displayFields: cfg.displayFields.slice(),
      sumFields: cfg.sumFields || []
    };
    if (cfg.showBody) { displayCfg.showBody = cfg.showBody; }
    searchInfo.push(displayCfg);

    // SEARCH_INFO [2] — fixCondition
    searchInfo.push({ fixCondition: cfg.fixCondition });

    // SEARCH_INFO [2a] — searchInfoExtra (fixed hidden conditions after fixCondition)
    if (cfg.searchInfoExtra) {
      cfg.searchInfoExtra.forEach(function(extra) {
        var elem = {};
        Object.keys(extra).forEach(function(k) { elem[k] = extra[k]; });
        // Resolve computed date values in searchInfoExtra (e.g., BASE_DD for rptinvdo)
        if (extra.fieldType === 'date' && extra.value === undefined) {
          var compOp = extra.dateOperator || extra.operator || 'today';
          var computed = computeDateValue(compOp);
          if (computed) { elem.value = computed; }
        }
        // Pass through dateOperator if set (e.g., ZJ_DD for fixaa)
        if (extra.dateOperator) { elem.dateOperator = extra.dateOperator; }
        searchInfo.push(elem);
      });
    }

    // SEARCH_INFO [3] — date filter (configurable via cfg.dateFilter for non-standard types)
    if (cfg.dateField) {
      var dFilter = cfg.dateFilter || {};
      // Determine effective operator: dateFilter.operator takes priority over dateOperator
      var dateOperator = dFilter.operator || cfg.dateOperator || 'range';
      var dateElem = {
        field: cfg.dateField,
        operator: dateOperator,
        fieldType: dFilter.fieldType || 'date',
        need: dFilter.need !== false,
        fieldDisabled: dFilter.fieldDisabled === true
      };
      if (dFilter.operatorDisabled) { dateElem.operatorDisabled = true; }
      if (dFilter.dateOperator && dFilter.dateOperator !== dateOperator) { dateElem.dateOperator = dFilter.dateOperator; }

      // Resolve value:
      // 1. If dateFilter has explicit value, use it
      // 2. If operator is a computed preset (last_year, this_year, today, last_week, this_month), compute
      // 3. If singleValue mode, read single date from filters
      // 4. Otherwise, read date range from filters
      if (dFilter.value !== undefined) {
        dateElem.value = dFilter.value;
      } else {
        var computedValue = computeDateValue(dateOperator);
        if (computedValue !== null) {
          dateElem.value = computedValue;
        } else if (dFilter.singleValue) {
          dateElem.value = (filters.dateFrom || filters[cfg.dateField] || '');
        } else {
          var dateFrom = filters.dateFrom || '';
          var dateTo = filters.dateTo || '';
          dateElem.value = [dateFrom || null, dateTo || null];
        }
      }
      searchInfo.push(dateElem);
    }

    // SEARCH_INFO [4]~[N] — dynamic filters from config
    cfg.filters.forEach(function(f) {
      var filterObj = {
        field: f.field,
        operator: f.operator || 'in',
        fieldDisabled: f.fieldDisabled === true
      };
      if (f.checkUnder) { filterObj.checkUnder = f.checkUnder; }
      if (f.fieldType)  { filterObj.fieldType = f.fieldType; }
      if (f.operatorDisabled || f.operatorDisabled === true) { filterObj.operatorDisabled = true; }
      if (f.need !== undefined) { filterObj.need = f.need; }
      // Extra properties (e.g. fieldType: 'bilNo', operator: 'contain')
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
        'YG_NO': 'filterYgNo', 'OUT_DAY_TYPE': 'filterOutDayType',
        // v3 映射
        'BOOK_NO': 'filterMrpNo', 'ACC_NO': 'filterPrd',
        'USR_NO': 'cust', 'JK_NO': 'filterDocNo', 'CHK_NO': 'filterDocNo',
        'BAT_NO': 'filterBatNo', 'PRD_MARK': 'filterPrdMark',
        'TI_NO': 'filterDocNo', 'OS_NO': 'filterDocNo', 'TW_NO': 'filterDocNo',
        'IC_NO': 'filterDocNo', 'IJ_NO': 'filterDocNo',
        'HJ_NO': 'filterDocNo', 'IS_PUB': 'ywType',
        'FX_NO': 'filterDocNo', 'STS_ID': 'status', 'FX_KND': 'filterFxKnd'
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
        fieldDisabled: f.fieldDisabled === true
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
      dateCst:         _val('filterDateCst'),
      // v3 新增筛选器
      filterBatNo:     _val('filterBatNo'),
      filterPrdMark:   _val('filterPrdMark'),
      filterFxKnd:     _val('filterFxKnd')
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
      batNo:   document.querySelector('.filter-group-batno'),
      prdMark: document.querySelector('.filter-group-prdmark'),
      fxKnd:   document.querySelector('.filter-group-fxknd'),
      dateRange: document.querySelector('.filter-date-group')
    };

    // Hide all optional groups first
    Object.keys(allGroups).forEach(function(k) {
      if (allGroups[k]) allGroups[k].style.display = 'none';
    });

    // Layout → visible groups
    var layoutMap = {
      'inv':      ['cust','prd','wh','status','dateRange'],
      'payment':  ['cust','ywType','kb','dateRange'],
      'mrpPK':    ['docNo','mrpNo','dateRange'],
      'mrpPS':    ['docNo','mrpNo','wh','status','dateRange'],
      'mrppu':    ['prd','dateCst'],
      'wagCG3':   ['ygNo','outDay'],
      // v3 新增布局
      'accabgt':  ['prd','mrpNo','dateRange'],
      'rptsarp':  ['cust'],
      'financeBase': ['cust','dep','dateRange'],
      'monjk':    ['docNo','dateRange'],
      'monCA':    ['dep','docNo','dateRange'],
      'mrpag':    ['cust','dep','status','dateRange'],
      'stockDate':   ['prd','wh','batNo','prdMark','dateRange'],
      'stockNodate': ['prd','wh','batNo','prdMark'],
      'price':       ['prd','dateRange'],
      'priceChk':    ['prd','status','ywType','dateRange'],
      'priceCust':   ['cust','prd','status','ywType','dateRange'],
      'docDate':     ['docNo','dateRange'],
      'invij':       ['docNo','prd','dep','dateRange'],
      'fixAsset':    ['docNo','status','fxKnd','dateRange'],
      'hrNoDate':    ['ygNo','dep'],
      'hrDate':      ['ygNo','dep','outDay','status']
    };

    // Remove dateRange if hideDateUI is true (SYS_DATE reports)
    if (cfg.hideDateUI) {
      layout = layout; // keep layout name unchanged
    }

    var visible = layoutMap[layout] || [];
    // hideDateUI: remove dateRange from visible groups
    if (cfg.hideDateUI && visible.indexOf('dateRange') >= 0) {
      visible = visible.filter(function(v) { return v !== 'dateRange'; });
    }
    visible.forEach(function(key) {
      if (allGroups[key]) allGroups[key].style.display = '';
    });
    // DEP is always visible (present in all layouts)
    // Date range: shown for inv/payment/mrpPK/mrpPS, hidden for mrppu/wagCG3

    // Update label for filterCust
    var custLabel = document.querySelector('label[for="filterCust"]');
    if (custLabel) {
      if (reportKey === 'invpo' || reportKey === 'invpc' || reportKey === 'mrpag') { custLabel.textContent = '厂商代号'; }
      else if (reportKey === 'monbx') { custLabel.textContent = '员工代号'; }
      else if (reportKey === 'invhs') { custLabel.textContent = '客户代号'; }
      else { custLabel.textContent = '客户/厂商'; }
    }

    // Update label for filterDocNo based on active report
    var docNoLabel = document.querySelector('label[for="filterDocNo"]');
    if (docNoLabel) {
      if (reportKey === 'mrpPK') { docNoLabel.textContent = '生产子工单'; }
      else if (reportKey === 'mrpPS') { docNoLabel.textContent = '入库单号'; }
      else if (reportKey === 'monjk') { docNoLabel.textContent = '借款单号'; }
      else if (reportKey === 'monCA' || reportKey === 'monCB') { docNoLabel.textContent = '票据号码'; }
      else if (reportKey === 'scmdrpti') { docNoLabel.textContent = '送货单号'; }
      else if (reportKey === 'invpopc') { docNoLabel.textContent = '采购单号'; }
      else if (reportKey === 'invtwpc') { docNoLabel.textContent = '托工单号'; }
      else if (reportKey === 'invic') { docNoLabel.textContent = '调拨单号'; }
      else if (reportKey === 'invij') { docNoLabel.textContent = '调整单号'; }
      else if (reportKey === 'fixaa') { docNoLabel.textContent = '资产代号'; }
      else { docNoLabel.textContent = '单号'; }
    }

    // Update label for filterPrd based on active report
    var prdLabel = document.querySelector('label[for="filterPrd"]');
    if (prdLabel) {
      if (reportKey === 'mrppu') { prdLabel.textContent = '生产货品'; }
      else if (reportKey === 'mrpPK' || reportKey === 'mrpPS') { prdLabel.textContent = '成品代号'; }
      else if (reportKey === 'accabgt') { prdLabel.textContent = '科目代号'; }
      else { prdLabel.textContent = '货品代号'; }
    }

    // Update label for filterMrpNo based on active report
    var mrpNoLabel = document.querySelector('label[for="filterMrpNo"]');
    if (mrpNoLabel) {
      if (reportKey === 'accabgt') { mrpNoLabel.textContent = '帐册代号'; }
      else { mrpNoLabel.textContent = '成品代号'; }
    }

    // Update label for filterStatus based on active report
    var statusLabel = document.querySelector('label[for="filterStatus"]');
    var statusEl = document.getElementById('filterStatus');
    if (statusLabel && statusEl) {
      if (reportKey === 'fixaa') { statusLabel.textContent = '资产状况'; }
      else if (reportKey === 'invhp' || reportKey === 'invhs') { statusLabel.textContent = '审核状态'; }
      else { statusLabel.textContent = '审核状态'; }
    }

    // Update label for filterYwType based on active report
    var ywTypeLabel = document.querySelector('label[for="filterYwType"]');
    if (ywTypeLabel) {
      if (reportKey === 'invhp' || reportKey === 'invhs') { ywTypeLabel.textContent = '公开状态'; }
      else { ywTypeLabel.textContent = '业务类型'; }
    }

    // Update label for filterFxKnd
    var fxKndLabel = document.querySelector('label[for="filterFxKnd"]');
    if (fxKndLabel) {
      fxKndLabel.textContent = '资产类别';
    }

    // Update label for filterBatNo
    var batNoLabel = document.querySelector('label[for="filterBatNo"]');
    if (batNoLabel) {
      batNoLabel.textContent = '批号';
    }

    // Update label for filterPrdMark
    var prdMarkLabel = document.querySelector('label[for="filterPrdMark"]');
    if (prdMarkLabel) {
      prdMarkLabel.textContent = '货品特征';
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
