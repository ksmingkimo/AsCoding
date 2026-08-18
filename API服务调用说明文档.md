# API 服务调用说明文档

> Sunlike ERP API 对接参考
> 最后更新：2026-08-18（API4 长连接 SSE 实测 + 账簿列表 API + REM_TYPE 摘要类型语义）

---

## 一、基本信息

| 项目 | 值 |
|------|-----|
| Base URL | `http://localhost/SUNFUSION/API` |
| 请求格式 | JSON |
| 编码 | UTF-8 |
| 认证方式 | Bearer Token（`Authorization: Bearer {TOKEN}`） |
| 成功判断 | **`response.code === 0`**（⚠️ 不是 HTTP 200） |
| 服务器 | Microsoft-IIS/10.0, ASP.NET |

---

## 二、登录 API

### 请求

```
POST /user/login
Content-Type: application/json
```

| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| `COMPNO` | string | **是** | 公司代码 | `"AT01"` |
| `USR` | string | **是** | 用户代号 | `"SAN"` |
| `PWD` | string | **是** | 密码（可为空字符串） | `""` |
| `LANG_ID` | string | **是** | 语言标识 | `"zh-cn"` |
| `SYS_TYPE` | string | **是** | 系统类型 | `"ERP"` |

### curl 示例

```bash
curl -s -X POST http://localhost/SUNFUSION/API/user/login \
  -H "Content-Type: application/json" \
  -d '{"COMPNO":"AT01","USR":"SAN","PWD":"","LANG_ID":"zh-cn","SYS_TYPE":"ERP"}'
```

### 成功响应 (code: 0)

```json
{
  "code": 0,
  "message": "RCID=USER_LOGIN_SUCCESS",
  "data": {
    "TOKEN": "fc8ad173-1506-4f5f-9a07-38dfbdf3e638",
    "COMPNO": "AT01",
    "USR": "SAN",
    "USR_NAME": "SAN",
    "LANG_ID": "0",
    "LANG_ID_DATA": [
      { "LangID": "0", "LangCaption": "简体中文", "LangTag": "zh-cn" },
      { "LangID": "1", "LangCaption": "繁體中文", "LangTag": "zh-tw" },
      { "LangID": "2", "LangCaption": "English", "LangTag": "en" }
    ]
  }
}
```

**关键字段路径**：
- Token：`response.data.TOKEN`
- 用户名：`response.data.USR_NAME`
- 语言列表：`response.data.LANG_ID_DATA`

### 错误响应

| 场景 | code | message |
|------|------|---------|
| 密码错误 | 10001 | `登录失败，请检查用户代号和密码是否正确！` |
| 公司代码无效 | 10001 | `Object reference not set to an instance of an object.` |
| 缺少必填字段 | 10001 | `Object reference not set to an instance of an object.` |

> ⚠️ code 10001 是通用错误码，message 不一定准确。不要根据 message 做逻辑判断。

---

## 三、报表查询 API（通用）

### 请求结构（30 个 getReport 报表通用；getList 见 6.3，长连接 GetReportStream 见第九节）

```
POST /{module}/getReport
Content-Type: application/json
Authorization: Bearer {TOKEN}
```

```json
{
  "PGM": "REP_XXXXX",
  "SEARCH_INFO": [ /* 10 个元素，按索引固定顺序 */ ],
  "DISPLAY_FIELDS": "FIELD1,FIELD2,..."
}
```

### SEARCH_INFO 通用结构（索引 [0]~[9]）

| 索引 | 内容 | 说明 |
|------|------|------|
| `[0]` | `{ offset: [start, end], temp: true }` | 分页：start 从 0 开始，end 是截止行号（含）。temp=true 不持久化 |
| `[1]` | `{ showLadder, displayFields, sumFields }` | 展示字段配置。showLadder="F"，sumFields=[] 表示不汇总 |
| `[2]` | `{ fixCondition: {...} }` | 固定条件，各报表不同 |
| `[3]` | `{ field, operator, fieldType, need, fieldDisabled, value }` | 日期范围条件 |
| `[4]` | `{ field: "CUS_NO", operator: "in", ... }` | 客户/厂商筛选 |
| `[5]` | `{ field: "PRD_NO", operator: "in", ... }` | 货品筛选 |
| `[6]` | `{ field: "DEP"/"PO_DEP", operator: "in", ... }` | 部门筛选 |
| `[7]` | `{ field: "WH", operator: "in", ... }` | 仓库筛选 |
| `[8]` | `{ field: "CHK_STATUS", operator: "equal", ... }` | 审核状态 |
| `[9]` | `{ orderBy: { FIELD: "asc"/"desc" } }` | 排序规则 |

**筛选条件不限制时**：传 `"value": ""`（空字符串），不是 `null` 或 `[]`。

