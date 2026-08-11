# 工单完成情况表 - 查询制表

## 接口信息

- **接口名称**：工单完成情况表 - 查询制表
- **接口地址**：`POST /api/MrpPK/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPPK"`                            |
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
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"MO_DD"`（工单日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`MO_DD`（工单日期）    |
| operator      | string        | 操作符：`range`（区间查询）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [6] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                       |
| :--- | :----------- | :---------------- | :----------------------------------------- |
| [4]  | `MO_NO`      | `in`              | 生产子工单（多选）                         |
| [5]  | `MRP_NO`     | `in`              | 生产成品（多选）                           |
| [6]  | `DEP`        | `in`              | 部门/产线（多选），`checkUnder="T"` 含所属 |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [7] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），按工单日期、工单号、加工顺序升序排列 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPPK",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "MO_NO",
                "MO_DD",
                "MRP_NO",
                "MRP_NAME",
                "SPC",
                "UNIT",
                "ZC_ITM",
                "TZ_NO",
                "ZC_NO",
                "ZC_NAME",
                "DEP_NAME",
                "CUS_NAME_TW",
                "QTY_MO",
                "QTY_PRC",
                "QTY_FIN",
                "QTY_LOST",
                "QTY_MV",
                "QTY_WWG",
                "STA_DD",
                "OPN_DD",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "MO_DD"
            }
        },
        {
            "field": "MO_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": ["2024-10-01", "2024-10-31"]
        },
        {
            "field": "MO_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "MRP_NO",
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
            "orderBy": {
                "MO_DD": "asc",
                "MO_NO": "asc",
                "ZC_ITM": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "MO_NO,MO_DD,MRP_NO,MRP_NAME,SPC,UNIT,ZC_ITM,TZ_NO,ZC_NO,ZC_NAME,DEP_NAME,CUS_NAME_TW,QTY_MO,QTY_PRC,QTY_FIN,QTY_LOST,QTY_MV,QTY_WWG,STA_DD,OPN_DD,REM"
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
                "MO_DD": "2024-10-31T00:00:00",
                "MO_NO": "MOYMDD0015",
                "MRP_NO": "000",
                "MRP_NAME": "原油",
                "SPC": "华为三折叠，怎么叠都有面",
                "PRD_MARK": "",
                "OPN_DD": "2024-10-31T00:00:00",
                "UNIT": "KG",
                "QTY_MO": 10,
                "QTY_FIN": 0,
                "STA_DD": "2024-10-30T00:00:00",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "QTY_WWG": 10,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "MO_DD", "TYPE": "DateTime" },
                { "NAME": "OPN_DD", "TYPE": "DateTime" },
                { "NAME": "STA_DD", "TYPE": "DateTime" },
                { "NAME": "QTY_MO", "TYPE": "Decimal" },
                { "NAME": "QTY_FIN", "TYPE": "Decimal" },
                { "NAME": "QTY_PRC", "TYPE": "Decimal" },
                { "NAME": "QTY_LOST", "TYPE": "Decimal" },
                { "NAME": "QTY_MV", "TYPE": "Decimal" },
                { "NAME": "QTY_WWG", "TYPE": "Decimal" },
                { "NAME": "ZC_ITM", "TYPE": "Int32" },
                { "NAME": "ITM_JH", "TYPE": "Int32" },
                { "NAME": "ITM_SO", "TYPE": "Int32" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_MO",
            "CUST",
            "CASN",
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

# 完工入库报表 - 查询制表

## 接口信息

- **接口名称**：完工入库报表 - 查询制表
- **接口地址**：`POST /api/mrpafc/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPPS"`                            |
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
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"MM_DD"`（入库日期） |
| `fixCondition.COMBOFCP`        | string | 固定值 `"1"`                                       |
| `fixCondition.WL_CHK`          | string | `"F"` 为否                                         |
| `fixCondition.COMBODATE`       | string | 日期组合标识，固定值 `"1"`                         |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`MM_DD`（入库日期）    |
| operator      | string        | 操作符：`this_year`（今年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [8] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                      |
| :--- | :----------- | :---------------- | :---------------------------------------- |
| [4]  | `MM_NO`      | `in`              | 入库单号（多选），`fieldType="bilNo"`     |
| [5]  | `MRP_NO`     | `in`              | 成品代号（多选）                          |
| [6]  | `DEP`        | `in`              | 部门代号（多选），`checkUnder="T"` 含所属 |
| [7]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属 |
| [8]  | `CHK_STATUS` | `equal`           | 审核状态（精确匹配，如 `'Y'`/`'N'`）      |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按入库日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPPS",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "MM_NO",
                "MM_DD",
                "MRP_NO",
                "MRP_NAME",
                "MRP_SPC",
                "PRD_MARK",
                "A001",
                "ID_NO",
                "QTY",
                "UNIT",
                "USED_TIME",
                "QTY_MO",
                "QTY_MO_FIN",
                "QTY_LOST",
                "CST_MAKE",
                "CST_PRD",
                "CST_MAN",
                "CST_OUT",
                "CST",
                "CST_ALL",
                "REM_B"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "MM_DD",
                "COMBOFCP": "1",
                "WL_CHK": "F",
                "COMBODATE": "1"
            }
        },
        {
            "field": "MM_DD",
            "operator": "this_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-01-01", "2026-12-31"]
        },
        {
            "field": "MM_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "MRP_NO",
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
                "MM_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "MM_NO,MM_DD,MRP_NO,MRP_NAME,MRP_SPC,PRD_MARK,A001,ID_NO,QTY,UNIT,USED_TIME,QTY_MO,QTY_MO_FIN,QTY_LOST,CST_MAKE,CST_PRD,CST_MAN,CST_OUT,CST,CST_ALL,REM_B"
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
                "MM_DD": "2026-07-15T00:00:00",
                "MM_NO": "MMYMDD0006",
                "QTY": 1,
                "REM_B": "",
                "MRP_NO": "000",
                "PRD_MARK": "",
                "MRP_NAME": "原油",
                "MRP_SPC": "华为三折叠，怎么叠都有面",
                "WH": "01",
                "PRD_NO": "",
                "PRD_NAME": "",
                "DEP": "00000000",
                "USED_TIME": 0,
                "UNIT": "KG",
                "ID_NO": "000->",
                "CST_MAKE": 90,
                "CST_PRD": 120,
                "CST_MAN": 70,
                "CST_OUT": 0,
                "CST": 0,
                "CST_ALL": 280,
                "QTY_MO": 1,
                "QTY_MO_FIN": 1,
                "QTY_LOST": 0,
                "CHK_STATUS": "Y",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "MM_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "USED_TIME", "TYPE": "Decimal" },
                { "NAME": "CST_MAKE", "TYPE": "Decimal" },
                { "NAME": "CST_PRD", "TYPE": "Decimal" },
                { "NAME": "CST_MAN", "TYPE": "Decimal" },
                { "NAME": "CST_OUT", "TYPE": "Decimal" },
                { "NAME": "CST", "TYPE": "Decimal" },
                { "NAME": "CST_ALL", "TYPE": "Decimal" },
                { "NAME": "QTY_MO", "TYPE": "Decimal" },
                { "NAME": "QTY_MO_FIN", "TYPE": "Decimal" },
                { "NAME": "QTY_LOST", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_MM0",
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

# 产品成本分析表 - 列表查询

## 接口信息

- **接口名称**：产品成本分析表 - 列表查询
- **接口地址**：`POST /api/mrppu/getList`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名      | 类型          | 必填 | 说明                               |
| :---------- | :------------ | :--- | :--------------------------------- |
| PGM         | string        | 是   | 程序/报表标识，固定值 `"MRPPU"`    |
| OTHERINFO   | object        | 是   | 其他固定参数（见下方说明）         |
| SEARCH_INFO | array[object] | 是   | 查询条件数组（具体结构见下方详解） |
| PAGE_INFO   | object        | 是   | 分页信息（见下方说明）             |

------

### OTHERINFO 参数说明

| 字段       | 类型   | 必填 | 说明                                |
| :--------- | :----- | :--- | :---------------------------------- |
| DEP_GROUP  | string | 是   | 集团分公司编码，固定值 `"00000000"` |
| INCLUDESON | string | 是   | 是否包含子公司，`"F"` 为否          |

------

### PAGE_INFO 参数说明

| 字段         | 类型  | 说明                                      |
| :----------- | :---- | :---------------------------------------- |
| PAGE_SIZE    | Int32 | 每页条数（`-1` 表示不分页，返回全部数据） |
| CURRENT_PAGE | Int32 | 当前页码（从1开始）                       |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段配置

| 字段          | 类型          | 说明                       |
| :------------ | :------------ | :------------------------- |
| showBody      | string        | 是否显示明细体，`"T"` 为是 |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否 |
| displayFields | array[string] | 表格需要展示的字段列表     |

#### [1] - 固定条件配置

| 字段                   | 类型   | 说明                     |
| :--------------------- | :----- | :----------------------- |
| `fixCondition.CHK_ALL` | string | 全部审核标识，`"F"` 为否 |

#### [2] - 部门群组过滤

| 字段          | 类型    | 说明                                |
| :------------ | :------ | :---------------------------------- |
| field         | string  | 筛选字段名：`DEP_GROUP`（部门群组） |
| operator      | string  | 操作符：`contain`（包含）           |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改）      |
| value         | string  | 筛选值（传空表示全部）              |

#### [3] - 单据别过滤

| 字段          | 类型    | 说明                           |
| :------------ | :------ | :----------------------------- |
| field         | string  | 筛选字段名：`BIL_ID`（单据别） |
| operator      | string  | 操作符：`in`（多选）           |
| fieldType     | string  | 字段类型：`select`（下拉选择） |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改） |
| value         | string  | 筛选值（传空表示全部）         |

#### [4] - 成本年月条件

| 字段          | 类型    | 说明                                       |
| :------------ | :------ | :----------------------------------------- |
| field         | string  | 筛选字段名：`DATE_CST`（成本年月）         |
| operator      | string  | 操作符：`equal`（等于）                    |
| fieldType     | string  | 字段类型：`date`                           |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改）             |
| value         | string  | 成本年月，格式 `YYYY-MM`（如 `"2025-07"`） |

#### [5] - 结案状态过滤

| 字段          | 类型    | 说明                               |
| :------------ | :------ | :--------------------------------- |
| field         | string  | 筛选字段名：`CLOSE_ID`（结案状态） |
| operator      | string  | 操作符：`equal`（等于）            |
| fieldType     | string  | 字段类型：`string`                 |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改）     |
| value         | string  | 筛选值（传空表示全部）             |

#### [6] - 部门筛选

| 字段          | 类型    | 说明                        |
| :------------ | :------ | :-------------------------- |
| field         | string  | 筛选字段名：`DEP`（部门）   |
| operator      | string  | 操作符：`in`（多选）        |
| fieldType     | string  | 字段类型：`string`          |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑） |
| checkUnder    | string  | 是否包含下级，`"T"` 为是    |
| value         | string  | 筛选值（传空表示全部）      |

#### [7] - 生产货品筛选

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`PRD_NO`（生产货品） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldType     | string  | 字段类型：`string`               |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPPU",
    "OTHERINFO": {
        "DEP_GROUP": "00000000",
        "INCLUDESON": "F"
    },
    "SEARCH_INFO": [
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "BIL_DD",
                "BIL_NO",
                "ITM",
                "PRD_NO",
                "PRD_NAME",
                "A001",
                "BAT_NO",
                "WH",
                "UNIT_NAME",
                "QTY",
                "QTY1",
                "CST",
                "CST_OUT",
                "CST_ALL",
                "SO_NO",
                "JH_NO",
                "MO_NO",
                "TW_NO",
                "TZ_NO",
                "DATE_CST",
                "CST_MAN1",
                "CST_MAK1"
            ]
        },
        {
            "fixCondition": {
                "CHK_ALL": "F"
            }
        },
        {
            "field": "DEP_GROUP",
            "operator": "contain",
            "fieldDisabled": true,
            "value": ""
        },
        {
            "field": "BIL_ID",
            "operator": "in",
            "fieldType": "select",
            "fieldDisabled": true,
            "value": ""
        },
        {
            "field": "DATE_CST",
            "operator": "equal",
            "fieldType": "date",
            "fieldDisabled": true,
            "value": "2025-07"
        },
        {
            "field": "CLOSE_ID",
            "operator": "equal",
            "fieldType": "string",
            "fieldDisabled": true,
            "value": ""
        },
        {
            "field": "DEP",
            "operator": "in",
            "fieldType": "string",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldType": "string",
            "fieldDisabled": false,
            "value": ""
        }
    ],
    "PAGE_INFO": {
        "PAGE_SIZE": -1,
        "CURRENT_PAGE": 1
    }
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
        "TRANS": [
            {
                "BIL_ID": "WR",
                "BIL_NO": "WRYMDD0010",
                "BIL_NO2": "WRYMDD0010->1",
                "BIL_DD": "2025-07-16 00:00:00.000",
                "CLS_DATE": "2025-07-16 00:00:00.000",
                "PRE_ITM": 1,
                "PRD_NO": "000",
                "PRD_MARK": "",
                "BAT_NO": "",
                "WH": "",
                "QTY": 5,
                "QTY1": 5000,
                "UNIT": "1",
                "CST": 0,
                "CST_OUT": null,
                "CST_MAN": null,
                "CST_MAKE": null,
                "CST_PRD": null,
                "USED_TIME": null,
                "TIME_CNT": null,
                "BIL_TYPE": "",
                "WHINVALID": "",
                "DEP": "00000000",
                "SAL_NO": null,
                "CAS_NO": "",
                "OS_NO": "",
                "ITM": 1,
                "CLOSE_ID": "T",
                "BIL_ID2": "MO",
                "MO_NO": "MOYMDD0008",
                "TW_NO": "",
                "TZ_NO": "TZYMDD0012",
                "YY": 2025,
                "MM": 7,
                "M_ITM": 0,
                "CST_ALL": 0,
                "CST_MAN1": null,
                "CST_MAK1": null,
                "DEP_NAME": "First Department",
                "SAL_NAME": null,
                "PRD_NAME": "原油",
                "SPC": "华为三折叠，怎么叠都有面",
                "IDX_NO": null,
                "IDX_NAME": null,
                "KND": "半成品",
                "WH_NAME": null,
                "SO_NO": "",
                "JH_NO": "",
                "CAS_NAME": null,
                "BIL_TYPE_NAME": null,
                "UNIT_NAME": "KG",
                "DATE_CST": "2025-07-01 00:00:00.000",
                "PRD_CHK_NUM": "F",
                "PRD_UT": "KG",
                "PRD_PK2_UT": "01",
                "PRD_PK3_UT": "02",
                "PRD_DFU_UT": "1",
                "PRD_PK2_QTY": null,
                "PRD_PK3_QTY": null,
                "PRD_USE_PRDMARK": "F",
                "PRD_FORMULA": "1;0;0;2;2;Main unit qty*1000;Sub unit Qty/1000",
                "PRD_NAME_ENG": null,
                "PRD_UT1": "G",
                "PRD_QUOTE_UT1": "1",
                "PRD_QUOTE_UT2": "1",
                "PRD_QUOTE_UT3": "1",
                "PRD_VALID_DAYS": null,
                "PRD_MOB_ID": null,
                "PRD_KND": "3",
                "A001": null,
                "A001_DSC": null
            }
        ],
        "COLUMN_INFO": [
            { "NAME": "BIL_ID", "TYPE": "String", "ISHEAD": "F" },
            { "NAME": "BIL_NO", "TYPE": "String", "ISHEAD": "F" },
            { "NAME": "BIL_DD", "TYPE": "DateTime", "ISHEAD": "F" },
            { "NAME": "QTY", "TYPE": "Decimal", "ISHEAD": "F", "IS_SUM_FIELD": "T" },
            { "NAME": "CST", "TYPE": "Decimal", "ISHEAD": "F", "IS_SUM_FIELD": "T" },
            { "NAME": "CST_OUT", "TYPE": "Decimal", "ISHEAD": "F", "IS_SUM_FIELD": "T" },
            { "NAME": "CST_ALL", "TYPE": "Decimal", "ISHEAD": "F", "IS_SUM_FIELD": "T" },
            { "NAME": "ITM", "TYPE": "Int32", "ISHEAD": "F" },
            { "NAME": "YY", "TYPE": "Int32", "ISHEAD": "F" },
            { "NAME": "MM", "TYPE": "Int32", "ISHEAD": "F" }
        ],
        "BASIC_DATA_TABLE": [
            "CASN",
            "MF_YG",
            "DEPT",
            "PRDT",
            "MY_WH",
            "INDX",
            "MARK"
        ],
        "PAGE_INFO": {
            "TOTAL_PAGES": 0,
            "TOTAL": 0,
            "CURRENT_PAGE": 1,
            "PAGE_SIZE": -1,
            "ORDER_BY": ""
        }
    }
}
```

