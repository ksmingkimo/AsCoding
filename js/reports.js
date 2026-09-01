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

    // ─── 总账报表 (v4/v5 API 长连接 SSE) ──────────────────────

    accgl: {
      name: '总分类账',
      group: '总账报表',
      icon: '📗',
      pinyin: 'zflz',
      apiPath: 'accGeneralLedger/GetReportStream',   // 相对 /SUNFUSION/API（文档 298 行；URL 里的 api 段就是 API 本身）
      apiMethod: 'getReportStream',
      pgm: 'ACCRPTGL',
      dateField: null,
      filterLayout: 'accgl',
      needsBook: true,   // 账簿依赖报表：打开前必须确保账簿清单已加载
      displayFields: [
        'ACC_NO','ACC_NAME','ACC_IPERIOD','DC','REM_TYPE','FZHS_TITLE',
        'CUR_NAME','AMTN_D','AMTN_C','AMTN_BAL'
      ],
      // BOOK_NO 不进标准 filters 循环——它在 buildRequestStream 的 fixCondition 里动态构造
      filters: [
        { index: 4, field: 'BOOK_NO', operator: 'equal', label: '账簿', filterId: 'filterBookNo' }
      ],
      stream: {
        showBody: 'T',
        showLadder: 'F',
        fixCondition: {
          BOOK_NO: '@BOOK_NO',
          CUR_ID: '',
          ACC_IPERIOD_B: '@PERIOD',
          ACC_IPERIOD_E: '@PERIOD',
          CHK_ACCN_TYPE: '2',
          ACC_NO: '',
          ACC_NO_B: '',
          ACC_NO_E: '',
          REL_CLS_B: 1,
          REL_CLS_E: 10,
          AMTN_BAL_TYPE: '1',
          CHK_POSTACC: 'F',
          CHK_STOP: 'F',
          CHK_NOVOH: 'F',
          CHK_NOVOH_BAL_ZERO: 'F',
          CHK_FZHS_DETAIL: 'F',
          CHK_ARP_DAT: 'F',
          CHK_DETAIL_ACCN: 'F',
          CHK_NO_POA_VOH: 'F',
          CHK_NO_SYTZ_VOH: 'F',
          SHOW_BN_TYPE: '1',
          ORDERBY_TYPE: '1',
          START_DD: '@START_DD',
          YEARS: '@YEARS',
          IPERIOD: '@IPERIOD',
          TYPE_NO: '01',
          CHK_GROUP_CUR_LOC: 'F',
          DATE_B: '@DATE_B',
          DATE_E: '@DATE_E'
        },
        orderBy: { SYS_DATE: 'asc' }
      },
      // Round 59 Online 降级（账簿 0 条）：RPTACCBlank 空白纸打印版，扁平请求体（照抄总账报表调用方法.md 6.2）
      online: {
        apiPath: 'RPTACCBlank/GetReportStream',
        responseDataKey: 'RPT',
        filterLayout: 'accglOnline',
        inputs: [],   // 无公式参数 → 面板仅「会计期间」
        body: {
          dateB: '@DATE_B', dateE: '@DATE_E', AccNoB: '', AccNoE: '', DEPT: '', DEPTSHOW: '',
          ACCLEVEL: '0', YE: '', POSSTYLE: '', ACCA: '', CUR_SEL: '', CHKCUR_ID: ''
        }
      }
    },

    // ─── API5 总账 4 只（2026-08-19 新增，长连接 SSE，依赖账簿） ───

    accBalTable: {
      name: '科目余额表',
      group: '总账报表',
      icon: '📊',
      pinyin: 'kmyeb',
      apiPath: 'accBalanceTable/GetReportStream',   // 相对 /SUNFUSION/API，勿带 api/ 前缀
      apiMethod: 'getReportStream',
      pgm: 'ACCRPTABT',
      dateField: null,
      filterLayout: 'accgl',   // 账簿下拉 + 会计期间
      needsBook: true,
      displayFields: [
        'ACC_NO','ACC_NAME',
        'AMTN_NC_D','AMTN_NC_C','AMTN_QC_D','AMTN_QC_C',
        'AMTN_D','AMTN_C','AMTN_Y_D','AMTN_Y_C','AMTN_QM_D','AMTN_QM_C'
      ],
      filters: [
        { index: 4, field: 'BOOK_NO', operator: 'equal', label: '账簿', filterId: 'filterBookNo' }
      ],
      stream: {
        showBody: 'T',
        showLadder: 'F',
        // fixCondition 25 字段逐字取自 API5.md 请求示例（REL_CLS_B/E 为 Int32 数字）
        fixCondition: {
          BOOK_NO: '@BOOK_NO',
          CUR_ID: '',
          ACC_IPERIOD_B: '@PERIOD',
          ACC_IPERIOD_E: '@PERIOD',
          CHK_ACCN_TYPE: '2',
          ACC_NO: '',
          DATE_TYPE: '1',
          ACC_NO_B: '',
          ACC_NO_E: '',
          DATE_B: '@DATE_B',
          DATE_E: '@DATE_E',
          REL_CLS_B: 1,
          REL_CLS_E: 10,
          AMTN_BAL_TYPE: '1',
          CHK_POSTACC: 'F',
          CHK_STOP: 'F',
          CHK_NOVOH_BAL_ZERO: 'F',
          CHK_FZHS_DETAIL: 'F',
          CHK_DETAIL_ACCN: 'F',
          CHK_NO_POA_VOH: 'F',
          CHK_NO_SYTZ_VOH: 'F',
          CHK_GROUP_CUR_LOC: 'F',
          START_DD: '@START_DD',
          YEARS: '@YEARS',
          IPERIOD: '@IPERIOD',
          TYPE_NO: '01'
        },
        orderBy: { SYS_DATE: 'asc' }
      },
      // Round 59 Online 降级：RPTACCDetail（无公式参数；AccNo 空 = 全部科目）
      online: {
        apiPath: 'RPTACCDetail/GetReportStream',
        responseDataKey: 'RPT',
        filterLayout: 'accglOnline',
        inputs: [],
        body: {
          dateB: '@DATE_B', dateE: '@DATE_E', AccNo: '', DEPT: '', DEPTSHOW: '', ACCLEVEL: '',
          YE: '', POSSTYLE: '', ACCA: '', CUR_SEL: '', CHKCUR_ID: '', ACCNOBJLEVEL: ''
        }
      }
    },

    accZcfzb: {
      name: '资产负债表',
      group: '总账报表',
      icon: '📊',
      pinyin: 'zcfzb',
      apiPath: 'accRptPreview/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'CUS_ACC_RPT__2_ZCFZB',
      dateField: null,
      filterLayout: 'accglStyle',
      needsBook: true,
      needsRptStyle: true,   // 需【报表样式】下拉：RPT_NO 动态化（TYPE_NO 取自科目表）
      rptTypeFilter: '2',    // 报表样式按 RPT_TYPE 过滤：2=资产负债表
      displayFields: [],   // 列全走 COLUMN_INFO 动态生成
      renderColumns: 'columnInfo',
      leadingColumns: ['ITEM_NO', 'ITEM_NAME'],
      filters: [
        { index: 4, field: 'BOOK_NO', operator: 'equal', label: '账簿', filterId: 'filterBookNo' }
      ],
      stream: {
        showBody: 'T',
        showLadder: 'F',
        // fixCondition 20 字段取自 API5.md（CHK_NO_SYTZ_VOH="F"）；RPT_NO/TYPE_NO 动态：
        // @RPT_NO 来自样式下拉所选 RPT_NO、@TYPE_NO 来自该样式所属科目表代号
        // （样式行 TYPE_NO；链路：账簿行 TYPE_NO → accRptStyle/getlist，AccType/getlist 不在链路内）
        fixCondition: {
          RPT_NO: '@RPT_NO',
          BOOK_NO: '@BOOK_NO',
          CYCLE_TYPE: '1',
          IPERIOD_TYPE: '1',
          ACC_IPERIOD_B: '@PERIOD',
          ACC_IPERIOD_E: '@PERIOD',
          UP_AMTN: '1',
          CHK_POSTACC: 'F',
          CHK_NO_POA_VOH: 'F',
          DOUBLE_CLASS: 'F',
          SHOW_RPT_ITEM_AMTN_ZERO: 'T',
          CHK_NO_SYTZ_VOH: 'F',
          START_DD: '@START_DD',
          YEARS: '@YEARS',
          IPERIOD: '@IPERIOD',
          TYPE_NO: '@TYPE_NO',
          DATE_TYPE: '1',
          DATE_B: '@DATE_B',
          DATE_E: '@DATE_E',
          CHK_DATE: '1'
        },
        orderBy: { SYS_DATE: 'asc' },
        topFields: { RPT_NO: '@RPT_NO', TYPE_NO: '@TYPE_NO' }
      },
      // Round 59 Online 降级：RPTZFListA（只传 dtE=月末；3 公式框：REPNO1/2/3 资产/负债/业主）
      online: {
        apiPath: 'RPTZFListA/GetReportStream',
        responseDataKey: 'MyTable',
        filterLayout: 'accglOnline',
        inputs: [
          { id: 'filterRepno1', ctxKey: 'REPNO1', defaultValue: '10' },
          { id: 'filterRepno2', ctxKey: 'REPNO2', defaultValue: '20' },
          { id: 'filterRepno3', ctxKey: 'REPNO3', defaultValue: '30' }
        ],
        body: {
          txtDep: '', dtE: '@DATE_E', REPNO1: '@REPNO1', REPNO2: '@REPNO2', REPNO3: '@REPNO3',
          ZHANGID: '', SHOW_LST: '1', ZERO_SHOW: ''
        }
      }
    },

    accLrb: {
      name: '利润表',
      group: '总账报表',
      icon: '📊',
      pinyin: 'lrb',
      apiPath: 'accRptPreview/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'CUS_ACC_RPT__3_LRB',
      dateField: null,
      filterLayout: 'accglStyle',
      needsBook: true,
      needsRptStyle: true,   // 需【报表样式】下拉：RPT_NO 动态化（TYPE_NO 取自科目表）
      rptTypeFilter: '3',    // 报表样式按 RPT_TYPE 过滤：3=利润表
      displayFields: [],   // 动态列
      renderColumns: 'columnInfo',
      leadingColumns: ['ITEM_NO', 'ITEM_NAME'],
      filters: [
        { index: 4, field: 'BOOK_NO', operator: 'equal', label: '账簿', filterId: 'filterBookNo' }
      ],
      stream: {
        showBody: 'T',
        showLadder: 'F',
        // fixCondition 20 字段（CHK_NO_SYTZ_VOH="T"，与资产负债表不同）；RPT_NO/TYPE_NO 动态（同资产负债表）
        fixCondition: {
          RPT_NO: '@RPT_NO',
          BOOK_NO: '@BOOK_NO',
          CYCLE_TYPE: '1',
          IPERIOD_TYPE: '1',
          ACC_IPERIOD_B: '@PERIOD',
          ACC_IPERIOD_E: '@PERIOD',
          UP_AMTN: '1',
          CHK_POSTACC: 'F',
          CHK_NO_POA_VOH: 'F',
          DOUBLE_CLASS: 'F',
          SHOW_RPT_ITEM_AMTN_ZERO: 'T',
          CHK_NO_SYTZ_VOH: 'T',
          START_DD: '@START_DD',
          YEARS: '@YEARS',
          IPERIOD: '@IPERIOD',
          TYPE_NO: '@TYPE_NO',
          DATE_TYPE: '1',
          DATE_B: '@DATE_B',
          DATE_E: '@DATE_E',
          CHK_DATE: '1'
        },
        orderBy: { SYS_DATE: 'asc' },
        // 请求侧字段带 _1 后缀（响应无后缀）；DISPLAY_FIELDS 前导逗号逐字保留
        requestFields: ['ITEM_NO_1', 'ITEM_NAME_1', 'ROW_ID_1', 'STD003_1', 'STD004_1'],
        disFieldsPrefix: ',',
        topFields: { RPT_NO: '@RPT_NO', TYPE_NO: '@TYPE_NO' }
      },
      // Round 59 Online 降级：RPTSYListA（dtB/dtE=月初/月末；1 公式框：REPNO 利润表公式）
      online: {
        apiPath: 'RPTSYListA/GetReportStream',
        responseDataKey: 'MyTable',
        filterLayout: 'accglOnline',
        inputs: [
          { id: 'filterRepno', ctxKey: 'REPNO', defaultValue: '40' }
        ],
        body: {
          dtB: '@DATE_B', dtE: '@DATE_E', REPNO: '@REPNO', DEPNO: '', DEP_LST: '1',
          OBJ_ID: '0', OBJ: '', ADDUP: '', RATEMODE: '1', ZHANGID: '', ZERO_SHOW: ''
        }
      }
    },

    accXjllb: {
      name: '现金流量表',
      group: '总账报表',
      icon: '📊',
      pinyin: 'xjllb',
      apiPath: 'accRptPreview/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'CUS_ACC_RPT__4_XJLL',
      dateField: null,
      filterLayout: 'accglStyle',
      needsBook: true,
      needsRptStyle: true,   // 需【报表样式】下拉：RPT_NO 动态化（TYPE_NO 取自科目表）
      rptTypeFilter: '4',    // 报表样式按 RPT_TYPE 过滤：4=现金流量表
      displayFields: [],
      renderColumns: 'columnInfo',
      leadingColumns: ['ITEM_NO', 'ITEM_NAME'],
      filters: [
        { index: 4, field: 'BOOK_NO', operator: 'equal', label: '账簿', filterId: 'filterBookNo' }
      ],
      stream: {
        showBody: 'T',
        showLadder: 'F',
        fixCondition: {
          RPT_NO: '@RPT_NO',
          BOOK_NO: '@BOOK_NO',
          CYCLE_TYPE: '1',
          IPERIOD_TYPE: '1',
          ACC_IPERIOD_B: '@PERIOD',
          ACC_IPERIOD_E: '@PERIOD',
          UP_AMTN: '1',
          CHK_POSTACC: 'F',
          CHK_NO_POA_VOH: 'F',
          DOUBLE_CLASS: 'F',
          SHOW_RPT_ITEM_AMTN_ZERO: 'T',
          CHK_NO_SYTZ_VOH: 'F',
          START_DD: '@START_DD',
          YEARS: '@YEARS',
          IPERIOD: '@IPERIOD',
          TYPE_NO: '@TYPE_NO',
          DATE_TYPE: '1',
          DATE_B: '@DATE_B',
          DATE_E: '@DATE_E',
          CHK_DATE: '1'
        },
        orderBy: { SYS_DATE: 'asc' },
        topFields: { RPT_NO: '@RPT_NO', TYPE_NO: '@TYPE_NO' }
      },
      // Round 59 Online 降级：RPTCshFroList（凭证日期区间；无公式参数）
      online: {
        apiPath: 'RPTCshFroList/GetReportStream',
        responseDataKey: 'RPT_CSHFROLIST',
        filterLayout: 'accglOnline',
        inputs: [],
        body: {
          dtDateB: '@DATE_B', dtDateE: '@DATE_E', txtCshFroB: '', txtCshFroE: '',
          ACCN_SEL: '', DEPT_SEL: '', DEPT_LST: '1', DATE_TYPE: '', BILL_TYPE: '', CHK_CASH: ''
        }
      }
    },

    // ─── API5 生产制造 4 只（2026-08-19 新增，长连接 SSE，无账簿） ───

    mrpcu: {
      name: '物料分析明细表',
      group: '生产制造',
      icon: '📦',
      pinyin: 'wlfxmxb',
      apiPath: 'mrpcu/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'MRPCU',
      dateField: null,
      filterLayout: 'mrpcu',   // 母件代号 + 工单号（无日期条件）
      displayFields: [
        'MO_NO','MO_ITM','QTY_BIL','BOM_NO','MRP_NO','MRP_NAME','BOM_NO1','ITEM',
        'PRD_NO','PRD_NAME','SPC','PRD_MARK','A001','ID_NO','UNIT_NAME',
        'QTY_STD','LOS_RTO','QTY_LOST_FIX','QTY','QTY_RSV','QTY_ADDLOST',
        'UP_STD','CST','QTY_NOW','QTY_END'
      ],
      filters: [],
      stream: {
        showLadder: 'F',
        // fixCondition 14 字段（ED_QTY_END 分号列表原文）
        fixCondition: {
          COMBOEXP: '3',
          BOM_ITEM: '1',
          COMBOCST: '1',
          SELUPS: '',
          CHKTW_ID: '',
          COMBOWHDTL: '1',
          COMBO_KCWH: '1',
          CHK_PRD: 'F',
          ED_QTY_END: 'QTY_NOW;QTY_ON_ODR;QTY_SQ;QTY_ON_WAY;QTY_ON_RSV;QTY_ON_PRC',
          EXP_VIR_DRC: 'F',
          ED_KCWH: '',
          WASTERCHANGE: 'F',
          NOBOM: 'F',
          REPORT_DD_FIELD: 'REPORT_DD'
        },
        elements: [
          { field: 'MO_NO',  operator: 'in', fieldType: 'bilNo', filterId: 'filterDocNo' },   // 工单号
          { field: 'BOM_NO', operator: 'in', fieldType: 'bilNo', value: '' },                  // 无 UI，请求体照传空
          { field: 'MRP_NO', operator: 'in', filterId: 'filterMrpNo' },                       // 母件代号
          { field: 'QTY',    operator: 'equal', fieldType: 'number', fieldDisabled: true, value: 0 }
        ],
        orderBy: { REPORT_DD: 'asc' }
      }
    },

    mrpct: {
      name: '在制成本明细表',
      group: '生产制造',
      icon: '📦',
      pinyin: 'zzcbmxb',
      apiPath: 'mrpct/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'MRPCT',
      dateField: null,
      filterLayout: 'mrpct',   // 生产货品 + 日期区间（预填本月第一天×2，可编辑）
      displayFields: [
        'MRP_NO','MRP_NAME','PRD_MARK','A001','BAT_NO',
        'QTY_QC','CST_QC','CST_MAN_QC','CST_MAK_QC','CST_PRD_QC','CST_OUT_QC',
        'QTY_TR','CST_TR','CST_MAN_TR','CST_MAK_TR','CST_PRD_TR','CST_OUT_TR',
        'QTY_WG','QTY_LOST_WG','CST_WG','CST_MAN_WG','CST_MAK_WG','CST_PRD_WG','CST_OUT_WG',
        'QTY_DQ','CST_DQ','CST_MAN_DQ','CST_MAK_DQ','CST_PRD_DQ','CST_OUT_DQ',
        'QTY_QM','CST_QM','CST_MAN_QM','CST_MAK_QM','CST_PRD_QM','CST_OUT_QM'
      ],
      filters: [],
      stream: {
        showLadder: 'F',
        // fixCondition 8 字段
        fixCondition: {
          COMBODATE: '1',
          CHKBILS: 'MO;TW',
          CHK_QTYPRC: '',
          COMBOCLS: '1',
          CLSDD: '',
          COMBOSVS: '1',
          SHOWDATA: '1',
          REPORT_DD_FIELD: 'BIL_DD'
        },
        elements: [
          { field: 'YYMM', operator: 'range', fieldType: 'date', need: true, fieldDisabled: true,
            dateOperator: 'this_month', presetFrom: 'dateRange', preset0: '@MONTH_FIRST', sameEndsFrom: true },
          { field: 'MRP_NO', operator: 'in', filterId: 'filterMrpNo' }   // 生产货品
        ],
        orderBy: { BIL_DD: 'asc' },
        // STAT_GROUP 原样传（用户决策；_X_ROW_KEY 行键照抄文档）
        statGroup: [
          { FIELD: 'MRP_NO',   CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '生产货品', _X_ROW_KEY: 'row_17844' },
          { FIELD: 'PRD_MARK', CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '货品特征', _X_ROW_KEY: 'row_17845' },
          { FIELD: 'BAT_NO',   CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '批号',     _X_ROW_KEY: 'row_17846' }
        ],
        datePreset: { from: '@MONTH_FIRST', to: '@MONTH_FIRST' }
      }
    },

    mrpcx: {
      name: '在制原料明细表',
      group: '生产制造',
      icon: '📦',
      pinyin: 'zzylmxb',
      apiPath: 'mrpcx/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'MRPCX',
      dateField: null,
      filterLayout: 'mrpcx',   // 材料代号 + 日期区间（预填本月 1 日~末日，可编辑）
      displayFields: [
        'PRD_NAME','PRD_MARK','A001','BAT_NO','UNIT_NAME',
        'QTY_QC','QTY1_QC','CST_QC','CST_STD_QC',
        'QTY_TR','QTY1_TR','CST_TR','CST_STD_TR',
        'QTY_HY','QTY1_HY','CST_HY','CST_STD_HY',
        'QTY_DQ','QTY1_DQ','CST_DQ','CST_STD_DQ',
        'QTY_QM','QTY1_QM','CST_QM','CST_STD_QM'
      ],
      filters: [],
      stream: {
        showLadder: 'F',
        // fixCondition 3 字段
        fixCondition: {
          COMBOBILKND: '1',
          CHKBILS: 'MO;MB;MD',
          REPORT_DD_FIELD: 'BIL_DD'
        },
        elements: [
          // Round 54 实测 AT04 2022：operator=this_month 时服务端忽略传入日期、自取服务器当月 → 老账套必 0 行；
          // 改 range 后用户日期生效（2022 全年 → 26996 行）
          { field: 'BIL_DD', operator: 'range', fieldType: 'date', need: true, fieldDisabled: true,
            presetFrom: 'dateRange', preset0: '@MONTH_FIRST', preset1: '@MONTH_LAST' },
          { field: 'PRD_NO', operator: 'in', filterId: 'filterPrd' }   // 材料代号
        ],
        orderBy: { BIL_DD: 'asc' },
        statGroup: [
          { FIELD: 'PRD_NO',   CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '材料代号', _X_ROW_KEY: 'row_8211' },
          { FIELD: 'PRD_MARK', CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '货品特征', _X_ROW_KEY: 'row_8212' },
          { FIELD: 'BAT_NO',   CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '批号',     _X_ROW_KEY: 'row_8213' }
        ],
        datePreset: { from: '@MONTH_FIRST', to: '@MONTH_LAST' }
      }
    },

    mrpce: {
      name: '直接原料明细表',
      group: '生产制造',
      icon: '📦',
      pinyin: 'zjylymxb',
      apiPath: 'mrpce/GetReportStream',
      apiMethod: 'getReportStream',
      pgm: 'MRPCE',
      dateField: null,
      filterLayout: 'mrpce',   // 生产货品 + 日期区间（预填年初~今天，可编辑）
      displayFields: [
        'MRP_NO','MRP_NAME','SPC','UNIT_NAME_H','QTY',
        'PRD_NO','PRD_NAME','SPC_PRD','UNIT_NAME','QTY_PRD',
        'UP','CST','QTY_AVE','CST_AVE'
      ],
      filters: [],
      stream: {
        showLadder: 'T',   // 唯一 showLadder="T" 的报表（层级显示）
        // fixCondition 5 字段（WASTERCHANGE 为空串原文）
        fixCondition: {
          REPORT_DD_FIELD: 'BIL_DD',
          COMBOSVS: '1',
          COMBOFCP: 'T',
          COMBOSUM: '1',
          WASTERCHANGE: ''
        },
        elements: [
          { field: 'BIL_DD', operator: 'range', fieldType: 'date', need: true, fieldDisabled: true,
            dateOperator: 'this_month', presetFrom: 'dateRange', preset0: '@YEAR_FIRST', preset1: '@TODAY' },
          { field: 'MRP_NO', operator: 'in', filterId: 'filterMrpNo' }   // 生产货品
        ],
        orderBy: { BIL_DD: 'asc' },
        statGroup: [
          { FIELD: 'MRP_NO', CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '生产货品',           _X_ROW_KEY: 'row_14023' },
          { FIELD: 'PRD_NO', CHK_DEF: 'T', ROW_TO_COL: 'F', TITLE: '直接原料-材料代号',   _X_ROW_KEY: 'row_14024' }
        ],
        datePreset: { from: '@YEAR_FIRST', to: '@TODAY' }
      }
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
      // Round 54 实测 AT04 2022：last_year 锁死上年（2025）→ 老账套必 0 行；range 走用户日期（2022 → 5000 行）
      dateFilter: { operator: 'range' },
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
      // Round 54 实测 AT04 2022：this_year 锁死今年（2026）→ 老账套必 0 行；range 走用户日期（2022 → 5000 行）
      dateFilter: { operator: 'range' },
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
    'ACC_NO_QL_NAME':'清理科目',
    // ─── 总分类账 (accgl, v4 长连接) ───
    'ACC_NAME':      '科目名称',
    'ACC_IPERIOD':   '会计期间',
    'DC':            '借贷方向',
    'REM_TYPE':      '摘要类型',
    'AMTN_D':        '借方金额',
    'AMTN_C':        '贷方金额',
    'AMTN_BAL':      '余额',
    // ─── API5 科目余额表 (accBalTable) ───
    'AMTN_NC_D':     '年初借方',
    'AMTN_NC_C':     '年初贷方',
    'AMTN_QC_D':     '期初借方',
    'AMTN_QC_C':     '期初贷方',
    'AMTN_Y_D':      '本年借方',
    'AMTN_Y_C':      '本年贷方',
    'AMTN_QM_D':     '期末借方',
    'AMTN_QM_C':     '期末贷方',
    // ─── API5 财务报表 (accZcfzb/accLrb/accXjllb) ───
    'ITEM_NO':       '项目编号',
    'ITEM_NAME':     '项目名称',
    'ROW_ID':        '行号',
    'STD001':        '期末数',
    'STD002':        '年初数',
    'STD003':        '本期发生数',
    'STD004':        '本年累计数',
    // ─── API5 MRPCU 物料分析明细表（语义待 ERP 数据回归校核） ───
    'MO_ITM':        '加工项次',
    'QTY_BIL':       '单据数量',
    'BOM_NO':        '工单BOM代号',
    'BOM_NO1':       'BOM代号',
    'ITEM':          '组合项次',
    'QTY':           '数量',
    'QTY_STD':       '标准用量',
    'LOS_RTO':       '损耗率',
    'QTY_LOST_FIX':  '固定损耗量',
    'QTY_RSV':       '已预留量',
    'QTY_ADDLOST':   '附加损耗量',
    'UP_STD':        '标准单价',
    // ─── API5 五阶段列（用户确认：QC 期初在制/TR 本期投入/WG 本期完工/DQ 本期对冲/QM 期末在制/HY 本期耗用） ───
    'QTY_QC':        '期初在制数量',
    'QTY_TR':        '本期投入数量',
    'QTY_WG':        '本期完工数量',
    'QTY_LOST_WG':   '本期完工损耗数量',
    'QTY_DQ':        '本期对冲数量',
    'QTY_QM':        '期末在制数量',
    'QTY_HY':        '本期耗用数量',
    'QTY1_QC':       '期初在制基本数量',
    'QTY1_TR':       '本期投入基本数量',
    'QTY1_HY':       '本期耗用基本数量',
    'QTY1_DQ':       '本期对冲基本数量',
    'QTY1_QM':       '期末在制基本数量',
    'CST_QC':        '期初在制成本',
    'CST_TR':        '本期投入成本',
    'CST_WG':        '本期完工成本',
    'CST_DQ':        '本期对冲成本',
    'CST_QM':        '期末在制成本',
    'CST_HY':        '本期耗用成本',
    'CST_MAN_QC':    '期初在制人工成本',
    'CST_MAN_TR':    '本期投入人工成本',
    'CST_MAN_WG':    '本期完工人工成本',
    'CST_MAN_DQ':    '本期对冲人工成本',
    'CST_MAN_QM':    '期末在制人工成本',
    'CST_MAK_QC':    '期初在制制造费用',
    'CST_MAK_TR':    '本期投入制造费用',
    'CST_MAK_WG':    '本期完工制造费用',
    'CST_MAK_DQ':    '本期对冲制造费用',
    'CST_MAK_QM':    '期末在制制造费用',
    'CST_PRD_QC':    '期初在制材料成本',
    'CST_PRD_TR':    '本期投入材料成本',
    'CST_PRD_WG':    '本期完工材料成本',
    'CST_PRD_DQ':    '本期对冲材料成本',
    'CST_PRD_QM':    '期末在制材料成本',
    'CST_OUT_QC':    '期初在制委外成本',
    'CST_OUT_TR':    '本期投入委外成本',
    'CST_OUT_WG':    '本期完工委外成本',
    'CST_OUT_DQ':    '本期对冲委外成本',
    'CST_OUT_QM':    '期末在制委外成本',
    'CST_STD_QC':    '期初在制标准成本',
    'CST_STD_TR':    '本期投入标准成本',
    'CST_STD_HY':    '本期耗用标准成本',
    'CST_STD_DQ':    '本期对冲标准成本',
    'CST_STD_QM':    '期末在制标准成本',
    // ─── API5 MRPCE 直接原料明细表 ───
    'UNIT_NAME_H':   '母件单位',
    'SPC_PRD':       '材料规格',
    'QTY_PRD':       '材料数量',
    'QTY_AVE':       '平均耗用数量',
    'CST_AVE':       '平均成本'
  };

  // Round 59 Online 空白纸打印版列名（按 reportKey 分表）。
  // 不能并入全局 COLUMN_LABELS：NAME=姓名/REM=备注 等与 Online 语义冲突（科目名称/摘要），
  // 且 AMTN 等字段含义随报表不同（本期金额 vs 本位币金额）。
  // 只收 AT02 实测锁定的高/中置信度字段，未收录者自动回退英文原名（总账报表调用方法.md 6.4）。
  var ONLINE_COLUMN_LABELS = {
    accgl: {
      'ACC_NO': '科目代号', 'NAME': '科目名称', 'ACC_NOTE': '科目说明',
      'YEARMONTH': '会计期间', 'REM': '摘要',
      'AMTND': '本期借方', 'AMTNC': '本期贷方', 'AMTNYE': '期末余额', 'SHOWDC': '借贷方向'
    },
    accBalTable: {
      'ACC_NO': '科目代号', 'NAME': '科目名称', 'AMTNQC': '期初余额',
      'AMTND': '本期借方', 'AMTNC': '本期贷方', 'AMTNYE': '期末余额', 'SHOWDC': '借贷方向',
      'AMTNQC_D': '期初借方', 'AMTNQC_C': '期初贷方', 'AMTNYE_D': '期末借方', 'AMTNYE_C': '期末贷方',
      'DC': '借贷', 'D_NUM': '借方笔数', 'C_NUM': '贷方笔数'
    },
    accZcfzb: {
      'ACC_NOL': '科目代号(左)', 'ACC_NAMEL': '科目名称(左)', 'AMTN_SUML': '金额(左)', 'RATE1L': '比率(左)',
      'ACC_NOR': '科目代号(右)', 'ACC_NAMER': '科目名称(右)', 'AMTN_SUMR': '金额(右)', 'RATE1R': '比率(右)',
      'ITM': '项目编号'
    },
    accLrb: {
      'ACC_NO': '科目代号', 'ACC_NAME': '科目名称', 'AMTN': '本期金额', 'AMTN_SUB': '子公司金额',
      'AMTN_SUM': '合计金额', 'RATE1': '比率', 'AMTN_BUDGET': '预算金额', 'AMTN_DIFF': '差异', 'CAS_NAME': '现金流量项目'
    },
    accXjllb: {
      'MAK_DAT': '制单日期', 'MAK_NO': '制单编号', 'VOH_NO': '凭证号',
      'ACC_NO': '科目代号', 'ACC_NAME': '科目名称', 'EXC_RTO': '汇率',
      'BIL_ID': '单据类别', 'BIL_NO': '单据编号', 'DEP': '部门代号', 'DEP_NAME': '部门名称',
      'DC': '借贷方向', 'ACC_REM': '科目摘要', 'REM': '摘要', 'AMT': '原币金额', 'AMTN': '本位币金额'
    }
  };

  /** Round 59：Online 报表列名（按 reportKey 分表，覆盖全局 COLUMN_LABELS 冲突字段；无则 null） */
  function getOnlineColumnLabel(reportKey, fieldName) {
    var t = ONLINE_COLUMN_LABELS[reportKey];
    return (t && t[fieldName]) || null;
  }

  // Round 60 i18n：制表公式清单 14 条实测目录（AT02/AT03 一致，与账套无关）REP_NO → 简体名。
  // 服务端 NAME 是简体资料、随登录 LANG_ID 不随 UI 语言切换 → 下拉选项名走本地字典翻译，
  // 字典外的客制公式回退服务端 NAME。
  var ONLINE_REPNO_NAMES = {
    '10': '资产(一般企业)', '11': '资产',
    '20': '负债(一般企业)', '21': '负债',
    '30': '股东权益(一般企业)', '31': '股东权益',
    '40': '损益表(一般企业)', '41': '损益表',
    '42': '金融业损益表', '43': '保险业损益表', '44': '证券业损益表',
    '50': '费用明细表', '51': '营业成本表', '61': '管销费用明细表'
  };

  /** 公式选项显示名（"REP_NO · 名称"，名称走 I18n.t；未知 REP_NO 回退服务端 NAME） */
  function _repnoOptionLabel(row) {
    var key = ONLINE_REPNO_NAMES[String(row.REP_NO)];
    var name = key ? I18n.t(key) : (row.NAME || '');
    return row.REP_NO + ' · ' + name;
  }

  // Round 60 i18n：Online 报表资料格固定文案翻译——逐字段白名单（只收实测锁定的固定词组字段，
  // NAME=科目名称/REM=任意摘要等自由文字不入白名单，防误翻 ERP 资料）
  var ONLINE_VALUE_FIELDS = {
    accgl:       { SHOWDC: 1, REM: 1, ACC_NOTE: 1, YEARMONTH: 1 },
    accBalTable: { SHOWDC: 1, NAME: 1 }
  };
  var ONLINE_FIXED_VALUES = { '借': 1, '贷': 1, '承上期': 1, '小计': 1, '合计': 1, '合计:': 1 };

  /**
   * Round 60 i18n：Online 资料格文案翻译（仅固定词组/固定模式，无匹配原样返回）
   * 模式：YEARMONTH "2024年1月"；REM "2024年1月份凭证总金额"（月补零，en 显示 2024-01）
   */
  function translateOnlineCell(reportKey, fieldName, value) {
    var fs = ONLINE_VALUE_FIELDS[reportKey];
    if (!fs || !fs[fieldName]) return value;
    if (ONLINE_FIXED_VALUES[value]) return I18n.t(value);
    if (fieldName === 'YEARMONTH') {
      var ym = /^(\d{4})年(\d{1,2})月$/.exec(value);
      if (ym) return I18n.t('{0}年{1}月', ym[1], String(ym[2]).padStart(2, '0'));
    } else if (fieldName === 'REM') {
      var vr = /^(\d{4})年(\d{1,2})月份凭证总金额$/.exec(value);
      if (vr) return I18n.t('{0}年{1}月份凭证总金额', vr[1], String(vr[2]).padStart(2, '0'));
    }
    return value;
  }

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
    'QTY_DZ','QTY_UNPS','QTY_PRE','QTY_PRE_UNSH','QTY_RK','QTY_RK_UNSH','QTY_JH','ITM',
    // v4 总分类账（长连接）
    'AMT_D','AMT_C','AMT_BAL','AMTN_D','AMTN_C','AMTN_BAL','QTY_D','QTY_C','QTY_BAL','UP_D','UP_C','UP_BAL',
    // v5 API5 八报表
    // 财务报表动态列（STD001 期末数/STD002 年初数/STD003 本期发生数/STD004 本年累计数）
    'STD001','STD002','STD003','STD004',
    // 科目余额表
    'AMTN_NC_D','AMTN_NC_C','AMTN_QC_D','AMTN_QC_C','AMTN_Y_D','AMTN_Y_C','AMTN_QM_D','AMTN_QM_C',
    // MRPCU 物料分析明细表
    'QTY_BIL','QTY_STD','LOS_RTO','QTY_LOST_FIX','QTY_RSV','QTY_ADDLOST','UP_STD',
    // 五阶段列（QC 期初在制/TR 本期投入/WG 本期完工/DQ 本期对冲/QM 期末在制/HY 本期耗用）
    'QTY_QC','QTY_TR','QTY_WG','QTY_LOST_WG','QTY_DQ','QTY_QM','QTY_HY',
    'QTY1_QC','QTY1_TR','QTY1_HY','QTY1_DQ','QTY1_QM',
    // MRPCE 直接原料明细表
    'QTY_PRD','QTY_AVE','CST_AVE',
    // Round 59 Online 空白纸打印版数值列（总分类账/科目余额表/资产负债表/利润表/现金流量表）
    'AMTND','AMTNC','AMTNYE','AMTD','AMTC','AMTYE','YEARS','MONTHS',
    'AMTNQC','AMTQC','AMTCUR','AMTDCCE','AMTNQC_D','AMTNQC_C','AMTQC_D','AMTQC_C',
    'AMTNYE_D','AMTNYE_C','AMTYE_D','AMTYE_C','D_NUM','C_NUM',
    'AMTNL','AMTN_SUBL','AMTN_SUML','RATE1L','AMTNR','AMTN_SUBR','AMTN_SUMR','RATE1R',
    'AMTNA','AMTN_SUBA','AMTN_SUMA','RATE1A','AMTNB','AMTN_SUBB','AMTN_SUMB','RATE1B','ITM',
    'AMTN_SUB','AMTN_SUM','RATE1','AMTN_BUDGET','AMTN_DIFF','RATE2','ID'
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
    'CST_PRD1','CST_PRD2','CST_STD','CST_AMT','UP_AVG_CST','CST_UP',
    // v4 总分类账（长连接）
    'AMT_D','AMT_C','AMT_BAL','AMTN_D','AMTN_C','AMTN_BAL','UP_D','UP_C','UP_BAL',
    // v5 API5 八报表
    // 科目余额表 12 金额列
    'AMTN_NC_D','AMTN_NC_C','AMTN_QC_D','AMTN_QC_C','AMTN_Y_D','AMTN_Y_C','AMTN_QM_D','AMTN_QM_C',
    // 五阶段成本列（X 成本/X 人工成本/X 制造费用/X 材料成本/X 委外成本/X 标准成本/平均成本）
    'CST_QC','CST_MAN_QC','CST_MAK_QC','CST_PRD_QC','CST_OUT_QC',
    'CST_TR','CST_MAN_TR','CST_MAK_TR','CST_PRD_TR','CST_OUT_TR',
    'CST_WG','CST_MAN_WG','CST_MAK_WG','CST_PRD_WG','CST_OUT_WG',
    'CST_DQ','CST_MAN_DQ','CST_MAK_DQ','CST_PRD_DQ','CST_OUT_DQ',
    'CST_QM','CST_MAN_QM','CST_MAK_QM','CST_PRD_QM','CST_OUT_QM',
    'CST_HY','CST_STD_QC','CST_STD_TR','CST_STD_HY','CST_STD_DQ','CST_STD_QM','CST_AVE',
    // Round 59 Online 空白纸打印版金额列（比率 RATE*/笔数 D_NUM/C_NUM 不加 ¥）
    'AMTND','AMTNC','AMTNYE','AMTD','AMTC','AMTYE',
    'AMTNQC','AMTQC','AMTCUR','AMTDCCE','AMTNQC_D','AMTNQC_C','AMTQC_D','AMTQC_C',
    'AMTNYE_D','AMTNYE_C','AMTYE_D','AMTYE_C',
    'AMTNL','AMTN_SUBL','AMTN_SUML','AMTNR','AMTN_SUBR','AMTN_SUMR',
    'AMTNA','AMTN_SUBA','AMTN_SUMA','AMTNB','AMTN_SUBB','AMTN_SUMB',
    'AMTN_SUB','AMTN_SUM','AMTN_BUDGET','AMTN_DIFF'
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
  // Round 59：账簿清单 0 条 → 总账 5 只静默降级 Online 空白纸打印版端点（app.js openReport 置位）
  var _ledgerOnline = false;

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
    return I18n.t(COLUMN_LABELS[fieldName] || fieldName);
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
      return value === 'Y' ? I18n.t('已审核') : (value === 'N' ? I18n.t('未审核') : String(value));
    }

    // 总分类账摘要类型 REM_TYPE：1=期初余额 2=本期合计 3=本年合计（用户 2026-08-18 确认语义，API 文档 9.1）
    if (fieldName === 'REM_TYPE') {
      var remLabel = REM_TYPE_LABELS[String(value)];
      return remLabel ? I18n.t(remLabel) : String(value);
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
    if (value === 'Y') return '<span class="badge badge-success">' + I18n.t('已审核') + '</span>';
    if (value === 'N') return '<span class="badge badge-warning">' + I18n.t('未审核') + '</span>';
    return '';
  }

  // 总分类账摘要类型 REM_TYPE 值 → 语义 key（用户 2026-08-18 确认：1=期初余额 2=本期合计 3=本年合计）
  var REM_TYPE_LABELS = { '1': '期初余额', '2': '本期合计', '3': '本年合计' };

  /**
   * Get badge HTML for REM_TYPE (总分类账摘要类型)
   */
  function getRemTypeBadge(value) {
    var s = String(value);
    if (REM_TYPE_LABELS[s]) {
      var cls = s === '1' ? 'badge-info' : (s === '2' ? 'badge-warning' : 'badge-success');
      return '<span class="badge ' + cls + '">' + I18n.t(REM_TYPE_LABELS[s]) + '</span>';
    }
    return escapeHtml(s);
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
   * Build request body for stream reports (v4 accgl / v5 API5 八报表, 长连接 API)
   * 结构对照 标准报表制表API4/API5.md：SEARCH_INFO [0]展示配置 [1]fixCondition [2..]筛选元素 [末]orderBy
   * + 顶层 DISPLAY_FIELDS；财务报表另有 RPT_NO/TYPE_NO，制造 3 只另有 STAT_GROUP
   * cfg.stream 驱动：fixCondition 模板用 @占位符替换业务值，elements 描述中间筛选元素
   * BOOK_NO 铁律：必填（空值服务端回 SSE ERR「账簿不能为空」；前端 app.js 已拦，此处再兜底传空）
   */
  function buildRequestStream(cfg, filters) {
    filters = filters || {};
    var s = cfg.stream || {};
    var ctx = buildStreamCtx(filters);

    function ph(v) {
      // @占位符解析；非占位符（"F"/"1"/数字/null）原样返回
      if (typeof v === 'string' && v.charAt(0) === '@') {
        var name = v.slice(1);
        return (name in ctx) ? ctx[name] : '';
      }
      return v;
    }

    // [1] fixCondition：模板键值逐项解析占位符
    var fixCondition = {};
    Object.keys(s.fixCondition || {}).forEach(function(k) {
      fixCondition[k] = ph(s.fixCondition[k]);
    });

    // [2]~[N-1] 筛选元素（日期/工单号/母件代号…，文档顺序固定）
    var searchInfo = [];
    (s.elements || []).forEach(function(el) {
      var elem = {
        field: el.field,
        operator: el.operator || 'in',
        fieldDisabled: el.fieldDisabled === true
      };
      if (el.fieldType)  { elem.fieldType = el.fieldType; }
      if (el.need !== undefined) { elem.need = el.need; }
      if (el.dateOperator) { elem.dateOperator = el.dateOperator; }

      if (el.value !== undefined) {
        elem.value = ph(el.value);            // 标量原样（如 MRPCU QTY=0）
      } else if (el.presetFrom === 'dateRange') {
        // 日期元素：优先取用户输入的日期区间，空则用 @占位符预设
        var from = filters.dateFrom || ph(el.preset0) || null;
        var to = filters.dateTo || ph(el.preset1) || null;
        if (el.sameEndsFrom) { to = from; }   // MRPCT：两端都取 from
        elem.value = [from, to];
      } else {
        var fid = el.filterId;                // 显式 filterId，避开 fieldToKey 的 BOOK_NO→filterMrpNo 坑
        elem.value = (fid && filters[fid] !== undefined) ? filters[fid] : '';
      }
      searchInfo.push(elem);
    });

    // [末] orderBy
    searchInfo.push({ orderBy: s.orderBy || { SYS_DATE: 'asc' } });

    var requestFields = s.requestFields || cfg.displayFields;

    // [0] 展示元素（总账 4 只有 showBody；MRPCE showLadder="T"）
    var displayEl = {
      showLadder: s.showLadder || 'F',
      displayFields: requestFields.slice(),
      sumFields: []
    };
    if (s.showBody) { displayEl.showBody = s.showBody; }

    var body = {
      PGM: cfg.pgm,
      SEARCH_INFO: [displayEl, { fixCondition: fixCondition }].concat(searchInfo),
      DISPLAY_FIELDS: (s.disFieldsPrefix || '') + requestFields.join(',')
    };
    // 顶层额外字段：财务报表 RPT_NO/TYPE_NO（占位符同样走 ph() 替换，不能直传）
    if (s.topFields) {
      Object.keys(s.topFields).forEach(function(k) { body[k] = ph(s.topFields[k]); });
    }
    // STAT_GROUP 原样传（用户决策：不做分组 UI，深拷贝防引用污染）
    if (s.statGroup) {
      body.STAT_GROUP = JSON.parse(JSON.stringify(s.statGroup));
    }
    return body;
  }

  /**
   * Round 59：Online 空白纸打印版降级请求体（扁平结构，无 PGM/SEARCH_INFO）
   * cfg.online.body 模板 @占位符：DATE_B/DATE_E 等 buildStreamCtx 派生值 +
   * 公式框（inputs.ctxKey，值来自条件面板，未填 → defaultValue 文档示例值）
   */
  function buildOnlineBody(cfg, filters) {
    filters = filters || {};
    var online = cfg.online;
    var ctx = buildStreamCtx(filters);

    (online.inputs || []).forEach(function(inp) {
      var v = filters[inp.id];
      ctx[inp.ctxKey] = (v !== undefined && v !== '') ? v : inp.defaultValue;
    });

    var body = {};
    Object.keys(online.body || {}).forEach(function(k) {
      var v = online.body[k];
      body[k] = (typeof v === 'string' && v.charAt(0) === '@')
        ? ((v.slice(1) in ctx) ? ctx[v.slice(1)] : '')
        : v;
    });
    return body;
  }

  /**
   * 流式报表 @占位符上下文（BOOK_NO/会计期间/当前日期派生值）
   * 会计期间非法/空 → 默认当前月（YYYY-MM，与 v4 总分类账行为一致）
   */
  function buildStreamCtx(filters) {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');

    var period = filters.dateCst || '';
    if (!/^\d{4}-\d{2}$/.test(period)) { period = y + '-' + m; }
    var years = parseInt(period.slice(0, 4), 10);
    var iperiod = parseInt(period.slice(5, 7), 10);
    var dateB = period + '-01';
    var dateE = period + '-' + String(new Date(years, iperiod, 0).getDate()).padStart(2, '0');

    var monthLast = new Date(y, parseInt(m, 10), 0);
    var ml = String(monthLast.getMonth() + 1).padStart(2, '0');
    var md = String(monthLast.getDate()).padStart(2, '0');

    return {
      BOOK_NO: filters.filterBookNo || '',
      RPT_NO: filters.filterRptNo || '',      // 所选报表样式（@RPT_NO）
      TYPE_NO: filters.styleTypeNo || '',     // 所选样式所属科目表代号（@TYPE_NO，app.js 注入）
      PERIOD: period,
      YEARS: years,
      IPERIOD: iperiod,
      DATE_B: dateB,
      DATE_E: dateE,
      START_DD: dateB + 'T00:00:00',
      MONTH_FIRST: y + '-' + m + '-01',
      MONTH_LAST: y + '-' + ml + '-' + md,
      YEAR_FIRST: y + '-01-01',
      TODAY: y + '-' + m + '-' + d
    };
  }

  /**
   * Query a report via API
   * @param {string} reportKey
   * @param {object} filters
   * @param {number} page
   * @param {number} pageSize
   * @param {function} onProgress 长连接进度回调 (percent, title)，仅流式报表使用
   * @returns {Promise<{data: Array, columnInfo: Array, totalEstimate: number}>}
   */
  function query(reportKey, filters, page, pageSize, onProgress) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) { return Promise.reject(new Error('Unknown report: ' + reportKey)); }

    // ── 长连接流式报表（v4/v5 + Round 59 Online 降级）：独立请求体 + fetchStreamReport ──
    if (cfg.apiMethod === 'getReportStream') {
      // Online 降级（账簿 0 条，readFilters 携带 onlineMode）：扁平请求体 + 专属表键 + 嵌套 COLUMN_INFO
      var isOnline = !!(filters.onlineMode && cfg.online);
      var streamBody = isOnline ? buildOnlineBody(cfg, filters) : buildRequestStream(cfg, filters);
      var colInfo = [];
      return Api.fetchStreamReport(isOnline ? cfg.online.apiPath : cfg.apiPath, streamBody, {
        dataKey: isOnline ? cfg.online.responseDataKey : undefined,
        onProgress: onProgress,
        onData: function(d) {
          // COLUMN_INFO：标准版扁平数组；Online 嵌套 {表键:[...]}；空数据为 {} 对象（实测）→ 数组防护
          if (d && d.COLUMN_INFO) {
            if (isOnline) {
              var k = cfg.online.responseDataKey;
              if (Array.isArray(d.COLUMN_INFO[k])) { colInfo = d.COLUMN_INFO[k]; }
            } else if (Array.isArray(d.COLUMN_INFO)) {
              colInfo = d.COLUMN_INFO;
            }
          }
        }
      }).then(function(rows) {
        _currentColumnInfo = colInfo;   // renderColumns:'columnInfo' 的动态列表头读取
        return {
          data: rows,
          columnInfo: colInfo,
          totalEstimate: rows.length
        };
      });
    }

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
        throw new Error(response.message || I18n.t('查询失败 (code: {0})', response.code));
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

    // 财务报表动态列（renderColumns:'columnInfo'）：前导列 + COLUMN_INFO 映射
    // COLUMN_INFO [{NAME, TITLE}] 异步到达（PERCENT 100 消息），TITLE 走 I18n.t，未知回退原文
    // Round 59 Online 降级：5 只总账报表强制动态列、丢弃前导列（Online 无 ITEM_NO/ITEM_NAME 前导语义）
    var dynamicOnline = !!(_ledgerOnline && cfg.online);
    if (cfg.renderColumns === 'columnInfo' || dynamicOnline) {
      var cols = [];
      if (!dynamicOnline) {
        (cfg.leadingColumns || []).forEach(function(f) {
          cols.push({
            field: f,
            label: getColumnLabel(f),
            isDecimal: false,
            isCurrency: false
          });
        });
      }
      (_currentColumnInfo || []).forEach(function(c) {
        if (!c || !c.NAME) return;
        cols.push({
          field: c.NAME,
          label: I18n.t(getOnlineColumnLabel(reportKey, c.NAME) || COLUMN_LABELS[c.NAME] || c.TITLE || c.NAME),
          isDecimal: isDecimalField(c.NAME),
          isCurrency: isCurrencyField(c.NAME)
        });
      });
      return cols;
    }

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
      // API5 行样式：_SKIP_STAT="T" 汇总行加粗（MRPCE）；财务报表一级项目行加粗
      var trClass = '';
      if (row && row._SKIP_STAT === 'T') { trClass = ' class="row-total"'; }
      else if (row && row.SPACES === 0 && row.ITEM_NO !== undefined) { trClass = ' class="row-level1"'; }

      return '<tr' + trClass + '>' + columns.map(function(col) {
        var raw = row ? row[col.field] : '';
        var display = formatCellValue(raw, col.field);
        // Round 60 i18n：Online 降级报表资料格固定文案随语言翻译（借/贷/承上期/小计/合计等；
        // 自由文字无匹配原样返回，标准版路径 _ledgerOnline=false 不经过这里）
        if (_ledgerOnline) { display = translateOnlineCell(reportKey, col.field, display); }
        var cssClass = getCellClass(col.field);

        if (col.field === 'CHK_STATUS') {
          return '<td class="' + cssClass + '">' + getStatusBadge(raw) + '</td>';
        }

        if (col.field === 'REM_TYPE') {
          return '<td class="' + cssClass + '">' + getRemTypeBadge(raw) + '</td>';
        }

        // 财务报表层级缩进：SPACES×16px 应用于项目名称列
        var indent = '';
        if (col.field === 'ITEM_NAME' && row && row.SPACES) {
          indent = ' style="padding-left:' + (row.SPACES * 16) + 'px"';
        }

        return '<td class="' + cssClass + '"' + indent + '>' + escapeHtml(display) + '</td>';
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
      filterFxKnd:     _val('filterFxKnd'),
      // v4 总分类账（长连接）
      filterBookNo:    _val('filterBookNo'),
      // v6 三财务报表（长连接）：报表样式（RPT_NO）
      filterRptNo:     _val('filterRptNo'),
      // 所选样式所属科目表代号：从下拉选中 option 的 data-type-no 读（populateRptStyleSelect 写入）。
      // 转入数据源等路径不走 doQuery 注入，TYPE_NO 必须在此处拿到，否则 ERP 报「科目表代号不能为空」
      styleTypeNo:     _selData('filterRptNo', 'typeNo'),
      // Round 59 Online 降级（账簿 0 条）：onlineMode 标志驱动 query() 走 Online 端点 +
      // 报表公式框（资产负债表 REPNO1/2/3、利润表 REPNO；未填由 buildOnlineBody 兜底默认值）
      onlineMode:      _ledgerOnline,
      filterRepno1:    _val('filterRepno1'),
      filterRepno2:    _val('filterRepno2'),
      filterRepno3:    _val('filterRepno3'),
      filterRepno:     _val('filterRepno')
    };
  }

  /** 读取指定下拉选中 option 的 dataset 字段（无选中/无该字段 → 空字符串） */
  function _selData(id, key) {
    var sel = document.getElementById(id);
    if (!sel || sel.selectedIndex < 0) return '';
    var o = sel.options[sel.selectedIndex];
    return (o && o.dataset && o.dataset[key]) ? o.dataset[key] : '';
  }

  /**
   * Update the filter panel visibility based on report type
   * Uses cfg.filterLayout to determine which filter groups to show/hide
   */
  function updateFilterPanel(reportKey) {
    var cfg = REPORT_CONFIG[reportKey];
    if (!cfg) return;

    // 切报表清空旧动态列头（Round 59 修：报表间切换时 getVisibleColumns 读到上一只的 COLUMN_INFO）
    _currentColumnInfo = [];

    var layout = cfg.filterLayout;
    // Round 59 Online 降级：账簿 0 条 → 用 online 布局（会计期间 + 自动推导公式栏位）
    if (_ledgerOnline && cfg.online) { layout = cfg.online.filterLayout; }
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
      bookNo:  document.querySelector('.filter-group-bookno'),
      rptStyle: document.querySelector('.filter-group-rptstyle'),
      onlinerepno3: document.querySelector('.filter-group-onlinerepno3'),   // Round 59 资产负债 3 公式框
      onlinerepno1: document.querySelector('.filter-group-onlinerepno1'),   // Round 59 利润表 1 公式框
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
      'hrDate':      ['ygNo','dep','outDay','status'],
      // v4 总分类账（长连接）：账簿下拉 + 会计期间
      'accgl':       ['bookNo','dateCst'],
      // v6 三财务报表（长连接）：账簿 + 报表样式 + 会计期间（不动共用 accgl）
      'accglStyle':  ['bookNo','rptStyle','dateCst'],
      // v5 API5 八报表（4 总账复用 accgl 布局；生产 4 只）
      'mrpcu':       ['mrpNo','docNo'],       // 母件代号 + 工单号（无日期）
      'mrpct':       ['mrpNo','dateRange'],   // 生产货品 + 日期区间
      'mrpcx':       ['prd','dateRange'],     // 材料代号 + 日期区间
      'mrpce':       ['mrpNo','dateRange'],   // 生产货品 + 日期区间
      // Round 59 Online 降级：会计期间（公式栏位由下方 inputs.length 自动推导，不进 layoutMap）
      'accglOnline': ['dateCst']
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
    // Round 59 Online 降级：公式栏位自动判断（同 ui-template ONLINE_DEMO 推导逻辑：
    // online.inputs.length 3 → 资产负债表 3 公式框；1 → 利润表 1 公式框；0 → 仅会计期间）
    if (_ledgerOnline && cfg.online) {
      var nInputs = (cfg.online.inputs || []).length;
      if (nInputs === 3) { visible.push('onlinerepno3'); }
      else if (nInputs === 1) { visible.push('onlinerepno1'); }
    }

    visible.forEach(function(key) {
      if (allGroups[key]) allGroups[key].style.display = '';
    });
    // DEP is always visible (present in all layouts)
    // Date range: shown for inv/payment/mrpPK/mrpPS, hidden for mrppu/wagCG3

    // Update label for filterCust
    var custLabel = document.querySelector('label[for="filterCust"]');
    if (custLabel) {
      if (reportKey === 'invpo' || reportKey === 'invpc' || reportKey === 'mrpag') { custLabel.textContent = I18n.t('厂商代号'); }
      else if (reportKey === 'monbx') { custLabel.textContent = I18n.t('员工代号'); }
      else if (reportKey === 'invhs') { custLabel.textContent = I18n.t('客户代号'); }
      else { custLabel.textContent = I18n.t('客户/厂商'); }
    }

    // Update label for filterDocNo based on active report
    var docNoLabel = document.querySelector('label[for="filterDocNo"]');
    if (docNoLabel) {
      if (reportKey === 'mrpPK') { docNoLabel.textContent = I18n.t('生产子工单'); }
      else if (reportKey === 'mrpPS') { docNoLabel.textContent = I18n.t('入库单号'); }
      else if (reportKey === 'monjk') { docNoLabel.textContent = I18n.t('借款单号'); }
      else if (reportKey === 'monCA' || reportKey === 'monCB') { docNoLabel.textContent = I18n.t('票据号码'); }
      else if (reportKey === 'scmdrpti') { docNoLabel.textContent = I18n.t('送货单号'); }
      else if (reportKey === 'invpopc') { docNoLabel.textContent = I18n.t('采购单号'); }
      else if (reportKey === 'invtwpc') { docNoLabel.textContent = I18n.t('托工单号'); }
      else if (reportKey === 'invic') { docNoLabel.textContent = I18n.t('调拨单号'); }
      else if (reportKey === 'invij') { docNoLabel.textContent = I18n.t('调整单号'); }
      else if (reportKey === 'fixaa') { docNoLabel.textContent = I18n.t('资产代号'); }
      else if (reportKey === 'mrpcu') { docNoLabel.textContent = I18n.t('工单号'); }   // API5 MO_NO
      else { docNoLabel.textContent = I18n.t('单号'); }
    }

    // Update label for filterPrd based on active report
    var prdLabel = document.querySelector('label[for="filterPrd"]');
    if (prdLabel) {
      if (reportKey === 'mrppu') { prdLabel.textContent = I18n.t('生产货品'); }
      else if (reportKey === 'mrpPK' || reportKey === 'mrpPS') { prdLabel.textContent = I18n.t('成品代号'); }
      else if (reportKey === 'accabgt') { prdLabel.textContent = I18n.t('科目代号'); }
      else if (reportKey === 'mrpcx') { prdLabel.textContent = I18n.t('材料代号'); }   // API5 PRD_NO
      else { prdLabel.textContent = I18n.t('货品代号'); }
    }

    // Update label for filterMrpNo based on active report
    var mrpNoLabel = document.querySelector('label[for="filterMrpNo"]');
    if (mrpNoLabel) {
      if (reportKey === 'accabgt') { mrpNoLabel.textContent = I18n.t('帐册代号'); }
      else if (reportKey === 'mrpcu') { mrpNoLabel.textContent = I18n.t('母件代号'); }        // API5
      else if (reportKey === 'mrpct' || reportKey === 'mrpce') { mrpNoLabel.textContent = I18n.t('生产货品'); }  // API5
      else { mrpNoLabel.textContent = I18n.t('成品代号'); }
    }

    // Update label for filterStatus based on active report
    var statusLabel = document.querySelector('label[for="filterStatus"]');
    var statusEl = document.getElementById('filterStatus');
    if (statusLabel && statusEl) {
      if (reportKey === 'fixaa') { statusLabel.textContent = I18n.t('资产状况'); }
      else if (reportKey === 'invhp' || reportKey === 'invhs') { statusLabel.textContent = I18n.t('审核状态'); }
      else { statusLabel.textContent = I18n.t('审核状态'); }
    }

    // Update label for filterYwType based on active report
    var ywTypeLabel = document.querySelector('label[for="filterYwType"]');
    if (ywTypeLabel) {
      if (reportKey === 'invhp' || reportKey === 'invhs') { ywTypeLabel.textContent = I18n.t('公开状态'); }
      else { ywTypeLabel.textContent = I18n.t('业务类型'); }
    }

    // Update label for filterFxKnd
    var fxKndLabel = document.querySelector('label[for="filterFxKnd"]');
    if (fxKndLabel) {
      fxKndLabel.textContent = I18n.t('资产类别');
    }

    // Update label for filterBatNo
    var batNoLabel = document.querySelector('label[for="filterBatNo"]');
    if (batNoLabel) {
      batNoLabel.textContent = I18n.t('批号');
    }

    // Update label for filterPrdMark
    var prdMarkLabel = document.querySelector('label[for="filterPrdMark"]');
    if (prdMarkLabel) {
      prdMarkLabel.textContent = I18n.t('货品特征');
    }

    // Update label for filterDateCst（总账 4 只 + Round 59 Online 5 只复用为「会计期间」）
    var dateCstLabel = document.querySelector('label[for="filterDateCst"]');
    if (dateCstLabel) {
      if (layout === 'accgl' || layout === 'accglStyle' || layout === 'accglOnline') {
        dateCstLabel.textContent = I18n.t('会计期间');
        // 打开总账报表即默认当前月（HTML 硬编码 2025-07 是旧演示值，不能用）
        var cstEl = document.getElementById('filterDateCst');
        if (cstEl) {
          var now = new Date();
          var mm = String(now.getMonth() + 1);
          if (mm.length === 1) mm = '0' + mm;
          cstEl.value = now.getFullYear() + '-' + mm;
        }
      } else {
        dateCstLabel.textContent = I18n.t('成本年月');
      }
    }

    // 生产 3 只日期预填（可编辑，用户可改）：打开报表时按 cfg.stream.datePreset 填入
    if (cfg.stream && cfg.stream.datePreset) {
      var preset = cfg.stream.datePreset;
      var presetCtx = buildStreamCtx({});
      var fromEl = document.getElementById('filterDateFrom');
      var toEl = document.getElementById('filterDateTo');
      if (fromEl && preset.from) fromEl.value = preset.from.charAt(0) === '@' ? presetCtx[preset.from.slice(1)] : preset.from;
      if (toEl && preset.to) toEl.value = preset.to.charAt(0) === '@' ? presetCtx[preset.to.slice(1)] : preset.to;
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
     Round 60 Online 公式下拉（billcommon/GetAccRepNoList）
     ================================================================ */

  /** 公式框换装辅助：input → select（保留 id/class/父节点），返回新 select */
  function _swapRepnoToSelect(el, inp) {
    var sel = document.createElement('select');
    sel.id = inp.id;
    sel.className = el.className;
    el.parentNode.replaceChild(sel, el);
    return sel;
  }

  /** 公式框换装辅助：select → text input（保留 id/class/父节点，回填默认值），返回新 input */
  function _swapRepnoToInput(el, inp) {
    var input = document.createElement('input');
    input.type = 'text';
    input.id = inp.id;
    input.className = el.className;
    input.value = inp.defaultValue;
    el.parentNode.replaceChild(input, el);
    return input;
  }

  /**
   * Online 公式框换装成下拉选单（拉取制表公式清单成功后调用；语言切换重渲染也走这里）
   * 选项 = 全量清单（"REP_NO · 名称"，名称本地翻译、未知回退服务端 NAME），各自预选 defaultValue；
   * 已是 select 时保留当前选中（语言切换不重置回默认值）；清单缺目标值时插入兜底选项
   * （仍预选默认值，查询语义与 buildOnlineBody 空值兜底一致）
   * @param {object} cfg 目标报表配置（须有 cfg.online.inputs）
   */
  function renderOnlineRepnoSelects(cfg) {
    var inputs = cfg && cfg.online && cfg.online.inputs;
    if (!inputs || !inputs.length) return;
    var list = (typeof AccRepNoStore !== 'undefined') ? AccRepNoStore.getList() : [];
    inputs.forEach(function(inp) {
      var el = document.getElementById(inp.id);
      if (!el) return;
      var sel = (el.tagName === 'SELECT') ? el : _swapRepnoToSelect(el, inp);
      var cur = sel.value;   // 保留当前选中（Round 60 i18n：语言切换重渲染不重置回默认值）
      sel.innerHTML = '';
      var hasSel = false;
      list.forEach(function(row) {
        var o = document.createElement('option');
        o.value = row.REP_NO;
        o.textContent = _repnoOptionLabel(row);
        if (row.REP_NO === (cur || inp.defaultValue)) { o.selected = true; hasSel = true; }
        sel.appendChild(o);
      });
      if (!hasSel && inp.defaultValue) {
        var fb = document.createElement('option');
        fb.value = inp.defaultValue;
        fb.textContent = inp.defaultValue;
        fb.selected = true;
        sel.insertBefore(fb, sel.firstChild);
      }
    });
  }

  /**
   * Online 公式框换回文本框（登出/状态复位时调用；幂等：已是 input 则只回填默认值）
   * 不依赖单只报表 cfg：遍历 REPORT_CONFIG 全部 online.inputs 的 id，防换账套残留旧清单 select
   */
  function restoreOnlineRepnoInputs() {
    Object.keys(REPORT_CONFIG).forEach(function(key) {
      var cfg = REPORT_CONFIG[key];
      var inputs = cfg && cfg.online && cfg.online.inputs;
      if (!inputs || !inputs.length) return;
      inputs.forEach(function(inp) {
        var el = document.getElementById(inp.id);
        if (!el) return;
        if (el.tagName === 'SELECT') _swapRepnoToInput(el, inp);
        else el.value = inp.defaultValue;
      });
    });
  }

  /**
   * Online 公式框默认值集中导出：{ filterRepno1: '10', ... }（自 cfg.online.inputs，唯一真源）
   * 重置按钮与复位逻辑统一走这里，消除硬编码漂移
   */
  function getOnlineRepnoDefaults() {
    var defaults = {};
    Object.keys(REPORT_CONFIG).forEach(function(key) {
      var cfg = REPORT_CONFIG[key];
      var inputs = cfg && cfg.online && cfg.online.inputs;
      if (!inputs || !inputs.length) return;
      inputs.forEach(function(inp) {
        defaults[inp.id] = inp.defaultValue;
      });
    });
    return defaults;
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
    renderOnlineRepnoSelects: renderOnlineRepnoSelects,
    restoreOnlineRepnoInputs: restoreOnlineRepnoInputs,
    getOnlineRepnoDefaults:   getOnlineRepnoDefaults,

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
    set isLoading(v)        { _isLoading = v; },
    get ledgerOnline()      { return _ledgerOnline; },
    set ledgerOnline(v)     { _ledgerOnline = v; }
  };

})();
