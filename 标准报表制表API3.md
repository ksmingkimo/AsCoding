# 1.科目预算报表 - 查询制表

## 接口信息

- **接口名称**：科目预算报表 - 查询制表
- **接口地址**：`POST /api/ACCABGT/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_ACCABGTLIST"`                  |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"YEARS"`（会计年度） |

#### [3] - 年度筛选

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`YEARS`（会计年度） |
| operator      | string  | 操作符：`equal`（等于）         |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）     |
| value         | string  | 筛选值（传空表示全部）          |

#### [4] - 账簿筛选

| 字段          | 类型    | 说明                          |
| :------------ | :------ | :---------------------------- |
| field         | string  | 筛选字段名：`BOOK_NO`（账簿） |
| operator      | string  | 操作符：`equal`（等于）       |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）   |
| value         | string  | 筛选值（传空表示全部）        |

#### [5] - 科目筛选

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`ACC_NO`（科目代号） |
| operator      | string  | 操作符：`equal`（等于）          |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| checkUnder    | string  | 是否包含下级，`"T"` 为是         |
| value         | string  | 筛选值（传空表示全部）           |

#### [6] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按会计年度升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_ACCABGTLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "BOOK_NO",
                "BOOK_NO_NAME",
                "YEARS",
                "ACC_NO",
                "ACC_NO_NAME",
                "FZHS_TITLE",
                "AMTN_TOTAL",
                "AMTN_ACTUL",
                "AMTN1",
                "AMTN_1",
                "AMTN2",
                "AMTN_2",
                "AMTN3",
                "AMTN_3",
                "AMTN4",
                "AMTN_4",
                "AMTN5",
                "AMTN_5",
                "AMTN6",
                "AMTN_6",
                "AMTN7",
                "AMTN_7",
                "AMTN8",
                "AMTN_8",
                "AMTN9",
                "AMTN_9",
                "AMTN10",
                "AMTN_10",
                "AMTN11",
                "AMTN_11",
                "AMTN12",
                "AMTN_12"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "YEARS"
            }
        },
        {
            "field": "YEARS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "BOOK_NO",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "ACC_NO",
            "operator": "equal",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "orderBy": {
                "YEARS": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "BOOK_NO,BOOK_NO_NAME,YEARS,ACC_NO,ACC_NO_NAME,FZHS_TITLE,AMTN_TOTAL,AMTN_ACTUL,AMTN1,AMTN_1,AMTN2,AMTN_2,AMTN3,AMTN_3,AMTN4,AMTN_4,AMTN5,AMTN_5,AMTN6,AMTN_6,AMTN7,AMTN_7,AMTN8,AMTN_8,AMTN9,AMTN_9,AMTN10,AMTN_10,AMTN11,AMTN_11,AMTN12,AMTN_12"
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
                "ITM": 1,
                "BOOK_NO": "01",
                "BOOK_NO_NAME": "主账簿01",
                "YEARS": "2025",
                "ACC_NO": "1001",
                "AMTN_TOTAL": 12000,
                "AMTN_ACTUL": 0,
                "AMTN1": 1000,
                "AMTN_1": 0,
                "AMTN2": 1000,
                "AMTN_2": 0,
                "AMTN3": 1000,
                "AMTN_3": 0,
                "AMTN4": 1000,
                "AMTN_4": 0,
                "AMTN5": 1000,
                "AMTN_5": 0,
                "AMTN6": 1000,
                "AMTN_6": 0,
                "AMTN7": 1000,
                "AMTN_7": 0,
                "AMTN8": 1000,
                "AMTN_8": 0,
                "AMTN9": 1000,
                "AMTN_9": 0,
                "AMTN10": 1000,
                "AMTN_10": 0,
                "AMTN11": 1000,
                "AMTN_11": 0,
                "AMTN12": 1000,
                "AMTN_12": 0,
                "CLS_ID2": "",
                "FZHS_TITLE": "",
                "ACC_NO_NAME": "库存现金",
                "CLS_ID2_NAME": "",
                "FZHS_KEY": "1001,01,,,,,,,,,,",
                "FZHS_NO_H": ""
            },
            {
                "ITM": 1,
                "BOOK_NO": "02",
                "BOOK_NO_NAME": "副账簿02",
                "YEARS": "2025",
                "ACC_NO": "1001",
                "AMTN_TOTAL": 1200,
                "AMTN_ACTUL": -10,
                "AMTN1": 100,
                "AMTN_1": 0,
                "AMTN2": 100,
                "AMTN_2": -10,
                "AMTN3": 100,
                "AMTN_3": 0,
                "AMTN4": 100,
                "AMTN_4": 0,
                "AMTN5": 100,
                "AMTN_5": 0,
                "AMTN6": 100,
                "AMTN_6": 0,
                "AMTN7": 100,
                "AMTN_7": 0,
                "AMTN8": 100,
                "AMTN_8": 0,
                "AMTN9": 100,
                "AMTN_9": 0,
                "AMTN10": 100,
                "AMTN_10": 0,
                "AMTN11": 100,
                "AMTN_11": 0,
                "AMTN12": 100,
                "AMTN_12": 0,
                "FZHS_TITLE": "",
                "ACC_NO_NAME": "库存现金",
                "FZHS_KEY": "1001,02,,,,,,,,,,",
                "FZHS_NO_KEY": ",,,,,,,,,,"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "AMTN_TOTAL", "TYPE": "Decimal" },
                { "NAME": "AMTN_ACTUL", "TYPE": "Decimal" },
                { "NAME": "AMTN1", "TYPE": "Decimal" },
                { "NAME": "AMTN_1", "TYPE": "Decimal" },
                { "NAME": "AMTN2", "TYPE": "Decimal" },
                { "NAME": "AMTN_2", "TYPE": "Decimal" },
                { "NAME": "AMTN3", "TYPE": "Decimal" },
                { "NAME": "AMTN_3", "TYPE": "Decimal" },
                { "NAME": "AMTN4", "TYPE": "Decimal" },
                { "NAME": "AMTN_4", "TYPE": "Decimal" },
                { "NAME": "AMTN5", "TYPE": "Decimal" },
                { "NAME": "AMTN_5", "TYPE": "Decimal" },
                { "NAME": "AMTN6", "TYPE": "Decimal" },
                { "NAME": "AMTN_6", "TYPE": "Decimal" },
                { "NAME": "AMTN7", "TYPE": "Decimal" },
                { "NAME": "AMTN_7", "TYPE": "Decimal" },
                { "NAME": "AMTN8", "TYPE": "Decimal" },
                { "NAME": "AMTN_8", "TYPE": "Decimal" },
                { "NAME": "AMTN9", "TYPE": "Decimal" },
                { "NAME": "AMTN_9", "TYPE": "Decimal" },
                { "NAME": "AMTN10", "TYPE": "Decimal" },
                { "NAME": "AMTN_10", "TYPE": "Decimal" },
                { "NAME": "AMTN11", "TYPE": "Decimal" },
                { "NAME": "AMTN_11", "TYPE": "Decimal" },
                { "NAME": "AMTN12", "TYPE": "Decimal" },
                { "NAME": "AMTN_12", "TYPE": "Decimal" },
                { "NAME": "APR_DAT", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "ARP_DAT", "TYPE": "DateTime" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        }
    }
}
```

# 2.信用额度查询表 - 查询制表

## 接口信息

- **接口名称**：信用额度查询表 - 查询制表
- **接口地址**：`POST /api/Rptsarplist/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"RPTSARPLIST"`                      |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [1] - 固定条件配置

| 字段                           | 类型   | 说明                         |
| :----------------------------- | :----- | :--------------------------- |
| `fixCondition.CHK_TYPE`        | string | 审核类型，固定值 `"0"`       |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识（当前为空） |

#### [2] - 客户筛选

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`CUS_NO`（客户代号） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| checkUnder    | string  | 是否包含下级，`"T"` 为是         |
| value         | string  | 筛选值（传空表示全部）           |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "RPTSARPLIST",
    "SEARCH_INFO": [
        {
            "showLadder": "F",
            "displayFields": [
                "CUS_NAME",
                "IDX_NAME",
                "CAS_NAME",
                "BIL_TYPE_NAME",
                "AMTN_CRD",
                "AMTN_CRDED",
                "AMTN_CHK",
                "AMTN_SO",
                "AMTN_IRP",
                "AMTN_TRP",
                "AMTN_BALANCE"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "CHK_TYPE": "0",
                "REPORT_DD_FIELD": ""
            }
        },
        {
            "field": "CUS_NO",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        }
    ],
    "DISPLAY_FIELDS": "CUS_NAME,IDX_NAME,CAS_NAME,BIL_TYPE_NAME,AMTN_CRD,AMTN_CRDED,AMTN_CHK,AMTN_SO,AMTN_IRP,AMTN_TRP,AMTN_BALANCE"
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
                "SNM": "01",
                "CUS_LEVEL": "5",
                "CUS_ARE": "001-01",
                "CUS_ARE_NAME": "从化区",
                "IDX_NO": "",
                "IDX_NAME": "",
                "CAS_NO": "",
                "CAS_NAME": "",
                "BIL_TYPE": "",
                "BIL_TYPE_NAME": "",
                "AMTN_CRD": 0,
                "AMTN_CRDED": 117380380.08,
                "AMTN_CHK": 40,
                "AMTN_INV": 0,
                "AMTN_SO": 108001337,
                "AMTN_IRP": 47,
                "AMTN_TRP": 0,
                "AMTN_FAX": 0,
                "AMTN_BALANCE": -117380333.08
            },
            {
                "CUS_NO": "02",
                "CUS_NAME": "华为",
                "SNM": "往来单位02",
                "CUS_LEVEL": "5",
                "CUS_ARE": "",
                "IDX_NO": "",
                "IDX_NAME": "",
                "CAS_NO": "",
                "CAS_NAME": "",
                "BIL_TYPE": "",
                "BIL_TYPE_NAME": "",
                "AMTN_CRD": 0,
                "AMTN_CRDED": 216462.8,
                "AMTN_CHK": 0,
                "AMTN_INV": 0,
                "AMTN_SO": 140766,
                "AMTN_IRP": 0,
                "AMTN_TRP": 0,
                "AMTN_FAX": 0,
                "AMTN_BALANCE": -216462.8
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "AMTN_CRD", "TYPE": "Decimal" },
                { "NAME": "AMTN_CRDED", "TYPE": "Decimal" },
                { "NAME": "AMTN_CHK", "TYPE": "Decimal" },
                { "NAME": "AMTN_INV", "TYPE": "Decimal" },
                { "NAME": "AMTN_SO", "TYPE": "Decimal" },
                { "NAME": "AMTN_IRP", "TYPE": "Decimal" },
                { "NAME": "AMTN_TRP", "TYPE": "Decimal" },
                { "NAME": "AMTN_FAX", "TYPE": "Decimal" },
                { "NAME": "AMTN_BALANCE", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "CUST",
            "CASN",
            "INDX",
            "AREA",
            "BIL_SPC"
        ]
    }
}
```

# 3.过期货品预警表 - 查询制表

## 接口信息

- **接口名称**：过期货品预警表 - 查询制表
- **接口地址**：`POST /api/rptinvdo/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"RPT_INVDO"`                        |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                             |
| :----------------------------- | :----- | :----------------------------------------------- |
| `fixCondition.ZL_DAYS`         | Int32  | 过期天数阈值，固定值 `0`（即查询所有已过期产品） |
| `fixCondition.WASTERCHANGE`    | string | 是否包含报废变更，`"F"` 为否                     |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识（当前为空）                     |

#### [3] - 基准日期条件

| 字段             | 类型    | 说明                                |
| :--------------- | :------ | :---------------------------------- |
| field            | string  | 筛选字段名：`BASE_DD`（过期基准日） |
| operator         | string  | 操作符：`equal`（等于）             |
| fieldType        | string  | 字段类型：`date`                    |
| need             | boolean | 是否必须条件：`true`（必填）        |
| fieldDisabled    | boolean | 前端是否禁用：`true`（固定不可改）  |
| operatorDisabled | boolean | 操作符是否禁用：`true`              |
| value            | string  | 基准日期，格式 `YYYY-MM-DD`         |

#### [4] - 过期类型条件

| 字段             | 类型    | 说明                               |
| :--------------- | :------ | :--------------------------------- |
| field            | string  | 筛选字段名：`ZL_TYPE`（逾期类型）  |
| operator         | string  | 操作符：`equal`（等于）            |
| need             | boolean | 是否必须条件：`true`（必填）       |
| fieldDisabled    | boolean | 前端是否禁用：`true`（固定不可改） |
| operatorDisabled | boolean | 操作符是否禁用：`true`             |
| value            | string  | 过期类型：`"1"`（已过期）          |

#### [5] 至 [8] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                      |
| :--- | :----------- | :---------------- | :---------------------------------------- |
| [5]  | `PRD_NO`     | `in`              | 品号（多选）                              |
| [6]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属 |
| [7]  | `BAT_NO`     | `in`              | 批号（多选）                              |
| [8]  | `PRD_MARK`   | `in`              | 货品特征（多选）                          |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按品号升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "RPT_INVDO",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "WH",
                "WH_NAME",
                "PRD_NO",
                "PRD_NAME",
                "PRD_MARK",
                "A001",
                "BAT_NO",
                "LST_SFD",
                "UNIT_NAME",
                "QTY",
                "UP_AVG_CST",
                "CST_AMT"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "ZL_DAYS": 0,
                "WASTERCHANGE": "F",
                "REPORT_DD_FIELD": ""
            }
        },
        {
            "field": "BASE_DD",
            "operator": "equal",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "operatorDisabled": true,
            "value": "2026-08-12"
        },
        {
            "field": "ZL_TYPE",
            "operator": "equal",
            "need": true,
            "fieldDisabled": true,
            "operatorDisabled": true,
            "value": "1"
        },
        {
            "field": "PRD_NO",
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
            "field": "BAT_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "PRD_MARK",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "PRD_NO": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "WH,WH_NAME,PRD_NO,PRD_NAME,PRD_MARK,A001,BAT_NO,LST_SFD,UNIT_NAME,QTY,UP_AVG_CST,CST_AMT"
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
                "PRD_NO": "000",
                "BAT_NO": "",
                "WH": "01",
                "PRD_MARK": "",
                "QTY": 41,
                "PRD_NAME": "原油",
                "WH_NAME": "成品仓",
                "UNIT_NAME": "KG",
                "BASE_DD": "2026-08-12",
                "ZL_TYPE": "1",
                "A001": "",
                "UP_AVG_CST": 15.463414634146341,
                "CST_AMT": 634
            },
            {
                "PRD_NO": "01",
                "BAT_NO": "",
                "WH": "02",
                "PRD_MARK": "",
                "QTY": 7,
                "PRD_NAME": "米奇妙妙屋",
                "WH_NAME": "仓库02",
                "UNIT_NAME": "个",
                "BASE_DD": "2026-08-12",
                "ZL_TYPE": "1",
                "A001": "",
                "UP_AVG_CST": 246.31714285714287,
                "CST_AMT": 1724.22
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "LST_SFD", "TYPE": "DateTime" },
                { "NAME": "LST_OTD", "TYPE": "DateTime" },
                { "NAME": "LST_IND", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY1", "TYPE": "Decimal" },
                { "NAME": "QTY_BRW", "TYPE": "Decimal" },
                { "NAME": "QTY_LRN", "TYPE": "Decimal" },
                { "NAME": "QTY1_BRW", "TYPE": "Decimal" },
                { "NAME": "QTY1_LRN", "TYPE": "Decimal" },
                { "NAME": "QTY_MIN", "TYPE": "Decimal" },
                { "NAME": "AMT_CST", "TYPE": "Decimal" },
                { "NAME": "EX_DAY", "TYPE": "Int32" },
                { "NAME": "HA_DAY", "TYPE": "Int32" },
                { "NAME": "UPR", "TYPE": "Decimal" },
                { "NAME": "UP_AVG_CST", "TYPE": "Decimal" },
                { "NAME": "CST_AMT", "TYPE": "Decimal" },
                { "NAME": "PRD_PK2_QTY", "TYPE": "Double" },
                { "NAME": "PRD_PK3_QTY", "TYPE": "Double" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        }
    }
}
```

