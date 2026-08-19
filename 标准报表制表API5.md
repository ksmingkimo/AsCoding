# 1.科目余额表 - 查询制表

## 接口信息

- **接口名称**：科目余额表 - 查询制表
- **接口地址**：`POST /api/accBalanceTable/GetReportStream`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"ACCRPTABT"`                        |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showBody      | string        | 是否显示明细体，`"T"` 为是                                   |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |

#### [1] - 固定条件配置

| 字段                              | 类型   | 说明                                         |
| :-------------------------------- | :----- | :------------------------------------------- |
| `fixCondition.BOOK_NO`            | string | 账簿代号，固定值 `"001"`                     |
| `fixCondition.CUR_ID`             | string | 币别（当前为空 - 综合本位币）                |
| `fixCondition.ACC_IPERIOD_B`      | string | 会计期间起，格式 `YYYY-MM`（如 `"2023-01"`） |
| `fixCondition.ACC_IPERIOD_E`      | string | 会计期间止，格式 `YYYY-MM`（如 `"2023-01"`） |
| `fixCondition.CHK_ACCN_TYPE`      | string | 检查科目类型，固定值 `"2"`                   |
| `fixCondition.ACC_NO`             | string | 科目编号（当前为空）                         |
| `fixCondition.DATE_TYPE`          | string | 日期类型，固定值 `"1"`                       |
| `fixCondition.ACC_NO_B`           | string | 科目编号起（当前为空）                       |
| `fixCondition.ACC_NO_E`           | string | 科目编号止（当前为空）                       |
| `fixCondition.DATE_B`             | string | 日期起，格式 `YYYY-MM-DD`                    |
| `fixCondition.DATE_E`             | string | 日期止，格式 `YYYY-MM-DD`                    |
| `fixCondition.REL_CLS_B`          | Int32  | 关联类别起，固定值 `1`                       |
| `fixCondition.REL_CLS_E`          | Int32  | 关联类别止，固定值 `10`                      |
| `fixCondition.AMTN_BAL_TYPE`      | string | 余额类型，固定值 `"1"`                       |
| `fixCondition.CHK_POSTACC`        | string | 是否检查过账科目，`"F"` 为否                 |
| `fixCondition.CHK_STOP`           | string | 是否检查停用，`"F"` 为否                     |
| `fixCondition.CHK_NOVOH_BAL_ZERO` | string | 是否包含无凭证且余额为零，`"F"` 为否         |
| `fixCondition.CHK_FZHS_DETAIL`    | string | 是否显示辅助核算明细，`"F"` 为否             |
| `fixCondition.CHK_DETAIL_ACCN`    | string | 是否显示明细科目，`"F"` 为否                 |
| `fixCondition.CHK_NO_POA_VOH`     | string | 是否排除POA凭证，`"F"` 为否                  |
| `fixCondition.CHK_NO_SYTZ_VOH`    | string | 是否排除SYTZ凭证，`"F"` 为否                 |
| `fixCondition.CHK_GROUP_CUR_LOC`  | string | 是否按币别分组，`"F"` 为否                   |
| `fixCondition.START_DD`           | string | 开始日期                                     |
| `fixCondition.YEARS`              | Int32  | 年度                                         |
| `fixCondition.IPERIOD`            | Int32  | 会计期间                                     |
| `fixCondition.TYPE_NO`            | string | 类型编号，固定值 `"01"`                      |

#### [2] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

## 请求示例（JSON）

json

```json
{
    "PGM": "ACCRPTABT",
    "SEARCH_INFO": [
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "ACC_NO",
                "ACC_NAME",
                "AMTN_NC_D",
                "AMTN_NC_C",
                "AMTN_QC_D",
                "AMTN_QC_C",
                "AMTN_D",
                "AMTN_C",
                "AMTN_Y_D",
                "AMTN_Y_C",
                "AMTN_QM_D",
                "AMTN_QM_C"
            ]
        },
        {
            "fixCondition": {
                "BOOK_NO": "001",
                "CUR_ID": "",
                "ACC_IPERIOD_B": "2023-01",
                "ACC_IPERIOD_E": "2023-01",
                "CHK_ACCN_TYPE": "2",
                "ACC_NO": "",
                "DATE_TYPE": "1",
                "ACC_NO_B": "",
                "ACC_NO_E": "",
                "DATE_B": "2023-01-01",
                "DATE_E": "2023-01-31",
                "REL_CLS_B": 1,
                "REL_CLS_E": 10,
                "AMTN_BAL_TYPE": "1",
                "CHK_POSTACC": "F",
                "CHK_STOP": "F",
                "CHK_NOVOH_BAL_ZERO": "F",
                "CHK_FZHS_DETAIL": "F",
                "CHK_DETAIL_ACCN": "F",
                "CHK_NO_POA_VOH": "F",
                "CHK_NO_SYTZ_VOH": "F",
                "CHK_GROUP_CUR_LOC": "F",
                "START_DD": "2023-01-01T00:00:00",
                "YEARS": 2023,
                "IPERIOD": 1,
                "TYPE_NO": "01"
            }
        },
        {
            "orderBy": {
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "ACC_NO,ACC_NAME,AMTN_NC_D,AMTN_NC_C,AMTN_QC_D,AMTN_QC_C,AMTN_D,AMTN_C,AMTN_Y_D,AMTN_Y_C,AMTN_QM_D,AMTN_QM_C"
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中，需要按行解析。`REPORT__TAB` 出现在 `PERCENT: 90.0` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "FZHS_KEY": "2023,1;1001,001",
            "BOOK_NO": "001",
            "ACC_NO": "1001",
            "CUR_ID": null,
            "CUR_NAME": "",
            "DC": "D",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "库存现金",
            "FZHS_TITLE": "",
            "REM_TYPE": "2",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 12.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 12.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1001,001",
            "BOOK_NO": "001",
            "ACC_NO": "1001",
            "CUR_ID": "",
            "CUR_NAME": null,
            "DC": "D",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "库存现金",
            "FZHS_TITLE": "",
            "REM_TYPE": "3",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 12.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 12.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;2202,001",
            "BOOK_NO": "001",
            "ACC_NO": "2202",
            "CUR_ID": null,
            "CUR_NAME": "",
            "DC": "C",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "应付账款",
            "FZHS_TITLE": "",
            "REM_TYPE": "2",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 12.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 12.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;2202,001",
            "BOOK_NO": "001",
            "ACC_NO": "2202",
            "CUR_ID": "",
            "CUR_NAME": null,
            "DC": "C",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "应付账款",
            "FZHS_TITLE": "",
            "REM_TYPE": "3",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 12.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 12.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        }
    ],
    "PAGE_COUNT": 1,
    "PAGE_NUM": 1
}
```

# 2.资产负债表 - 查询制表

## 接口信息

- **接口名称**：资产负债表 - 查询制表
- **接口地址**：`POST /api/accRptPreview/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                     |
| :------------- | :------------ | :--- | :------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"CUS_ACC_RPT__2_ZCFZB"`           |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                       |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（不传则返回全部） |
| RPT_NO         | string        | 是   | 报表样式代号，固定值 `"STD001"`（资产负债表）            |
| TYPE_NO        | string        | 是   | 类型编号，固定值 `"3"`                                   |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段配置

| 字段          | 类型   | 说明                                                 |
| :------------ | :----- | :--------------------------------------------------- |
| showBody      | string | 是否显示明细体，`"T"` 为是                           |
| showLadder    | string | 是否显示阶梯价，`"F"` 为否                           |
| displayFields | array  | 表格需要展示的字段列表（当前为空数组，返回全部字段） |

#### [1] - 固定条件配置

| 字段                                   | 类型   | 说明                                         |
| :------------------------------------- | :----- | :------------------------------------------- |
| `fixCondition.RPT_NO`                  | string | 报表样式代号，固定值 `"STD001"`              |
| `fixCondition.BOOK_NO`                 | string | 账簿代号，固定值 `"10"`                      |
| `fixCondition.CYCLE_TYPE`              | string | 周期类型，固定值 `"1"`                       |
| `fixCondition.IPERIOD_TYPE`            | string | 期间维度，固定值 `"1"`                       |
| `fixCondition.ACC_IPERIOD_B`           | string | 会计期间起，格式 `YYYY-MM`（如 `"2017-01"`） |
| `fixCondition.ACC_IPERIOD_E`           | string | 会计期间止，格式 `YYYY-MM`（如 `"2017-01"`） |
| `fixCondition.UP_AMTN`                 | string | 是否更新金额，固定值 `"1"`                   |
| `fixCondition.CHK_POSTACC`             | string | 是否检查过账科目，`"F"` 为否                 |
| `fixCondition.CHK_NO_POA_VOH`          | string | 是否排除POA凭证，`"F"` 为否                  |
| `fixCondition.DOUBLE_CLASS`            | string | 是否双类别，`"F"` 为否                       |
| `fixCondition.SHOW_RPT_ITEM_AMTN_ZERO` | string | 是否显示金额为零的报表项目，`"T"` 为是       |
| `fixCondition.CHK_NO_SYTZ_VOH`         | string | 是否排除SYTZ凭证，`"F"` 为否                 |
| `fixCondition.START_DD`                | string | 开始日期                                     |
| `fixCondition.YEARS`                   | Int32  | 年度                                         |
| `fixCondition.IPERIOD`                 | Int32  | 会计期间                                     |
| `fixCondition.TYPE_NO`                 | string | 类型编号，固定值 `"3"`                       |
| `fixCondition.DATE_TYPE`               | string | 日期类型，固定值 `"1"`                       |
| `fixCondition.DATE_B`                  | string | 日期起，格式 `YYYY-MM-DD`                    |
| `fixCondition.DATE_E`                  | string | 日期止，格式 `YYYY-MM-DD`                    |
| `fixCondition.CHK_DATE`                | string | 是否检查日期，固定值 `"1"`                   |

#### [2] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

## 请求示例（JSON）

json

```json
{
    "PGM": "CUS_ACC_RPT__2_ZCFZB",
    "SEARCH_INFO": [
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": []
        },
        {
            "fixCondition": {
                "RPT_NO": "STD001",
                "BOOK_NO": "10",
                "CYCLE_TYPE": "1",
                "IPERIOD_TYPE": "1",
                "ACC_IPERIOD_B": "2017-01",
                "ACC_IPERIOD_E": "2017-01",
                "UP_AMTN": "1",
                "CHK_POSTACC": "F",
                "CHK_NO_POA_VOH": "F",
                "DOUBLE_CLASS": "F",
                "SHOW_RPT_ITEM_AMTN_ZERO": "T",
                "CHK_NO_SYTZ_VOH": "F",
                "START_DD": "2017-01-01T00:00:00",
                "YEARS": 2017,
                "IPERIOD": 1,
                "TYPE_NO": "3",
                "DATE_TYPE": "1",
                "DATE_B": "2017-01-01",
                "DATE_E": "2017-01-01",
                "CHK_DATE": "1"
            }
        },
        {
            "orderBy": {
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "",
    "RPT_NO": "STD001",
    "TYPE_NO": "3"
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD001",
            "RPT_TYPE": "2",
            "ITEM_NO": "1001",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "流动资产",
            "ROW_ID": 0,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD002": 0.0,
            "STD001": 0.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD001",
            "RPT_TYPE": "2",
            "ITEM_NO": "1002",
            "ITEM_NO_UP": "1001",
            "REL_CLS": 2,
            "ITEM_NAME": "货币资金",
            "ROW_ID": 1,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[1001]+[1002]+[1012]",
            "FORMULA_TEXT": "[1001 库存*金*****]+[1002 银行*款*****]+[1012 其他*币*金****]",
            "STD002": 2903981.08,
            "STD001": 2463427.14
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD001",
            "RPT_TYPE": "2",
            "ITEM_NO": "1003",
            "ITEM_NO_UP": "1001",
            "REL_CLS": 2,
            "ITEM_NAME": "交易性金融资产",
            "ROW_ID": 2,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[1101]",
            "FORMULA_TEXT": "[1101 交易*金*资****]",
            "STD002": 12000000.0,
            "STD001": 10000000.0
        }
        // ... 更多报表项目（因篇幅限制，仅展示部分）
    ],
    "COLUMN_INFO": [
        { "NAME": "STD002", "TITLE": "年初数" },
        { "NAME": "STD001", "TITLE": "期末数" }
    ],
    "OTHER_DATA": {
        "RPT_ITEM_SJ": "2",
        "SW_NEW_ROW_ALIGN": "T",
        "USR_TYPE": "1",
        "RPT_TYPE": "2",
        "SHOW_RESULT_TYPE": 2
    },
    "CHART_DATA": {},
    "PAGE_COUNT": 0,
    "PAGE_NUM": 0
}
```

# 3.利润表 - 查询制表

## 接口信息

- **接口名称**：利润表 - 查询制表
- **接口地址**：`POST /api/accRptPreview/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                         |
| :------------- | :------------ | :--- | :------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"CUS_ACC_RPT__3_LRB"` |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）           |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段       |
| RPT_NO         | string        | 是   | 报表样式代号，固定值 `"STD002"`（利润表）    |
| TYPE_NO        | string        | 是   | 类型编号，固定值 `"3"`                       |

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

| 字段                                   | 类型   | 说明                                   |
| :------------------------------------- | :----- | :------------------------------------- |
| `fixCondition.RPT_NO`                  | string | 报表样式代号，固定值 `"STD002"`        |
| `fixCondition.BOOK_NO`                 | string | 账簿代号，固定值 `"10"`                |
| `fixCondition.CYCLE_TYPE`              | string | 周期类型，固定值 `"1"`                 |
| `fixCondition.IPERIOD_TYPE`            | string | 期间维度，固定值 `"1"`                 |
| `fixCondition.ACC_IPERIOD_B`           | string | 会计期间起，格式 `YYYY-MM`             |
| `fixCondition.ACC_IPERIOD_E`           | string | 会计期间止，格式 `YYYY-MM`             |
| `fixCondition.UP_AMTN`                 | string | 是否更新金额，固定值 `"1"`             |
| `fixCondition.CHK_POSTACC`             | string | 是否检查过账科目，`"F"` 为否           |
| `fixCondition.CHK_NO_POA_VOH`          | string | 是否排除POA凭证，`"F"` 为否            |
| `fixCondition.DOUBLE_CLASS`            | string | 是否双类别，`"F"` 为否                 |
| `fixCondition.SHOW_RPT_ITEM_AMTN_ZERO` | string | 是否显示金额为零的报表项目，`"T"` 为是 |
| `fixCondition.CHK_NO_SYTZ_VOH`         | string | 是否排除SYTZ凭证，`"T"` 为是           |
| `fixCondition.START_DD`                | string | 开始日期                               |
| `fixCondition.YEARS`                   | Int32  | 年度                                   |
| `fixCondition.IPERIOD`                 | Int32  | 会计期间                               |
| `fixCondition.TYPE_NO`                 | string | 类型编号，固定值 `"3"`                 |
| `fixCondition.DATE_TYPE`               | string | 日期类型，固定值 `"1"`                 |
| `fixCondition.DATE_B`                  | string | 日期起，格式 `YYYY-MM-DD`              |
| `fixCondition.DATE_E`                  | string | 日期止，格式 `YYYY-MM-DD`              |
| `fixCondition.CHK_DATE`                | string | 是否检查日期，固定值 `"1"`             |

#### [2] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

## 请求示例（JSON）

json

```json
{
    "PGM": "CUS_ACC_RPT__3_LRB",
    "SEARCH_INFO": [
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "ITEM_NO_1",
                "ITEM_NAME_1",
                "ROW_ID_1",
                "STD003_1",
                "STD004_1"
            ]
        },
        {
            "fixCondition": {
                "RPT_NO": "STD002",
                "BOOK_NO": "10",
                "CYCLE_TYPE": "1",
                "IPERIOD_TYPE": "1",
                "ACC_IPERIOD_B": "2017-01",
                "ACC_IPERIOD_E": "2017-01",
                "UP_AMTN": "1",
                "CHK_POSTACC": "F",
                "CHK_NO_POA_VOH": "F",
                "DOUBLE_CLASS": "F",
                "SHOW_RPT_ITEM_AMTN_ZERO": "T",
                "CHK_NO_SYTZ_VOH": "T",
                "START_DD": "2017-01-01T00:00:00",
                "YEARS": 2017,
                "IPERIOD": 1,
                "TYPE_NO": "3",
                "DATE_TYPE": "1",
                "DATE_B": "2017-01-01",
                "DATE_E": "2017-01-31",
                "CHK_DATE": "1"
            }
        },
        {
            "orderBy": {
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": ",ITEM_NO_1,ITEM_NAME_1,ROW_ID_1,STD003_1,STD004_1",
    "RPT_NO": "STD002",
    "TYPE_NO": "3"
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4001",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "一、营业收入",
            "ROW_ID": 1,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6001]+[6051]",
            "FORMULA_TEXT": "[6001 主营*务*入****]+[6051 其他*务*入****]",
            "STD003": 305439.58,
            "STD004": 305439.58
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4002",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "减：营业成本",
            "ROW_ID": 2,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6401]+[6402]",
            "FORMULA_TEXT": "[6401 主营*务*本****]+[6402 其他*务*本****]",
            "STD003": 199193.46,
            "STD004": 199193.46
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4003",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "税金及附加",
            "ROW_ID": 3,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6403]",
            "FORMULA_TEXT": "[6403 税金*附*****]",
            "STD003": 15593.04,
            "STD004": 15593.04
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4004",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "销售费用",
            "ROW_ID": 4,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6601]",
            "FORMULA_TEXT": "[6601 销售*用*****]",
            "STD003": 153934.97,
            "STD004": 153934.97
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4005",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "管理费用",
            "ROW_ID": 5,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6602]",
            "FORMULA_TEXT": "[6602 管理*用*****]",
            "STD003": 1585706.28,
            "STD004": 1585706.28
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4006",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "研发费用",
            "ROW_ID": 6,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 0.0,
            "STD004": 0.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4007",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "财务费用",
            "ROW_ID": 7,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6603]",
            "FORMULA_TEXT": "[6603 财务*用*****]",
            "STD003": 473.5,
            "STD004": 473.5
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4008",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "其中：利息费用",
            "ROW_ID": 8,
            "SPACES": 3,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 0.0,
            "STD004": 0.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4009",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "利息收入",
            "ROW_ID": 9,
            "SPACES": 4,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 0.0,
            "STD004": 0.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4010",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "加：其他收益",
            "ROW_ID": 10,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 0.0,
            "STD004": 0.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4011",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "投资收益（损失以“-”号填列）",
            "ROW_ID": 11,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[6111]",
            "FORMULA_TEXT": "[6111 投资*益*****]",
            "STD003": 66095.89,
            "STD004": 66095.89
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4019",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "二、营业利润（亏损以“-”号填列）",
            "ROW_ID": 19,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[4001]-[4002]-[4003]-[4004]-[4005]-[4006]-[4007]+[4010]+[4011]+[4014]+[4015]+[4016]+[4017]+[4018]",
            "FORMULA_TEXT": "[4001 一、营业收入]-[4002 减：营业成本]-[4003 税金及附加]-[4004 销售费用]-[4005 管理费用]-[4006 研发费用]-[4007 财务费用]+[4010 加：其他收益]+[4011 投资收益（损失以“-”号填列）]...",
            "STD003": -1583365.78,
            "STD004": -1583365.78
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4022",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "三、利润总额（亏损总额以“-”号填列）",
            "ROW_ID": 22,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[4019]+[4020]-[4021]",
            "FORMULA_TEXT": "[4019 二、营业利润（亏损以“-”号填列）]+[4020 加：营业外收入]-[4021 减：营业外支出]",
            "STD003": -1583365.64,
            "STD004": -1583365.64
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4024",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "四、净利润（净亏损以“-”号填列）",
            "ROW_ID": 24,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[4022]-[4023]",
            "FORMULA_TEXT": "[4022 三、利润总额（亏损总额以“-”号填列）]-[4023 减：所得税费用]",
            "STD003": -1583365.64,
            "STD004": -1583365.64
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD002",
            "RPT_TYPE": "3",
            "ITEM_NO": "4040",
            "ITEM_NO_UP": "4000",
            "REL_CLS": 2,
            "ITEM_NAME": "六、综合收益总额",
            "ROW_ID": 40,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[4024]+[4027]",
            "FORMULA_TEXT": "[4024 四、净利润（净亏损以“-”号填列）]+[4027 五、其他综合收益的税后净额]",
            "STD003": -1583365.64,
            "STD004": -1583365.64
        }
    ],
    "COLUMN_INFO": [
        { "NAME": "STD003", "TITLE": "本期发生数" },
        { "NAME": "STD004", "TITLE": "本年累计数" }
    ],
    "OTHER_DATA": {
        "RPT_ITEM_SJ": "2",
        "SW_NEW_ROW_ALIGN": "F",
        "USR_TYPE": "1",
        "RPT_TYPE": "3",
        "SHOW_RESULT_TYPE": 0
    },
    "CHART_DATA": {}
}
```

# 4.现金流量表 - 查询制表

## 接口信息

- **接口名称**：现金流量表 - 查询制表
- **接口地址**：`POST /api/accRptPreview/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名         | 类型          | 必填 | 说明                                                     |
| :------------- | :------------ | :--- | :------------------------------------------------------- |
| PGM            | string        | 是   | 程序/报表标识，固定值 `"CUS_ACC_RPT__4_XJLL"`            |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                       |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（传空则返回全部） |
| RPT_NO         | string        | 是   | 报表样式代号，固定值 `"STD003"`（现金流量表）            |
| TYPE_NO        | string        | 是   | 类型编号，固定值 `"3"`                                   |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段配置

