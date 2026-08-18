# 总分类账 - 查询制表

## 接口信息

- **接口名称**：总分类账 - 查询制表
- **接口地址**：`POST /api/accGeneralLedger/GetReportStream`

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
| PGM            | string        | 是   | 程序/报表标识，固定值 `"ACCRPTGL"`                         |
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
| sumFields     | array         | 需要汇总合计的字段（当前为空数组，即不汇总）                 |

#### [1] - 固定条件配置

| 字段                              | 类型   | 说明                                         |
| :-------------------------------- | :----- | :------------------------------------------- |
| `fixCondition.BOOK_NO`            | string | 账簿，固定值 `"001"`                         |
| `fixCondition.CUR_ID`             | string | 币别（当前为空 - 综合本位币）                |
| `fixCondition.ACC_IPERIOD_B`      | string | 会计期间起，格式 `YYYY-MM`（如 `"2023-01"`） |
| `fixCondition.ACC_IPERIOD_E`      | string | 会计期间止，格式 `YYYY-MM`（如 `"2023-01"`） |
| `fixCondition.CHK_ACCN_TYPE`      | string | 检查科目类型，固定值 `"2"`                   |
| `fixCondition.ACC_NO`             | string | 科目编号（当前为空）                         |
| `fixCondition.ACC_NO_B`           | string | 科目编号起（当前为空）                       |
| `fixCondition.ACC_NO_E`           | string | 科目编号止（当前为空）                       |
| `fixCondition.REL_CLS_B`          | Int32  | 关联类别起，固定值 `1`                       |
| `fixCondition.REL_CLS_E`          | Int32  | 关联类别止，固定值 `10`                      |
| `fixCondition.AMTN_BAL_TYPE`      | string | 余额类型，固定值 `"1"`                       |
| `fixCondition.CHK_POSTACC`        | string | 是否检查过账科目，`"F"` 为否                 |
| `fixCondition.CHK_STOP`           | string | 是否检查停用，`"F"` 为否                     |
| `fixCondition.CHK_NOVOH`          | string | 是否包含无凭证记录，`"F"` 为否               |
| `fixCondition.CHK_NOVOH_BAL_ZERO` | string | 是否包含无凭证且余额为零，`"F"` 为否         |
| `fixCondition.CHK_FZHS_DETAIL`    | string | 是否显示辅助核算明细，`"F"` 为否             |
| `fixCondition.CHK_ARP_DAT`        | string | 是否检查应收应付日期，`"F"` 为否             |
| `fixCondition.CHK_DETAIL_ACCN`    | string | 是否显示明细科目，`"F"` 为否                 |
| `fixCondition.CHK_NO_POA_VOH`     | string | 是否排除POA凭证，`"F"` 为否                  |
| `fixCondition.CHK_NO_SYTZ_VOH`    | string | 是否排除SYTZ凭证，`"F"` 为否                 |
| `fixCondition.SHOW_BN_TYPE`       | string | 显示期初余额类型，固定值 `"1"`               |
| `fixCondition.ORDERBY_TYPE`       | string | 排序类型，固定值 `"1"`                       |
| `fixCondition.START_DD`           | string | 开始日期                                     |
| `fixCondition.YEARS`              | Int32  | 年度                                         |
| `fixCondition.IPERIOD`            | Int32  | 会计期间                                     |
| `fixCondition.TYPE_NO`            | string | 类型编号，固定值 `"01"`                      |
| `fixCondition.CHK_GROUP_CUR_LOC`  | string | 是否按币别分组，`"F"` 为否                   |
| `fixCondition.DATE_B`             | string | 日期起                                       |
| `fixCondition.DATE_E`             | string | 日期止                                       |

#### [2] - 排序规则

| 字段    | 类型   | 说明                                                         |
| :------ | :----- | :----------------------------------------------------------- |
| orderBy | object | 键为字段名，值为 `"asc"`（升序）或 `"desc"`（降序），此处按系统日期升序 |

## 请求示例（JSON）

json

```json
{
    "PGM": "ACCRPTGL",
    "SEARCH_INFO": [
        {
            "showBody": "T",
            "showLadder": "F",
            "displayFields": [
                "ACC_NO",
                "ACC_NAME",
                "ACC_IPERIOD",
                "REM_TYPE",
                "DC"
            ]
        },
        {
            "fixCondition": {
                "BOOK_NO": "00000000", //账簿
                "CUR_ID": "",
                "ACC_IPERIOD_B": "2026-01", //会计期间起
                "ACC_IPERIOD_E": "2026-01",//会计期间止
                "CHK_ACCN_TYPE": "2",
                "ACC_NO": "",
                "ACC_NO_B": "",
                "ACC_NO_E": "",
                "REL_CLS_B": 1,
                "REL_CLS_E": 10,
                "AMTN_BAL_TYPE": "1",
                "CHK_POSTACC": "F",
                "CHK_STOP": "F",
                "CHK_NOVOH": "F",
                "CHK_NOVOH_BAL_ZERO": "F",
                "CHK_FZHS_DETAIL": "F",
                "CHK_ARP_DAT": "F",
                "CHK_DETAIL_ACCN": "F",
                "CHK_NO_POA_VOH": "F",
                "CHK_NO_SYTZ_VOH": "F",
                "SHOW_BN_TYPE": "1",
                "ORDERBY_TYPE": "1",
                "START_DD": "2026-01-01T00:00:00",
                "YEARS": 2023,
                "IPERIOD": 1,
                "TYPE_NO": "01",
                "CHK_GROUP_CUR_LOC": "F",
                "DATE_B": "2026-01-01",
                "DATE_E": "2026-01-31"
            }
        },
        {
            "orderBy": {
                "SYS_DATE": "asc"
            }
        }
    ],
    "DISPLAY_FIELDS": "ACC_NO,ACC_NAME,ACC_IPERIOD,REM_TYPE,DC"
}
```



