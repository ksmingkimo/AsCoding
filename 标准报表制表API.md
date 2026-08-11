# 采购报表 - 查询制表

## 接口信息

- **接口名称**：采购报表 - 查询制表
- **接口地址**：`POST /api/invpo/getReport`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                       |
| :------------- | :------------ | :--- | :--------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_POLIST"`                       |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 分页偏移量配置

| 字段   | 类型          | 说明                                                         |
| :----- | :------------ | :----------------------------------------------------------- |
| offset | array[number] | 第一个元素为起始行（从0开始），第二个为截止行（此处 `[0, 5000]` 表示取前5001条） |
| temp   | boolean       | 是否为临时查询（传 `true` 表示不持久化）                     |

#### [1] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否，`"T"` 为是                       |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"OS_DD"`（订单日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`OS_DD`（采购日期）    |
| operator      | string        | 操作符：`range`（区间查询）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| dateOperator  | string        | 日期快捷操作：`last_year`（去年）  |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [8] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                                 |
| :--- | :----------- | :---------------- | :--------------------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 厂商代号（多选/模糊），`checkUnder="T"` 表示包含下级 |
| [5]  | `PRD_NO`     | `in`              | 货品代号（多选/模糊）                                |
| [6]  | `PO_DEP`     | `in`              | 采购部门（多选）                                     |
| [7]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属            |
| [8]  | `CHK_STATUS` | `equal`           | 审核状态（精确匹配，如 `'Y'`/`'N'`）                 |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按采购日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_POLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO",
                "CUS_NAME",
                "OS_DD",
                "OS_NO",
                "PRD_NO",
                "PRD_NAME",
                "WH_NAME",
                "UNIT",
                "QTY",
                "UP",
                "DIS_CNT",
                "AMT_DIS_CNT",
                "AMTN",
                "AMTN_NET",
                "TAX",
                "AMTN_WITHTAX",
                "EST_DD",
                "QTY_PRE",
                "QTY_PRE_UNSH",
                "QTY_PS",
                "QTY_PS_UNSH",
                "QTY_UNPS",
                "REM",
                "SAL_NO",
                "SAL_NAME"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "OS_DD"
            }
        },
        {
            "field": "OS_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "last_year",
            "value": [
                "2025-01-01",
                "2025-12-31"
            ]
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "PO_DEP",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "WH",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "CHK_STATUS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "OS_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,OS_DD,OS_NO,PRD_NO,PRD_NAME,WH_NAME,UNIT,QTY,UP,DIS_CNT,AMT_DIS_CNT,AMTN,AMTN_NET,TAX,AMTN_WITHTAX,EST_DD,QTY_PRE,QTY_PRE_UNSH,QTY_PS,QTY_PS_UNSH,QTY_UNPS,REM,SAL_NO,SAL_NAME"
}
```



------

## 成功响应 (200 OK)

json

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "REPORT__TAB": [
            {
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "OS_DD": "2025-02-27T00:00:00",
                "OS_NO": "POYMDD0008",
                "PRD_NO": "1000140001002",
                "PRD_NAME": "WMS",
                "UNIT": "套",
                "QTY": 30,
                "UP": 2.5,
                "WH_NAME": "成品仓",
                "AMT": 0,
                "AMT_NET": 0,
                "AMT_TAX": 0,
                "AMT_WITHTAX": 0,
                "AMTN": 75,
                "AMTN_NET": 66.37,
                "TAX": 8.63,
                "AMTN_WITHTAX": 75,
                "EST_DD": "2025-02-27T00:00:00",
                "OS_ID": "PO",
                "WH": "01",
                "SAL_NO": "",
                "PRD_MARK": "",
                "QTY_PRE": 30,
                "QTY_UNPS": 0,
                "PO_DEP": "00000000",
                "TAX_ID": "2",
                "TAX_RTO": 13,
                "CHK_STATUS": "Y",
                "AMT_DIS_CNT": 0,
                "CUR_ID": "",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                {
                    "NAME": "OS_DD",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "ITM",
                    "TYPE": "Int32"
                },
                {
                    "NAME": "QTY",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "UP",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "DIS_CNT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMT_NET",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMT_TAX",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMT_WITHTAX",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMTN",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMTN_NET",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "TAX",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMTN_WITHTAX",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "EST_DD",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "QTY_PRE",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_PRE_UNSH",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_PS",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_PS_UNSH",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_UNPS",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_SL",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "EXC_RTO",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "TAX_RTO",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "CHK_DD",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "SYS_DATE",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "DIS_CNT_M",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "CST_STD_UNIT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "CST_STD",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_PO",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_PO_UNSH",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "PAK_EXC",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "PAK_NW",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "PAK_GW",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "PAK_MEAST",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY1",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "UP_QTY1",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY1_SPLIT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY2_SPLIT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY3_SPLIT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_JD",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "DATE_QR",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "MODIFY_DD",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "UP_TYDJ",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMTN_TYDJ",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "SUP_REP_DATE1",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "SUP_REP_DATE2",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "SUP_REP_DATE3",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "QTY_JH",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "RATE_JH",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_DELAY",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMTN_NET_ZDZK",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "TAX_ZDZK",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMT_ZDZK",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "AMT_DIS_CNT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "SCM_DD",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "UP_EXPECT",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "UNCFM_DATE",
                    "TYPE": "DateTime"
                },
                {
                    "NAME": "SUP_REP_QTY1",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "SUP_REP_QTY2",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "SUP_REP_QTY3",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "RATE_PC_UNPS",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "RATE_PC_OVER",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "RATE_RK",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "RATE_CST_PO",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_RK",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_RK_UNSH",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_YS",
                    "TYPE": "Decimal"
                },
                {
                    "NAME": "QTY_YS_UNSH",
                    "TYPE": "Decimal"
                }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": [
                {
                    "NAME": "QTY",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "UP",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMT",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMT_NET",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMT_TAX",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMT_WITHTAX",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMTN",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMTN_NET",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "TAX",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "AMTN_WITHTAX",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "QTY_PS",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "QTY1_SPLIT",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "QTY2_SPLIT",
                    "SEARCHVISIBLE": "F"
                },
                {
                    "NAME": "QTY3_SPLIT",
                    "SEARCHVISIBLE": "F"
                }
            ]
        },
        "BASIC_DATA_TABLE": [
            "MF_POS",
            "TF_POS",
            "MY_WH",
            "CUST",
            "DEPT",
            "PRDT",
            "AREA",
            "INDX",
            "MF_YG",
            "CASN",
            "MARK"
        ]
    }
}
```

