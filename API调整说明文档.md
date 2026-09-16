# API 接口调整说明文档

## 术语说明

- `SunFusion站点`：SunFusion ERP 站点地址，格式为 `http://主机名/SunFusion`，例如 `http://192.168.2.167/SunFusion`。
- `API站点`：ERP API 站点地址，指 ERP API 配置器“基本信息”中显示的地址，格式为 `http://主机名/ERPAPI`，例如 `http://192.168.2.167/ERPAPI`。

下文接口地址中的 `{SunFusion站点}` 和 `{API站点}` 均需替换为实际地址。

---

## 一、 登录接口调整说明

本次对登录接口的请求地址及请求体进行了调整。

### 1. 接口地址（URL） 路径调整
- **旧接口地址：** `{SunFusion站点}/api/user/login`
- **新接口地址：** `{API站点}/auth/login`
- **例：** `http://192.168.2.167/ERPAPI/auth/login`

### 2. 请求体（Body） 参数调整
- **旧请求体：**
  
  ```json
  {
      "COMPNO": "{{COMPNO}}/########",
      "USR": "{{USR}}",
      "PWD": "{{PWD}}",
      "LANG_ID": "zh-cn",
      "SYS_TYPE": "ERP"
  }
  
- **新请求体：**
  
  ```json
  {
      "COMPNO": "{{COMPNO}}",
      "USR": "{{USR}}",
      "PWD": "{{PWD}}",
      "LANG_ID": "zh-cn",
      "SYS_TYPE": "ERP"
  }
  
- **调整点：**新接口中的 `COMPNO` 字段去掉了后缀 `/########`，现在只需传入实际的 `COMPNO` 值即可。



## 二、 其余报表接口调整说明

对于除登录接口以外的其他报表接口，请求头（Header）和请求体（Body）内容保持不变。

唯一需要调整的是：将请求地址（URL）的前缀由 `{SunFusion站点}` 改为 `{API站点}`，其余路径保持不变。

以科目余额表为例：

- **旧接口地址：** `{SunFusion站点}/api/accBalanceTable/GetReportStream`
- **新接口地址：** `{API站点}/api/accBalanceTable/GetReportStream`
- **例：** `http://192.168.2.167/ERPAPI/api/accBalanceTable/GetReportStream`