# 4.安全存量预警表 - 查询制表

## 接口信息

- **接口名称**：安全存量预警表 - 查询制表
- **接口地址**：`POST /api/rptinvdl/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"RPT_INVDL"`                        |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                              |
| :----------------------------- | :----- | :-------------------------------- |
| `fixCondition.SEL_KYKC`        | string | 可选库存类型（当前为空）          |
| `fixCondition.INVALID`         | string | 是否包含无效数据，`"F"` 为否      |
| `fixCondition.LISTQTYIS0`      | string | 是否列出数量为0的数据，`"1"` 为是 |
| `fixCondition.ISLC`            | string | 是否包含残次品，`"F"` 为否        |
| `fixCondition.SUMBOX`          | string | 是否汇总箱数，`"1"` 为是          |
| `fixCondition.CHK_NOUSE`       | string | 是否包含未审核数据，`"F"` 为否    |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识（当前为空）      |

#### [3] 至 [6] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                      |
| :--- | :----------- | :---------------- | :---------------------------------------- |
| [3]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属 |
| [4]  | `PRD_NO`     | `in`              | 货品代号（多选）                          |
| [5]  | `PRD_MARK`   | `in`              | 货品特征（多选）                          |
| [6]  | `BAT_NO`     | `in`              | 批号（多选）                              |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [7] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按货品代号升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "RPT_INVDL",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "WH_NAME",
                "PRD_NAME",
                "PRD_MARK",
                "A001",
                "BAT_NO",
                "UNIT",
                "QTY",
                "QTY_MIN",
                "QTY_CHK",
                "QTY_OUT",
                "QTY_NOW",
                "QTY_END"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "SEL_KYKC": "",
                "INVALID": "F",
                "LISTQTYIS0": "1",
                "ISLC": "F",
                "SUMBOX": "1",
                "CHK_NOUSE": "F",
                "REPORT_DD_FIELD": ""
            }
        },
        {
            "field": "WH",
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
            "field": "PRD_MARK",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "BAT_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "PRD_NO": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "WH_NAME,PRD_NAME,PRD_MARK,A001,BAT_NO,UNIT,QTY,QTY_MIN,QTY_CHK,QTY_OUT,QTY_NOW,QTY_END"
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
                "BAT_NO": "",
                "WH": "01",
                "WH_NAME": "成品仓",
                "PRD_NO": "1000130001001",
                "PRD_NAME": "Sunlike",
                "PRD_MARK": "",
                "UNIT": "套",
                "QTY": 0,
                "QTY_NOW": 0,
                "QTY_MIN": 20,
                "QTY_CHK": -20,
                "QTY_OUT": 0,
                "QTY_END": -20,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "LST_SFD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY_NOW", "TYPE": "Decimal" },
                { "NAME": "QTY_MIN", "TYPE": "Decimal" },
                { "NAME": "QTY_MAX", "TYPE": "Decimal" },
                { "NAME": "QTY_CHK", "TYPE": "Decimal" },
                { "NAME": "QTY_OUT", "TYPE": "Decimal" },
                { "NAME": "QTY_END", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_WAY", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_PRC", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_RSV", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_ODR", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        }
    }
}
```

# 5.负库存预警表 - 查询制表

## 接口信息

- **接口名称**：负库存预警表 - 查询制表
- **接口地址**：`POST /api/rptinvswa/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"RPT_INVSWA"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                             |
| :----------------------------- | :----- | :----------------------------------------------- |
| `fixCondition.SEL_KYKC`        | string | 可选库存类型，固定值 `"1;2"`（包含多种库存类型） |
| `fixCondition.INVALID`         | string | 是否包含无效数据，`"F"` 为否                     |
| `fixCondition.LISTQTYIS0`      | string | 是否列出数量为0的数据，`"1"` 为是                |
| `fixCondition.ISLC`            | string | 是否包含残次品，`"F"` 为否                       |
| `fixCondition.SUMBOX`          | string | 是否汇总箱数，`"1"` 为是                         |
| `fixCondition.CHK_NOUSE`       | string | 是否包含未审核数据，`"F"` 为否                   |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识（当前为空）                     |

#### [3] 至 [6] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                      |
| :--- | :----------- | :---------------- | :---------------------------------------- |
| [3]  | `WH`         | `in`              | 仓库代号（多选），`checkUnder="T"` 含所属 |
| [4]  | `PRD_NO`     | `in`              | 货品代号（多选）                          |
| [5]  | `PRD_MARK`   | `in`              | 货品特征（多选）                          |
| [6]  | `BAT_NO`     | `in`              | 批号（多选）                              |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [7] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按货品代号升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "RPT_INVSWA",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "WH",
                "WH_NAME",
                "PRD_NO",
                "PRD_NAME",
                "PRD_MARK",
                "A001",
                "BAT_NO",
                "LST_SFD",
                "UNIT",
                "QTY",
                "QTY_END",
                "QTY_MIN",
                "QTY_MAX"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "SEL_KYKC": "1;2",
                "INVALID": "F",
                "LISTQTYIS0": "1",
                "ISLC": "F",
                "SUMBOX": "1",
                "CHK_NOUSE": "F",
                "REPORT_DD_FIELD": ""
            }
        },
        {
            "field": "WH",
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
            "field": "PRD_MARK",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "BAT_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "PRD_NO": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "WH,WH_NAME,PRD_NO,PRD_NAME,PRD_MARK,A001,BAT_NO,LST_SFD,UNIT,QTY,QTY_END,QTY_MIN,QTY_MAX"
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
                "BAT_NO": "",
                "WH": "01",
                "WH_NAME": "成品仓",
                "PRD_NO": "01",
                "PRD_NAME": "米奇妙妙屋",
                "PRD_MARK": "",
                "UNIT": "个",
                "QTY": -7,
                "QTY_MIN": 0,
                "QTY_MAX": 0,
                "QTY_END": -7,
                "A001": ""
            },
            {
                "BAT_NO": "",
                "WH": "02",
                "WH_NAME": "仓库02",
                "PRD_NO": "01",
                "PRD_NAME": "米奇妙妙屋",
                "PRD_MARK": "",
                "UNIT": "个",
                "QTY": -8.34,
                "QTY_MIN": 0,
                "QTY_MAX": 0,
                "QTY_END": -8.34,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "LST_SFD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY_MIN", "TYPE": "Decimal" },
                { "NAME": "QTY_MAX", "TYPE": "Decimal" },
                { "NAME": "QTY_END", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_WAY", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_PRC", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_RSV", "TYPE": "Decimal" },
                { "NAME": "QTY_ON_ODR", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        }
    }
}
```

# 6.报销报表 - 查询制表

## 接口信息

- **接口名称**：报销报表 - 查询制表
- **接口地址**：`POST /api/monbx/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_BXLIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.SHOW_LSIT`       | string | 显示列表标识，固定值 `"1"`                         |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"BX_DD"`（报销日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`BX_DD`（报销日期）    |
| operator      | string        | 操作符：`last_year`（去年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 报销人筛选

| 字段          | 类型    | 说明                               |
| :------------ | :------ | :--------------------------------- |
| field         | string  | 筛选字段名：`USR_NO`（请款人代号） |
| operator      | string  | 操作符：`in`（多选）               |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）        |
| value         | string  | 筛选值（传空表示全部）             |

#### [5] - 部门筛选

| 字段          | 类型    | 说明                              |
| :------------ | :------ | :-------------------------------- |
| field         | string  | 筛选字段名：`DEP`（报销部门代号） |
| operator      | string  | 操作符：`in`（多选）              |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）       |
| checkUnder    | string  | 是否包含下级，`"T"` 为是          |
| value         | string  | 筛选值（传空表示全部）            |