# 进货报表 - 查询制表

## 接口信息

- **接口名称**：进货报表 - 查询制表
- **接口地址**：`POST /api/invpc/getReport`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                       |
| :------------- | :------------ | :--- | :--------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_PCLIST"`                       |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 分页偏移量配置

| 字段   | 类型          | 说明                                                         |
| :----- | :------------ | :----------------------------------------------------------- |
| offset | array[number] | 第一个元素为起始行（从0开始），第二个为截止行（此处 `[0, 5000]` 表示取前5001条） |
| temp   | boolean       | 是否为临时查询（传 `true` 表示不持久化）                     |

#### [1] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否，`"T"` 为是                       |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                         |
| :----------------------------- | :----- | :----------------------------------------------------------- |
| `fixCondition.SA_BILLS`        | string | 进货单据类型，固定值 `"PC;PB;PD"`（PC=进货单，PB=进货退回，PD=进货折让） |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"PS_DD"`（进货日期）           |
| `fixCondition.SUB_CUS`         | string | 子厂商过滤（传空表示全部）                                   |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                            |
| :------------ | :------------ | :------------------------------ |
| field         | string        | 筛选字段名：`PS_DD`（进货日期） |
| operator      | string        | 操作符：`this_year`（今年）     |
| fieldType     | string        | 字段类型：`date`                |
| need          | boolean       | 是否必须条件：`true`（必填）    |
| fieldDisabled | boolean       | 前端是否禁用：`false`（可编辑） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD       |

#### [4] 至 [8] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                                 |
| :--- | :----------- | :---------------- | :--------------------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 厂商代号（多选/模糊），`checkUnder="T"` 表示包含下级 |
| [5]  | `PRD_NO`     | `in`              | 货品代号（多选/模糊）                                |
| [6]  | `DEP`        | `in`              | 部门代号（多选），`checkUnder="T"` 含所属            |
| [7]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属            |
| [8]  | `CHK_STATUS` | `equal`           | 审核状态（精确匹配，如 `'Y'`/`'N'`）                 |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按进货日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_PCLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO",
                "CUS_NAME",
                "PS_DD",
                "PS_NO",
                "PRD_NO",
                "PRD_NAME",
                "PRD_MARK",
                "A001",
                "WH_NAME",
                "UNIT",
                "UP",
                "QTY",
                "DIS_CNT",
                "AMT_DIS_CNT",
                "AMTN",
                "AMTN_NET",
                "TAX",
                "REM_T"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "SA_BILLS": "PC;PB;PD",
                "REPORT_DD_FIELD": "PS_DD",
                "SUB_CUS": ""
            }
        },
        {
            "field": "PS_DD",
            "operator": "this_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": false,
            "value": ["2026-01-01", "2026-12-31"]
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "DEP",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "WH",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "CHK_STATUS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "PS_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,PS_DD,PS_NO,PRD_NO,PRD_NAME,PRD_MARK,A001,WH_NAME,UNIT,UP,QTY,DIS_CNT,AMT_DIS_CNT,AMTN,AMTN_NET,TAX,REM_T"
}
```