| 字段          | 类型   | 说明                                                 |
| :------------ | :----- | :--------------------------------------------------- |
| showBody      | string | 是否显示明细体，`"T"` 为是                           |
| showLadder    | string | 是否显示阶梯价，`"F"` 为否                           |
| displayFields | array  | 表格需要展示的字段列表（当前为空数组，返回全部字段） |

#### [1] - 固定条件配置

| 字段                                   | 类型   | 说明                                   |
| :------------------------------------- | :----- | :------------------------------------- |
| `fixCondition.RPT_NO`                  | string | 报表样式代号，固定值 `"STD003"`        |
| `fixCondition.BOOK_NO`                 | string | 账簿代号，固定值 `"10"`                |
| `fixCondition.CYCLE_TYPE`              | string | 周期类型，固定值 `"1"`                 |
| `fixCondition.IPERIOD_TYPE`            | string | 期间维度，固定值 `"1"`                 |
| `fixCondition.ACC_IPERIOD_B`           | string | 会计期间起，格式 `YYYY-MM`             |
| `fixCondition.ACC_IPERIOD_E`           | string | 会计期间止，格式 `YYYY-MM`             |
| `fixCondition.UP_AMTN`                 | string | 是否更新金额，固定值 `"1"`             |
| `fixCondition.CHK_POSTACC`             | string | 是否检查过账科目，`"F"` 为否           |
| `fixCondition.CHK_NO_POA_VOH`          | string | 是否排除POA凭证，`"F"` 为否            |
| `fixCondition.DOUBLE_CLASS`            | string | 是否双类别，`"F"` 为否                 |
| `fixCondition.SHOW_RPT_ITEM_AMTN_ZERO` | string | 是否显示金额为零的报表项目，`"T"` 为是 |
| `fixCondition.CHK_NO_SYTZ_VOH`         | string | 是否排除SYTZ凭证，`"F"` 为否           |
| `fixCondition.START_DD`                | string | 开始日期                               |
| `fixCondition.YEARS`                   | Int32  | 年度                                   |
| `fixCondition.IPERIOD`                 | Int32  | 会计期间                               |
| `fixCondition.TYPE_NO`                 | string | 类型编号，固定值 `"3"`                 |
| `fixCondition.DATE_TYPE`               | string | 日期类型，固定值 `"1"`                 |
| `fixCondition.DATE_B`                  | string | 日期起，格式 `YYYY-MM-DD`              |
| `fixCondition.DATE_E`                  | string | 日期止，格式 `YYYY-MM-DD`              |
| `fixCondition.CHK_DATE`                | string | 是否检查日期，固定值 `"1"`             |

