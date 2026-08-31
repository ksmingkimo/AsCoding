# 1.总分类账（Online空白纸打印(总账)）- 查询制表

## 接口信息

- **接口名称**：总分类账（Online空白纸打印(总账)）- 查询制表
- **接口地址**：`POST /api/RPTACCBlank/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名    | 类型   | 必填 | 说明                          |
| :-------- | :----- | :--- | :---------------------------- |
| dateB     | string | 是   | 起止日期起，格式 `YYYY-MM-DD` |
| dateE     | string | 是   | 起止日期止，格式 `YYYY-MM-DD` |
| AccNoB    | string | 否   | 起止科目起                    |
| AccNoE    | string | 否   | 起止科目止                    |
| DEPT      | string | 否   | 部门选择                      |
| DEPTSHOW  | string | 否   | 部门列示                      |
| ACCLEVEL  | string | 是   | 科目级别（0,1,2,3）           |
| YE        | string | 否   | 科目余额方向                  |
| POSSTYLE  | string | 否   | 过账方式                      |
| ACCA      | string | 否   | 账别                          |
| CUR_SEL   | string | 否   | 币别                          |
| CHKCUR_ID | string | 否   | 依币别汇总                    |

## 请求示例（JSON）

json

```json
{
    "dateB": "2024-01-01",
    "dateE": "2024-12-31",
    "AccNoB": "1001",
    "AccNoE": "6901",
    "DEPT": "",
    "DEPTSHOW": "",
    "ACCLEVEL": "0",
    "YE": "",
    "POSSTYLE": "",
    "ACCA": "",
    "CUR_SEL": "",
    "CHKCUR_ID": ""
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`RPT` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "RPT": [
        {
            "NAME": "库存现金",
            "ENG_NAME": null,
            "ACC_NO": "1001",
            "ACC_NOTE": "1001/库存现金",
            "YEARMONTH": null,
            "YEARS": null,
            "MONTHS": null,
            "REM": "承上期",
            "AMTND": null,
            "AMTNC": null,
            "AMTNYE": null,
            "SHOWDC": "",
            "ACCNDC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTYE": null,
            "ENG_NOTE": "1001/",
            "CUR_ID": null,
            "CUR_NAME": null
        },
        {
            "NAME": null,
            "ENG_NAME": null,
            "ACC_NO": "1001",
            "ACC_NOTE": null,
            "YEARMONTH": "2024年1月",
            "YEARS": null,
            "MONTHS": null,
            "REM": "2024年1月份凭证总金额",
            "AMTND": 2200.00000000,
            "AMTNC": null,
            "AMTNYE": 2200.00000000,
            "SHOWDC": "借",
            "ACCNDC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTYE": null,
            "ENG_NOTE": null,
            "CUR_ID": null,
            "CUR_NAME": null
        },
        {
            "NAME": null,
            "ENG_NAME": null,
            "ACC_NO": "1001",
            "ACC_NOTE": "小计",
            "YEARMONTH": null,
            "YEARS": null,
            "MONTHS": null,
            "REM": null,
            "AMTND": 2200.00000000,
            "AMTNC": null,
            "AMTNYE": 2200.00000000,
            "SHOWDC": "借",
            "ACCNDC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTYE": null,
            "ENG_NOTE": "Subtotal",
            "CUR_ID": null,
            "CUR_NAME": null
        },
        {
            "NAME": "累计折旧",
            "ENG_NAME": null,
            "ACC_NO": "1602",
            "ACC_NOTE": "1602/累计折旧",
            "YEARMONTH": null,
            "YEARS": null,
            "MONTHS": null,
            "REM": "承上期",
            "AMTND": null,
            "AMTNC": null,
            "AMTNYE": null,
            "SHOWDC": "",
            "ACCNDC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTYE": null,
            "ENG_NOTE": "1602/",
            "CUR_ID": null,
            "CUR_NAME": null
        },
        {
            "NAME": null,
            "ENG_NAME": null,
            "ACC_NO": "1602",
            "ACC_NOTE": null,
            "YEARMONTH": "2024年1月",
            "YEARS": null,
            "MONTHS": null,
            "REM": "2024年1月份凭证总金额",
            "AMTND": null,
            "AMTNC": 2200.00000000,
            "AMTNYE": -2200.00000000,
            "SHOWDC": "借",
            "ACCNDC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTYE": null,
            "ENG_NOTE": null,
            "CUR_ID": null,
            "CUR_NAME": null
        },
        {
            "NAME": null,
            "ENG_NAME": null,
            "ACC_NO": "1602",
            "ACC_NOTE": "小计",
            "YEARMONTH": null,
            "YEARS": null,
            "MONTHS": null,
            "REM": null,
            "AMTND": null,
            "AMTNC": 2200.00000000,
            "AMTNYE": -2200.00000000,
            "SHOWDC": "借",
            "ACCNDC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTYE": null,
            "ENG_NOTE": "Subtotal",
            "CUR_ID": null,
            "CUR_NAME": null
        }
    ],
    "COLUMN_INFO": {
        "RPT": [
            { "NAME": "NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ENG_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NOTE", "TYPE": "String", "SIZE": -1 },
            { "NAME": "YEARMONTH", "TYPE": "String", "SIZE": -1 },
            { "NAME": "YEARS", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "MONTHS", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "REM", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTND", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNYE", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "SHOWDC", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACCNDC", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTD", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTYE", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "ENG_NOTE", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CUR_ID", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CUR_NAME", "TYPE": "String", "SIZE": -1 }
        ]
    },
    "COLUMN_PROP": {
        "RPT": []
    }
}
```

# 2.科目余额表（Online科目明细表）- 查询制表

## 接口信息

- **接口名称**：科目余额表（Online科目明细表）- 查询制表
- **接口地址**：`POST /api/RPTACCDetail/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名       | 类型   | 必填 | 说明                          |
| :----------- | :----- | :--- | :---------------------------- |
| dateB        | string | 是   | 起止日期起，格式 `YYYY-MM-DD` |
| dateE        | string | 是   | 起止日期止，格式 `YYYY-MM-DD` |
| AccNo        | string | 否   | 主科目代号                    |
| DEPT         | string | 否   | 部门选择                      |
| DEPTSHOW     | string | 否   | 部门列示                      |
| ACCLEVEL     | string | 否   | 科目级别方式显示（T）         |
| YE           | string | 否   | 科目余额方向                  |
| POSSTYLE     | string | 否   | 过账方式                      |
| ACCA         | string | 否   | 账别                          |
| CUR_SEL      | string | 否   | 币别                          |
| CHKCUR_ID    | string | 否   | 依币别汇总                    |
| ACCNOBJLEVEL | string | 否   | 依对象别显示                  |

## 请求示例（JSON）

json

```json
{
    "dateB": "2024-01-01",
    "dateE": "2024-12-31",
    "AccNo": "1001",
    "DEPT": "",
    "DEPTSHOW": "",
    "ACCLEVEL": "",
    "YE": "",
    "POSSTYLE": "",
    "ACCA": "",
    "CUR_SEL": "",
    "CHKCUR_ID": "",
    "ACCNOBJLEVEL": ""
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`RPT` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "RPT": [
        {
            "ACC_NO": "1001",
            "NAME": "库存现金",
            "ENG_NAME": null,
            "AMTNQC": null,
            "AMTND": 2200.00000000,
            "AMTNC": null,
            "SHOWDC": "借",
            "AMTNYE": 2200.00000000,
            "AMTQC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTCUR": null,
            "AMTYE": null,
            "AMTDCCE": 2200.00000000,
            "AMTNSHOWQC": null,
            "AMTSHOWQC": null,
            "AMTNQC_D": null,
            "AMTNQC_C": null,
            "AMTQC_D": null,
            "AMTQC_C": null,
            "AMTNYE_D": 2200.00000000,
            "AMTNYE_C": null,
            "AMTYE_D": null,
            "AMTYE_C": null,
            "DC": "D",
            "CLS": null,
            "TOP": null,
            "D_NUM": 20,
            "C_NUM": 0,
            "CUR_ID": null,
            "OBJ": null,
            "OBJ_NAME": null,
            "OBJ_NAME_F": null,
            "SW_OBJ": null
        },
        {
            "ACC_NO": null,
            "NAME": "合计:",
            "ENG_NAME": null,
            "AMTNQC": null,
            "AMTND": 2200.00000000,
            "AMTNC": null,
            "SHOWDC": "借",
            "AMTNYE": 2200.00000000,
            "AMTQC": null,
            "AMTD": null,
            "AMTC": null,
            "AMTCUR": null,
            "AMTYE": null,
            "AMTDCCE": 2200.00000000,
            "AMTNSHOWQC": null,
            "AMTSHOWQC": null,
            "AMTNQC_D": null,
            "AMTNQC_C": null,
            "AMTQC_D": null,
            "AMTQC_C": null,
            "AMTNYE_D": null,
            "AMTNYE_C": null,
            "AMTYE_D": null,
            "AMTYE_C": null,
            "DC": null,
            "CLS": null,
            "TOP": null,
            "D_NUM": null,
            "C_NUM": null,
            "CUR_ID": null,
            "OBJ": null,
            "OBJ_NAME": null,
            "OBJ_NAME_F": null,
            "SW_OBJ": null
        }
    ],
    "COLUMN_INFO": {
        "RPT": [
            { "NAME": "ACC_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ENG_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTNQC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTND", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "SHOWDC", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTNYE", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTQC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTD", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTCUR", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTYE", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTDCCE", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNSHOWQC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTSHOWQC", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNQC_D", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNQC_C", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTQC_D", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTQC_C", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNYE_D", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTNYE_C", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTYE_D", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTYE_C", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "DC", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CLS", "TYPE": "String", "SIZE": -1 },
            { "NAME": "TOP", "TYPE": "String", "SIZE": -1 },
            { "NAME": "D_NUM", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "C_NUM", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "CUR_ID", "TYPE": "String", "SIZE": -1 },
            { "NAME": "OBJ", "TYPE": "String", "SIZE": -1 },
            { "NAME": "OBJ_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "OBJ_NAME_F", "TYPE": "String", "SIZE": -1 },
            { "NAME": "SW_OBJ", "TYPE": "String", "SIZE": -1 }
        ]
    },
    "COLUMN_PROP": {
        "RPT": []
    }
}
```

# 3.资产负债表（Online资产负债表(账户式)）- 查询制表

## 接口信息

- **接口名称**：资产负债表（Online资产负债表(账户式)）- 查询制表
- **接口地址**：`POST /api/RPTZFListA/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名    | 类型   | 必填 | 说明                                         |
| :-------- | :----- | :--- | :------------------------------------------- |
| txtDep    | string | 否   | 部门                                         |
| dtE       | string | 是   | 日期，格式 `YYYY-MM-DD`（如 `"2025-08-28"`） |
| REPO1     | string | 是   | 资产公式（如 `"10"`）                        |
| REPO2     | string | 是   | 负债公式（如 `"20"`）                        |
| REPO3     | string | 是   | 业主公式（如 `"30"`）                        |
| ZHANGID   | string | 否   | 账别                                         |
| SHOW_LST  | string | 否   | 列示方式（`"1"`=默认）                       |
| ZERO_SHOW | string | 否   | 科目为零显示否                               |

## 请求示例（JSON）

json

```json
{
    "txtDep": "",
    "dtE": "2025-08-28",
    "REPNO1": "10",
    "REPNO2": "20",
    "REPNO3": "30",
    "ZHANGID": "",
    "SHOW_LST": "1",
    "ZERO_SHOW": ""
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`MyTable` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "MyTable": [
        {
            "ID": 1,
            "ACC_NOL": null,
            "ACC_NAMEL": null,
            "LL": null,
            "AMTNL": null,
            "AMTN_SUBL": null,
            "AMTN_SUML": null,
            "RATE1L": null,
            "ACC_NOR": " ",
            "ACC_NAMER": "负债合计",
            "RR": null,
            "AMTNR": null,
            "AMTN_SUBR": null,
            "AMTN_SUMR": null,
            "RATE1R": 0.0,
            "LA": null,
            "AMTNA": null,
            "AMTN_SUBA": null,
            "AMTN_SUMA": null,
            "RATE1A": null,
            "RB": null,
            "AMTNB": null,
            "AMTN_SUBB": null,
            "AMTN_SUMB": null,
            "RATE1B": 0.0,
            "ITM": "2"
        },
        {
            "ID": 2,
            "ACC_NOL": null,
            "ACC_NAMEL": null,
            "LL": null,
            "AMTNL": null,
            "AMTN_SUBL": null,
            "AMTN_SUML": null,
            "RATE1L": null,
            "ACC_NOR": " ",
            "ACC_NAMER": "减：库存股",
            "RR": null,
            "AMTNR": null,
            "AMTN_SUBR": null,
            "AMTN_SUMR": null,
            "RATE1R": 0.0,
            "LA": null,
            "AMTNA": null,
            "AMTN_SUBA": null,
            "AMTN_SUMA": null,
            "RATE1A": null,
            "RB": null,
            "AMTNB": null,
            "AMTN_SUBB": null,
            "AMTN_SUMB": null,
            "RATE1B": 0.0,
            "ITM": "3"
        },
        {
            "ID": 3,
            "ACC_NOL": null,
            "ACC_NAMEL": null,
            "LL": null,
            "AMTNL": null,
            "AMTN_SUBL": null,
            "AMTN_SUML": null,
            "RATE1L": null,
            "ACC_NOR": " ",
            "ACC_NAMER": "本期损益",
            "RR": null,
            "AMTNR": null,
            "AMTN_SUBR": null,
            "AMTN_SUMR": null,
            "RATE1R": 0.0,
            "LA": null,
            "AMTNA": null,
            "AMTN_SUBA": null,
            "AMTN_SUMA": null,
            "RATE1A": null,
            "RB": null,
            "AMTNB": null,
            "AMTN_SUBB": null,
            "AMTN_SUMB": null,
            "RATE1B": 0.0,
            "ITM": "4"
        },
        {
            "ID": 4,
            "ACC_NOL": null,
            "ACC_NAMEL": null,
            "LL": null,
            "AMTNL": null,
            "AMTN_SUBL": null,
            "AMTN_SUML": null,
            "RATE1L": null,
            "ACC_NOR": " ",
            "ACC_NAMER": "减：以前年度损益调整",
            "RR": null,
            "AMTNR": null,
            "AMTN_SUBR": null,
            "AMTN_SUMR": null,
            "RATE1R": 0.0,
            "LA": null,
            "AMTNA": null,
            "AMTN_SUBA": null,
            "AMTN_SUMA": null,
            "RATE1A": null,
            "RB": null,
            "AMTNB": null,
            "AMTN_SUBB": null,
            "AMTN_SUMB": null,
            "RATE1B": 0.0,
            "ITM": "5"
        },
        {
            "ID": 5,
            "ACC_NOL": " ",
            "ACC_NAMEL": "资产合计",
            "LL": null,
            "AMTNL": null,
            "AMTN_SUBL": null,
            "AMTN_SUML": null,
            "RATE1L": 0.0,
            "ACC_NOR": " ",
            "ACC_NAMER": "负债及业主权益合计",
            "RR": null,
            "AMTNR": null,
            "AMTN_SUBR": null,
            "AMTN_SUMR": null,
            "RATE1R": 0.0,
            "LA": null,
            "AMTNA": null,
            "AMTN_SUBA": null,
            "AMTN_SUMA": null,
            "RATE1A": 0.0,
            "RB": null,
            "AMTNB": null,
            "AMTN_SUBB": null,
            "AMTN_SUMB": null,
            "RATE1B": 0.0,
            "ITM": "6"
        }
    ],
    "COLUMN_INFO": {
        "MyTable": [
            { "NAME": "ID", "TYPE": "Int32", "SIZE": -1, "ISPK": "T" },
            { "NAME": "ACC_NOL", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NAMEL", "TYPE": "String", "SIZE": -1 },
            { "NAME": "LL", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTNL", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUBL", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUML", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RATE1L", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "ACC_NOR", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NAMER", "TYPE": "String", "SIZE": -1 },
            { "NAME": "RR", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTNR", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUBR", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUMR", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RATE1R", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "LA", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTNA", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUBA", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUMA", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RATE1A", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RB", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTNB", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUBB", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUMB", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RATE1B", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "ITM", "TYPE": "String", "SIZE": -1 }
        ]
    },
    "COLUMN_PROP": {
        "MyTable": []
    }
}
```

# 4.利润表（Online损益表(单部门,期间)）- 查询制表

## 接口信息

- **接口名称**：利润表（Online损益表(单部门,期间)）- 查询制表
- **接口地址**：`POST /api/RPTSYListA/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名    | 类型   | 必填 | 说明                                               |
| :-------- | :----- | :--- | :------------------------------------------------- |
| dtB       | string | 是   | 起止日期起，格式 `YYYY-MM-DD`（如 `"2026-01-01"`） |
| dtE       | string | 是   | 起止日期止，格式 `YYYY-MM-DD`（如 `"2026-12-31"`） |
| REPNO     | string | 是   | 报表公式（如 `"40"`）                              |
| DEPNO     | string | 否   | 部门选择                                           |
| DEP_LST   | string | 否   | 部门列示（`"1"`=不含下属）                         |
| OBJ_ID    | string | 否   | 对象别类型（`"0"`=全部）                           |
| OBJ       | string | 否   | 统计对象别                                         |
| ADDUP     | string | 否   | 计算年度累计否                                     |
| RATEMODE  | string | 否   | 比率计算方式（`"1"`=依销货收入总额）               |
| ZHANGID   | string | 否   | 账别                                               |
| ZERO_SHOW | string | 否   | 科目为零显示否                                     |

## 请求示例（JSON）

json

```json
{
    "dtB": "2026-01-01",
    "dtE": "2026-12-31",
    "REPNO": "40",
    "DEPNO": "",
    "DEP_LST": "1",
    "OBJ_ID": "0",
    "OBJ": "",
    "ADDUP": "",
    "RATEMODE": "1",
    "ZHANGID": "",
    "ZERO_SHOW": ""
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`MyTable` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "MyTable": [
        {
            "ITM": 1,
            "KEY_ITM": 2,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "减:营业成本",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___1",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 2,
            "KEY_ITM": 3,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "营业税金及附加",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___2",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 3,
            "KEY_ITM": 4,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "销售费用",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___3",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 4,
            "KEY_ITM": 5,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "管理费用",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___4",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 5,
            "KEY_ITM": 6,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "财务费用",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___5",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 11,
            "KEY_ITM": 10,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "营业利润",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___11",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "2"
        },
        {
            "ITM": 9,
            "KEY_ITM": 11,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "加:营业外收入",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___9",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 10,
            "KEY_ITM": 12,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "减:营业外支出",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___10",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "1"
        },
        {
            "ITM": 12,
            "KEY_ITM": 13,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "利润总额:",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___12",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "2"
        },
        {
            "ITM": 13,
            "KEY_ITM": 16,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "减:所得税费用",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___13",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "2"
        },
        {
            "ITM": 14,
            "KEY_ITM": 17,
            "CLS": null,
            "REL_CLS": null,
            "ACC_NO": " ",
            "ACC_NAME": "净利润",
            "AMTN": null,
            "AMTN_SUB": null,
            "AMTN_SUM": null,
            "RATE1": 0.0000,
            "AMTN_BUDGET": null,
            "AMTN_DIFF": 0.00000000,
            "RATE2": 0.0,
            "CAS_NO": "",
            "CAS_NAME": null,
            "CAS_ITM": "___14",
            "UP": null,
            "SEG3": null,
            "SEG2": null,
            "AMT": null,
            "FUN": "2"
        }
    ],
    "COLUMN_INFO": {
        "MyTable": [
            { "NAME": "ITM", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "KEY_ITM", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "CLS", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "REL_CLS", "TYPE": "Int32", "SIZE": -1 },
            { "NAME": "ACC_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMTN", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUB", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_SUM", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RATE1", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_BUDGET", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN_DIFF", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "RATE2", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "CAS_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CAS_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CAS_ITM", "TYPE": "String", "SIZE": -1 },
            { "NAME": "UP", "TYPE": "String", "SIZE": -1 },
            { "NAME": "SEG3", "TYPE": "String", "SIZE": -1 },
            { "NAME": "SEG2", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMT", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "FUN", "TYPE": "String", "SIZE": -1 }
        ]
    },
    "COLUMN_PROP": {
        "MyTable": []
    }
}
```

# 5.现金流量表（Online现金流量表(直接法)）- 查询制表

## 接口信息

- **接口名称**：现金流量表（Online现金流量表(直接法)）- 查询制表
- **接口地址**：`POST /api/RPTCshFroList/GetReportStream`

------

## 请求头 (Headers)

| 参数名        | 类型   | 必填 | 说明                      |
| :------------ | :----- | :--- | :------------------------ |
| Content-Type  | string | 是   | 固定为 `application/json` |
| Authorization | string | 是   | 用户认证令牌              |

------

## 请求体 (Body)

### 顶层参数说明

| 字段名     | 类型   | 必填 | 说明                                               |
| :--------- | :----- | :--- | :------------------------------------------------- |
| dtDateB    | string | 是   | 凭证日期起，格式 `YYYY-MM-DD`（如 `"2026-01-01"`） |
| dtDateE    | string | 是   | 凭证日期止，格式 `YYYY-MM-DD`（如 `"2026-12-31"`） |
| txtCshFroB | string | 否   | 原因代号起                                         |
| txtCshFroE | string | 否   | 原因代号止                                         |
| ACCN_SEL   | string | 否   | 会计科目                                           |
| DEPT_SEL   | string | 否   | 部门选择                                           |
| DEPT_LST   | string | 否   | 部门列示（`"1"`=不含下属）                         |
| DATE_TYPE  | string | 否   | 制表日期（0,1）                                    |
| BILL_TYPE  | string | 否   | 单据显示（0,1,2）                                  |
| CHK_CASH   | string | 否   | 依现金流量科目制表                                 |

## 请求示例（JSON）

json

```json
{
    "dtDateB": "2026-01-01",
    "dtDateE": "2026-12-31",
    "txtCshFroB": "",
    "txtCshFroE": "",
    "ACCN_SEL": "",
    "DEPT_SEL": "",
    "DEPT_LST": "1",
    "DATE_TYPE": "",
    "BILL_TYPE": "",
    "CHK_CASH": ""
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中。`RPT_CSHFROLIST` 出现在 `PERCENT: 100` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "RPT_CSHFROLIST": [],
    "COLUMN_INFO": {
        "RPT_CSHFROLIST": [
            { "NAME": "CSH_FRO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CSH_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CSH_ENG_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "MAK_DAT", "TYPE": "DateTime", "SIZE": -1 },
            { "NAME": "MAK_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "VOH_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_ENG_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CUR_ID", "TYPE": "String", "SIZE": -1 },
            { "NAME": "EXC_RTO", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "BIL_ID", "TYPE": "String", "SIZE": -1 },
            { "NAME": "BIL_NO", "TYPE": "String", "SIZE": -1 },
            { "NAME": "DEP", "TYPE": "String", "SIZE": -1 },
            { "NAME": "DEP_NAME", "TYPE": "String", "SIZE": -1 },
            { "NAME": "DC", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ACC_REM", "TYPE": "String", "SIZE": -1 },
            { "NAME": "REM", "TYPE": "String", "SIZE": -1 },
            { "NAME": "OBJ", "TYPE": "String", "SIZE": -1 },
            { "NAME": "ARP_DAT", "TYPE": "DateTime", "SIZE": -1 },
            { "NAME": "CLS_ID1", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CLS_ID2", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CLS_ID3", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CLS_ID4", "TYPE": "String", "SIZE": -1 },
            { "NAME": "VOH_ID", "TYPE": "String", "SIZE": -1 },
            { "NAME": "CANCEL_ID", "TYPE": "String", "SIZE": -1 },
            { "NAME": "AMT", "TYPE": "Decimal", "SIZE": -1 },
            { "NAME": "AMTN", "TYPE": "Decimal", "SIZE": -1 }
        ]
    },
    "COLUMN_PROP": {
        "RPT_CSHFROLIST": []
    }
}
```