# 员工年度薪资清册 - 查询制表

## 接口信息

- **接口名称**：员工年度薪资清册 - 查询制表
- **接口地址**：`POST /api/rptWagCG3/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_WAGCG3"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"T"` 为是                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                         |
| :----------------------------- | :----- | :----------------------------------------------------------- |
| `fixCondition.SZ_NO_TYPE`      | string | 项目类型，固定值 `"2"`                                       |
| `fixCondition.SZ_NO`           | string | 薪资项目列表（`AMTN_ADD`=加项合计，`AMTN_SUB`=减项合计，`AMTN_TAX`=应税金额，`AMTN_NET`=实发金额） |
| `fixCondition.CHK_TYPE`        | string | 审核类型，固定值 `"T"`                                       |
| `fixCondition.LOCK_TYPE`       | string | 锁定类型（当前为空）                                         |
| `fixCondition.OTR_NO_TYPE`     | string | 其他项目类型，固定值 `"1"`                                   |
| `fixCondition.OTR_NO`          | string | 其他项目编号（当前为空）                                     |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"YEARS"`（年度）               |

#### [3] - 薪资年度条件

| 字段             | 类型    | 说明                               |
| :--------------- | :------ | :--------------------------------- |
| field            | string  | 筛选字段名：`YEARS`（薪资年度）    |
| operator         | string  | 操作符：`equal`（等于）            |
| fieldType        | string  | 字段类型：`date`                   |
| need             | boolean | 是否必须条件：`true`（必填）       |
| fieldDisabled    | boolean | 前端是否禁用：`true`（固定不可改） |
| operatorDisabled | boolean | 操作符是否禁用：`true`             |
| value            | string  | 年度，格式 `YYYY`（如 `"2025"`）   |

#### [4] - 员工筛选

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`YG_NO`（员工代号） |
| operator      | string  | 操作符：`equal`（等于）         |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）     |
| value         | string  | 筛选值（传空表示全部）          |

#### [5] - 在职状态筛选

| 字段          | 类型    | 说明                                       |
| :------------ | :------ | :----------------------------------------- |
| field         | string  | 筛选字段名：`OUT_DAY_TYPE`（在职状态类型） |
| operator      | string  | 操作符：`equal`（等于）                    |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）                |
| value         | string  | 筛选值：`"1"` 表示在职                     |

#### [6] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），按员工代号升序、员工姓名降序、集团公司升序、顺序号升序排列 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_WAGCG3",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "T",
            "displayFields": [
                "YG_NO",
                "NAME",
                "DEP_NAME",
                "SZ_NAME_1",
                "AMTN_1",
                "AMTN_2",
                "AMTN_3",
                "AMTN_4",
                "AMTN_5",
                "AMTN_6",
                "AMTN_7",
                "AMTN_8",
                "AMTN_9",
                "AMTN_10",
                "AMTN_11",
                "AMTN_12",
                "AMTN_TOTAL"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "SZ_NO_TYPE": "2",
                "SZ_NO": "AMTN_ADD;AMTN_SUB;AMTN_TAX;AMTN_NET",
                "CHK_TYPE": "T",
                "LOCK_TYPE": "",
                "OTR_NO_TYPE": "1",
                "OTR_NO": "",
                "REPORT_DD_FIELD": "YEARS"
            }
        },
        {
            "field": "YEARS",
            "operator": "equal",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "operatorDisabled": true,
            "value": "2025"
        },
        {
            "field": "YG_NO",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "OUT_DAY_TYPE",
            "operator": "equal",
            "fieldDisabled": false,
            "value": "1"
        },
        {
            "orderBy": {
                "YG_NO": "asc",
                "NAME": "desc",
                "WAG_DEP_ORG": "asc",
                "ORDER_ID": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "YG_NO,NAME,DEP_NAME,SZ_NAME_1,AMTN_1,AMTN_2,AMTN_3,AMTN_4,AMTN_5,AMTN_6,AMTN_7,AMTN_8,AMTN_9,AMTN_10,AMTN_11,AMTN_12,AMTN_TOTAL"
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
                "YG_NO": "001",
                "NAME": "刘一",
                "DEP_NAME": "销售部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 1,
                "SZ_ID_1": "12",
                "SZ_NO_1": "AMTN_ADD",
                "SZ_NAME_1": "加项合计",
                "AMTN_12": 20500,
                "AMTN_TOTAL": 20500
            },
            {
                "YG_NO": "001",
                "NAME": "刘一",
                "DEP_NAME": "销售部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 2,
                "SZ_ID_1": "13",
                "SZ_NO_1": "AMTN_SUB",
                "SZ_NAME_1": "减项合计",
                "AMTN_12": 1419,
                "AMTN_TOTAL": 1419
            },
            {
                "YG_NO": "001",
                "NAME": "刘一",
                "DEP_NAME": "销售部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 3,
                "SZ_ID_1": "10",
                "SZ_NO_1": "AMTN_NET",
                "SZ_NAME_1": "实发金额",
                "AMTN_12": 19081,
                "AMTN_TOTAL": 19081
            },
            {
                "YG_NO": "001",
                "NAME": "刘一",
                "DEP_NAME": "销售部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 4,
                "SZ_ID_1": "11",
                "SZ_NO_1": "AMTN_TAX",
                "SZ_NAME_1": "应税金额",
                "AMTN_12": 16584,
                "AMTN_TOTAL": 16584
            },
            {
                "YG_NO": "001",
                "NAME": "刘一",
                "DEP_NAME": "销售部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 8,
                "SZ_ID_1": "5",
                "SZ_NO_1": "M01",
                "SZ_NAME_1": "子女教育",
                "AMTN_12": 1000,
                "AMTN_TOTAL": 1000
            },
            {
                "YG_NO": "001",
                "NAME": "刘一",
                "DEP_NAME": "销售部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 8,
                "SZ_ID_1": "5",
                "SZ_NO_1": "M06",
                "SZ_NAME_1": "赡养老人",
                "AMTN_12": 1500,
                "AMTN_TOTAL": 1500
            },
            {
                "YG_NO": "002",
                "NAME": "陈二",
                "DEP_NAME": "采购部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 1,
                "SZ_ID_1": "12",
                "SZ_NO_1": "AMTN_ADD",
                "SZ_NAME_1": "加项合计",
                "AMTN_12": 12100,
                "AMTN_TOTAL": 12100
            },
            {
                "YG_NO": "002",
                "NAME": "陈二",
                "DEP_NAME": "采购部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 2,
                "SZ_ID_1": "13",
                "SZ_NO_1": "AMTN_SUB",
                "SZ_NAME_1": "减项合计",
                "AMTN_12": 320,
                "AMTN_TOTAL": 320
            },
            {
                "YG_NO": "002",
                "NAME": "陈二",
                "DEP_NAME": "采购部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 3,
                "SZ_ID_1": "10",
                "SZ_NO_1": "AMTN_NET",
                "SZ_NAME_1": "实发金额",
                "AMTN_12": 11780,
                "AMTN_TOTAL": 11780
            },
            {
                "YG_NO": "002",
                "NAME": "陈二",
                "DEP_NAME": "采购部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 4,
                "SZ_ID_1": "11",
                "SZ_NO_1": "AMTN_TAX",
                "SZ_NAME_1": "应税金额",
                "AMTN_12": 10500,
                "AMTN_TOTAL": 10500
            },
            {
                "YG_NO": "002",
                "NAME": "陈二",
                "DEP_NAME": "采购部",
                "WAG_DEP_ORG": "",
                "OUT_DAY_TYPE": "1",
                "YEARS": 1,
                "ORDER_ID": 8,
                "SZ_ID_1": "5",
                "SZ_NO_1": "M06",
                "SZ_NAME_1": "赡养老人",
                "AMTN_12": 1500,
                "AMTN_TOTAL": 1500
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "YEARS", "TYPE": "Int32" },
                { "NAME": "ORDER_ID", "TYPE": "Int32" },
                { "NAME": "AMTN_1", "TYPE": "Decimal" },
                { "NAME": "AMTN_2", "TYPE": "Decimal" },
                { "NAME": "AMTN_3", "TYPE": "Decimal" },
                { "NAME": "AMTN_4", "TYPE": "Decimal" },
                { "NAME": "AMTN_5", "TYPE": "Decimal" },
                { "NAME": "AMTN_6", "TYPE": "Decimal" },
                { "NAME": "AMTN_7", "TYPE": "Decimal" },
                { "NAME": "AMTN_8", "TYPE": "Decimal" },
                { "NAME": "AMTN_9", "TYPE": "Decimal" },
                { "NAME": "AMTN_10", "TYPE": "Decimal" },
                { "NAME": "AMTN_11", "TYPE": "Decimal" },
                { "NAME": "AMTN_12", "TYPE": "Decimal" },
                { "NAME": "AMTN_TOTAL", "TYPE": "Decimal" },
                { "NAME": "IN_DAY", "TYPE": "DateTime" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_YG",
            "DEPT"
        ]
    }
}
```