#### [2] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

## 请求示例（JSON）

json

```json
{
    "PGM": "CUS_ACC_RPT__4_XJLL",
    "SEARCH_INFO": [
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": []
        },
        {
            "fixCondition": {
                "RPT_NO": "STD003",
                "BOOK_NO": "10",
                "CYCLE_TYPE": "1",
                "IPERIOD_TYPE": "1",
                "ACC_IPERIOD_B": "2017-01",
                "ACC_IPERIOD_E": "2017-01",
                "UP_AMTN": "1",
                "CHK_POSTACC": "F",
                "CHK_NO_POA_VOH": "F",
                "DOUBLE_CLASS": "F",
                "SHOW_RPT_ITEM_AMTN_ZERO": "T",
                "CHK_NO_SYTZ_VOH": "F",
                "START_DD": "2017-01-01T00:00:00",
                "YEARS": 2017,
                "IPERIOD": 1,
                "TYPE_NO": "3",
                "DATE_TYPE": "1",
                "DATE_B": "2017-01-01",
                "DATE_E": "2017-01-31",
                "CHK_DATE": "1"
            }
        },
        {
            "orderBy": {
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "",
    "RPT_NO": "STD003",
    "TYPE_NO": "3"
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 100` 的消息中，以下为完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI01",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "经营活动产生的现金流量",
            "ROW_ID": 1,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 0.0,
            "STD004": 0.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI010101",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "销售商品、提供劳务收到的现金",
            "ROW_ID": 2,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AI01]",
            "FORMULA_TEXT": "[AI01 销售商品、提供劳务收到的现金]",
            "STD003": 968620.1,
            "STD004": 968620.1
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI010103",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "收到其他与经营活动有关的现金",
            "ROW_ID": 4,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AI07]",
            "FORMULA_TEXT": "[AI07 收到的其他与经营活动有关的现金]",
            "STD003": 1183048.64,
            "STD004": 1183048.64
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI0101",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "经营活动现金流入小计",
            "ROW_ID": 5,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AI]",
            "FORMULA_TEXT": "[AI 经营活动现金流入]",
            "STD003": 2151668.74,
            "STD004": 2151668.74
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI010201",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "购买商品、接受劳务支付的现金",
            "ROW_ID": 6,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AO09]",
            "FORMULA_TEXT": "[AO09 购买商品、接受劳务支付的现金]",
            "STD003": 60000.0,
            "STD004": 60000.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI010203",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "支付的各项税费",
            "ROW_ID": 8,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AO11]",
            "FORMULA_TEXT": "[AO11 支付给职工以及为职工支付的现金]",
            "STD003": 2393971.82,
            "STD004": 2393971.82
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI010204",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "支付其他与经营活动有关的现金",
            "ROW_ID": 9,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AO17]",
            "FORMULA_TEXT": "[AO17 支付的其他与经营活动有关的现金]",
            "STD003": 2123253.11,
            "STD004": 2123253.11
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI0102",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "经营活动现金流出小计",
            "ROW_ID": 10,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[AO]",
            "FORMULA_TEXT": "[AO 经营活动现金流出]",
            "STD003": 4657845.07,
            "STD004": 4657845.07
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI0103",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "经营活动产生的现金流量净额",
            "ROW_ID": 11,
            "SPACES": 3,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[CI0101]-[CI0102]",
            "FORMULA_TEXT": "[CI0101 经营活动现金流入小计]-[CI0102 经营活动现金流出小计]",
            "STD003": -2506176.33,
            "STD004": -2506176.33
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI020105",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "收到其他与投资活动有关的现金",
            "ROW_ID": 17,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[BI26]",
            "FORMULA_TEXT": "[BI26 收到的其他与投资活动有关的现金]",
            "STD003": 8066095.89,
            "STD004": 8066095.89
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI0201",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "投资活动现金流入小计",
            "ROW_ID": 18,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[BI]",
            "FORMULA_TEXT": "[BI 投资活动现金流入]",
            "STD003": 8066095.89,
            "STD004": 8066095.89
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI020204",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "支付其他与投资活动有关的现金",
            "ROW_ID": 22,
            "SPACES": 1,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[BO33]",
            "FORMULA_TEXT": "[BO33 支付的其他与投资活动有关的现金]",
            "STD003": 6000000.0,
            "STD004": 6000000.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI0202",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "投资活动现金流出小计",
            "ROW_ID": 23,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[BO]",
            "FORMULA_TEXT": "[BO 投资活动现金流出]",
            "STD003": 6000000.0,
            "STD004": 6000000.0
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI0203",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "投资活动产生的现金流量净额",
            "ROW_ID": 24,
            "SPACES": 3,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[CI0201]-[CI0202]",
            "FORMULA_TEXT": "[CI0201 投资活动现金流入小计]-[CI0202 投资活动现金流出小计]",
            "STD003": 2066095.89,
            "STD004": 2066095.89
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI06",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "现金及现金等价物净增加额",
            "ROW_ID": 36,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[CI0103]+[CI0203]+[CI0303]+[CI04]",
            "FORMULA_TEXT": "[CI0103 经营活动产生的现金流量净额]+[CI0203 投资活动产生的现金流量净额]+[CI0303 筹资活动产生的现金流量净额]+[CI04 汇率变动产生的现金流量]",
            "STD003": -440080.44,
            "STD004": -440080.44
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI07",
            "ITEM_NO_UP": "",
            "REL_CLS": 1,
            "ITEM_NAME": "期末现金及现金等价物余额",
            "ROW_ID": 38,
            "SPACES": 0,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[CI06]+[CI0601]",
            "FORMULA_TEXT": "[CI06 现金及现金等价物净增加额]+[CI0601 加：期初现金及现金等价物余额]",
            "STD003": 2463900.64,
            "STD004": 2463900.64
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI050301",
            "ITEM_NO_UP": "CI0503",
            "REL_CLS": 3,
            "ITEM_NAME": "现金的期末余额",
            "ROW_ID": 62,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 2463427.14,
            "STD004": 2463427.14
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI050302",
            "ITEM_NO_UP": "CI0503",
            "REL_CLS": 3,
            "ITEM_NAME": "减：现金的期初余额",
            "ROW_ID": 63,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "",
            "FORMULA_TEXT": "",
            "STD003": 2903981.08,
            "STD004": 2903981.08
        },
        {
            "BOOK_NO": "10",
            "RPT_NO": "STD003",
            "RPT_TYPE": "4",
            "ITEM_NO": "CI050305",
            "ITEM_NO_UP": "CI0503",
            "REL_CLS": 3,
            "ITEM_NAME": "现金及现金等价物净增加额",
            "ROW_ID": 66,
            "SPACES": 2,
            "IS_SUM": "",
            "SW_NEW_ROW": "F",
            "RPT_ITEM_SJ": "2",
            "FORMULA": "[CI050301]-[CI050302]+[CI050303]-[CI050304]",
            "FORMULA_TEXT": "[CI050301 现金的期末余额]-[CI050302 减：现金的期初余额]+[CI050303 加：现金等价物的期末余额]-[CI050304 减：现金等价物的期初余额]",
            "STD003": -440553.94,
            "STD004": -440553.94
        }
    ],
    "COLUMN_INFO": [
        { "NAME": "STD003", "TITLE": "本期发生数" },
        { "NAME": "STD004", "TITLE": "本年累计数" }
    ],
    "OTHER_DATA": {
        "RPT_ITEM_SJ": "2",
        "SW_NEW_ROW_ALIGN": "F",
        "USR_TYPE": "1",
        "RPT_TYPE": "4",
        "SHOW_RESULT_TYPE": 0
    },
    "CHART_DATA": {}
}
```

# 5.物料分析明细表 - 查询制表

## 接口信息

- **接口名称**：物料分析明细表 - 查询制表
- **接口地址**：`POST /api/mrpcu/GetReportStream`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPCU"`                            |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [1] - 固定条件配置