#### [6] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按报销日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_BXLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "USR_NO",
                "USRBX_NAME",
                "BX_DD",
                "BX_NO",
                "PAY_ID",
                "FEE_ID",
                "FEE_NAME",
                "AMTN",
                "AMTN_CHK",
                "AMTN_CJK",
                "AMTN_SH",
                "AMTN_UNSH",
                "SAL_NO",
                "SAL_NAME",
                "INV_NO",
                "REM_B",
                "REM_A"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "SHOW_LSIT": "1",
                "REPORT_DD_FIELD": "BX_DD"
            }
        },
        {
            "field": "BX_DD",
            "operator": "last_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2025-01-01", "2025-12-31"]
        },
        {
            "field": "USR_NO",
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
                "BX_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "USR_NO,USRBX_NAME,BX_DD,BX_NO,PAY_ID,FEE_ID,FEE_NAME,AMTN,AMTN_CHK,AMTN_CJK,AMTN_SH,AMTN_UNSH,SAL_NO,SAL_NAME,INV_NO,REM_B,REM_A"
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
                "BX_DD": "2025-01-06T00:00:00",
                "DEP": "00000000",
                "USR_NO": "0001",
                "USRBX_NAME": "李明",
                "BX_NO": "BXYMDD0001",
                "AMTN": 20,
                "AMTN_SH": 20,
                "AMTN_CHK": 20,
                "SAL_NO": "",
                "FEE_ID": "02",
                "FEE_NAME": "三角洲",
                "AMTN_UNSH": 20
            },
            {
                "BX_DD": "2025-05-16T00:00:00",
                "DEP": "00000000",
                "USR_NO": "95",
                "USRBX_NAME": "美味蟹黄堡",
                "REM_A": "123",
                "BX_NO": "BXYMDD0002",
                "AMTN": 70560,
                "AMTN_SH": 70560,
                "AMTN_CHK": 70560,
                "SAL_NO": "",
                "FEE_ID": "01",
                "FEE_NAME": "费用项目01",
                "REM_B": "456",
                "AMTN_UNSH": 70560
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "BX_DD", "TYPE": "DateTime" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "AMTN_CHK", "TYPE": "Decimal" },
                { "NAME": "AMTN_CJK", "TYPE": "Decimal" },
                { "NAME": "AMTN_SH", "TYPE": "Decimal" },
                { "NAME": "AMTN_UNSH", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "EXC_RTO", "TYPE": "Decimal" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "FORM_CNT", "TYPE": "Int16" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "CASN",
            "MF_YG",
            "DEPT"
        ]
    }
}
```

# 7.员工借款报表 - 查询制表

## 接口信息

- **接口名称**：员工借款报表 - 查询制表
- **接口地址**：`POST /api/monjk/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_JKLIST"`                       |
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
| showBody      | string        | 是否显示明细体，`"T"` 为是                                   |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"JK_DD"`（借款日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                            |
| :------------ | :------------ | :------------------------------ |
| field         | string        | 筛选字段名：`JK_DD`（借款日期） |
| operator      | string        | 操作符：`this_year`（今年）     |
| fieldType     | string        | 字段类型：`date`                |
| need          | boolean       | 是否必须条件：`true`（必填）    |
| fieldDisabled | boolean       | 前端是否禁用：`false`（可编辑） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD       |

#### [4] - 借款单号筛选

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`JK_NO`（借款单号） |
| operator      | string  | 操作符：`in`（多选）            |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）   |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）     |
| value         | string  | 筛选值（传空表示全部）          |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按借款日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_JKLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "REPORT_DD",
                "JK_DD",
                "JK_NO",
                "SAL_NO",
                "SAL_NAME",
                "REASON",
                "CUR_ID",
                "CUR_NAME",
                "EXC_RTO",
                "AMT",
                "AMTN",
                "AMT_BACK",
                "AMTN_BACK",
                "FEE_ID",
                "FEE_NAME",
                "CAS_NO",
                "CAS_NAME",
                "TASK_ID",
                "BACC_NO",
                "BACC_NAME",
                "BIL_NO",
                "BB_NO",
                "EST_DD",
                "DEP",
                "DEP_NAME",
                "SAL_NO1",
                "SAL_NAME1",
                "VOH_ID",
                "VOH_NO",
                "CHK_NO",
                "BOX_CHK_NO",
                "CHK_STA_NUM",
                "CHK_END_NUM",
                "CHK_KND",
                "CHK_KND_NAME",
                "END_DD",
                "BIL_TYPE",
                "BIL_TYPE_NAME",
                "SYS_DATE",
                "CLS_DATE",
                "USR_NAME",
                "CHK_MAN",
                "CHK_MAN_NAME",
                "CHK_STATUS",
                "CLS_ID",
                "REM",
                "MODIFY_DD",
                "MODIFY_MAN",
                "MODIFY_MAN_NAME"
            ]
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "JK_DD"
            }
        },
        {
            "field": "JK_DD",
            "operator": "this_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": false,
            "value": ["2026-01-01", "2026-12-31"]
        },
        {
            "field": "JK_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "JK_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "REPORT_DD,JK_DD,JK_NO,SAL_NO,SAL_NAME,REASON,CUR_ID,CUR_NAME,EXC_RTO,AMT,AMTN,AMT_BACK,AMTN_BACK,FEE_ID,FEE_NAME,CAS_NO,CAS_NAME,TASK_ID,BACC_NO,BACC_NAME,BIL_NO,BB_NO,EST_DD,DEP,DEP_NAME,SAL_NO1,SAL_NAME1,VOH_ID,VOH_NO,CHK_NO,BOX_CHK_NO,CHK_STA_NUM,CHK_END_NUM,CHK_KND,CHK_KND_NAME,END_DD,BIL_TYPE,BIL_TYPE_NAME,SYS_DATE,CLS_DATE,USR_NAME,CHK_MAN,CHK_MAN_NAME,CHK_STATUS,CLS_ID,REM,MODIFY_DD,MODIFY_MAN,MODIFY_MAN_NAME"
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
                "SAL_NO": "0001",
                "SAL_NAME": "李明",
                "JK_DD": "2026-08-12T00:00:00",
                "JK_NO": "JK26080001",
                "REASON": "KFC",
                "CUR_ID": "",
                "EXC_RTO": 1,
                "AMTN": 50,
                "BACC_NO": "01",
                "BACC_NAME": "01",
                "BB_NO": "BT26080001",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "SAL_NO1": "",
                "VOH_ID": "",
                "CHK_NO": "",
                "BIL_TYPE": "",
                "SYS_DATE": "2026-08-12T14:48:58",
                "CLS_DATE": "2026-08-12T00:00:00",
                "USR_NAME": "ADMIN",
                "CHK_MAN": "ADMIN",
                "CHK_MAN_NAME": "ADMIN",
                "CHK_STATUS": "Y"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "TASK_ID", "TYPE": "Int32" },
                { "NAME": "JK_DD", "TYPE": "DateTime" },
                { "NAME": "EXC_RTO", "TYPE": "Decimal" },
                { "NAME": "AMT", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "AMT_BACK", "TYPE": "Decimal" },
                { "NAME": "AMTN_BACK", "TYPE": "Decimal" },
                { "NAME": "EST_DD", "TYPE": "DateTime" },
                { "NAME": "END_DD", "TYPE": "DateTime" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "MODIFY_DD", "TYPE": "DateTime" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "CASN",
            "MF_YG",
            "DEPT",
            "BACC"
        ]
    }
}
```

# 8.应收票据报表 - 查询制表

## 接口信息

- **接口名称**：应收票据报表 - 查询制表
- **接口地址**：`POST /api/monCA/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_CALIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                |
| :----------------------------- | :----- | :-------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"RCV_DD"`（收票日期） |
| `fixCondition.END_DD`          | string | 到期日期（当前为空）                                |
| `fixCondition.INT_STS_LST`     | string | 内部状态列表，固定值 `"0"`                          |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`RCV_DD`（收票日期）   |
| operator      | string        | 操作符：`last_year`（去年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 票据号码筛选

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`CHK_NO`（票据号码） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）    |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [5] - 部门筛选

| 字段          | 类型    | 说明                        |
| :------------ | :------ | :-------------------------- |
| field         | string  | 筛选字段名：`DEP`（部门）   |
| operator      | string  | 操作符：`in`（多选）        |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑） |
| checkUnder    | string  | 是否包含下级，`"T"` 为是    |
| value         | string  | 筛选值（传空表示全部）      |

#### [6] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按收款日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_CALIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CHK_NO",
                "RCV_DD",
                "CHK_KND_NAME",
                "CHK_STS",
                "AMT",
                "AMTN",
                "END_DD",
                "CAH_DD",
                "BACC_NO",
                "BACC_NAME",
                "BACC_ID_CODE",
                "RP_NO",
                "CUS_NO",
                "CUS_NAME",
                "SAL_NO",
                "SAL_NAME",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "RCV_DD",
                "END_DD": "",
                "INT_STS_LST": "0"
            }
        },
        {
            "field": "RCV_DD",
            "operator": "last_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2025-01-01", "2025-12-31"]
        },
        {
            "field": "CHK_NO",
            "operator": "in",
            "fieldType": "bilNo",
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
                "RCV_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CHK_NO,RCV_DD,CHK_KND_NAME,CHK_STS,AMT,AMTN,END_DD,CAH_DD,BACC_NO,BACC_NAME,BACC_ID_CODE,RP_NO,CUS_NO,CUS_NAME,SAL_NO,SAL_NAME,REM"
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
                "CHK_NO": "ZP0001",
                "RCV_DD": "2025-02-26T00:00:00",
                "CHK_KND_NAME": "支票",
                "CHK_STS": "0",
                "AMT": 20,
                "AMTN": 20,
                "END_DD": "2025-02-26T00:00:00",
                "CAH_DD": "2025-02-26T00:00:00",
                "BACC_NAME": "01",
                "RP_NO": "RTYMDD0006",
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "SAL_NO": "",
                "REM": "",
                "BACC_NO": "01",
                "ITM": 1,
                "DEP": "00000000",
                "BIL_ID": "RT",
                "BACC_ID_CODE": "111"
            },
            {
                "CHK_NO": "ZP885632",
                "RCV_DD": "2025-02-27T00:00:00",
                "CHK_KND_NAME": "支票",
                "CHK_STS": "0",
                "AMT": 20,
                "AMTN": 20,
                "END_DD": "2025-02-28T00:00:00",
                "CAH_DD": "2025-02-28T00:00:00",
                "BACC_NAME": "01",
                "RP_NO": "RTYMDD0007",
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "SAL_NO": "",
                "REM": "",
                "BACC_NO": "01",
                "ITM": 1,
                "DEP": "00000000",
                "BIL_ID": "RT",
                "BACC_ID_CODE": "111"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "RCV_DD", "TYPE": "DateTime" },
                { "NAME": "AMT", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "END_DD", "TYPE": "DateTime" },
                { "NAME": "CAH_DD", "TYPE": "DateTime" },
                { "NAME": "EXC_RTO", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "CHK_DD", "TYPE": "DateTime" },
                { "NAME": "AMTN_DIF_CAS", "TYPE": "Decimal" },
                { "NAME": "AMT_DIF_CAS", "TYPE": "Decimal" },
                { "NAME": "AMTN_CAS", "TYPE": "Decimal" },
                { "NAME": "AMT_CAS", "TYPE": "Decimal" }
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
            "DEPT",
            "BANK",
            "BACC"
        ]
    }
}
```

# 9.应付票据报表 - 查询制表

## 接口信息

- **接口名称**：应付票据报表 - 查询制表
- **接口地址**：`POST /api/monCB/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_CBLIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                |
| :----------------------------- | :----- | :-------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"RCV_DD"`（付票日期） |
| `fixCondition.END_DD`          | string | 到期日期（当前为空）                                |
| `fixCondition.INT_STS_LST`     | string | 内部状态列表，固定值 `"0"`                          |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`RCV_DD`（付票日期）   |
| operator      | string        | 操作符：`last_year`（去年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 票据号码筛选

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`CHK_NO`（票据号码） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）    |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [5] - 部门筛选

| 字段          | 类型    | 说明                        |
| :------------ | :------ | :-------------------------- |
| field         | string  | 筛选字段名：`DEP`（部门）   |
| operator      | string  | 操作符：`in`（多选）        |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑） |
| checkUnder    | string  | 是否包含下级，`"T"` 为是    |
| value         | string  | 筛选值（传空表示全部）      |

#### [6] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按付票日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_CBLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CHK_NO",
                "RCV_DD",
                "CHK_KND_NAME",
                "CHK_STS",
                "AMT",
                "AMTN",
                "END_DD",
                "CAH_DD",
                "BACC_NO",
                "BACC_NAME",
                "BACC_ID_CODE",
                "RP_NO",
                "CUS_NO",
                "CUS_NAME",
                "SAL_NO",
                "SAL_NAME",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "RCV_DD",
                "END_DD": "",
                "INT_STS_LST": "0"
            }
        },
        {
            "field": "RCV_DD",
            "operator": "last_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2025-01-01", "2025-12-31"]
        },
        {
            "field": "CHK_NO",
            "operator": "in",
            "fieldType": "bilNo",
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
                "RCV_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CHK_NO,RCV_DD,CHK_KND_NAME,CHK_STS,AMT,AMTN,END_DD,CAH_DD,BACC_NO,BACC_NAME,BACC_ID_CODE,RP_NO,CUS_NO,CUS_NAME,SAL_NO,SAL_NAME,REM"
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
                "CHK_NO": "ZP1010",
                "RCV_DD": "2025-02-26T00:00:00",
                "CHK_STS": "D",
                "AMT": 2,
                "AMTN": 2,
                "END_DD": "2025-02-26T00:00:00",
                "CAH_DD": "2025-02-26T00:00:00",
                "BACC_NAME": "01",
                "RP_NO": "PTYMDD0002",
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "SAL_NO": "",
                "REM": "",
                "BACC_NO": "01",
                "ITM": 1,
                "DEP": "00000000",
                "BIL_ID": "PT",
                "BACC_ID_CODE": "111",
                "CHK_KND_NAME": "支票"
            },
            {
                "CHK_NO": "ZP00067",
                "RCV_DD": "2025-02-27T00:00:00",
                "CHK_STS": "D",
                "AMT": 15,
                "AMTN": 15,
                "END_DD": "2025-02-28T00:00:00",
                "CAH_DD": "2025-02-28T00:00:00",
                "BACC_NAME": "01",
                "RP_NO": "PTYMDD0003",
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "SAL_NO": "",
                "REM": "",
                "BACC_NO": "01",
                "ITM": 1,
                "DEP": "00000000",
                "BIL_ID": "PT",
                "BACC_ID_CODE": "111",
                "CHK_KND_NAME": "支票"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "RCV_DD", "TYPE": "DateTime" },
                { "NAME": "AMT", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "END_DD", "TYPE": "DateTime" },
                { "NAME": "CAH_DD", "TYPE": "DateTime" },
                { "NAME": "EXC_RTO", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" }
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
            "DEPT",
            "BANK",
            "BACC"
        ]
    }
}
```