## 成功响应 (200 OK)

> ⚠️ **数据格式说明**：该接口返回 SSE（Server-Sent Events）格式响应，数据分散在多个 `data:` 行中，需要按行解析。`REPORT__TAB` 出现在 `PERCENT: 90.0` 的消息中，以下为提取后的完整数据示例。

json

```json
{
    "REPORT__TAB": [
        {
            "FZHS_KEY": "1001,001",
            "BOOK_NO": "001",
            "ACC_NO": "1001",
            "CUR_ID": "",
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "库存现金",
            "FZHS_TITLE": "",
            "REM_TYPE": "1",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.0,
            "AMT_C": 0.0,
            "AMTN_D": 0.0,
            "AMTN_C": 0.0,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.0,
            "QTY_C": 0.0,
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
            "CUR_ID": null,
            "CUR_NAME": "",
            "DC": "",
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
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
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
            "DC": "",
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
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "1011,001",
            "BOOK_NO": "001",
            "ACC_NO": "1011",
            "CUR_ID": "",
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "存放同业",
            "FZHS_TITLE": "",
            "REM_TYPE": "1",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.0,
            "AMT_C": 0.0,
            "AMTN_D": 0.0,
            "AMTN_C": 0.0,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.0,
            "QTY_C": 0.0,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1011,001",
            "BOOK_NO": "001",
            "ACC_NO": "1011",
            "CUR_ID": null,
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "存放同业",
            "FZHS_TITLE": "",
            "REM_TYPE": "2",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1011,001",
            "BOOK_NO": "001",
            "ACC_NO": "1011",
            "CUR_ID": "",
            "CUR_NAME": null,
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "存放同业",
            "FZHS_TITLE": "",
            "REM_TYPE": "3",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "1012,001",
            "BOOK_NO": "001",
            "ACC_NO": "1012",
            "CUR_ID": "",
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "其他货币资金",
            "FZHS_TITLE": "",
            "REM_TYPE": "1",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.0,
            "AMT_C": 0.0,
            "AMTN_D": 0.0,
            "AMTN_C": 0.0,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.0,
            "QTY_C": 0.0,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1012,001",
            "BOOK_NO": "001",
            "ACC_NO": "1012",
            "CUR_ID": null,
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "其他货币资金",
            "FZHS_TITLE": "",
            "REM_TYPE": "2",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1012,001",
            "BOOK_NO": "001",
            "ACC_NO": "1012",
            "CUR_ID": "",
            "CUR_NAME": null,
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "其他货币资金",
            "FZHS_TITLE": "",
            "REM_TYPE": "3",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "1122,001",
            "BOOK_NO": "001",
            "ACC_NO": "1122",
            "CUR_ID": "",
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "应收账款",
            "FZHS_TITLE": "",
            "REM_TYPE": "1",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.0,
            "AMT_C": 0.0,
            "AMTN_D": 0.0,
            "AMTN_C": 0.0,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.0,
            "QTY_C": 0.0,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1122,001",
            "BOOK_NO": "001",
            "ACC_NO": "1122",
            "CUR_ID": null,
            "CUR_NAME": "",
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "应收账款",
            "FZHS_TITLE": "",
            "REM_TYPE": "2",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
            "QTY_D": 0.00000000,
            "QTY_C": 0.00000000,
            "QTY_BAL": 0.00000000,
            "UP_D": 0.0,
            "UP_C": 0.0,
            "UP_BAL": 0.0,
            "ACC_IPERIOD": "2023-1"
        },
        {
            "FZHS_KEY": "2023,1;1122,001",
            "BOOK_NO": "001",
            "ACC_NO": "1122",
            "CUR_ID": "",
            "CUR_NAME": null,
            "DC": "",
            "CLS": "0",
            "YEARS": 2023,
            "IPERIOD": 1,
            "ACC_NAME": "应收账款",
            "FZHS_TITLE": "",
            "REM_TYPE": "3",
            "ACC_NO_UP": null,
            "REL_CLS": 1,
            "AMT_D": 0.00000000,
            "AMT_C": 0.00000000,
            "AMTN_D": 0.00000000,
            "AMTN_C": 0.00000000,
            "AMT_BAL": 0.00000000,
            "AMTN_BAL": 0.00000000,
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