------

## 成功响应 (200 OK)

json

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "REPORT__TAB": [
            {
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "PS_DD": "2026-01-06T00:00:00",
                "PS_ID": "进货单",
                "PS_NO": "PCYMDD0021",
                "PRD_NAME": "香辣鸡腿堡",
                "PRD_NO": "11",
                "UNIT": "KG",
                "UP": 10,
                "QTY": 10,
                "AMT": 0,
                "AMT_NET": 0,
                "AMT_TAX": 0,
                "AMT_WITHTAX": 0,
                "AMTN": 100,
                "AMTN_NET": 88.5,
                "TAX": 11.5,
                "AMTN_WITHTAX": 100,
                "CUR_ID": "",
                "CHK_STATUS": "N",
                "PRD_MARK": "",
                "DEP": "a",
                "WH": "2077",
                "WH_NAME": "中情局第一仓库",
                "TAX_RTO": 13,
                "TAX_ID": "应税内含",
                "A001": "",
                "PS_ID_H": "PC"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "PS_DD", "TYPE": "DateTime" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "TAX_RTO", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "GROUP_CY_ITM", "TYPE": "Int32" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": [
                { "NAME": "UP", "SEARCHVISIBLE": "F" },
                { "NAME": "QTY", "SEARCHVISIBLE": "F" },
                { "NAME": "AMTN", "SEARCHVISIBLE": "F" },
                { "NAME": "A001", "SEARCHVISIBLE": "F" },
                { "NAME": "A001_DSC", "SEARCHVISIBLE": "F" }
            ]
        },
        "BASIC_DATA_TABLE": [
            "MF_PSS",
            "TF_PSS",
            "CUST",
            "MY_WH",
            "PRDT",
            "CASN",
            "DEPT",
            "MF_YG",
            "AREA",
            "INDX",
            "MARK"
        ]
    }
}
```

# 受订报表 - 查询制表

## 接口信息

- **接口名称**：受订报表 - 查询制表
- **接口地址**：`POST /api/invSO/getReport`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                       |
| :------------- | :------------ | :--- | :--------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_SOLIST"`                       |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 分页偏移量配置

| 字段   | 类型          | 说明                                                         |
| :----- | :------------ | :----------------------------------------------------------- |
| offset | array[number] | 第一个元素为起始行（从0开始），第二个为截止行（此处 `[0, 5000]` 表示取前5001条） |
| temp   | boolean       | 是否为临时查询（传 `true` 表示不持久化）                     |