# 10.财产目录 - 查询制表

## 接口信息

- **接口名称**：财产目录 - 查询制表
- **接口地址**：`POST /api/fixaa/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"FIXCE"`                            |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.GR_TYPE`         | string | 购入类型，固定值 `"1"`                             |
| `fixCondition.BD_TYPE`         | string | 变动类型，固定值 `"1"`                             |
| `fixCondition.BJT_TYPE`        | string | 折旧类型，固定值 `"1"`                             |
| `fixCondition.ZJ_TYPE`         | string | 折旧方法，固定值 `"2"`                             |
| `fixCondition.BQZJ_TYPE`       | string | 本期折旧类型，固定值 `"2"`                         |
| `fixCondition.BQZJFS_TYPE`     | string | 本期折旧方式，固定值 `"1"`                         |
| `fixCondition.INCLUDE_SUB`     | string | 是否包含下级，`"F"` 为否                           |
| `fixCondition.B_DD`            | string | 开始日期（当前为空）                               |
| `fixCondition.E_DD`            | string | 结束日期（当前为空）                               |
| `fixCondition.FX_NO`           | string | 资产代号（当前为空）                               |
| `fixCondition.FX_NO_B`         | string | 资产代号起（当前为空）                             |
| `fixCondition.FX_NO_E`         | string | 资产代号止（当前为空）                             |
| `fixCondition.END_DD`          | string | 截止日期（当前为空）                               |
| `fixCondition.B_DD_ZJ`         | string | 折旧开始日期（当前为 `null`）                      |
| `fixCondition.E_DD_ZJ`         | string | 折旧结束日期（当前为空）                           |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"GR_DD"`（取得日期） |

#### [3] - 截止日期条件（固定值，不参与实际筛选）

| 字段             | 类型    | 说明                               |
| :--------------- | :------ | :--------------------------------- |
| field            | string  | 筛选字段名：`END_DD`（截止日期）   |
| operator         | string  | 操作符：`equal`（等于）            |
| fieldType        | string  | 字段类型：`date`                   |
| need             | boolean | 是否必须条件：`true`（必填）       |
| fieldDisabled    | boolean | 前端是否禁用：`true`（固定不可改） |
| operatorDisabled | boolean | 操作符是否禁用：`true`             |
| value            | string  | 筛选值（传空表示全部）             |

#### [4] - 购入日期范围条件

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| field         | string        | 筛选字段名：`GR_DD`（取得日期）                              |
| operator      | string        | 操作符：`range`（区间查询）                                  |
| fieldType     | string        | 字段类型：`date`                                             |
| need          | boolean       | 是否必须条件：`true`（必填）                                 |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改）                           |
| dateOperator  | string        | 日期快捷操作：`range`                                        |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD（截止日期为 `null` 表示无结束限制） |

#### [5] 至 [7] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                      |
| :--- | :----------- | :---------------- | :---------------------------------------- |
| [5]  | `FX_NO`      | `in`              | 资产代号（多选）                          |
| [6]  | `STS_ID`     | `in`              | 资产状况（多选）                          |
| [7]  | `FX_KND`     | `in`              | 资产类别（多选），`checkUnder="T"` 含下级 |

#### [8] - 折旧日期范围条件

| 字段             | 类型          | 说明                                                       |
| :--------------- | :------------ | :--------------------------------------------------------- |
| field            | string        | 筛选字段名：`ZJ_DD`（折旧日期）                            |
| operator         | string        | 操作符：`range`（区间查询）                                |
| fieldType        | string        | 字段类型：`date`                                           |
| need             | boolean       | 是否必须条件：`true`（必填）                               |
| fieldDisabled    | boolean       | 前端是否禁用：`true`（固定不可改）                         |
| operatorDisabled | boolean       | 操作符是否禁用：`true`                                     |
| dateOperator     | string        | 日期快捷操作：`this_month`（本月）                         |
| value            | array[string] | 起止日期（起始日期为 `null` 表示无开始限制，结束日期为空） |

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按取得日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "FX_NO",
                "FX_NAME",
                "FX_SPC",
                "QTY",
                "UNIT",
                "STS_ID",
                "FX_KND_NAME",
                "USE_DEP_NAME",
                "GR_DD",
                "AMTN",
                "AMTN_JZ",
                "AMTN_SHARE",
                "AMTN_NET",
                "AMTN_REST",
                "SHARE_MTH",
                "USE_YEARS",
                "USE_MONTH",
                "ZJ_MONTH",
                "WZJ_MONTH",
                "AMTN_QQ_SHARE",
                "AMTN_BQ_SHARE",
                "AMTN_BQLJ_SHARE",
                "AMTN_NET_BQ",
                "REM",
                "ACC_NO_FX_NAME",
                "ACC_NO_FY_NAME",
                "ACC_NO_SHARE_NAME",
                "ACC_NO_CAS_NAME",
                "ACC_NO_JZ_NAME",
                "ACC_NO_QL_NAME"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "GR_TYPE": "1",
                "BD_TYPE": "1",
                "BJT_TYPE": "1",
                "ZJ_TYPE": "2",
                "BQZJ_TYPE": "2",
                "BQZJFS_TYPE": "1",
                "INCLUDE_SUB": "F",
                "B_DD": "",
                "E_DD": "",
                "FX_NO": "",
                "FX_NO_B": "",
                "FX_NO_E": "",
                "END_DD": "",
                "B_DD_ZJ": null,
                "E_DD_ZJ": "",
                "REPORT_DD_FIELD": "GR_DD"
            }
        },
        {
            "field": "END_DD",
            "operator": "equal",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "operatorDisabled": true,
            "value": ""
        },
        {
            "field": "GR_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "range",
            "value": ["2026-05-20", null]
        },
        {
            "field": "FX_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "STS_ID",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "FX_KND",
            "operator": "in",
            "fieldDisabled": false,
            "checkUnder": "T",
            "value": ""
        },
        {
            "field": "ZJ_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "operatorDisabled": true,
            "dateOperator": "this_month",
            "value": [null, ""]
        },
        {
            "orderBy": {
                "GR_DD": "asc"
            }
        }
    ],
    "PGM": "FIXCE",
    "DISPLAY_FIELDS": "FX_NO,FX_NAME,FX_SPC,QTY,UNIT,STS_ID,FX_KND_NAME,USE_DEP_NAME,GR_DD,AMTN,AMTN_JZ,AMTN_SHARE,AMTN_NET,AMTN_REST,SHARE_MTH,USE_YEARS,USE_MONTH,ZJ_MONTH,WZJ_MONTH,AMTN_QQ_SHARE,AMTN_BQ_SHARE,AMTN_BQLJ_SHARE,AMTN_NET_BQ,REM,ACC_NO_FX_NAME,ACC_NO_FY_NAME,ACC_NO_SHARE_NAME,ACC_NO_CAS_NAME,ACC_NO_JZ_NAME,ACC_NO_QL_NAME"
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
                "TRS_DSC1": "",
                "FX_NO": "019",
                "FX_NAME": "好好好",
                "FX_SPC": "",
                "UNIT": "KG",
                "QTY": 1,
                "STS_ID": "1",
                "FX_KND": "002",
                "FX_KND_NAME": "当月折旧",
                "USE_DEP_NAME": "First Department;First Department;分公司01;公司02",
                "GR_DD": "2026-05-20T00:00:00",
                "PC_DD": "2026-05-20T00:00:00",
                "SYS_DATE": "2026-05-20T11:39:17",
                "CLS_DATE": "2026-05-20T00:00:00",
                "AMTN_OLD": 200,
                "AMTN": 200,
                "AMTN_JZ": 0,
                "AMTN_SHARE": 0,
                "AMTN_REST": 0,
                "AMTN_NET": 200,
                "SHARE_MTH": "1",
                "USE_YEARS": 1,
                "USE_MONTH": 0,
                "ZJ_MONTH": 0,
                "WZJ_MONTH": 12,
                "GET_DD": "2026-06-01T00:00:00",
                "DIS_DD": "2026-05-31T00:00:00",
                "SHARE_END_DD": "2027-05-01T00:00:00",
                "REM": "",
                "AMTN_BASE": 200,
                "AMTN_QQ_SHARE": 0,
                "AMTN_BQ_SHARE": 0,
                "AMTN_BQLJ_SHARE": 0,
                "AMTN_NET_BQ": 200
            },
            {
                "TRS_DSC1": "",
                "FX_NO": "001-006",
                "FX_NAME": "金铲铲",
                "FX_SPC": "JCC",
                "UNIT": "KG",
                "QTY": 3,
                "STS_ID": "8",
                "FX_KND": "002",
                "FX_KND_NAME": "当月折旧",
                "USE_DEP_NAME": "分公司01",
                "GR_DD": "2026-06-25T00:00:00",
                "PC_DD": "2026-06-25T00:00:00",
                "SYS_DATE": "2026-06-25T14:19:20",
                "CLS_DATE": "2026-06-25T00:00:00",
                "AMTN_OLD": 6000,
                "AMTN": 6000,
                "AMTN_JZ": 0,
                "AMTN_SHARE": -78.3333,
                "AMTN_REST": 360,
                "AMTN_NET": 6078.3333,
                "SHARE_MTH": "1",
                "USE_YEARS": 2,
                "ZJ_MONTH": 0,
                "WZJ_MONTH": 24,
                "GET_DD": "2026-06-01T00:00:00",
                "DIS_DD": "2026-05-31T00:00:00",
                "SHARE_END_DD": "2028-05-01T00:00:00",
                "REM": "123",
                "AMTN_BASE": 5640,
                "AMTN_QQ_SHARE": -78.3333,
                "AMTN_BQ_SHARE": 0,
                "AMTN_BQLJ_SHARE": -78.3333,
                "AMTN_NET_BQ": 6078.3333
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "GR_DD", "TYPE": "DateTime" },
                { "NAME": "PC_DD", "TYPE": "DateTime" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "AMTN_OLD", "TYPE": "Decimal" },
                { "NAME": "AMTN", "TYPE": "Decimal" },
                { "NAME": "AMTN_JZ", "TYPE": "Decimal" },
                { "NAME": "AMTN_SHARE", "TYPE": "Decimal" },
                { "NAME": "AMTN_REST", "TYPE": "Decimal" },
                { "NAME": "AMTN_NET", "TYPE": "Decimal" },
                { "NAME": "USE_YEARS", "TYPE": "Int16" },
                { "NAME": "USE_MONTH", "TYPE": "Int16" },
                { "NAME": "ZJ_MONTH", "TYPE": "Int16" },
                { "NAME": "WZJ_MONTH", "TYPE": "Int16" },
                { "NAME": "GET_DD", "TYPE": "DateTime" },
                { "NAME": "DIS_DD", "TYPE": "DateTime" },
                { "NAME": "SHARE_END_DD", "TYPE": "DateTime" },
                { "NAME": "AMTN_BASE", "TYPE": "Decimal" },
                { "NAME": "AMTN_QQ_SHARE", "TYPE": "Decimal" },
                { "NAME": "AMTN_BQ_SHARE", "TYPE": "Decimal" },
                { "NAME": "AMTN_BQLJ_SHARE", "TYPE": "Decimal" },
                { "NAME": "AMTN_NET_BQ", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_FX",
            "CASN",
            "MF_YG",
            "DEPT"
        ]
    }
}
```

# 11.领退补料报表 - 查询制表

## 接口信息

- **接口名称**：领退补料报表 - 查询制表
- **接口地址**：`POST /api/mrpag/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_MLLIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                   |
| :----------------------------- | :----- | :----------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"ML_DD"`（领退补料日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`ML_DD`（领料日期）    |
| operator      | string        | 操作符：`last_year`（去年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] 至 [6] - 动态筛选条件（均为可选）

| 索引 | 字段 (field) | 操作符 (operator) | 说明                                      |
| :--- | :----------- | :---------------- | :---------------------------------------- |
| [4]  | `CUS_NO`     | `in`              | 厂商代号（多选），`checkUnder="T"` 含下级 |
| [5]  | `DEP`        | `in`              | 生产部门（多选），`checkUnder="T"` 含所属 |
| [6]  | `CHK_STATUS` | `equal`           | 审核状态（精确匹配，如 `'Y'`/`'N'`）      |

> **传参说明**：以上条件若不限制，请传 `"value": ""` 或空数组，表示"全部"。

#### [7] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按领料日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_MLLIST",
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
                "ML_DD",
                "ML_NO",
                "PRD_NO",
                "PRD_NAME",
                "BAT_NO",
                "QTY",
                "UNIT",
                "CST",
                "CST_STD",
                "WH_NAME",
                "CHUW_NAME",
                "TZ_NO",
                "MO_NO",
                "QL_NO",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "ML_DD"
            }
        },
        {
            "field": "ML_DD",
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
            "field": "CHK_STATUS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "ML_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,ML_DD,ML_NO,PRD_NO,PRD_NAME,BAT_NO,QTY,UNIT,CST,CST_STD,WH_NAME,CHUW_NAME,TZ_NO,MO_NO,QL_NO,REM"
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
                "ML_DD": "2025-03-07T00:00:00",
                "ML_NO": "MLYMDD0008",
                "MLID": "ML",
                "MO_NO": "MOYMDD0017",
                "TZ_NO": "TZYMDD0033",
                "QL_NO": "",
                "PRD_NO": "01",
                "PRD_MARK": "",
                "PRD_NAME": "米奇妙妙屋",
                "WH_NAME": "仓库02",
                "QTY": 1,
                "CST": 0,
                "CST_STD": 0,
                "UNIT": "个",
                "DEP": "00000000",
                "CHK_STATUS": "Y"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "ML_DD", "TYPE": "DateTime" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY1", "TYPE": "Decimal" },
                { "NAME": "QTY_FIN", "TYPE": "Decimal" },
                { "NAME": "QTY_LEFT", "TYPE": "Decimal" },
                { "NAME": "QTY_OVER", "TYPE": "Decimal" },
                { "NAME": "CST", "TYPE": "Decimal" },
                { "NAME": "CST_STD", "TYPE": "Decimal" },
                { "NAME": "AMT", "TYPE": "Decimal" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "TASK_ID", "TYPE": "Int32" },
                { "NAME": "EST_ITM", "TYPE": "Int32" },
                { "NAME": "UP_STD", "TYPE": "Decimal" },
                { "NAME": "PAK_EXC", "TYPE": "Decimal" },
                { "NAME": "PAK_NW", "TYPE": "Decimal" },
                { "NAME": "PAK_GW", "TYPE": "Decimal" },
                { "NAME": "PAK_MEAST", "TYPE": "Decimal" },
                { "NAME": "QTY_MRP", "TYPE": "Decimal" },
                { "NAME": "QTY_STD", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_ML",
            "TF_ML",
            "CUST",
            "CASN",
            "MF_YG",
            "DEPT",
            "PRDT",
            "INDX",
            "MY_WH",
            "AREA",
            "MARK"
        ]
    }
}
```