**分页说明**：`offset: [0, 10]` 返回前 11 条（0-based，含 end）。实测 offset[0,3] 返回 3 条。

### 响应结构（所有 6 个报表通用）

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "REPORT__TAB": [ /* 数据行数组 */ ],
    "COLUMN_INFO": { "REPORT__TAB": [ /* 列类型元数据 */ ] },
    "COLUMN_PROP": { "REPORT__TAB": [ /* 列属性元数据 */ ] },
    "BASIC_DATA_TABLE": [ /* 基础数据表名 */ ]
  }
}
```

**关键字段路径**：
- 数据行：`response.data.REPORT__TAB`（数组，可能为空 `[]`）
- 列类型：`response.data.COLUMN_INFO.REPORT__TAB[].NAME` / `TYPE`
- 前端可搜索列：`COLUMN_PROP.REPORT__TAB[]` 中 `SEARCHVISIBLE !== "F"` 的
- 总行数：`REPORT__TAB.length`（当前页），无 total 字段。取全量需设大 offset

### 认证错误

| 场景 | code | message |
|------|------|---------|
| 无 Token | 20001 | `The credential is empty, access is denied.` |
| Token 无效/过期 | 20004 | `The credential has expired: ...` |

### 其他错误

| 场景 | code | message |
|------|------|---------|
| PGM 不存在 | 10001 | SQL 语法错误（服务端拼接 SQL 失败） |

---

## 四、受订单报表（已实测）

### 请求

```
POST /api/invso/getReport
```

> ⚠️ 注意：Postman 实测端点是 `/invso`（全小写），不是 `/invSO`。

```bash
curl -s -X POST 'http://localhost/SUNFUSION/API/invso/getReport' \
  -H 'Authorization: Bearer {TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{
    "PGM": "REP_SOLIST",
    "SEARCH_INFO": [
        {"offset": [0, 5000], "temp": true},
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO","CUS_NAME","OS_DD","OS_NO","PRD_NO","PRD_NAME",
                "PRD_MARK","A001","WH_NAME","UNIT","UP","QTY","DIS_CNT",
                "AMT_DIS_CNT","AMTN","AMTN_NET","TAX","AMTN_WITHTAX",
                "QTY_PS","QTY_PS_UNSH","QTY_JH","QTY_UNPS","QTY_PRE",
                "QTY_PRE_UNSH","QTY_RK","QTY_RK_UNSH","EST_DD","REM_B"
            ],
            "sumFields": []
        },
        {"fixCondition": {"REPORT_DD_FIELD": "OS_DD", "SUB_CUS": ""}},
        {"field": "OS_DD", "operator": "this_year", "fieldType": "date", "need": true, "fieldDisabled": true, "value": ["2026-01-01", "2026-12-31"]},
        {"field": "CUS_NO", "operator": "in", "fieldDisabled": false, "checkUnder": "T", "value": ""},
        {"field": "PRD_NO", "operator": "in", "fieldDisabled": false, "value": ""},
        {"field": "DEP", "operator": "in", "fieldDisabled": false, "checkUnder": "T", "value": ""},
        {"field": "WH", "operator": "in", "fieldDisabled": false, "checkUnder": "T", "value": ""},
        {"field": "CHK_STATUS", "operator": "equal", "fieldDisabled": false, "value": ""},
        {"orderBy": {"OS_DD": "asc"}}
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,OS_DD,OS_NO,PRD_NO,PRD_NAME,PRD_MARK,A001,WH_NAME,UNIT,UP,QTY,DIS_CNT,AMT_DIS_CNT,AMTN,AMTN_NET,TAX,AMTN_WITHTAX,QTY_PS,QTY_PS_UNSH,QTY_JH,QTY_UNPS,QTY_PRE,QTY_PRE_UNSH,QTY_RK,QTY_RK_UNSH,EST_DD,REM_B"
  }'