#### [1] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否，`"T"` 为是                       |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"OS_DD"`（受订日期） |
| `fixCondition.SUB_CUS`         | string | 子客户过滤（传空表示全部）                         |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`OS_DD`（受订日期）    |
| operator      | string        | 操作符：`this_year`（今年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [8] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                                 |
| :--- | :----------- | :---------------- | :--------------------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 客户代号（多选/模糊），`checkUnder="T"` 表示包含下级 |
| [5]  | `PRD_NO`     | `in`              | 货品代号（多选/模糊）                                |
| [6]  | `DEP`        | `in`              | 部门（多选），`checkUnder="T"` 含所属                |
| [7]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属            |
| [8]  | `CHK_STATUS` | `equal`           | 审核状态（精确匹配，如 `'Y'`/`'N'`）                 |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按受订日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_SOLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO",
                "CUS_NAME",
                "OS_DD",
                "OS_NO",
                "PRD_NO",
                "PRD_NAME",
                "PRD_MARK",
                "A001",
                "WH_NAME",
                "UNIT",
                "UP",
                "QTY",
                "DIS_CNT",
                "AMT_DIS_CNT",
                "AMTN",
                "AMTN_NET",
                "TAX",
                "AMTN_WITHTAX",
                "QTY_PS",
                "QTY_PS_UNSH",
                "QTY_JH",
                "QTY_UNPS",
                "QTY_PRE",
                "QTY_PRE_UNSH",
                "QTY_RK",
                "QTY_RK_UNSH",
                "EST_DD",
                "REM_B"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "OS_DD",
                "SUB_CUS": ""
            }
        },
        {
            "field": "OS_DD",
            "operator": "this_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-01-01", "2026-12-31"]
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "DEP",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "WH",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "CHK_STATUS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "OS_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,OS_DD,OS_NO,PRD_NO,PRD_NAME,PRD_MARK,A001,WH_NAME,UNIT,UP,QTY,DIS_CNT,AMT_DIS_CNT,AMTN,AMTN_NET,TAX,AMTN_WITHTAX,QTY_PS,QTY_PS_UNSH,QTY_JH,QTY_UNPS,QTY_PRE,QTY_PRE_UNSH,QTY_RK,QTY_RK_UNSH,EST_DD,REM_B"
}
```



------

## 成功响应 (200 OK)

json

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "REPORT__TAB": [
            {
                "CUS_NO": "05",
                "CUS_NAME": "肯德基",
                "OS_ID": "SO",
                "OS_NO": "SO26070001",
                "PRD_NAME": "Sunlike",
                "PRD_NO": "1000130001001",
                "UNIT": "套",
                "UP": 300,
                "QTY": 1,
                "AMT": 0,
                "AMT_NET": 0,
                "AMT_TAX": 0,
                "AMT_WITHTAX": 0,
                "AMTN": 300,
                "AMTN_NET": 265.49,
                "TAX": 34.51,
                "AMTN_WITHTAX": 300,
                "EST_DD": "2027-07-30T00:00:00",
                "PRD_MARK": "",
                "DEP": "01",
                "WH": "01",
                "WH_NAME": "成品仓",
                "CHK_STATUS": "Y",
                "TAX_ID": "2",
                "QTY_UNPS": 1,
                "OS_DD": "2026-07-29T00:00:00",
                "TAX_RTO": 13,
                "DIS_CNT": 0,
                "CUR_ID": "",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "TAX_RTO", "TYPE": "Decimal" },
                { "NAME": "OS_DD", "TYPE": "DateTime" },
                { "NAME": "EST_DD", "TYPE": "DateTime" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": [
                { "NAME": "UP", "SEARCHVISIBLE": "F" },
                { "NAME": "QTY", "SEARCHVISIBLE": "F" },
                { "NAME": "AMTN", "SEARCHVISIBLE": "F" },
                { "NAME": "QTY_PS", "SEARCHVISIBLE": "F" },
                { "NAME": "QTY_PRE", "SEARCHVISIBLE": "F" }
            ]
        },
        "BASIC_DATA_TABLE": [
            "MF_POS",
            "TF_POS",
            "CUST",
            "PRDT",
            "INDX",
            "MF_YG",
            "DEPT",
            "AREA",
            "MY_WH",
            "CASN",
            "MARK"
        ]
    }
}
```

# 销货报表 - 查询制表

## 接口信息

- **接口名称**：销货报表 - 查询制表
- **接口地址**：`POST /api/invSa/getReport`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                       |
| :------------- | :------------ | :--- | :--------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_SALIST"`                       |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 分页偏移量配置

| 字段   | 类型          | 说明                                                         |
| :----- | :------------ | :----------------------------------------------------------- |
| offset | array[number] | 第一个元素为起始行（从0开始），第二个为截止行（此处 `[0, 5000]` 表示取前5001条） |
| temp   | boolean       | 是否为临时查询（传 `true` 表示不持久化）                     |