# 12.单位成本分析表 - 查询制表

## 接口信息

- **接口名称**：单位成本分析表 - 查询制表
- **接口地址**：`POST /api/mrpcf/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPCF"`                            |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                |
| :----------------------------- | :----- | :-------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"BIL_DD"`（单据日期） |
| `fixCondition.COMBOFCP`        | string | 组合字段标识，固定值 `"1"`                          |
| `fixCondition.COMBOUNIT`       | string | 组合单位标识，固定值 `"1"`                          |
| `fixCondition.CHKPRDT_CST`     | string | 是否检查产品成本，`"F"` 为否                        |
| `fixCondition.WASTERCHANGE`    | string | 报废变更标识（当前为空）                            |
| `fixCondition.COMBODATE`       | string | 日期组合标识，固定值 `"1"`                          |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`BIL_DD`（单据日期）   |
| operator      | string        | 操作符：`this_year`（今年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 产品筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`PRD_NO`（生产货品） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPCF",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "BIL_NO",
                "PRD_NO",
                "PRD_NAME",
                "SPC",
                "UNIT_NAME",
                "QTY",
                "CST_PRD1",
                "CST_PRD1_RT",
                "CST_MAN",
                "CST_MAN_RT",
                "CST_MAKE",
                "CST_MK_RT",
                "CST_OUT",
                "CST_OUT_RT",
                "CST_PRD2",
                "CST_PRD2_RT",
                "CST",
                "UP"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "BIL_DD",
                "COMBOFCP": "1",
                "COMBOUNIT": "1",
                "CHKPRDT_CST": "F",
                "WASTERCHANGE": "",
                "COMBODATE": "1"
            }
        },
        {
            "field": "BIL_DD",
            "operator": "this_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-01-01", "2026-12-31"]
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "BIL_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "BIL_NO,PRD_NO,PRD_NAME,SPC,UNIT_NAME,QTY,CST_PRD1,CST_PRD1_RT,CST_MAN,CST_MAN_RT,CST_MAKE,CST_MK_RT,CST_OUT,CST_OUT_RT,CST_PRD2,CST_PRD2_RT,CST,UP"
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
                "CST": 280,
                "UP": 280,
                "CST_MK_RT": 32.142857,
                "CST_MAN_RT": 25,
                "CST_OUT_RT": 0,
                "CST_PRD1_RT": 0,
                "CST_PRD2_RT": 42.857143,
                "BIL_DD": "2026-07-15T00:00:00",
                "BIL_ID": "MM",
                "BIL_NO": "MMYMDD0006",
                "PRD_NO": "000",
                "PRD_MARK": "",
                "PRD_NAME": "原油",
                "SPC": "华为三折叠，怎么叠都有面",
                "UNIT_NAME": "KG",
                "QTY": 1,
                "CST_MAKE": 90,
                "CST_MAN": 70,
                "CST_OUT": 0,
                "CST_PRD2": 120,
                "CST_PRD1": 0,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "CST", "TYPE": "Decimal" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "CST_MK_RT", "TYPE": "Decimal" },
                { "NAME": "CST_MAN_RT", "TYPE": "Decimal" },
                { "NAME": "CST_OUT_RT", "TYPE": "Decimal" },
                { "NAME": "CST_PRD1_RT", "TYPE": "Decimal" },
                { "NAME": "CST_PRD2_RT", "TYPE": "Decimal" },
                { "NAME": "BIL_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "CST_MAKE", "TYPE": "Decimal" },
                { "NAME": "CST_MAN", "TYPE": "Decimal" },
                { "NAME": "CST_OUT", "TYPE": "Decimal" },
                { "NAME": "CST_PRD2", "TYPE": "Decimal" },
                { "NAME": "CST_PRD1", "TYPE": "Decimal" },
                { "NAME": "USED_TIME", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        }
    }
}
```

# 13.人事资料分析表 - 查询制表

## 接口信息

- **接口名称**：人事资料分析表 - 查询制表
- **接口地址**：`POST /api/rptwagyg/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_WAGYG0"`                       |
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

#### [1] - 展示字段配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showBody      | string        | 是否显示明细体，`"T"` 为是                                   |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                         | 类型   | 说明                           |
| :--------------------------- | :----- | :----------------------------- |
| `fixCondition.CALC_IN_DAY`   | string | 计算入职天数标识，固定值 `"1"` |
| `fixCondition.CALC_RESET_DD` | string | 计算离职日期标识，固定值 `"1"` |

#### [3] - 员工筛选

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`YG_NO`（员工代号） |
| operator      | string  | 操作符：`in`（多选）            |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）     |
| value         | string  | 筛选值（传空表示全部）          |

#### [4] - 部门筛选

| 字段          | 类型    | 说明                          |
| :------------ | :------ | :---------------------------- |
| field         | string  | 筛选字段名：`DEP`（所属部门） |
| operator      | string  | 操作符：`in`（多选）          |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）   |
| checkUnder    | string  | 是否包含下级，`"T"` 为是      |
| value         | string  | 筛选值（传空表示全部）        |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_WAGYG0",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "YG_NO",
                "NAME",
                "DEP",
                "DEP_NAME",
                "DEP_ORG",
                "DEP_ORG_NAME",
                "YG_NO_UP",
                "YG_NO_UP_NAME",
                "LV_NO",
                "LV_NO_NAME",
                "IN_DAY",
                "TEST_OK_DAY",
                "HT_NO",
                "CONTRACT_DD",
                "OUT_DAY",
                "CZ_ID",
                "RESET_DD",
                "RESET_REASON",
                "YG_TEST_T",
                "OUT_DAY_TYPE",
                "YG_NZ",
                "ID_USR",
                "ID_USR_NAME",
                "ENG_NAME",
                "SEX_ID",
                "BTH_DAY",
                "MARRY_ID",
                "OTH_COUNTRY",
                "BTH_PLS",
                "ID_NO",
                "SFZ_BDD",
                "SFZ_EDD",
                "STUDY_LEVEL",
                "GRAD_SCH",
                "STYDY_PR",
                "POS_NAME",
                "CG_NO",
                "CG_NO_NAME",
                "WORK_KIND",
                "YGXZ",
                "CNT_TEL1",
                "CNT_TEL2",
                "EMAIL",
                "BANK1_NO",
                "BANK1_NO_NAME",
                "BACC1_NO",
                "ADR2",
                "ADR1",
                "LANG_LEVEL1",
                "LANG_LEVEL2",
                "LANG_LEVEL3",
                "LANG_LEVEL4",
                "CELL_NO",
                "REL_NAME",
                "TEL",
                "ADR",
                "TEL_WORK",
                "CONTACT_MAN1",
                "CELL_NO1",
                "REL_NAME1",
                "TEL1",
                "ADR3",
                "TEL_WORK1",
                "IS_CUST",
                "LOGON",
                "USR",
                "USR_NAME",
                "SYS_DATE",
                "MODIFY_MAN",
                "MODIFY_MAN_NAME",
                "MODIFY_DD",
                "PRT_USR",
                "PRT_USR_NAME",
                "PRT_DATE",
                "CHK_STATUS",
                "YG_INT"
            ]
        },
        {
            "fixCondition": {
                "CALC_IN_DAY": "1",
                "CALC_RESET_DD": "1"
            }
        },
        {
            "field": "YG_NO",
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
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "YG_NO,NAME,DEP,DEP_NAME,DEP_ORG,DEP_ORG_NAME,YG_NO_UP,YG_NO_UP_NAME,LV_NO,LV_NO_NAME,IN_DAY,TEST_OK_DAY,HT_NO,CONTRACT_DD,OUT_DAY,CZ_ID,RESET_DD,RESET_REASON,YG_TEST_T,OUT_DAY_TYPE,YG_NZ,ID_USR,ID_USR_NAME,ENG_NAME,SEX_ID,BTH_DAY,MARRY_ID,OTH_COUNTRY,BTH_PLS,ID_NO,SFZ_BDD,SFZ_EDD,STUDY_LEVEL,GRAD_SCH,STYDY_PR,POS_NAME,CG_NO,CG_NO_NAME,WORK_KIND,YGXZ,CNT_TEL1,CNT_TEL2,EMAIL,BANK1_NO,BANK1_NO_NAME,BACC1_NO,ADR2,ADR1,LANG_LEVEL1,LANG_LEVEL2,LANG_LEVEL3,LANG_LEVEL4,CELL_NO,REL_NAME,TEL,ADR,TEL_WORK,CONTACT_MAN1,CELL_NO1,REL_NAME1,TEL1,ADR3,TEL_WORK1,IS_CUST,LOGON,USR,USR_NAME,SYS_DATE,MODIFY_MAN,MODIFY_MAN_NAME,MODIFY_DD,PRT_USR,PRT_USR_NAME,PRT_DATE,CHK_STATUS,YG_INT"
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
                "DEP_ORG": "00000000",
                "DEP_ORG_NAME": "First Department",
                "YG_NO": "9999",
                "NAME": "test",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "LV_NO": "",
                "LV_NO_NAME": "",
                "IN_DAY": "2024-01-01T00:00:00",
                "YG_TEST_T": "F",
                "OUT_DAY_TYPE": "1",
                "YG_NZ": "2年8月",
                "ID_USR": "9999",
                "ID_USR_NAME": "test",
                "SEX_ID": "T",
                "MARRY_ID": "F",
                "CNT_TEL1": "",
                "EMAIL": "",
                "LOGON": "T",
                "YG_INT": 1,
                "USR": "ADMIN",
                "USR_NAME": "ADMIN",
                "SYS_DATE": "2024-01-24T13:50:56",
                "MODIFY_DD": "2025-08-11T16:54:47.733",
                "MODIFY_MAN": "ADMIN",
                "MODIFY_MAN_NAME": "ADMIN",
                "CHK_STATUS": "Y"
            },
            {
                "DEP_ORG": "00000000",
                "DEP_ORG_NAME": "First Department",
                "YG_NO": "95",
                "NAME": "美味蟹黄堡",
                "YG_NO_UP": "9999",
                "YG_NO_UP_NAME": "test",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "LV_NO": "",
                "LV_NO_NAME": "",
                "IN_DAY": "2024-01-29T00:00:00",
                "YG_TEST_T": "F",
                "OUT_DAY_TYPE": "1",
                "YG_NZ": "2年8月",
                "ID_USR": "95",
                "ID_USR_NAME": "美味蟹黄堡",
                "SEX_ID": "T",
                "MARRY_ID": "F",
                "CNT_TEL1": "",
                "EMAIL": "xiesx@amtxts.com",
                "LOGON": "T",
                "YG_INT": 1,
                "USR": "ADMIN",
                "USR_NAME": "ADMIN",
                "SYS_DATE": "2024-01-29T10:07:43",
                "CHK_STATUS": "Y"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "IN_DAY", "TYPE": "DateTime" },
                { "NAME": "TEST_OK_DAY", "TYPE": "DateTime" },
                { "NAME": "CONTRACT_DD", "TYPE": "DateTime" },
                { "NAME": "OUT_DAY", "TYPE": "DateTime" },
                { "NAME": "RESET_DD", "TYPE": "DateTime" },
                { "NAME": "BTH_DAY", "TYPE": "DateTime" },
                { "NAME": "SFZ_BDD", "TYPE": "DateTime" },
                { "NAME": "SFZ_EDD", "TYPE": "DateTime" },
                { "NAME": "YG_INT", "TYPE": "Int32" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "MODIFY_DD", "TYPE": "DateTime" },
                { "NAME": "PRT_DATE", "TYPE": "DateTime" }
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