| 字段                           | 类型   | 说明                                       |
| :----------------------------- | :----- | :----------------------------------------- |
| `fixCondition.COMBOEXP`        | string | 展开方式，固定值 `"3"`                     |
| `fixCondition.BOM_ITEM`        | string | BOM项目类型，固定值 `"1"`                  |
| `fixCondition.COMBOCST`        | string | 成本计算方式，固定值 `"1"`                 |
| `fixCondition.SELUPS`          | string | 选择更新方式（当前为空）                   |
| `fixCondition.CHKTW_ID`        | string | 检查委外标识（当前为空）                   |
| `fixCondition.COMBOWHDTL`      | string | 仓库明细方式，固定值 `"1"`                 |
| `fixCondition.COMBO_KCWH`      | string | 库存仓库方式，固定值 `"1"`                 |
| `fixCondition.CHK_PRD`         | string | 是否检查产品，`"F"` 为否                   |
| `fixCondition.ED_QTY_END`      | string | 期末数量计算字段列表                       |
| `fixCondition.EXP_VIR_DRC`     | string | 是否展开虚拟件，`"F"` 为否                 |
| `fixCondition.ED_KCWH`         | string | 仓库库存计算方式（当前为空）               |
| `fixCondition.WASTERCHANGE`    | string | 是否包含报废变更，`"F"` 为否               |
| `fixCondition.NOBOM`           | string | 是否包含无BOM物料，`"F"` 为否              |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"REPORT_DD"` |

#### [2] - 工单号筛选（可选）

| 字段          | 类型    | 说明                          |
| :------------ | :------ | :---------------------------- |
| field         | string  | 筛选字段名：`MO_NO`（工单号） |
| operator      | string  | 操作符：`in`（多选）          |
| fieldType     | string  | 字段类型：`bilNo`（单据编号） |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）   |
| value         | string  | 筛选值（传空表示全部）        |

#### [3] - 母件配方筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`BOM_NO`（母件配方） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldType     | string  | 字段类型：`bilNo`（单据编号）    |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [4] - 母件代号筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`MRP_NO`（母件代号） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [5] - 需求量筛选

| 字段          | 类型    | 说明                           |
| :------------ | :------ | :----------------------------- |
| field         | string  | 筛选字段名：`QTY`（数量）      |
| operator      | string  | 操作符：`equal`（等于）        |
| fieldType     | string  | 字段类型：`number`             |
| fieldDisabled | boolean | 是否禁用：`true`（固定不可改） |
| value         | Int32   | 固定值 `0`                     |

#### [6] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按报表日期升序 |

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPCU",
    "SEARCH_INFO": [
        {
            "showLadder": "F",
            "displayFields": [
                "MO_NO",
                "MO_ITM",
                "QTY_BIL",
                "BOM_NO",
                "MRP_NO",
                "MRP_NAME",
                "BOM_NO1",
                "ITEM",
                "PRD_NO",
                "PRD_NAME",
                "SPC",
                "PRD_MARK",
                "A001",
                "ID_NO",
                "UNIT_NAME",
                "QTY_STD",
                "LOS_RTO",
                "QTY_LOST_FIX",
                "QTY",
                "QTY_RSV",
                "QTY_ADDLOST",
                "UP_STD",
                "CST",
                "QTY_NOW",
                "QTY_END"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "COMBOEXP": "3",
                "BOM_ITEM": "1",
                "COMBOCST": "1",
                "SELUPS": "",
                "CHKTW_ID": "",
                "COMBOWHDTL": "1",
                "COMBO_KCWH": "1",
                "CHK_PRD": "F",
                "ED_QTY_END": "QTY_NOW;QTY_ON_ODR;QTY_SQ;QTY_ON_WAY;QTY_ON_RSV;QTY_ON_PRC",
                "EXP_VIR_DRC": "F",
                "ED_KCWH": "",
                "WASTERCHANGE": "F",
                "NOBOM": "F",
                "REPORT_DD_FIELD": "REPORT_DD"
            }
        },
        {
            "field": "MO_NO",
            "operator": "in",
            "fieldType": "bilNo",
            "fieldDisabled": false,
            "value": ""
        },
        {
            "field": "BOM_NO",
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
            "field": "QTY",
            "operator": "equal",
            "fieldType": "number",
            "fieldDisabled": true,
            "value": 0
        },
        {
            "orderBy": {
                "REPORT_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "MO_NO,MO_ITM,QTY_BIL,BOM_NO,MRP_NO,MRP_NAME,BOM_NO1,ITEM,PRD_NO,PRD_NAME,SPC,PRD_MARK,A001,ID_NO,UNIT_NAME,QTY_STD,LOS_RTO,QTY_LOST_FIX,QTY,QTY_RSV,QTY_ADDLOST,UP_STD,CST,QTY_NOW,QTY_END"
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 20.0` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "MO_NO": "",
            "MO_ITM": null,
            "QTY_BIL": 1.00000000,
            "BOM_NO": "000->",
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "BOM_NO1": "000->",
            "ITEM": "",
            "PRD_NO": "000",
            "PRD_NAME": "原油",
            "SPC": "华为三折叠，怎么叠都有面",
            "PRD_MARK": "",
            "A001": "",
            "ID_NO": null,
            "UNIT_NAME": "KG",
            "QTY_STD": null,
            "LOS_RTO": null,
            "QTY_LOST_FIX": null,
            "QTY": 0.00000000,
            "QTY_RSV": 0.00000000,
            "QTY_ADDLOST": 0.00000000,
            "UP_STD": null,
            "CST": null,
            "QTY_NOW": 40.00000000,
            "QTY_END": 181.00000000,
            "A001_DSC": null,
            "PRD_MARK_DSC": null,
            "_SKIP_STAT": null,
            "MO_ID": "B"
        },
        {
            "MO_NO": "",
            "MO_ITM": null,
            "QTY_BIL": null,
            "BOM_NO": "",
            "MRP_NO": null,
            "MRP_NAME": null,
            "BOM_NO1": "000->",
            "ITEM": "1",
            "PRD_NO": "01",
            "PRD_NAME": "米奇妙妙屋",
            "SPC": "地对地导弹多多多多多多多多",
            "PRD_MARK": "",
            "A001": "",
            "ID_NO": "",
            "UNIT_NAME": "个",
            "QTY_STD": 1.00000000,
            "LOS_RTO": 0.00000000,
            "QTY_LOST_FIX": 0.00000000,
            "QTY": 1.00000000,
            "QTY_RSV": 1.00000000,
            "QTY_ADDLOST": 1.00000000,
            "UP_STD": 0.00000000,
            "CST": 0.00000000,
            "QTY_NOW": -24.00000000,
            "QTY_END": -47.00000000,
            "A001_DSC": null,
            "PRD_MARK_DSC": null,
            "_SKIP_STAT": null,
            "MO_ID": "B"
        }
    ],
    "PAGE_COUNT": 1,
    "PAGE_NUM": 1
}
```

# 6.在制成本明细表 - 查询制表

## 接口信息

- **接口名称**：在制成本明细表 - 查询制表
- **接口地址**：`POST /api/mrpct/GetReportStream`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPCT"`                            |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |
| STAT_GROUP     | array[object] | 否   | 统计分组配置（按物料、特征、批号分组）                     |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [1] - 固定条件配置

