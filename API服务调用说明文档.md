# API 服务调用说明文档

> Sunlike ERP API 对接参考
> 最后更新：2026-08-10（PoC 实测验证）

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

### 请求结构（所有 6 个报表通用）

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

## 五、6 个报表差异速查

| 报表 | 端点 | PGM | 日期字段 | 特殊 fixCondition | 部门字段 |
|------|------|-----|---------|-------------------|---------|
| 采购 | `/invpo` | `REP_POLIST` | `OS_DD` | 只有 REPORT_DD_FIELD | `PO_DEP` |
| 进货 | `/invpc` | `REP_PCLIST` | `PS_DD` | + SA_BILLS="PC;PB;PD" | `DEP` |
| 受订 | `/invso` | `REP_SOLIST` | `OS_DD` | + SUB_CUS | `DEP` |
| 销货 | `/invSa` | `REP_SALIST` | `PS_DD` | + SA_BILLS + SUB_CUS | `DEP` |
| 收款 | `/monAA` | `REP_RTLIST` | `RP_DD` | + LINE + SHOW_LSIT×3 + INCLUDESON | `DEP` |
| 付款 | `/monBA` | `REP_PTLIST` | `RP_DD` | + LINE + SHOW_LSIT×3 + INCLUDESON | `DEP` |

> ⚠️ 端点大小写：Postman 实测 `/invso` 为全小写。其余报表端点大小写以实际 Postman 验证为准。

---

## 六、前端对接 Checklist

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
- [ ] 空结果处理（REPORT__TAB 为 `[]`）