# 14.员工明细表 - 查询制表

## 接口信息

- **接口名称**：员工明细表 - 查询制表
- **接口地址**：`POST /api/rptwagyg/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_WAGYG"`                        |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                  |
| :----------------------------- | :----- | :---------------------------------------------------- |
| `fixCondition.CALC_IN_DAY`     | string | 计算入职天数标识，固定值 `"1"`                        |
| `fixCondition.CALC_RESET_DD`   | string | 计算离职日期标识，固定值 `"1"`                        |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"SYS_DATE"`（系统日期） |

#### [3] - 员工筛选（可选）

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`YG_NO`（员工代号） |
| operator      | string  | 操作符：`in`（多选）            |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）     |
| value         | string  | 筛选值（传空表示全部）          |

#### [4] - 部门筛选（可选）

| 字段          | 类型    | 说明                          |
| :------------ | :------ | :---------------------------- |
| field         | string  | 筛选字段名：`DEP`（所属部门） |
| operator      | string  | 操作符：`in`（多选）          |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）   |
| checkUnder    | string  | 是否包含下级，`"T"` 为是      |
| value         | string  | 筛选值（传空表示全部）        |

#### [5] - 离职状态筛选（可选）

| 字段          | 类型    | 说明                                   |
| :------------ | :------ | :------------------------------------- |
| field         | string  | 筛选字段名：`OUT_DAY_TYPE`（在职状态） |
| operator      | string  | 操作符：`equal`（等于）                |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）            |
| value         | string  | 筛选值（传空表示全部，`"1"`=在职）     |

#### [6] - 审核状态筛选（可选）

| 字段          | 类型    | 说明                                               |
| :------------ | :------ | :------------------------------------------------- |
| field         | string  | 筛选字段名：`CHK_STATUS`（审核状态）               |
| operator      | string  | 操作符：`equal`（等于）                            |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）                        |
| value         | string  | 筛选值（传空表示全部，`"Y"`=已审核，`"N"`=未审核） |

#### [7] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_WAGYG",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "YG_NO",
                "NAME",
                "YG_NO_UP_NAME",
                "DEP_NAME",
                "IN_DAY",
                "HT_NO",
                "CONTRACT_DD",
                "YG_TEST_T",
                "OUT_DAY_TYPE",
                "YG_NZ",
                "SEX_ID",
                "BTH_DAY",
                "BTH_PLS",
                "STYDY_PR",
                "POS_NAME",
                "CG_NO_NAME",
                "WORK_KIND",
                "YGXZ"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "CALC_IN_DAY": "1",
                "CALC_RESET_DD": "1",
                "REPORT_DD_FIELD": "SYS_DATE"
            }
        },
        {
            "field": "YG_NO",
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
            "field": "OUT_DAY_TYPE",
            "operator": "equal",
            "fieldDisabled": false,
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
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "YG_NO,NAME,YG_NO_UP_NAME,DEP_NAME,IN_DAY,HT_NO,CONTRACT_DD,YG_TEST_T,OUT_DAY_TYPE,YG_NZ,SEX_ID,BTH_DAY,BTH_PLS,STYDY_PR,POS_NAME,CG_NO_NAME,WORK_KIND,YGXZ"
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
                "DEP_ORG": "00000000",
                "YG_NO": "9999",
                "NAME": "test",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "IN_DAY": "2024-01-01T00:00:00",
                "YG_TEST_T": "F",
                "OUT_DAY_TYPE": "1",
                "YG_NZ": "2年8月",
                "SEX_ID": "T",
                "YG_INT": 1,
                "SYS_DATE": "2024-01-24T13:50:56",
                "CHK_STATUS": "Y"
            },
            {
                "DEP_ORG": "00000000",
                "YG_NO": "95",
                "NAME": "美味蟹黄堡",
                "YG_NO_UP_NAME": "test",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "IN_DAY": "2024-01-29T00:00:00",
                "YG_TEST_T": "F",
                "OUT_DAY_TYPE": "1",
                "YG_NZ": "2年8月",
                "SEX_ID": "T",
                "YG_INT": 1,
                "SYS_DATE": "2024-01-29T10:07:43",
                "CHK_STATUS": "Y"
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "IN_DAY", "TYPE": "DateTime" },
                { "NAME": "TEST_OK_DAY", "TYPE": "DateTime" },
                { "NAME": "CONTRACT_DD", "TYPE": "DateTime" },
                { "NAME": "OUT_DAY", "TYPE": "DateTime" },
                { "NAME": "RESET_DD", "TYPE": "DateTime" },
                { "NAME": "BTH_DAY", "TYPE": "DateTime" },
                { "NAME": "SFZ_BDD", "TYPE": "DateTime" },
                { "NAME": "SFZ_EDD", "TYPE": "DateTime" },
                { "NAME": "YG_INT", "TYPE": "Int32" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "MODIFY_DD", "TYPE": "DateTime" }
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

# 15.送货单报表 - 查询制表

## 接口信息

- **接口名称**：送货单报表 - 查询制表
- **接口地址**：`POST /api/scmdrpti/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REPTILIST"`                        |
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
| showBody      | string        | 是否显示明细体，`"T"` 为是                                   |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"TI_DD"`（送货日期） |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`TI_DD`（送货日期）    |
| operator      | string        | 操作符：`this_year`（今年）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 送货单号筛选（可选）

| 字段             | 类型    | 说明                               |
| :--------------- | :------ | :--------------------------------- |
| field            | string  | 筛选字段名：`TI_NO`（送货单号）    |
| operator         | string  | 操作符：`contain`（包含/模糊匹配） |
| fieldType        | string  | 字段类型：`bilNo`（单据编号）      |
| fieldDisabled    | boolean | 是否禁用：`false`（可编辑）        |
| operatorDisabled | boolean | 操作符是否禁用：`true`             |
| value            | string  | 筛选值（传空表示全部）             |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按送货日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REPTILIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "REPORT_DD",
                "TI_DD",
                "TI_NO",
                "CUS_NO",
                "CUS_SNM",
                "CUS_NAME",
                "OS_ID",
                "OS_NO",
                "BAT_NO",
                "BAT_NAME",
                "BIL_ID",
                "BIL_NO",
                "CHK_STATUS",
                "CHK_MAN",
                "CHK_MAN_NAME",
                "CANCEL_ID",
                "FREE_ID",
                "CLS_DATE",
                "REM_H",
                "MODIFY_DD",
                "MODIFY_MAN",
                "MODIFY_MAN_NAME",
                "CLOSE_ID",
                "SL_NO",
                "CUS_OS_NO",
                "ITM",
                "PRD_NO",
                "PRD_NAME",
                "BAT_NO_B",
                "BAT_NAME_B",
                "WH",
                "WH_NAME",
                "UNIT_NAME",
                "QTY",
                "QTY1",
                "QTY_RTN",
                "QTY_RTN_UNSH",
                "QTY_UNPS",
                "QTY_PS",
                "QTY_PS_UNSH",
                "QTY_RCK",
                "QTY_RCK_UNSH",
                "QTY_CUS",
                "CHKTY_ID",
                "B_DD",
                "E_DD",
                "NAME_ENG",
                "REM",
                "CUS_OS_NO_B",
                "SAL_NO",
                "SAL_NAME",
                "PRD_MARK",
                "A001",
                "SPC",
                "DEP",
                "DEP_NAME",
                "BIL_TYPE",
                "BIL_TYPE_NAME",
                "ID_NO",
                "VALID_DD",
                "CNT_NEED",
                "CNT_FLAG",
                "CAS_NO",
                "CAS_NAME"
            ]
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "TI_DD"
            }
        },
        {
            "field": "TI_DD",
            "operator": "this_year",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-01-01", "2026-12-31"]
        },
        {
            "field": "TI_NO",
            "operator": "contain",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "operatorDisabled": true,
            "value": ""
        },
        {
            "orderBy": {
                "TI_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "REPORT_DD,TI_DD,TI_NO,CUS_NO,CUS_SNM,CUS_NAME,OS_ID,OS_NO,BAT_NO,BAT_NAME,BIL_ID,BIL_NO,CHK_STATUS,CHK_MAN,CHK_MAN_NAME,CANCEL_ID,FREE_ID,CLS_DATE,REM_H,MODIFY_DD,MODIFY_MAN,MODIFY_MAN_NAME,CLOSE_ID,SL_NO,CUS_OS_NO,ITM,PRD_NO,PRD_NAME,BAT_NO_B,BAT_NAME_B,WH,WH_NAME,UNIT_NAME,QTY,QTY1,QTY_RTN,QTY_RTN_UNSH,QTY_UNPS,QTY_PS,QTY_PS_UNSH,QTY_RCK,QTY_RCK_UNSH,QTY_CUS,CHKTY_ID,B_DD,E_DD,NAME_ENG,REM,CUS_OS_NO_B,SAL_NO,SAL_NAME,PRD_MARK,A001,SPC,DEP,DEP_NAME,BIL_TYPE,BIL_TYPE_NAME,ID_NO,VALID_DD,CNT_NEED,CNT_FLAG,CAS_NO,CAS_NAME"
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
                "TI_DD": "2026-03-09T00:00:00",
                "TI_NO": "TIYMDD0002",
                "TI_ID": "TI",
                "ITM": 1,
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "CUS_SNM": "01",
                "PRD_NO": "02",
                "PRD_NAME": "02",
                "UNIT_NAME": "01",
                "WH": "01",
                "WH_NAME": "成品仓",
                "SAL_NO": "",
                "PRD_MARK": "",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "FREE_ID": "否",
                "CLOSE_ID": "F",
                "CLS_DATE": "2026-03-09T00:00:00",
                "CHK_MAN": "ADMIN",
                "CHK_MAN_NAME": "ADMIN",
                "CHK_STATUS": "Y",
                "CANCEL_ID": "",
                "QTY": 1,
                "QTY_UNPS": 1,
                "CHKTY_ID": "T",
                "CNT_NEED": "F",
                "BAT_NO_B": "",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "TI_DD", "TYPE": "DateTime" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "VALID_DD", "TYPE": "DateTime" },
                { "NAME": "B_DD", "TYPE": "DateTime" },
                { "NAME": "E_DD", "TYPE": "DateTime" },
                { "NAME": "MODIFY_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY1", "TYPE": "Decimal" },
                { "NAME": "QTY_RTN", "TYPE": "Decimal" },
                { "NAME": "QTY_RTN_UNSH", "TYPE": "Decimal" },
                { "NAME": "QTY_UNPS", "TYPE": "Decimal" },
                { "NAME": "QTY_PS", "TYPE": "Decimal" },
                { "NAME": "QTY_PS_UNSH", "TYPE": "Decimal" },
                { "NAME": "QTY_RCK", "TYPE": "Decimal" },
                { "NAME": "QTY_RCK_UNSH", "TYPE": "Decimal" },
                { "NAME": "QTY_CUS", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_TI",
            "TF_TI",
            "MY_WH",
            "CUST",
            "DEPT",
            "PRDT",
            "MF_YG",
            "AREA",
            "INDX",
            "MARK"
        ]
    }
}
```

# 16.采购交货状况表 - 查询制表

## 接口信息

- **接口名称**：采购交货状况表 - 查询制表
- **接口地址**：`POST /api/InvPoPcStatus/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"INVPOPCSTATUS"`                    |
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