#### [1] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否，`"T"` 为是                       |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                            | 类型   | 说明                                                         |
| :------------------------------ | :----- | :----------------------------------------------------------- |
| `fixCondition.SA_BILLS`         | string | 销货单据类型，固定值 `"SA;SB;SD"`（SA=销货，SB=销退，SD=销货折让） |
| `fixCondition.REPORT_DD_FIELD`  | string | 报表日期字段标识，固定取值为 `"PS_DD"`（销货日期）           |
| `fixCondition.SEND_GROUP_FIELD` | string | 发送分组字段（当前为空，暂未使用）                           |
| `fixCondition.SUB_CUS`          | string | 子客户过滤（传空表示全部）                                   |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`PS_DD`（销货日期）    |
| operator      | string        | 操作符：`this_season`（本季）      |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [8] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                                 |
| :--- | :----------- | :---------------- | :--------------------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 客户代号（多选/模糊），`checkUnder="T"` 表示包含下级 |
| [5]  | `PRD_NO`     | `in`              | 货品代号（多选/模糊）                                |
| [6]  | `DEP`        | `in`              | 部门（多选），`checkUnder="T"` 含所属                |
| [7]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属            |
| [8]  | `CHK_STATUS` | `equal`           | 审核状态（精确匹配，如 `'Y'`/`'N'`）                 |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按销货日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_SALIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO",
                "CUS_NAME",
                "PS_DD",
                "PS_NO",
                "PRD_NO",
                "PRD_NAME",
                "A001",
                "PRD_MARK",
                "WH_NAME",
                "UNIT",
                "UP",
                "QTY",
                "DIS_CNT",
                "AMT_DIS_CNT",
                "AMTN",
                "AMTN_NET",
                "TAX",
                "AMTN_WITHTAX",
                "REM_T",
                "SAL_NO"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "SA_BILLS": "SA;SB;SD",
                "REPORT_DD_FIELD": "PS_DD",
                "SEND_GROUP_FIELD": "",
                "SUB_CUS": ""
            }
        },
        {
            "field": "PS_DD",
            "operator": "this_season",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-07-01", "2026-09-30"]
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "DEP",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "WH",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "CHK_STATUS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "PS_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,PS_DD,PS_NO,PRD_NO,PRD_NAME,A001,PRD_MARK,WH_NAME,UNIT,UP,QTY,DIS_CNT,AMT_DIS_CNT,AMTN,AMTN_NET,TAX,AMTN_WITHTAX,REM_T,SAL_NO"
}
```



------

## 成功响应 (200 OK)

json

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "REPORT__TAB": [
            {
                "CUS_NO": "05",
                "CUS_NAME": "肯德基",
                "PS_DD": "2026-07-02T00:00:00",
                "PS_ID_H": "SA",
                "PS_NO": "SAYMDD0087",
                "PRD_NAME": "米奇妙妙屋",
                "PRD_NO": "01",
                "UNIT": "个",
                "UP": 0,
                "QTY": 10,
                "AMT": 0,
                "AMT_NET": 0,
                "AMT_TAX": 0,
                "AMT_WITHTAX": 0,
                "AMTN": 0,
                "AMTN_NET": 0,
                "TAX": 0,
                "AMTN_WITHTAX": 0,
                "DIS_CNT": 0,
                "CUR_ID": "",
                "CSTN_SAL": 3227.1053,
                "CHK_STATUS": "N",
                "PRD_MARK": "",
                "SAL_NO": "",
                "DEP": "02",
                "WH": "02",
                "WH_NAME": "仓库02",
                "TAX_RTO": 13,
                "CUS_ARE": "002-01",
                "SYS_DATE": "2026-07-27T17:20:53",
                "TAX_ID": "应税内含",
                "ITM": 1,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "PS_DD", "TYPE": "DateTime" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "CSTN_SAL", "TYPE": "Decimal" },
                { "NAME": "TAX_RTO", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": [
                { "NAME": "UP", "SEARCHVISIBLE": "F" },
                { "NAME": "QTY", "SEARCHVISIBLE": "F" },
                { "NAME": "AMTN", "SEARCHVISIBLE": "F" }
            ]
        },
        "BASIC_DATA_TABLE": [
            "CUST",
            "CASN",
            "MF_YG",
            "DEPT",
            "PRDT",
            "MY_WH",
            "AREA",
            "INDX",
            "MARK"
        ]
    }
}
```