| 字段                           | 类型   | 说明                                        |
| :----------------------------- | :----- | :------------------------------------------ |
| `fixCondition.COMBODATE`       | string | 日期组合方式，固定值 `"1"`                  |
| `fixCondition.CHKBILS`         | string | 检查单据类型，固定值 `"MO;TW"`（工单+委外） |
| `fixCondition.CHK_QTYPRC`      | string | 检查数量方式（当前为空）                    |
| `fixCondition.COMBOCLS`        | string | 结账方式，固定值 `"1"`                      |
| `fixCondition.CLSDD`           | string | 结账日期（当前为空）                        |
| `fixCondition.COMBOSVS`        | string | 服务方式，固定值 `"1"`                      |
| `fixCondition.SHOWDATA`        | string | 数据显示方式，固定值 `"1"`                  |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"BIL_DD"`     |

#### [2] - 年月条件

| 字段          | 类型          | 说明                                        |
| :------------ | :------------ | :------------------------------------------ |
| field         | string        | 筛选字段名：`YYMM`（年月）                  |
| operator      | string        | 操作符：`range`（区间查询）                 |
| fieldType     | string        | 字段类型：`date`                            |
| need          | boolean       | 是否必须条件：`true`（必填）                |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改）          |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月）          |
| value         | array[string] | 起止日期（均为本月第一天），格式 YYYY-MM-DD |

#### [3] - 生产货品筛选

| 字段          | 类型    | 说明                                 |
| :------------ | :------ | :----------------------------------- |
| field         | string  | 筛选字段名：`MRP_NO`（生产货品代号） |
| operator      | string  | 操作符：`in`（多选）                 |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）          |
| value         | string  | 筛选值（当前为 `"000"`）             |

#### [4] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

### STAT_GROUP 分组配置说明

| 字段       | 类型   | 说明                     |
| :--------- | :----- | :----------------------- |
| FIELD      | string | 分组字段名称             |
| CHK_DEF    | string | 是否默认勾选，`"T"` 为是 |
| ROW_TO_COL | string | 是否行转列，`"F"` 为否   |
| TITLE      | string | 分组标题                 |
| _X_ROW_KEY | string | 前端唯一标识             |

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPCT",
    "SEARCH_INFO": [
        {
            "showLadder": "F",
            "displayFields": [
                "MRP_NO",
                "MRP_NAME",
                "PRD_MARK",
                "A001",
                "BAT_NO",
                "QTY_QC",
                "CST_QC",
                "CST_MAN_QC",
                "CST_MAK_QC",
                "CST_PRD_QC",
                "CST_OUT_QC",
                "QTY_TR",
                "CST_TR",
                "CST_MAN_TR",
                "CST_MAK_TR",
                "CST_PRD_TR",
                "CST_OUT_TR",
                "QTY_WG",
                "QTY_LOST_WG",
                "CST_WG",
                "CST_MAN_WG",
                "CST_MAK_WG",
                "CST_PRD_WG",
                "CST_OUT_WG",
                "QTY_DQ",
                "CST_DQ",
                "CST_MAN_DQ",
                "CST_MAK_DQ",
                "CST_PRD_DQ",
                "CST_OUT_DQ",
                "QTY_QM",
                "CST_QM",
                "CST_MAN_QM",
                "CST_MAK_QM",
                "CST_PRD_QM",
                "CST_OUT_QM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "COMBODATE": "1",
                "CHKBILS": "MO;TW",
                "CHK_QTYPRC": "",
                "COMBOCLS": "1",
                "CLSDD": "",
                "COMBOSVS": "1",
                "SHOWDATA": "1",
                "REPORT_DD_FIELD": "BIL_DD"
            }
        },
        {
            "field": "YYMM",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": ["2026-08-01", "2026-08-01"]
        },
        {
            "field": "MRP_NO",
            "operator": "in",
            "fieldDisabled": false,
            "value": "000"
        },
        {
            "orderBy": {
                "BIL_DD": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "MRP_NO,MRP_NAME,PRD_MARK,A001,BAT_NO,QTY_QC,CST_QC,CST_MAN_QC,CST_MAK_QC,CST_PRD_QC,CST_OUT_QC,QTY_TR,CST_TR,CST_MAN_TR,CST_MAK_TR,CST_PRD_TR,CST_OUT_TR,QTY_WG,QTY_LOST_WG,CST_WG,CST_MAN_WG,CST_MAK_WG,CST_PRD_WG,CST_OUT_WG,QTY_DQ,CST_DQ,CST_MAN_DQ,CST_MAK_DQ,CST_PRD_DQ,CST_OUT_DQ,QTY_QM,CST_QM,CST_MAN_QM,CST_MAK_QM,CST_PRD_QM,CST_OUT_QM",
    "STAT_GROUP": [
        {
            "FIELD": "MRP_NO",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "生产货品",
            "_X_ROW_KEY": "row_17844"
        },
        {
            "FIELD": "PRD_MARK",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "货品特征",
            "_X_ROW_KEY": "row_17845"
        },
        {
            "FIELD": "BAT_NO",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "批号",
            "_X_ROW_KEY": "row_17846"
        }
    ]
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 80.0` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": null,
            "QTY_QC": 1.00000000,
            "CST_QC": 0.00000000,
            "CST_MAN_QC": 0.00000000,
            "CST_MAK_QC": 0.00000000,
            "CST_PRD_QC": 0.00000000,
            "CST_OUT_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_MAN_TR": 0.00000000,
            "CST_MAK_TR": 0.00000000,
            "CST_PRD_TR": 0.00000000,
            "CST_OUT_TR": 0.00000000,
            "QTY_WG": 0.00000000,
            "QTY_LOST_WG": 0.00000000,
            "CST_WG": 0.00000000,
            "CST_MAN_WG": 0.00000000,
            "CST_MAK_WG": 0.00000000,
            "CST_PRD_WG": 0.00000000,
            "CST_OUT_WG": 0.00000000,
            "QTY_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_MAN_DQ": 0.00000000,
            "CST_MAK_DQ": 0.00000000,
            "CST_PRD_DQ": 0.00000000,
            "CST_OUT_DQ": 0.00000000,
            "QTY_QM": 1.00000000,
            "CST_QM": 0.00000000,
            "CST_MAN_QM": 0.00000000,
            "CST_MAK_QM": 0.00000000,
            "CST_PRD_QM": 0.00000000,
            "CST_OUT_QM": 0.00000000,
            "YYMM": "2024-03-22T00:00:00",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        },
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": null,
            "QTY_QC": 10.00000000,
            "CST_QC": 1141.12500000,
            "CST_MAN_QC": 700.00000000,
            "CST_MAK_QC": 0.00000000,
            "CST_PRD_QC": 0.00000000,
            "CST_OUT_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_MAN_TR": 0.00000000,
            "CST_MAK_TR": 0.00000000,
            "CST_PRD_TR": 0.00000000,
            "CST_OUT_TR": 0.00000000,
            "QTY_WG": 0.00000000,
            "QTY_LOST_WG": 0.00000000,
            "CST_WG": 0.00000000,
            "CST_MAN_WG": 0.00000000,
            "CST_MAK_WG": 0.00000000,
            "CST_PRD_WG": 0.00000000,
            "CST_OUT_WG": 0.00000000,
            "QTY_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_MAN_DQ": 0.00000000,
            "CST_MAK_DQ": 0.00000000,
            "CST_PRD_DQ": 0.00000000,
            "CST_OUT_DQ": 0.00000000,
            "QTY_QM": 10.00000000,
            "CST_QM": 1141.12500000,
            "CST_MAN_QM": 700.00000000,
            "CST_MAK_QM": 0.00000000,
            "CST_PRD_QM": 0.00000000,
            "CST_OUT_QM": 0.00000000,
            "YYMM": "2024-09-11T00:00:00",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        },
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": null,
            "QTY_QC": 20.00000000,
            "CST_QC": 3042.98900000,
            "CST_MAN_QC": 0.00000000,
            "CST_MAK_QC": 0.00000000,
            "CST_PRD_QC": 0.00000000,
            "CST_OUT_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_MAN_TR": 0.00000000,
            "CST_MAK_TR": 0.00000000,
            "CST_PRD_TR": 0.00000000,
            "CST_OUT_TR": 0.00000000,
            "QTY_WG": 0.00000000,
            "QTY_LOST_WG": 0.00000000,
            "CST_WG": 0.00000000,
            "CST_MAN_WG": 0.00000000,
            "CST_MAK_WG": 0.00000000,
            "CST_PRD_WG": 0.00000000,
            "CST_OUT_WG": 0.00000000,
            "QTY_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_MAN_DQ": 0.00000000,
            "CST_MAK_DQ": 0.00000000,
            "CST_PRD_DQ": 0.00000000,
            "CST_OUT_DQ": 0.00000000,
            "QTY_QM": 20.00000000,
            "CST_QM": 3042.98900000,
            "CST_MAN_QM": 0.00000000,
            "CST_MAK_QM": 0.00000000,
            "CST_PRD_QM": 0.00000000,
            "CST_OUT_QM": 0.00000000,
            "YYMM": "2024-09-19T00:00:00",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        },
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": null,
            "QTY_QC": 0.00000000,
            "CST_QC": 0.00000000,
            "CST_MAN_QC": -50.00000000,
            "CST_MAK_QC": -60.00000000,
            "CST_PRD_QC": -80.00000000,
            "CST_OUT_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_MAN_TR": 0.00000000,
            "CST_MAK_TR": 0.00000000,
            "CST_PRD_TR": 0.00000000,
            "CST_OUT_TR": 0.00000000,
            "QTY_WG": 0.00000000,
            "QTY_LOST_WG": 0.00000000,
            "CST_WG": 0.00000000,
            "CST_MAN_WG": 0.00000000,
            "CST_MAK_WG": 0.00000000,
            "CST_PRD_WG": 0.00000000,
            "CST_OUT_WG": 0.00000000,
            "QTY_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_MAN_DQ": 0.00000000,
            "CST_MAK_DQ": 0.00000000,
            "CST_PRD_DQ": 0.00000000,
            "CST_OUT_DQ": 0.00000000,
            "QTY_QM": 0.00000000,
            "CST_QM": 0.00000000,
            "CST_MAN_QM": -50.00000000,
            "CST_MAK_QM": -60.00000000,
            "CST_PRD_QM": -80.00000000,
            "CST_OUT_QM": 0.00000000,
            "YYMM": "2025-03-07T00:00:00",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        },
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": null,
            "QTY_QC": 0.00000000,
            "CST_QC": null,
            "CST_MAN_QC": null,
            "CST_MAK_QC": null,
            "CST_PRD_QC": null,
            "CST_OUT_QC": null,
            "QTY_TR": 1.00000000,
            "CST_TR": 0.00000000,
            "CST_MAN_TR": 0.00000000,
            "CST_MAK_TR": 0.00000000,
            "CST_PRD_TR": 0.00000000,
            "CST_OUT_TR": 0.00000000,
            "QTY_WG": 0.00000000,
            "QTY_LOST_WG": 0.00000000,
            "CST_WG": 0.00000000,
            "CST_MAN_WG": 0.00000000,
            "CST_MAK_WG": 0.00000000,
            "CST_PRD_WG": 0.00000000,
            "CST_OUT_WG": 0.00000000,
            "QTY_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_MAN_DQ": 0.00000000,
            "CST_MAK_DQ": 0.00000000,
            "CST_PRD_DQ": 0.00000000,
            "CST_OUT_DQ": 0.00000000,
            "QTY_QM": 1.00000000,
            "CST_QM": 0.00000000,
            "CST_MAN_QM": 0.00000000,
            "CST_MAK_QM": 0.00000000,
            "CST_PRD_QM": 0.00000000,
            "CST_OUT_QM": 0.00000000,
            "YYMM": "2026-08-18T00:00:00",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        }
    ],
    "PAGE_COUNT": 1,
    "PAGE_NUM": 1
}
```

# 7.在制原料明细表 - 查询制表

## 接口信息

- **接口名称**：在制原料明细表 - 查询制表
- **接口地址**：`POST /api/mrpcx/GetReportStream`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPCX"`                            |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |
| STAT_GROUP     | array[object] | 否   | 统计分组配置（按产品、特征、批号分组）                     |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"F"` 为否                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [1] - 固定条件配置

| 字段                           | 类型   | 说明                                                |
| :----------------------------- | :----- | :-------------------------------------------------- |
| `fixCondition.COMBOBILKND`     | string | 单据种类组合，固定值 `"1"`                          |
| `fixCondition.CHKBILS`         | string | 检查单据类型，固定值 `"MO;MB;MD"`（工单+领料+补料） |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"BIL_DD"`             |