#### [1] - 展示字段配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showBody      | string        | 是否显示明细体，`"T"` 为是                                   |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                   | 类型   | 说明                   |
| :--------------------- | :----- | :--------------------- |
| `fixCondition.SH_TYPE` | string | 显示类型，固定值 `"T"` |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`OS_DD`（采购日期）    |
| operator      | string        | 操作符：`last_week`（上周）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 采购单号筛选（可选）

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`OS_NO`（采购单号） |
| operator      | string  | 操作符：`in`（多选）            |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）   |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）     |
| value         | string  | 筛选值（传空表示全部）          |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按采购日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "INVPOPCSTATUS",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "REPORT_DD",
                "OS_DD",
                "OS_NO",
                "CUS_NO",
                "CUS_NAME",
                "SNM",
                "CLS_STATUS",
                "PRD_NO",
                "PRD_NAME",
                "NAME_ENG",
                "SPC",
                "IDX1",
                "QTY",
                "QTY1",
                "UNIT",
                "UP",
                "UP_QTY1",
                "BAT_NO",
                "EST_DD",
                "QTY_RK",
                "QTY_PENDING_QC",
                "QTY_NOT_QC",
                "QTY_QC_OK",
                "QTY_QC_FAILING",
                "QTY_QC_BACK",
                "QTY_IN",
                "QTY_QC_NOT_IN",
                "QTY_BACK",
                "QTY_LATER",
                "QTY_AHEAD",
                "QTY_PRE",
                "QTY_NOT_COME",
                "SUP_PRD_NO",
                "MRP_NOS",
                "MRP_NAME",
                "MRP_SPC",
                "MARK_NAME",
                "QT_NO",
                "REM",
                "CUS_OS_NO"
            ]
        },
        {
            "fixCondition": {
                "SH_TYPE": "T"
            }
        },
        {
            "field": "OS_DD",
            "operator": "last_week",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-08-03", "2026-08-09"]
        },
        {
            "field": "OS_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "OS_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "REPORT_DD,OS_DD,OS_NO,CUS_NO,CUS_NAME,SNM,CLS_STATUS,PRD_NO,PRD_NAME,NAME_ENG,SPC,IDX1,QTY,QTY1,UNIT,UP,UP_QTY1,BAT_NO,EST_DD,QTY_RK,QTY_PENDING_QC,QTY_NOT_QC,QTY_QC_OK,QTY_QC_FAILING,QTY_QC_BACK,QTY_IN,QTY_QC_NOT_IN,QTY_BACK,QTY_LATER,QTY_AHEAD,QTY_PRE,QTY_NOT_COME,SUP_PRD_NO,MRP_NOS,MRP_NAME,MRP_SPC,MARK_NAME,QT_NO,REM,CUS_OS_NO"
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
                "OS_DD": "2026-08-03T00:00:00",
                "OS_NO": "PO26080001",
                "CUS_NO": "03",
                "CUS_NAME": "VIVO",
                "SNM": "VIVO",
                "CLS_STATUS": "N",
                "PRD_NO": "01",
                "PRD_NAME": "米奇妙妙屋",
                "SPC": "地对地导弹多多多多多多多多",
                "IDX1": "0000000000",
                "QTY": 10,
                "QTY1": 50,
                "UNIT": "个",
                "EST_DD": "2028-07-31T00:00:00",
                "QTY_RK": 0,
                "QTY_PENDING_QC": 0,
                "QTY_NOT_QC": 0,
                "QTY_QC_OK": 0,
                "QTY_QC_FAILING": 0,
                "QTY_QC_BACK": 0,
                "QTY_IN": 0,
                "QTY_QC_NOT_IN": 0,
                "QTY_BACK": 0,
                "QTY_LATER": 0,
                "QTY_AHEAD": 0,
                "QTY_PRE": 0,
                "QTY_NOT_COME": 10,
                "MRP_NAME": "米奇妙妙屋",
                "QT_NO": "SO26080001",
                "CUS_OS_NO": "",
                "UP": 0,
                "UP_QTY1": 0,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "OS_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY1", "TYPE": "Decimal" },
                { "NAME": "EST_DD", "TYPE": "DateTime" },
                { "NAME": "QTY_RK", "TYPE": "Decimal" },
                { "NAME": "QTY_PENDING_QC", "TYPE": "Decimal" },
                { "NAME": "QTY_NOT_QC", "TYPE": "Decimal" },
                { "NAME": "QTY_QC_OK", "TYPE": "Decimal" },
                { "NAME": "QTY_QC_FAILING", "TYPE": "Decimal" },
                { "NAME": "QTY_QC_BACK", "TYPE": "Decimal" },
                { "NAME": "QTY_IN", "TYPE": "Decimal" },
                { "NAME": "QTY_QC_NOT_IN", "TYPE": "Decimal" },
                { "NAME": "QTY_BACK", "TYPE": "Decimal" },
                { "NAME": "QTY_LATER", "TYPE": "Decimal" },
                { "NAME": "QTY_AHEAD", "TYPE": "Decimal" },
                { "NAME": "QTY_PRE", "TYPE": "Decimal" },
                { "NAME": "QTY_NOT_COME", "TYPE": "Decimal" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "UP_QTY1", "TYPE": "Decimal" },
                { "NAME": "EST_ITM", "TYPE": "Int32" },
                { "NAME": "PRE_ITM", "TYPE": "Int32" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "TF_POS",
            "MF_POS",
            "PRDT",
            "MARK",
            "CUST",
            "INDX",
            "AREA"
        ]
    }
}
```

# 17.委外交货状况表 - 查询制表

## 接口信息

- **接口名称**：委外交货状况表 - 查询制表
- **接口地址**：`POST /api/InvTwPcStatus/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"INVTWPCSTATUS"`                    |
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

#### [1] - 展示字段配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showBody      | string        | 是否显示明细体，`"T"` 为是                                   |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                   | 类型   | 说明                   |
| :--------------------- | :----- | :--------------------- |
| `fixCondition.SH_TYPE` | string | 显示类型，固定值 `"T"` |

#### [3] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`TW_DD`（委外日期）    |
| operator      | string        | 操作符：`range`（区间查询）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 委外单号筛选（可选）

| 字段          | 类型    | 说明                                |
| :------------ | :------ | :---------------------------------- |
| field         | string  | 筛选字段名：`TW_NO`（委外子工单号） |
| operator      | string  | 操作符：`in`（多选）                |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）       |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）         |
| value         | string  | 筛选值（传空表示全部）              |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按委外日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "INVTWPCSTATUS",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "REPORT_DD",
                "TW_DD",
                "TW_NO",
                "CUS_NO",
                "CUS_NAME",
                "SNM",
                "PRD_NO",
                "PRD_NAME",
                "NAME_ENG",
                "SPC",
                "QTY",
                "QTY1",
                "UP",
                "UP_QTY1",
                "UNIT",
                "EST_DD",
                "QTY_RK",
                "QTY_DY",
                "QTY_MJ",
                "QTY_CHK",
                "QTY_LOST",
                "QTY_PRE",
                "QTY_RTN",
                "QTY_WJK",
                "QTY_TC",
                "QTY_CJ",
                "QTY_ZJ",
                "QTY_WD",
                "QTY_ML",
                "MARK_NAME",
                "MO_NO",
                "SO_NO",
                "CUS_OS_NO",
                "REM",
                "CUS_NAME",
                "STA_DD",
                "WT_NO",
                "CLS_STATUS"
            ]
        },
        {
            "fixCondition": {
                "SH_TYPE": "T"
            }
        },
        {
            "field": "TW_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": ["2024-11-01", "2024-11-30"]
        },
        {
            "field": "TW_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "TW_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "REPORT_DD,TW_DD,TW_NO,CUS_NO,CUS_NAME,SNM,PRD_NO,PRD_NAME,NAME_ENG,SPC,QTY,QTY1,UP,UP_QTY1,UNIT,EST_DD,QTY_RK,QTY_DY,QTY_MJ,QTY_CHK,QTY_LOST,QTY_PRE,QTY_RTN,QTY_WJK,QTY_TC,QTY_CJ,QTY_ZJ,QTY_WD,QTY_ML,MARK_NAME,MO_NO,SO_NO,CUS_OS_NO,REM,CUS_NAME,STA_DD,WT_NO,CLS_STATUS"
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
                "TW_DD": "2024-11-01T00:00:00",
                "TW_NO": "TWYMDD0007",
                "CUS_NO": "01",
                "CUS_NAME": "麦当劳",
                "SNM": "01",
                "PRD_NO": "000",
                "PRD_MARK": "",
                "PRD_NAME": "原油",
                "SPC": "华为三折叠，怎么叠都有面",
                "QTY": 10,
                "QTY1": 10000,
                "UP": 10,
                "UP_QTY1": 0.01,
                "UNIT": "1",
                "EST_DD": "2024-10-17T00:00:00",
                "QTY_DY": 0,
                "QTY_WJK": 0,
                "QTY_WD": 10,
                "QTY_ML": 0,
                "STA_DD": "2024-10-12T00:00:00",
                "WT_NO": "WTYMDD0003",
                "CLS_STATUS": "N",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "TW_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "QTY1", "TYPE": "Decimal" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "UP_QTY1", "TYPE": "Decimal" },
                { "NAME": "EST_DD", "TYPE": "DateTime" },
                { "NAME": "QTY_RK", "TYPE": "Decimal" },
                { "NAME": "QTY_DY", "TYPE": "Decimal" },
                { "NAME": "QTY_MJ", "TYPE": "Decimal" },
                { "NAME": "QTY_CHK", "TYPE": "Decimal" },
                { "NAME": "QTY_LOST", "TYPE": "Decimal" },
                { "NAME": "QTY_PRE", "TYPE": "Decimal" },
                { "NAME": "QTY_RTN", "TYPE": "Decimal" },
                { "NAME": "QTY_WJK", "TYPE": "Decimal" },
                { "NAME": "QTY_TC", "TYPE": "Decimal" },
                { "NAME": "QTY_CJ", "TYPE": "Decimal" },
                { "NAME": "QTY_ZJ", "TYPE": "Decimal" },
                { "NAME": "QTY_WD", "TYPE": "Decimal" },
                { "NAME": "QTY_ML", "TYPE": "Decimal" },
                { "NAME": "STA_DD", "TYPE": "DateTime" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_TW",
            "PRDT",
            "MARK",
            "CUST",
            "MF_YG",
            "AREA",
            "INDX"
        ]
    }
}
```

# 18.采购政策价格表 - 查询制表

## 接口信息

- **接口名称**：采购政策价格表 - 查询制表
- **接口地址**：`POST /api/invhp/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_HPLIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                  |
| :----------------------------- | :----- | :---------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"SYS_DATE"`（系统日期） |

#### [3] - 系统日期范围条件

| 字段          | 类型          | 说明                                         |
| :------------ | :------------ | :------------------------------------------- |
| field         | string        | 筛选字段名：`SYS_DATE`（系统日期）           |
| operator      | string        | 操作符：`range`（区间查询）                  |
| fieldType     | string        | 字段类型：`date`                             |
| need          | boolean       | 是否必须条件：`true`（必填）                 |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改）           |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月）           |
| value         | array[string] | 起止日期（起始日期为 `null` 表示无开始限制） |

#### [4] - 询价单号筛选（固定禁用，不参与实际筛选）

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`HJ_NO`（核价单号） |
| operator      | string  | 操作符：`in`（多选）            |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）   |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改）  |
| value         | string  | 筛选值（传空表示全部）          |

#### [5] - 是否公开筛选（可选）

| 字段          | 类型    | 说明                                                     |
| :------------ | :------ | :------------------------------------------------------- |
| field         | string  | 筛选字段名：`IS_PUB`（公共定价）                         |
| operator      | string  | 操作符：`equal`（等于）                                  |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）                              |
| value         | string  | 筛选值（传空表示全部，`"T"`=公共定价，`"F"`=分公司定价） |

#### [6] - 产品筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`PRD_NO`（产品代号） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [7] - 审核状态筛选（可选）

| 字段          | 类型    | 说明                                               |
| :------------ | :------ | :------------------------------------------------- |
| field         | string  | 筛选字段名：`CHK_STATUS`（审核状态）               |
| operator      | string  | 操作符：`equal`（等于）                            |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）                        |
| value         | string  | 筛选值（传空表示全部，`"Y"`=已审核，`"N"`=未审核） |