# 收款明细表 - 查询制表

## 接口信息

- **接口名称**：收款明细表 - 查询制表
- **接口地址**：`POST /api/monAA/getReport`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                       |
| :------------- | :------------ | :--- | :--------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_RTLIST"`                       |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 分页偏移量配置

| 字段   | 类型          | 说明                                                         |
| :----- | :------------ | :----------------------------------------------------------- |
| offset | array[number] | 第一个元素为起始行（从0开始），第二个为截止行（此处 `[0, 5000]` 表示取前5001条） |
| temp   | boolean       | 是否为临时查询（传 `true` 表示不持久化）                     |

#### [1] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否，`"T"` 为是                       |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                             | 类型   | 说明                                               |
| :------------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.LINE`              | string | 行类型过滤（当前为空）                             |
| `fixCondition.REPORT_DD_FIELD`   | string | 报表日期字段标识，固定取值为 `"RP_DD"`（单据日期） |
| `fixCondition.SHOW_LSIT`         | string | 固定值 `"1"`                                       |
| `fixCondition.INCLUDESON`        | string | `"F"` 为否                                         |
| `fixCondition.SHOW_LSIT_TF_MON3` | string | 固定值 `"1"`                                       |
| `fixCondition.SHOW_LSIT_TF_MON4` | string | 固定值 `"1"`                                       |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`RP_DD`（单据日期）    |
| operator      | string        | 操作符：`last_year`（去年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [7] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                                 |
| :--- | :----------- | :---------------- | :--------------------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 客户代号（多选/模糊），`checkUnder="T"` 表示包含下级 |
| [5]  | `DEP`        | `in`              | 部门（多选），`checkUnder="T"` 含所属                |
| [6]  | `YW_TYPE`    | `in`              | 业务类型（多选）                                     |
| [7]  | `KB`         | `in`              | 收款方式（多选）                                     |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [8] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_RTLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO",
                "CUS_NAME",
                "RP_DD",
                "RP_NO",
                "YW_TYPE",
                "KB",
                "AMTN_BC",
                "AMTN_BB",
                "AMTN_CHK",
                "AMTN_OTHER",
                "AMTN_IRP",
                "AMTN_ARP",
                "AMTN_ZRP",
                "AMTN",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "LINE": "",
                "REPORT_DD_FIELD": "RP_DD",
                "SHOW_LSIT": "1",
                "INCLUDESON": "F",
                "SHOW_LSIT_TF_MON3": "1",
                "SHOW_LSIT_TF_MON4": "1"
            }
        },
        {
            "field": "RP_DD",
            "operator": "last_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2025-01-01", "2025-12-31"]
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "DEP",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "YW_TYPE",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "KB",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "RP_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,RP_DD,RP_NO,YW_TYPE,KB,AMTN_BC,AMTN_BB,AMTN_CHK,AMTN_OTHER,AMTN_IRP,AMTN_ARP,AMTN_ZRP,AMTN,REM"
}
```



------

## 成功响应 (200 OK)

json

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "REPORT__TAB": [
            {
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "RP_DD": "2025-01-06T00:00:00",
                "RP_NO_ID": "RT",
                "RP_NO": "RTYMDD0003",
                "KB": "1",
                "YW_TYPE": "11",
                "DEP": "00000000",
                "REM": "",
                "AMTN_BC": 10,
                "AMTN": 10
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "RP_DD", "TYPE": "DateTime" },
                { "NAME": "AMTN_BC", "TYPE": "Decimal" },
                { "NAME": "AMTN_BB", "TYPE": "Decimal" },
                { "NAME": "AMTN_CHK", "TYPE": "Decimal" },
                { "NAME": "AMTN_OTHER", "TYPE": "Decimal" },
                { "NAME": "AMTN_IRP", "TYPE": "Decimal" },
                { "NAME": "AMTN_ARP", "TYPE": "Decimal" },
                { "NAME": "AMTN_ZRP", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "EXC_RTO", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "CUST",
            "AREA",
            "CASN",
            "MF_YG",
            "DEPT"
        ]
    }
}
```

# 付款明细表 - 查询制表

## 接口信息

- **接口名称**：付款明细表 - 查询制表
- **接口地址**：`POST /api/monBA/getReport`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                       |
| :------------- | :------------ | :--- | :--------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_PTLIST"`                       |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 分页偏移量配置