#### [2] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`BIL_DD`（单据日期）   |
| operator      | string        | 操作符：`this_month`（本月）       |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [3] - 材料代号筛选（可选）

| 字段          | 类型    | 说明                             |
| :------------ | :------ | :------------------------------- |
| field         | string  | 筛选字段名：`PRD_NO`（材料代号） |
| operator      | string  | 操作符：`in`（多选）             |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）      |
| value         | string  | 筛选值（传空表示全部）           |

#### [4] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

### STAT_GROUP 分组配置说明

| 字段       | 类型   | 说明                     |
| :--------- | :----- | :----------------------- |
| FIELD      | string | 分组字段名称             |
| CHK_DEF    | string | 是否默认勾选，`"T"` 为是 |
| ROW_TO_COL | string | 是否行转列，`"F"` 为否   |
| TITLE      | string | 分组标题                 |
| _X_ROW_KEY | string | 前端唯一标识             |

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPCX",
    "SEARCH_INFO": [
        {
            "showLadder": "F",
            "displayFields": [
                "PRD_NAME",
                "PRD_MARK",
                "A001",
                "BAT_NO",
                "UNIT_NAME",
                "QTY_QC",
                "QTY1_QC",
                "CST_QC",
                "CST_STD_QC",
                "QTY_TR",
                "QTY1_TR",
                "CST_TR",
                "CST_STD_TR",
                "QTY_HY",
                "QTY1_HY",
                "CST_HY",
                "CST_STD_HY",
                "QTY_DQ",
                "QTY1_DQ",
                "CST_DQ",
                "CST_STD_DQ",
                "QTY_QM",
                "QTY1_QM",
                "CST_QM",
                "CST_STD_QM"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "COMBOBILKND": "1",
                "CHKBILS": "MO;MB;MD",
                "REPORT_DD_FIELD": "BIL_DD"
            }
        },
        {
            "field": "BIL_DD",
            "operator": "this_month",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "value": ["2026-08-01", "2026-08-31"]
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
    "DISPLAY_FIELDS": "PRD_NAME,PRD_MARK,A001,BAT_NO,UNIT_NAME,QTY_QC,QTY1_QC,CST_QC,CST_STD_QC,QTY_TR,QTY1_TR,CST_TR,CST_STD_TR,QTY_HY,QTY1_HY,CST_HY,CST_STD_HY,QTY_DQ,QTY1_DQ,CST_DQ,CST_STD_DQ,QTY_QM,QTY1_QM,CST_QM,CST_STD_QM",
    "STAT_GROUP": [
        {
            "FIELD": "PRD_NO",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "材料代号",
            "_X_ROW_KEY": "row_8211"
        },
        {
            "FIELD": "PRD_MARK",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "货品特征",
            "_X_ROW_KEY": "row_8212"
        },
        {
            "FIELD": "BAT_NO",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "批号",
            "_X_ROW_KEY": "row_8213"
        }
    ]
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 80.0` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "PRD_NAME": "米奇妙妙屋",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": "",
            "UNIT_NAME": "个",
            "QTY_QC": 2.00000000,
            "QTY1_QC": 10.00000000,
            "CST_QC": 0.00000000,
            "CST_STD_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "QTY1_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_STD_TR": 0.00000000,
            "QTY_HY": 0.00000000,
            "QTY1_HY": 0.00000000,
            "CST_HY": 0.00000000,
            "CST_STD_HY": 0.00000000,
            "QTY_DQ": 0.00000000,
            "QTY1_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_STD_DQ": 0.00000000,
            "QTY_QM": 2.00000000,
            "QTY1_QM": 10.00000000,
            "CST_QM": 0.00000000,
            "CST_STD_QM": 0.00000000,
            "BIL_DD": "2024-03-22T00:00:00",
            "PRD_NO": "01",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        },
        {
            "PRD_NAME": "米奇妙妙屋",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": "",
            "UNIT_NAME": "个",
            "QTY_QC": 15.00000000,
            "QTY1_QC": 75.00000000,
            "CST_QC": 1141.12500000,
            "CST_STD_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "QTY1_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_STD_TR": 0.00000000,
            "QTY_HY": 0.00000000,
            "QTY1_HY": 0.00000000,
            "CST_HY": 0.00000000,
            "CST_STD_HY": 0.00000000,
            "QTY_DQ": 0.00000000,
            "QTY1_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_STD_DQ": 0.00000000,
            "QTY_QM": 15.00000000,
            "QTY1_QM": 75.00000000,
            "CST_QM": 1141.12500000,
            "CST_STD_QM": 0.00000000,
            "BIL_DD": "2024-09-11T00:00:00",
            "PRD_NO": "01",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        },
        {
            "PRD_NAME": "佛跳墙",
            "PRD_MARK": "",
            "A001": "",
            "BAT_NO": "",
            "UNIT_NAME": "KG",
            "QTY_QC": 10.00000000,
            "QTY1_QC": 10000.00000000,
            "CST_QC": 0.00000000,
            "CST_STD_QC": 0.00000000,
            "QTY_TR": 0.00000000,
            "QTY1_TR": 0.00000000,
            "CST_TR": 0.00000000,
            "CST_STD_TR": 0.00000000,
            "QTY_HY": 0.00000000,
            "QTY1_HY": 0.00000000,
            "CST_HY": 0.00000000,
            "CST_STD_HY": 0.00000000,
            "QTY_DQ": 0.00000000,
            "QTY1_DQ": 0.00000000,
            "CST_DQ": 0.00000000,
            "CST_STD_DQ": 0.00000000,
            "QTY_QM": 10.00000000,
            "QTY1_QM": 10000.00000000,
            "CST_QM": 0.00000000,
            "CST_STD_QM": 0.00000000,
            "BIL_DD": "2024-09-12T00:00:00",
            "PRD_NO": "010",
            "A001_DSC": null,
            "PRD_MARK_DSC": null
        }
    ],
    "PAGE_COUNT": 1,
    "PAGE_NUM": 1
}
```

# 8.直接原料明细表 - 查询制表

## 接口信息

- **接口名称**：直接原料明细表 - 查询制表
- **接口地址**：`POST /api/mrpce/GetReportStream`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"MRPCE"`                            |
| SEARCH_INFO    | array[object] | 是   | 查询条件数组（具体结构见下方详解）                         |
| DISPLAY_FIELDS | string        | 否   | 逗号分隔的字符串，指定最终返回哪些字段（若不传则返回全部） |
| STAT_GROUP     | array[object] | 否   | 统计分组配置（按生产货品、直接原料分组）                   |

------

### SEARCH_INFO 数组结构详解

该数组是一个**条件组合体**，按索引顺序解析，各元素功能如下：

#### [0] - 展示字段及汇总配置

| 字段          | 类型          | 说明                                                         |
| :------------ | :------------ | :----------------------------------------------------------- |
| showLadder    | string        | 是否显示阶梯价，`"T"` 为是                                   |
| displayFields | array[string] | 表格需要展示的字段列表（需与下方 `DISPLAY_FIELDS` 保持一致） |
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [1] - 固定条件配置

| 字段                           | 类型   | 说明                                    |
| :----------------------------- | :----- | :-------------------------------------- |
| `fixCondition.REPORT_DD_FIELD` | string | 报表日期字段标识，固定取值为 `"BIL_DD"` |
| `fixCondition.COMBOSVS`        | string | 服务方式，固定值 `"1"`                  |
| `fixCondition.COMBOFCP`        | string | 固定值 `"T"`                            |
| `fixCondition.COMBOSUM`        | string | 汇总方式，固定值 `"1"`                  |
| `fixCondition.WASTERCHANGE`    | string | 报废变更（当前为空）                    |

#### [2] - 日期范围条件

| 字段          | 类型          | 说明                               |
| :------------ | :------------ | :--------------------------------- |
| field         | string        | 筛选字段名：`BIL_DD`（单据日期）   |
| operator      | string        | 操作符：`range`（区间查询）        |
| fieldType     | string        | 字段类型：`date`                   |
| need          | boolean       | 是否必须条件：`true`（必填）       |
| fieldDisabled | boolean       | 前端是否禁用：`true`（固定不可改） |
| dateOperator  | string        | 日期快捷操作：`this_month`（本月） |
| value         | array[string] | 起止日期，格式 YYYY-MM-DD          |

#### [3] - 生产货品筛选（可选）

| 字段          | 类型    | 说明                                 |
| :------------ | :------ | :----------------------------------- |
| field         | string  | 筛选字段名：`MRP_NO`（生产货品代号） |
| operator      | string  | 操作符：`in`（多选）                 |
| fieldDisabled | boolean | 是否禁用：`false`（可编辑）          |
| value         | string  | 筛选值（传空表示全部）               |

#### [4] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按单据日期升序 |

### STAT_GROUP 分组配置说明

| 字段       | 类型   | 说明                     |
| :--------- | :----- | :----------------------- |
| FIELD      | string | 分组字段名称             |
| CHK_DEF    | string | 是否默认勾选，`"T"` 为是 |
| ROW_TO_COL | string | 是否行转列，`"F"` 为否   |
| TITLE      | string | 分组标题                 |
| _X_ROW_KEY | string | 前端唯一标识             |

## 请求示例（JSON）

json

```json
{
    "PGM": "MRPCE",
    "SEARCH_INFO": [
        {
            "showLadder": "T",
            "displayFields": [
                "MRP_NO",
                "MRP_NAME",
                "SPC",
                "UNIT_NAME_H",
                "QTY",
                "PRD_NO",
                "PRD_NAME",
                "SPC_PRD",
                "UNIT_NAME",
                "QTY_PRD",
                "UP",
                "CST",
                "QTY_AVE",
                "CST_AVE"
            ],
            "sumFields": []
        },
        {
            "fixCondition": {
                "REPORT_DD_FIELD": "BIL_DD",
                "COMBOSVS": "1",
                "COMBOFCP": "T",
                "COMBOSUM": "1",
                "WASTERCHANGE": ""
            }
        },
        {
            "field": "BIL_DD",
            "operator": "range",
            "fieldType": "date",
            "need": true,
            "fieldDisabled": true,
            "dateOperator": "this_month",
            "value": ["2026-01-01", "2026-08-31"]
        },
        {
            "field": "MRP_NO",
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
    "DISPLAY_FIELDS": "MRP_NO,MRP_NAME,SPC,UNIT_NAME_H,QTY,PRD_NO,PRD_NAME,SPC_PRD,UNIT_NAME,QTY_PRD,UP,CST,QTY_AVE,CST_AVE",
    "STAT_GROUP": [
        {
            "FIELD": "MRP_NO",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "生产货品",
            "_X_ROW_KEY": "row_14023"
        },
        {
            "FIELD": "PRD_NO",
            "CHK_DEF": "T",
            "ROW_TO_COL": "F",
            "TITLE": "直接原料-材料代号",
            "_X_ROW_KEY": "row_14024"
        }
    ]
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`REPORT__TAB` 出现在 `PERCENT: 20.0` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "SPC": "华为三折叠，怎么叠都有面",
            "UNIT_NAME_H": "KG",
            "QTY": 1.00000000,
            "PRD_NO": "01",
            "PRD_NAME": "米奇妙妙屋",
            "SPC_PRD": "地对地导弹多多多多多多多多",
            "UNIT_NAME": "个",
            "QTY_PRD": 0.00000000,
            "UP": null,
            "CST": 0.00000000,
            "QTY_AVE": 0.00000000,
            "CST_AVE": 0.00000000,
            "BIL_DD": null,
            "PRD_MARK": "",
            "PRD_MARK_B": "",
            "_SKIP_STAT": ""
        },
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "SPC": "华为三折叠，怎么叠都有面",
            "UNIT_NAME_H": "KG",
            "QTY": 0.00000000,
            "PRD_NO": "02",
            "PRD_NAME": "02",
            "SPC_PRD": null,
            "UNIT_NAME": "01",
            "QTY_PRD": 0.00000000,
            "UP": null,
            "CST": 0.00000000,
            "QTY_AVE": 0.00000000,
            "CST_AVE": 0.00000000,
            "BIL_DD": null,
            "PRD_MARK": "",
            "PRD_MARK_B": "",
            "_SKIP_STAT": ""
        },
        {
            "MRP_NO": "000",
            "MRP_NAME": "原油",
            "SPC": "华为三折叠，怎么叠都有面",
            "UNIT_NAME_H": "KG",
            "QTY": 0.00000000,
            "PRD_NO": "03",
            "PRD_NAME": "03",
            "SPC_PRD": null,
            "UNIT_NAME": "01",
            "QTY_PRD": 0.00000000,
            "UP": null,
            "CST": 0.00000000,
            "QTY_AVE": 0.00000000,
            "CST_AVE": 0.00000000,
            "BIL_DD": null,
            "PRD_MARK": "",
            "PRD_MARK_B": "",
            "_SKIP_STAT": ""
        },
        {
            "MRP_NO": "小计",
            "MRP_NAME": null,
            "SPC": null,
            "UNIT_NAME_H": null,
            "QTY": 1.00000000,
            "PRD_NO": null,
            "PRD_NAME": null,
            "SPC_PRD": null,
            "UNIT_NAME": null,
            "QTY_PRD": 0.00000000,
            "UP": null,
            "CST": 0.00000000,
            "QTY_AVE": null,
            "CST_AVE": null,
            "BIL_DD": null,
            "PRD_MARK": "",
            "PRD_MARK_B": "",
            "_SKIP_STAT": "T"
        },
        {
            "MRP_NO": "全表合计",
            "MRP_NAME": null,
            "SPC": null,
            "UNIT_NAME_H": null,
            "QTY": 1.00000000,
            "PRD_NO": null,
            "PRD_NAME": null,
            "SPC_PRD": null,
            "UNIT_NAME": null,
            "QTY_PRD": 0.00000000,
            "UP": null,
            "CST": 0.00000000,
            "QTY_AVE": null,
            "CST_AVE": null,
            "BIL_DD": null,
            "PRD_MARK": "",
            "PRD_MARK_B": "",
            "_SKIP_STAT": "T"
        }
    ],
    "PAGE_COUNT": 1,
    "PAGE_NUM": 1
}
```