```

### 受订单 displayFields 完整字段说明（27个）

| 字段 | 含义 | 类型 |
|------|------|------|
| `CUS_NO` | 客户代号 | string |
| `CUS_NAME` | 客户名称 | string |
| `OS_DD` | 受订日期 | DateTime |
| `OS_NO` | 受订单号 | string |
| `PRD_NO` | 货品代号 | string |
| `PRD_NAME` | 货品名称 | string |
| `PRD_MARK` | 货品标记 | string |
| `A001` | 自定义字段A001 | string |
| `WH_NAME` | 仓库名称 | string |
| `UNIT` | 单位 | string |
| `UP` | 单价 | Decimal |
| `QTY` | 数量 | Decimal |
| `DIS_CNT` | 折扣率 | Decimal |
| `AMT_DIS_CNT` | 折扣金额 | Decimal |
| `AMTN` | 含税金额 | Decimal |
| `AMTN_NET` | 不含税金额（净额） | Decimal |
| `TAX` | 税额 | Decimal |
| `AMTN_WITHTAX` | 含税总金额 | Decimal |
| `QTY_PS` | 已交数量 | Decimal |
| `QTY_PS_UNSH` | 未出库已交数量 | Decimal |
| `QTY_JH` | 交货数量 | Decimal |
| `QTY_UNPS` | 未交数量 | Decimal |
| `QTY_PRE` | 预交数量 | Decimal |
| `QTY_PRE_UNSH` | 未出库预交数量 | Decimal |
| `QTY_RK` | 入库数量 | Decimal |
| `QTY_RK_UNSH` | 未出库入库数量 | Decimal |
| `EST_DD` | 预计交货日 | DateTime |
| `REM_B` | 备注B | string |

### 受订报表专用字段

| 要素 | 值 |
|------|-----|
| PGM | `REP_SOLIST` |
| 日期字段 | `OS_DD`（受订日期） |
| fixCondition | `REPORT_DD_FIELD: "OS_DD"`, `SUB_CUS: ""` |
| 部门字段 | `DEP`（checkUnder="T"） |
| 日期操作符 | `this_year` / `range` / `last_year` 等 |

### 响应数据示例（完整字段）

```json
{
  "CUS_NO": "C001",
  "CUS_NAME": "特斯拉",
  "OS_DD": "2026-08-03T00:00:00",
  "OS_NO": "SO68030001",
  "PRD_NO": "M0001",
  "PRD_NAME": "Model 3",
  "PRD_MARK": "",
  "A001": "",
  "WH_NAME": "First Stock",
  "UNIT": "辆",
  "UP": 230000.0,
  "QTY": 1.0,
  "DIS_CNT": 0.0,
  "AMT_DIS_CNT": 0.0,
  "AMTN": 230000.0,
  "AMTN_NET": 230000.0,
  "TAX": 0.0,
  "AMTN_WITHTAX": 230000.0,
  "QTY_PS": 0.0,
  "QTY_PS_UNSH": 0.0,
  "QTY_JH": 0.0,
  "QTY_UNPS": 0.0,
  "QTY_PRE": 0.0,
  "QTY_PRE_UNSH": 0.0,
  "QTY_RK": 0.0,
  "QTY_RK_UNSH": 0.0,
  "EST_DD": "2026-08-03T00:00:00",
  "REM_B": "",
  "CHK_STATUS": "Y",
  "TAX_RTO": 13.0
}
```

> 日期格式：`YYYY-MM-DDTHH:mm:ss`，前端展示时需格式化为 `YYYY-MM-DD`。
> 数值类型（Decimal）直接是数字，不需要额外解析。

---

## 五、报表差异速查

| 报表 | 端点 | PGM | 日期字段 | 特殊 fixCondition | 部门字段 |
|------|------|-----|---------|-------------------|---------|
| 采购 | `/invpo` | `REP_POLIST` | `OS_DD` | 只有 REPORT_DD_FIELD | `PO_DEP` |
| 进货 | `/invpc` | `REP_PCLIST` | `PS_DD` | + SA_BILLS="PC;PB;PD" | `DEP` |
| 受订 | `/invso` | `REP_SOLIST` | `OS_DD` | + SUB_CUS | `DEP` |
| 销货 | `/invSa` | `REP_SALIST` | `PS_DD` | + SA_BILLS + SUB_CUS | `DEP` |
| 收款 | `/monAA` | `REP_RTLIST` | `RP_DD` | + LINE + SHOW_LSIT×3 + INCLUDESON | `DEP` |
| 付款 | `/monBA` | `REP_PTLIST` | `RP_DD` | + LINE + SHOW_LSIT×3 + INCLUDESON | `DEP` |
| 工单 | `/mrppk` | `MRPPK` | `MO_DD` | 只有 REPORT_DD_FIELD | `DEP` |
| 完工入库 | `/mrpafc` | `MRPPS` | `MM_DD` | + COMBOFCP + WL_CHK + COMBODATE | `DEP` |
| 成本分析 | `/mrppu` | `MRPPU` | `DATE_CST` | **getList 端点**，OTHERINFO + PAGE_INFO，响应为 TRANS | `DEP` |
| 薪资 | `/rptwagcg3` | `REP_WAGCG3` | `YEARS` | showLadder="T"，年度筛选，SEARCH_INFO 仅 7 元素 | - |
| 总分类账 | `/accGeneralLedger/GetReportStream` | `ACCRPTGL` | `ACC_IPERIOD_B/E`（会计期间起止，YYYY-MM） | **长连接 SSE 流式**，BOOK_NO 必填，SEARCH_INFO 仅 3 元素无分页 | - |

> ⚠️ 端点大小写：Postman 实测 `/invso` 为全小写。其余报表端点大小写以实际 Postman 验证为准。

---

## 六、生产制造 & 人力资源报表（v2 API，2026-08-11 新增）

### 6.1 工单完成情况表

```
POST /mrppk/getReport
```

- **PGM**: `MRPPK`
- **日期字段**: `MO_DD`（工单日期）
- **fixCondition**: `{ REPORT_DD_FIELD: "MO_DD" }`
- **SEARCH_INFO**: 8 个元素（[0]~[7]），筛选字段：MO_NO、MRP_NO、DEP
- **orderBy**: 3 个字段 `{ MO_DD: "asc", MO_NO: "asc", ZC_ITM: "asc" }`
- **响应**: 标准 `REPORT__TAB` + `COLUMN_INFO.REPORT__TAB`

### 6.2 完工入库报表

```
POST /mrpafc/getReport
```

- **PGM**: `MRPPS`
- **日期字段**: `MM_DD`（入库日期）
- **fixCondition**: `{ REPORT_DD_FIELD: "MM_DD", COMBOFCP: "1", WL_CHK: "F", COMBODATE: "1" }`
- **SEARCH_INFO**: 10 个元素，标准布局。筛选字段：MM_NO（fieldType: bilNo）、MRP_NO、DEP、WH、CHK_STATUS
- **响应**: 标准 `REPORT__TAB` + `COLUMN_INFO.REPORT__TAB`

### 6.3 产品成本分析表 ⚠️ 架构不同

```
POST /mrppu/getList
```

- **PGM**: `MRPPU`
- **端点**: `getList`（不是 getReport！）
- **请求体额外字段**: `OTHERINFO: { DEP_GROUP: "00000000", INCLUDESON: "F" }`
- **分页**: 通过 `PAGE_INFO: { PAGE_SIZE, CURRENT_PAGE }`（不在 SEARCH_INFO[0]）
- **SEARCH_INFO**: 8 个元素（[0]=showBody+displayFields，[1]=fixCondition，[2]~[5]=固定禁用筛选，[6]=DEP，[7]=PRD_NO）
- **无** DISPLAY_FIELDS 顶层字段
- **无** orderBy 元素
- **响应数据路径**: `data.TRANS`（不是 REPORT__TAB）
- **响应列信息**: `data.COLUMN_INFO` 扁平数组（不是 `COLUMN_INFO.REPORT__TAB`）
- **响应分页**: `data.PAGE_INFO`

### 6.4 员工年度薪资清册

```
POST /rptwagcg3/getReport
```

- **PGM**: `REP_WAGCG3`
- **日期字段**: `YEARS`（年度筛选，operator: "equal"，单值 string）
- **showLadder**: `"T"`（显示阶梯价）
- **fixCondition**: 7 个字段（SZ_NO_TYPE、SZ_NO、CHK_TYPE、LOCK_TYPE、OTR_NO_TYPE、OTR_NO、REPORT_DD_FIELD）
- **SEARCH_INFO**: 7 个元素（[0]~[6]），筛选字段：YG_NO、OUT_DAY_TYPE
- **日期筛选**: `{ field: "YEARS", operator: "equal", operatorDisabled: true, value: "2025" }`
- **响应**: 标准 `REPORT__TAB` + `COLUMN_INFO.REPORT__TAB`

---

## 七、API3 — 21 个新报表（2026-08-12 新增）

### 7.1 概述

`标准报表制表API3.md` 包含 21 个新报表，全部使用 `getReport` 端点（无 getList 特殊情况）。新增以下分组：

| 分组 | 报表数 | 报表名称 |
|------|--------|---------|
| 财务管理 | 6 | 科目预算(ACCABGT/GetReport)、信用额度(Rptsarplist/GetReport)、报销(monbx/getReport)、员工借款(monjk/getReport)、应收票据(monCA/getReport)、应付票据(monCB/getReport) |
| 库存管理 | 5 | 过期货品预警(rptinvdo/getReport)、安全存量预警(rptinvdl/getReport)、负库存预警(rptinvswa/getReport)、库存调拨(invic/getReport)、库存调整(invij/getReport) |
| 采购与价格 | 5 | 送货单(scmdrpti/getReport)、采购交货状况(InvPoPcStatus/GetReport)、委外交货状况(InvTwPcStatus/GetReport)、采购政策价格(invhp/GetReport)、售价政策价格(invhs/GetReport) |
| 生产制造 | 2 | 领退补料(mrpag/getReport)、单位成本分析(mrpcf/getReport) |
| 人力资源 | 2 | 人事资料分析(rptwagyg/getReport, PGM: REP_WAGYG0)、员工明细(rptwagyg/getReport, PGM: REP_WAGYG) |
| 固定资产 | 1 | 财产目录(fixaa/getReport, PGM: FIXCE) |

### 7.2 新增请求模式

| 模式 | 配置字段 | 说明 |
|------|---------|------|
| showBody | `showBody: "T"` | SEARCH_INFO[1] 显示 body 字段（人事资料分析、员工借款） |
| 无分页 | `hasPagination: false` | SEARCH_INFO[0] 不生成 offset（信用额度查询表） |
| 预设日期操作符 | `dateOperator` | last_year/this_year/today/last_week/this_month/equal，客户端计算具体日期值 |
| 隐藏日期 UI | `hideDateUI: true` | SYS_DATE 报表不显示日期选择器（员工明细、采购/售价价格表） |
| 隐藏固定条件 | `searchInfoExtra: [...]` | fixCondition 后插入额外的 SEARCH_INFO 元素 |
| 文本包含 | `operator: "contain"` | 模糊文本搜索（送货单 TI_NO） |
| 非日期范围 | operator: "range" + fieldType 非 date | 非日期字段的范围筛选 [from, to]（库存调拨 IC_NO、库存调整 IJ_NO/PRD_NO/DEP） |
| checkUnder 非标准 | `checkUnder: "T"` on non-CUS/DEP | 科目代号 ACC_NO、帐册代号 BOOK_NO、资产类别 FX_KND |

### 7.3 端点大小写注意事项

API3 文档中端点路径大小写不统一，**全部通过 `apiPath` 精确指定**：

| 类型 | 示例 | 报表 |
|------|------|------|
| 全大写 | `ACCABGT/GetReport` | 科目预算 |
| 驼峰 | `Rptsarplist/GetReport`、`InvPoPcStatus/GetReport` | 信用额度、采购交货 |
| 全小写 | `monbx/getReport`、`rptinvdo/getReport` | 大部分报表 |

> ⚠️ 部署后如果报表调用不通，第一个怀疑就是端点大小写问题。

---

## 八、前端对接 Checklist

每次对接新报表时对照：

- [ ] 端点路径确认（`/invpo` vs `/invSO` 大小写！）
- [ ] PGM 确认
- [ ] 日期字段名确认（OS_DD / PS_DD / RP_DD）
- [ ] fixCondition 中额外字段确认（SA_BILLS / SUB_CUS / LINE / SHOW_LSIT...）
- [ ] 部门字段名确认（DEP / PO_DEP）
- [ ] displayFields 与 DISPLAY_FIELDS 一致
- [ ] SEARCH_INFO 数组顺序 = [0]~[9]，不可调换
- [ ] 空筛选条件 `"value": ""`
- [ ] 成功判断 `code === 0`
- [ ] 空结果处理（REPORT__TAB 为 `[]`，MRPPU 为 TRANS 为 `[]`）
- [ ] MRPPU 特殊处理：getList 端点、OTHERINFO、PAGE_INFO、TRANS 响应、扁平 COLUMN_INFO
- [ ] 端点大小写：全部使用小写（与 v1 实测一致，待 Postman 验证）
- [ ] API3 新字段：showBody / hasPagination / dateOperator / searchInfoExtra / hideDateUI
- [ ] API3 contain 操作符：文本包含搜索
- [ ] API3 非 date range：非日期字段范围筛选 [from, to]
- [ ] 长连接报表：fetch + ReadableStream 手动解析（EventSource 不支持 POST）
- [ ] 流式解析：按 `data:` 行 + 行缓冲（跨 chunk 断行）；消息 JSON 解析读 PERCENT/TITLE/ERR/DATA
- [ ] 进度条：消息内 PERCENT 字段实时更新（实测有 100.0 结束消息）
- [ ] BOOK_NO 空值拦截（实测空值 → HTTP 406）
- [ ] 长连接错误判别：res.ok + Content-Type（application/json = 错误 JSON，event-stream = 流）
- [ ] 长连接 AbortController 超时兜底
- [ ] 账簿清单：登录成功 + 会话恢复两处拉取 AccBook/GetList，不阻塞登录
- [ ] 账簿下拉：显示 BOOK_NO + NAME，>1 预选第一个
- [ ] 0 账簿：弹警告 + 禁用【查询】【转入】按钮，不调流；拉取失败重试一次，勿误报「未启用总账」
- [ ] REM_TYPE 摘要类型映射：1=期初余额 / 2=本期合计 / 3=本年合计（表格彩色 badge 展示 + 转入数据源存映射后文字）

---

## 九、长连接（SSE）流式报表 — API4（2026-08-18 新增）

### 9.1 概述

`标准报表制表API4.md`：**总分类账 - 查询制表**，系统第一个长连接报表。后续用户提到【长连接】即指此模式。

| 项 | 值 |
|----|-----|
| 端点 | `POST /accGeneralLedger/GetReportStream`。Postman 实测 URL 用 `/SUNFUSION/api/`（小写）；实测 `/API/`（大写）、`getReportStream`（全小写）同样 200 可用（IIS 大小写不敏感）。⚠️ **前端相对路径就是 `accGeneralLedger/GetReportStream`，不要再带 `api/` 前缀**——URL 里的 `api` 段就是 `/SUNFUSION/API` 本身，带前缀拼成 `/SUNFUSION/API/api/...` → 404（2026-08-18 浏览器实测踩坑，与 getReport 历史教训同类） |
| PGM | `ACCRPTGL`（⚠️ 实测该端点**不校验 PGM**，写错也正常返回） |
| 响应 | **SSE**：`Content-Type: text/event-stream; charset=utf-8`，每条消息 = 单行 `data: {JSON}` + 空行分隔，**按行解析** |
| 消息结构 | 每条消息固定 6 字段：`{ CODE, PERCENT, TITLE, ERR, DATA, IS_RES_ID }` |
| 进度 | `PERCENT` 是消息内字段（⚠️ 不是 `PERCENT:` 前缀行）：0.0 → 10.0 → 30.0 → 40.0 → 50.0 → 70.0 → 90.0(空) → 90.0(带 REPORT__TAB) → **100.0(结束)** |
| 数据 | `REPORT__TAB` 在第二个 90.0 消息的 `DATA` 里（含 PAGE_COUNT=1/PAGE_NUM=1）；100.0 消息的 `DATA` 带 PAGE_COUNT=0/PAGE_NUM=0 |

**实测消息序列**（2026-01 期间，共 9 条）：

| # | PERCENT | TITLE | DATA | IS_RES_ID |
|---|---------|-------|------|-----------|
| 1 | 0.0 | `CON_ID:SYNC_<guid>`（连接标识） | {} | true |
| 2 | 10.0 | `acc_general_ledger.perncent10`（i18n key，服务器端拼写如此） | {} | true |
| 3 | 30.0 | `acc_general_ledger.perncent30` | {} | true |
| 4 | 40.0 | `查询本期数据`（中文直文） | {} | false |
| 5 | 50.0 | `查询期初数据` | {} | false |
| 6 | 70.0 | `acc_general_ledger.perncent70` | {} | true |
| 7 | 90.0 | `acc_general_ledger.perncent90` | {} | true |
| 8 | 90.0 | `acc_general_ledger.perncent90` | **REPORT__TAB + PAGE_COUNT=1 + PAGE_NUM=1** | true |
| 9 | **100.0** | `acc_general_ledger.perncent100` | PAGE_COUNT=0 + PAGE_NUM=0 | true |

**字段语义（实测）**：
- `CODE`：全程 =1（含 100.0 完成消息）→ 语义未明，**前端不要依赖 CODE 判断成败**
- `ERR`：空串 = 正常；非空 = 错误信息（未实测到非空样本，前端见非空即提示）
- `TITLE`：混合 i18n key 与中文直文 → 可作进度阶段文字**原样显示**，不要翻译
- `IS_RES_ID`：true/false 混合，语义未明，前端不依赖
- `REM_TYPE`（数据行字段，摘要类型，用户 2026-08-18 确认语义）：**`"1"` = 期初余额，`"2"` = 本期合计，`"3"` = 本年合计**。前端表格与转入数据源均映射为该语义文字（三语），不显示原始数字；非 1/2/3 的未知值原样显示

### 9.2 请求体差异（vs 标准 getReport）

**SEARCH_INFO 仅 3 个元素，无 offset 分页元素**：

| 索引 | 内容 |
|------|------|
| [0] | `{ showBody: "T", showLadder: "F", displayFields: [...], sumFields: [] }` — 展示字段配置 |
| [1] | `{ fixCondition: {...} }` — 固定条件（**BOOK_NO 必填**，ACC_IPERIOD_B/E 会计期间起止等） |
| [2] | `{ orderBy: {...} }` — 排序（示例 SYS_DATE asc） |

**BOOK_NO 铁律**：账簿必须输入，否则不能搜寻结果。**实测**：BOOK_NO 为空 → HTTP **406 Not Acceptable** + 空 body（Content-Type 仍是 event-stream）。→ **前端必须校验非空，空值拦截不发请求**（406 只是服务端兜底，不能依赖它做 UX）。账簿清单来源：`AccBook/GetList`（见第十节，2026-08-18 实测）。

fixCondition 其他关键字段：`CUR_ID`（币别，空=综合本位币）、`ACC_IPERIOD_B/E`（YYYY-MM）、`START_DD`、`YEARS`、`IPERIOD`、`DATE_B/E`、`ACC_NO/ACC_NO_B/ACC_NO_E`（科目）、13 个 `CHK_*` 开关（均 "F"）、固定值字段（SHOW_BN_TYPE / ORDERBY_TYPE / AMTN_BAL_TYPE / CHK_ACCN_TYPE / TYPE_NO="01" / REL_CLS_B=1 / REL_CLS_E=10）。完整清单见 API4 原文档。

### 9.3 前端处理模式（后续所有【长连接】报表共用）

⚠️ **EventSource 不支持 POST** → 必须 `fetch` + `response.body.getReader()` 手动解析流。

**三步判别**（全部有实测依据）：

1. `res.ok === false` → HTTP 级错误（如 BOOK_NO 空 → 406）
2. `Content-Type` 含 `application/json` → 普通 JSON 错误（Token 无效实测返回 `{"code":20004,...}`，复用现有 20001/20004 认证拦截）
3. `Content-Type` 含 `text/event-stream` → 进入流解析

```javascript
// 长连接报表调用模式（2026-08-18 实测验证版）
async function fetchStreamReport(path, body, onProgress, onData) {
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, 120000); // 120s 超时兜底
  try {
    var res = await fetch(API_BASE + '/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TokenStore.get() },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status); // 406 = BOOK_NO 空 等
    var ctype = res.headers.get('content-type') || '';
    if (ctype.indexOf('application/json') !== -1) {
      var j = await res.json();
      if (j.code === 20001 || j.code === 20004) { Auth.onExpired(); return; }
      throw new Error(j.message || ('code ' + j.code));
    }
    // text/event-stream：每条消息 = 单行 data: {JSON} + 空行分隔
    var reader = res.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop(); // 最后一行可能不完整，留给下一个 chunk
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('data: ') !== 0) continue; // 空行分隔符直接跳过
        var msg;
        try { msg = JSON.parse(line.slice(6)); } catch (e) { continue; } // 非 JSON 行跳过
        if (msg.ERR) throw new Error(msg.ERR);
        onProgress(msg.PERCENT || 0, msg.TITLE || ''); // 进度条 + 阶段文字（TITLE 原样显示）
        if (msg.DATA && msg.DATA.REPORT__TAB) onData(msg.DATA);
      }
    }
  } finally {
    clearTimeout(timer);
  }
}
```

**五个要点**：
1. **行缓冲**：chunk 边界可能切断一行，必须保留不完整行到下一个 chunk
2. **进度来自消息内 PERCENT 字段**（实测不是 `PERCENT:` 前缀行）：实时更新进度条；实测存在 100.0 结束消息，流结束（done）兜底置 100%
3. **Content-Type 判别**：`application/json` = 错误 JSON（code 20004 等），`text/event-stream` = 正常流 —— 不要试图用 JSON.parse 流的第一行来猜
4. **数据到达时机不可预知**：UI 必须事件驱动（onProgress/onData 回调），不能等一个返回值
5. **超时兜底**：流式请求挂起不会自动结束（无 Authorization 实测 HTTP 200 + 空 body 永久挂起），AbortController 必须有

### 9.4 实测结果（2026-08-18 curl 实测）

| # | 验证项 | 结果 |
|---|--------|------|
| 1 | 原始流格式 | ✅ SSE `text/event-stream`，`data: {JSON}` 单行 + 空行分隔，本次 9 条消息 |
| 2 | 流结束标记 | ✅ 有 `PERCENT: 100.0` 消息（DATA 带 PAGE_COUNT=0/PAGE_NUM=0），之后流关闭 |
| 3 | 多页行为 | ⚠️ 实测 PAGE_COUNT=1 单条 REPORT__TAB；该端点无分页入参，大结果集是否拆多条消息未实测 |
| 4 | BOOK_NO 空 | ✅ HTTP **406** + 空 body |
| 5 | PGM 写错 | ✅ **不校验**，照样正常返回（HTTP 200，与正常响应完全一致） |
| 6 | Token 无效 | ✅ HTTP 200 + `application/json` `{"code":20004,...}`（与 getReport 一致） |
| 7 | 无 Authorization | ✅ HTTP 200 + 空 body（流挂起，靠 120s 超时兜底） |
| 8 | 端点大小写 | ✅ `/api/`、`/API/`、`GetReportStream`、`getReportStream` 四组合全 200 |
| 9 | 账簿清单来源 | ✅ `AccBook/GetList`（见第十节，实测本账套 1 条 BOOK_NO=00000000） |

**Authorization 前缀**：带不带 `Bearer ` 都通（实测）→ 前端沿用现有 Bearer 格式即可。

---

## 十、账簿列表查询 API — AccBook/GetList（2026-08-18 实测）

### 10.1 概述

用途：**登录一开始就拉取账簿清单**，供【总分类账】筛选面板的账簿下拉框使用（用户 2026-08-18 指定）。

| 项 | 值 |
|----|-----|
| 端点 | `POST /AccBook/GetList`（实测 `/api/`、`/API/`、`GetList`、`getList` 变体全 200；Authorization 带不带 `Bearer ` 都通） |
| 成功判断 | 标准信封 `code === 0` |
| 响应数据路径 | `data.ACC_BOOK_BS`（⚠️ 表名**不是** REPORT__TAB）+ `data.COLUMN_INFO`（实测 34 字段）+ `data.PAGE_INFO` + `HEADER_TABLE: "ACC_BOOK_BS"` |
| 本机账套实测 | 1 条账簿：`BOOK_NO=00000000`、`NAME=First Department`、`BOOK_XZ=1`；`PAGE_INFO.TOTAL=1` |

### 10.2 请求体

```json
{
  "DEP": "00000000",
  "SEARCH_INFO": [
    { "showBody": "F", "showLadder": null, "showSumField": null,
      "displayFields": ["BOOK_NO","NAME","BOOK_XZ","ACC_MD","CUR_ID","CUR_NAME","TYPE_NO","TYPE_NAME","DEP","DEP_NAME","START_DD","STOP_DD","YEARS","IPERIOD","USR_NAME","SYS_DATE","MODIFY_MAN_NAME","MODIFY_DD"],
      "sumFields": [] },
    { "fixCondition": {} },
    { "field": "BOOK_NO", "operator": "in", "fieldType": "string", "fieldDisabled": false, "value": "" },
    { "field": "NAME", "operator": "contain", "fieldType": "string", "fieldDisabled": false, "value": "" }
  ],
  "PAGE_INFO": { "PAGE_SIZE": 200, "CURRENT_PAGE": 1 }
}
```

> CURRENT_PAGE 从 1 开始（与 MRPPU 一致）。

### 10.3 前端设计规则（用户指定，实施轮照此执行）

1. **拉取时机**：登录成功（app.js:501 附近）与会话恢复（app.js:647 附近）两处，登录后异步拉取，**不阻塞登录**
2. **存储**：新建 `BookStore`（IIFE，仿 datasource-store.js 模式，LS_KEY `sunlike_books`，内存缓存 + localStorage，按公司隔离）
3. **账簿下拉**：总分类账筛选面板显示「BOOK_NO + NAME」；LIST > 1 预选第一个（1 条自然唯一）
4. **0 账簿拦截**：打开总分类账时弹警告「你的账套没有启用总账，所以你不能操作这个查询」→ **警告后该报表的【查询】【转入】按钮置禁用**，不调用 GetReportStream、不切换报表；切换到其他报表时按钮恢复可用
5. **拉取失败 ≠ 0 账簿**：打开总分类账时清单未成功加载 → 重试一次，仍失败 toast 报错；只有 `code===0` 且列表为空才算「未启用总账」
6. **i18n**：新增 key 需补 zh-tw/en 块（菜单「总分类账」/ 警告文案 / 「账簿」label）；审计工具 `.claude/extract-i18n-keys.js`
7. **菜单分组**（用户 2026-08-18 指定）：侧边栏**新增独立分组【总账报表】排在最上面**（report-menu.js `MENU_GROUPS` 首位插入），总分类账挂该分组下（config `group: '总账报表'`）
8. **登出重置**（2026-08-18 浏览器实测 Bug 补则）：退出登录（含 auth:expired）→ `BookStore.reset()` 作废内存缓存与进行中拉取（世代计数防旧账套数据串入新登录）+ 账簿下拉回「加载中...」占位 + 解除按钮阻断；**登录成功改走 `openReport(currentReport)` 全链路**（账簿下拉重填 / 筛选面板重置 / 表头重渲染），不再裸 doQuery——否则重登后下拉仍挂上一次登录的账簿

**实施锚点**（代码勘察结论）：

- 筛选控件是 HTML 硬编码（index.html:142-177 与 ui-template.html:205-253 必须同步）→ 动态下拉需新增 `select#filterBookNo` form-group；reports.js `updateFilterPanel` 的 `allGroups`/`layoutMap` 注册新布局、`readFilters` 读值、config 用 `filterId: 'filterBookNo'`（⚠️ `fieldToKey` 里 BOOK_NO 已映射到 filterMrpNo，必须用 filterId 避开）；参考 `accabgt` 配置（reports.js:316-332）
- ⚠️ `Dialog` 目前只有 `confirm`/`prompt`，**没有 `alert`**（dialog.js:141-144）→ 实施时仿 confirm 模式新增 `Dialog.alert(message) → Promise<void>`
- 拦截点：`openReport`（app.js:251-277，菜单点击唯一收口，无现成 before-open 钩子）+ `doQuery` 顶部兜底；查询/转入按钮禁用即在此处理（转入按钮 handler 在 app.js initTransferBtn）