| 字段   | 类型          | 说明                                                         |
| :----- | :------------ | :----------------------------------------------------------- |
| offset | array[number] | 第一个元素为起始行（从0开始），第二个为截止行（此处 `[0, 5000]` 表示取前5001条） |
| temp   | boolean       | 是否为临时查询（传 `true` 表示不持久化）                     |

#### [1] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否，`"T"` 为是                       |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                             | 类型   | 说明                                               |
| :------------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.LINE`              | string | 行类型过滤（当前为空）                             |
| `fixCondition.SHOW_LSIT`         | string | 显示列表标识，固定值 `"1"`                         |
| `fixCondition.INCLUDESON`        | string | `"F"` 为否                                         |
| `fixCondition.SHOW_LSIT_TF_MON3` | string | 固定值 `"1"`                                       |
| `fixCondition.SHOW_LSIT_TF_MON4` | string | 固定值 `"1"`                                       |
| `fixCondition.REPORT_DD_FIELD`   | string | 报表日期字段标识，固定取值为 `"RP_DD"`（单据日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| field         | string        | 筛选字段名：`RP_DD`（单据日期）                              |
| operator      | string        | 操作符：`range`（区间查询）                                  |
| fieldType     | string        | 字段类型：`date`                                             |
| need          | boolean       | 是否必须条件：`true`（必填）                                 |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改）                           |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月）                           |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD（起始日期为 `null` 表示无起始限制） |

#### [4] 至 [7] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                                 |
| :--- | :----------- | :---------------- | :--------------------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 客户代号（多选/模糊），`checkUnder="T"` 表示包含下级 |
| [5]  | `DEP`        | `in`              | 部门（多选），`checkUnder="T"` 含所属                |
| [6]  | `YW_TYPE`    | `in`              | 业务类型（多选）                                     |
| [7]  | `KB`         | `in`              | 付款方式（多选）                                     |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [8] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_PTLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NO",
                "CUS_NAME",
                "RP_DD",
                "RP_NO",
                "YW_TYPE",
                "KB",
                "AMTN_BC",
                "AMTN_BB",
                "AMTN_CHK",
                "AMTN_OTHER",
                "AMTN_IRP",
                "AMTN_ARP",
                "AMTN_ZRP",
                "AMTN",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "LINE": "",
                "SHOW_LSIT": "1",
                "INCLUDESON": "F",
                "SHOW_LSIT_TF_MON3": "1",
                "SHOW_LSIT_TF_MON4": "1",
                "REPORT_DD_FIELD": "RP_DD"
            }
        },
        {
            "field": "RP_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": [null, "2026-08-31"]
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "DEP",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "YW_TYPE",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "KB",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "RP_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,RP_DD,RP_NO,YW_TYPE,KB,AMTN_BC,AMTN_BB,AMTN_CHK,AMTN_OTHER,AMTN_IRP,AMTN_ARP,AMTN_ZRP,AMTN,REM"
}
```



------

## 成功响应 (200 OK)

json

```json
{
    "code": 0,
    "message": "Success",
    "data": {
        "REPORT__TAB": [
            {
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "RP_DD": "2024-07-08T00:00:00",
                "RP_NO_ID": "PT",
                "RP_NO": "PTYMDD0001",
                "KB": "3",
                "YW_TYPE": "11",
                "DEP": "00000000",
                "CHK_NO": "ZP00056",
                "AMTN_CHK": 1,
                "AMTN": 1
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "RP_DD", "TYPE": "DateTime" },
                { "NAME": "AMTN_BC", "TYPE": "Decimal" },
                { "NAME": "AMTN_BB", "TYPE": "Decimal" },
                { "NAME": "AMTN_CHK", "TYPE": "Decimal" },
                { "NAME": "AMTN_OTHER", "TYPE": "Decimal" },
                { "NAME": "AMTN_IRP", "TYPE": "Decimal" },
                { "NAME": "AMTN_ARP", "TYPE": "Decimal" },
                { "NAME": "AMTN_ZRP", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "EXC_RTO", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "CUST",
            "AREA",
            "CASN",
            "MF_YG",
            "DEPT"
        ]
    }
}
```