#### [8] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_HPLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "CUR_NAME",
                "PRD_NO",
                "PRD_NAME",
                "SPC",
                "UNIT",
                "QTY",
                "UP",
                "S_DD",
                "E_DD",
                "PRD_NO_DZ",
                "PRD_NAME_DZ",
                "QTY_DZ",
                "UNIT_DZ",
                "HJ_DD",
                "HJ_NO",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "SYS_DATE"
            }
        },
        {
            "field": "SYS_DATE",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": [null, "2026-08-31"]
        },
        {
            "field": "HJ_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": true,
            "value": ""
        },
        {
            "field": "IS_PUB",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "PRD_NO",
            "operator": "in",
            "fieldDisabled": false,
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
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUR_NAME,PRD_NO,PRD_NAME,SPC,UNIT,QTY,UP,S_DD,E_DD,PRD_NO_DZ,PRD_NAME_DZ,QTY_DZ,UNIT_DZ,HJ_DD,HJ_NO,REM"
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
                "PRD_NO": "11",
                "PRD_NAME": "香辣鸡腿堡",
                "UNIT": "KG",
                "S_DD": "2026-08-12T00:00:00",
                "HJ_NO": "HP26080001",
                "HJ_DD": "2026-08-12T00:00:00",
                "QTY": 1,
                "UP": 25,
                "SYS_DATE": "2026-08-12T15:32:41",
                "CHK_STATUS": "Y",
                "IS_PUB": "T",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "S_DD", "TYPE": "DateTime" },
                { "NAME": "E_DD", "TYPE": "DateTime" },
                { "NAME": "HJ_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "QTY_DZ", "TYPE": "Decimal" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CHK_DATE", "TYPE": "DateTime" },
                { "NAME": "UP_DZ", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_HJ",
            "TF_HJ",
            "PRDT",
            "DEPT",
            "MF_YG",
            "MY_WH",
            "INDX",
            "MARK"
        ]
    }
}
```

# 19.售价政策价格表 - 查询制表

## 接口信息

- **接口名称**：售价政策价格表 - 查询制表
- **接口地址**：`POST /api/invhs/GetReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_HSLIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                                  |
| :----------------------------- | :----- | :---------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"SYS_DATE"`（系统日期） |

#### [3] - 系统日期条件

| 字段          | 类型          | 说明                                      |
| :------------ | :------------ | :---------------------------------------- |
| field         | string        | 筛选字段名：`SYS_DATE`（系统日期）        |
| operator      | string        | 操作符：`today`（今天）                   |
| fieldType     | string        | 字段类型：`date`                          |
| need          | boolean       | 是否必须条件：`true`（必填）              |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改）        |
| value         | array[string] | 起止日期（均为当天日期），格式 YYYY-MM-DD |

#### [4] - 询价单号筛选（固定禁用，不参与实际筛选）

| 字段          | 类型    | 说明                            |
| :------------ | :------ | :------------------------------ |
| field         | string  | 筛选字段名：`HJ_NO`（核价单号） |
| operator      | string  | 操作符：`in`（多选）            |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）   |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改）  |
| value         | string  | 筛选值（传空表示全部）          |

#### [5] - 是否公开筛选（可选）

| 字段          | 类型    | 说明                                                     |
| :------------ | :------ | :------------------------------------------------------- |
| field         | string  | 筛选字段名：`IS_PUB`（公共定价）                         |
| operator      | string  | 操作符：`equal`（等于）                                  |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）                              |
| value         | string  | 筛选值（传空表示全部，`"T"`=公共定价，`"F"`=分公司定价） |

#### [6] - 客户筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`CUS_NO`（客户代号） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| checkUnder    | string  | 是否包含下级，`"T"` 为是         |
| value         | string  | 筛选值（传空表示全部）           |

#### [7] - 产品筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`PRD_NO`（产品代号） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [8] - 审核状态筛选（可选）

| 字段          | 类型    | 说明                                               |
| :------------ | :------ | :------------------------------------------------- |
| field         | string  | 筛选字段名：`CHK_STATUS`（审核状态）               |
| operator      | string  | 操作符：`equal`（等于）                            |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）                        |
| value         | string  | 筛选值（传空表示全部，`"Y"`=已审核，`"N"`=未审核） |

#### [9] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_HSLIST",
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
                "CUR_NAME",
                "PRD_NO",
                "PRD_NAME",
                "SPC",
                "UNIT",
                "QTY",
                "UP",
                "S_DD",
                "E_DD",
                "PRD_NO_DZ",
                "PRD_NAME_DZ",
                "UNIT_DZ",
                "QTY_DZ",
                "HJ_DD",
                "HJ_NO",
                "REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "SYS_DATE"
            }
        },
        {
            "field": "SYS_DATE",
            "operator": "today",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-08-12", "2026-08-12"]
        },
        {
            "field": "HJ_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": true,
            "value": ""
        },
        {
            "field": "IS_PUB",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
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
            "field": "CHK_STATUS",
            "operator": "equal",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "orderBy": {
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,CUR_NAME,PRD_NO,PRD_NAME,SPC,UNIT,QTY,UP,S_DD,E_DD,PRD_NO_DZ,PRD_NAME_DZ,UNIT_DZ,QTY_DZ,HJ_DD,HJ_NO,REM"
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
                "PRD_NO": "11",
                "PRD_NAME": "香辣鸡腿堡",
                "UNIT": "KG",
                "S_DD": "2026-08-12T00:00:00",
                "HJ_NO": "HS26080001",
                "HJ_DD": "2026-08-12T00:00:00",
                "QTY": 1,
                "UP": 25,
                "SYS_DATE": "2026-08-12T15:36:13",
                "CHK_STATUS": "Y",
                "IS_PUB": "T",
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "S_DD", "TYPE": "DateTime" },
                { "NAME": "E_DD", "TYPE": "DateTime" },
                { "NAME": "HJ_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "UP", "TYPE": "Decimal" },
                { "NAME": "QTY_DZ", "TYPE": "Decimal" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CHK_DATE", "TYPE": "DateTime" },
                { "NAME": "UP_DZ", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_HJ",
            "TF_HJ",
            "DEPT",
            "MY_WH",
            "MF_YG",
            "CUST",
            "PRDT",
            "AREA",
            "INDX",
            "MARK"
        ]
    }
}
```

# 20.库存调拨报表 - 查询制表

## 接口信息

- **接口名称**：库存调拨报表 - 查询制表
- **接口地址**：`POST /api/invic/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"DRPIC_REP"`                        |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"IC_DD"`（调拨日期） |

#### [3] - 调拨日期条件

| 字段          | 类型          | 说明                                      |
| :------------ | :------------ | :---------------------------------------- |
| field         | string        | 筛选字段名：`IC_DD`（调拨日期）           |
| operator      | string        | 操作符：`today`（今天）                   |
| fieldType     | string        | 字段类型：`date`                          |
| need          | boolean       | 是否必须条件：`true`（必填）              |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改）        |
| value         | array[string] | 起止日期（均为当天日期），格式 YYYY-MM-DD |

#### [4] - 调拨单号筛选（可选）

| 字段          | 类型          | 说明                            |
| :------------ | :------------ | :------------------------------ |
| field         | string        | 筛选字段名：`IC_NO`（调拨单号） |
| operator      | string        | 操作符：`range`（区间查询）     |
| fieldType     | string        | 字段类型：`bilNo`（单据编号）   |
| fieldDisabled | boolean       | 是否禁用：`false`（可编辑）     |
| value         | array[string] | 单号起止范围（传空表示全部）    |

#### [5] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按调拨日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "DRPIC_REP",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "IC_DD",
                "IC_NO",
                "IDX_NAME",
                "PRD_NO",
                "PRD_NAME",
                "SPC",
                "WH1",
                "WH1_NAME",
                "WH2",
                "WH2_NAME",
                "UNIT_NAME",
                "QTY",
                "QTY_ID",
                "QTY_DIV",
                "QTY_CFM",
                "QTY_LOST",
                "REM",
                "M_REM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "IC_DD"
            }
        },
        {
            "field": "IC_DD",
            "operator": "today",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-08-12", "2026-08-12"]
        },
        {
            "field": "IC_NO",
            "operator": "range",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ["", ""]
        },
        {
            "orderBy": {
                "IC_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "IC_DD,IC_NO,IDX_NAME,PRD_NO,PRD_NAME,SPC,WH1,WH1_NAME,WH2,WH2_NAME,UNIT_NAME,QTY,QTY_ID,QTY_DIV,QTY_CFM,QTY_LOST,REM,M_REM"
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
                "IC_DD": "2026-08-12T00:00:00",
                "IC_NO": "IC26080001",
                "WH1_NAME": "成品仓",
                "WH2_NAME": "仓库02",
                "PRD_NAME": "哈密瓜",
                "UNIT": "1",
                "UNIT_NAME": "KG",
                "QTY": 1,
                "PRD_NO": "15",
                "WH1": "01",
                "WH2": "02",
                "IC_ID": "IC",
                "A001": "",
                "A001_2": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "IC_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "CST", "TYPE": "Decimal" },
                { "NAME": "CST_STD", "TYPE": "Decimal" },
                { "NAME": "QTY_ID", "TYPE": "Decimal" },
                { "NAME": "QTY_DIV", "TYPE": "Decimal" },
                { "NAME": "QTY_CFM", "TYPE": "Decimal" },
                { "NAME": "QTY_LOST", "TYPE": "Decimal" },
                { "NAME": "TASK_ID", "TYPE": "Int32" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "MODIFY_DD", "TYPE": "DateTime" },
                { "NAME": "VALID_DD", "TYPE": "DateTime" },
                { "NAME": "SC_DD", "TYPE": "DateTime" },
                { "NAME": "QTY_CFM_UNSH", "TYPE": "Decimal" },
                { "NAME": "QTY_LOST_UNSH", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_IC",
            "TF_IC",
            "PRDT",
            "DEPT",
            "CASN",
            "INDX",
            "MY_WH",
            "MF_YG",
            "MARK"
        ]
    }
}
```

# 21.库存调整报表 - 查询制表

## 接口信息

- **接口名称**：库存调整报表 - 查询制表
- **接口地址**：`POST /api/invij/getReport`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"REP_IJLIST"`                       |
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
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [2] - 固定条件配置

| 字段                           | 类型   | 说明                                               |
| :----------------------------- | :----- | :------------------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"IJ_DD"`（单据日期） |

#### [3] - 调整日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`IJ_DD`（单据日期）    |
| operator      | string        | 操作符：`range`（区间查询）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [4] - 调整单号筛选（可选）

| 字段          | 类型          | 说明                            |
| :------------ | :------------ | :------------------------------ |
| field         | string        | 筛选字段名：`IJ_NO`（单据号码） |
| operator      | string        | 操作符：`range`（区间查询）     |
| fieldType     | string        | 字段类型：`bilNo`（单据编号）   |
| fieldDisabled | boolean       | 是否禁用：`false`（可编辑）     |
| value         | array[string] | 单号起止范围（传空表示全部）    |

#### [5] - 产品筛选（可选）

| 字段          | 类型          | 说明                             |
| :------------ | :------------ | :------------------------------- |
| field         | string        | 筛选字段名：`PRD_NO`（货品代号） |
| operator      | string        | 操作符：`range`（区间查询）      |
| fieldDisabled | boolean       | 是否禁用：`false`（可编辑）      |
| value         | array[string] | 产品编号起止范围（传空表示全部） |

#### [6] - 部门筛选（可选）

| 字段          | 类型          | 说明                          |
| :------------ | :------------ | :---------------------------- |
| field         | string        | 筛选字段名：`DEP`（部门代号） |
| operator      | string        | 操作符：`range`（区间查询）   |
| fieldDisabled | boolean       | 是否禁用：`false`（可编辑）   |
| value         | array[string] | 部门起止范围（传空表示全部）  |

#### [7] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

------

## 请求示例（JSON）

json

```json
{
    "PGM": "REP_IJLIST",
    "SEARCH_INFO": [
        {
            "offset": [0, 5000],
            "temp": true
        },
        {
            "showLadder": "F",
            "displayFields": [
                "IJ_NO",
                "IJ_DD",
                "IDX_NAME",
                "PRD_NO",
                "PRD_NAME",
                "SPC",
                "QTY",
                "CST_UP",
                "CST",
                "DEP",
                "DEP_NAME",
                "WH",
                "WH_NAME",
                "REM",
                "SALM_NAME"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "IJ_DD"
            }
        },
        {
            "field": "IJ_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": ["2024-09-01", "2026-08-31"]
        },
        {
            "field": "IJ_NO",
            "operator": "range",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ["", ""]
        },
        {
            "field": "PRD_NO",
            "operator": "range",
            "fieldDisabled": false,
            "value": ["", ""]
        },
        {
            "field": "DEP",
            "operator": "range",
            "fieldDisabled": false,
            "value": ["", ""]
        },
        {
            "orderBy": {
                "IJ_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "IJ_NO,IJ_DD,IDX_NAME,PRD_NO,PRD_NAME,SPC,QTY,CST_UP,CST,DEP,DEP_NAME,WH,WH_NAME,REM,SALM_NAME"
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
                "IJ_ID_H": "IJ",
                "IJ_NO": "IJYMDD0002",
                "IJ_DD": "2024-09-18T00:00:00",
                "DEP": "00000000",
                "DEP_NAME": "First Department",
                "WH": "01",
                "WH_NAME": "成品仓",
                "PRD_NO": "09",
                "PRD_NAME": "制成品",
                "QTY": 10,
                "CST_UP": 0,
                "CST": 0,
                "A001": ""
            }
        ],
        "COLUMN_INFO": {
            "REPORT__TAB": [
                { "NAME": "IJ_DD", "TYPE": "DateTime" },
                { "NAME": "QTY", "TYPE": "Decimal" },
                { "NAME": "CST_UP", "TYPE": "Decimal" },
                { "NAME": "CST", "TYPE": "Decimal" },
                { "NAME": "SYS_DATE", "TYPE": "DateTime" },
                { "NAME": "CLS_DATE", "TYPE": "DateTime" },
                { "NAME": "CST_STD", "TYPE": "Decimal" },
                { "NAME": "QTY1", "TYPE": "Decimal" },
                { "NAME": "MODIFY_DD", "TYPE": "DateTime" },
                { "NAME": "ITM", "TYPE": "Int32" },
                { "NAME": "VALID_DD", "TYPE": "DateTime" },
                { "NAME": "HZ_UP_TYDJ", "TYPE": "Decimal" },
                { "NAME": "HZ_AMTN_TYDJ", "TYPE": "Decimal" }
            ]
        },
        "COLUMN_PROP": {
            "REPORT__TAB": []
        },
        "BASIC_DATA_TABLE": [
            "MF_IJ",
            "TF_IJ",
            "PRDT",
            "MF_YG",
            "DEPT",
            "MY_WH",
            "CUST",
            "INDX",
            "CASN",
            "AREA",
            "MARK"
        ]
    }
}
```