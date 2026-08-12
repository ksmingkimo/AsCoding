# Sunlike ERP 报表查询系统

> 为 Sunlike ERP 构建的现代化 Web 报表查询平台，集成 AI 数据分析助手（Deepseek）。

[![Tech](https://img.shields.io/badge/tech-vanilla--js-blue)](#)
[![AI](https://img.shields.io/badge/AI-4%20Models-6C47FF)](#)
[![Charts](https://img.shields.io/badge/charts-Chart.js-FF6384)](#)
[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)](#)

---

## 📸 界面预览

### 登录 & Dashboard

![界面1 — 系统主界面](screenshots/界面1.png)

![界面2 — 数据查询](screenshots/界面2.png)

### 数据查询 & AI 分析

![界面3 — 数据查询与筛选](screenshots/界面3.png)

![界面4 — AI 数据分析](screenshots/界面4.png)

### 更多功能

![界面5 — 功能操作](screenshots/界面5.png)

![界面6 — 系统功能](screenshots/界面6.png)

> 💡 运行 `index.html` 即可体验完整功能（需 ERP API 服务器）。

---

## 🏗 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (SPA)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Login   │  │ 10 报表   │  │   AI 数据分析         │  │
│  │  Auth    │  │  查询     │  │   Chat + Chart + 导出 │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │              │
│  ┌────┴──────────────┴────────────────────┴──────────┐  │
│  │              16 模块化 JS 引擎                      │  │
│  │  utils / auth / api / reports / datasource /       │  │
│  │  chat / deepseek / parser / chart / export / app   │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
    ┌─────────┴─────────┐    ┌───────────┴───────────┐
    │  Sunlike ERP API   │    │   Deepseek API        │
    │  /SUNFUSION/API/   │    │   api.deepseek.com    │
    │  • /user/login     │    │   /v1/chat/completions │
    │  • /invso/getReport│    │   model: deepseek-chat │
    │  • /invpo/getReport│    └───────────────────────┘
    │  • /invpc/getReport│
    │  • /invSa/getReport│
    │  • /monAA/getReport│
    │  • /monBA/getReport│
    └────────────────────┘
```

---

## 📊 业务流程图

> 以下 10 张流程图覆盖系统全链路。点击图片可查看原图，`.drawio` 文件可用 [Draw.io](https://app.diagrams.net/) 打开编辑。

### 01 — 系统整体流程

从登录认证、Token 管理，到 10 大报表查询、AI 数据分析的端到端全链路（含 MRPPU getList 特殊路径）。

![系统整体流程](流程图/流程图_01_系统整体流程.png)

### 02 — 单报表查询流程

标准 getReport 路径（9 报表通用）与 MRPPU getList 特殊路径（产品成本分析表）的分叉查询流程。

![单报表查询流程](流程图/流程图_02_单报表查询流程.png)

### 03 — API 请求构造流程

SEARCH_INFO 10 元素数组按索引 [0]~[9] 固定顺序组装，displayFields 逗号拼接，最后包装为 `{ PGM, SEARCH_INFO, DISPLAY_FIELDS }`。

![API请求构造流程](流程图/流程图_03_API请求构造流程.png)

### 04 — 认证流程

登录 → Token 存储（localStorage） → 后续请求自动注入 Authorization Header → 过期拦截（code 20001/20004） → 自动恢复会话。

![认证流程](流程图/流程图_04_认证流程.png)

### 05 — API 差异对照

10 个报表的 PGM / 日期字段 / fixCondition / 额外筛选 / 特殊点差异矩阵一览（含 MRPPU getList 架构标注）。

![API差异对照](流程图/流程图_05_API差异对照.png)

### 06 — UI 页面流

登录页 → Dashboard 主界面 → 侧边栏导航（4 分组 10 报表切换） → 6 布局筛选面板 → Tab 页签 → 多模型 AI。

![UI页面流](流程图/流程图_06_UI页面流.png)

### 07 — AI 数据分析流程

数据转入数据源 → System Prompt 注入 ERP 专家角色 → Deepseek Chat API 调用 → Markdown/表格/图表标记解析 → Chart.js 渲染 + 导出。

![AI数据分析流程](流程图/流程图_07_AI数据分析流程.png)

### 08 — Tab 页签切换流程

数据查询 Tab ↔ AI 数据分析 Tab 双向切换，含「查转入数据源」自动跳转和「数据查询」返回。

![Tab页签切换流程](流程图/流程图_08_Tab页签切换流程.png)

### 09 — 设置面板流程

API Key / 服务器地址配置 → 在线验证（Deepseek API + ERP Server）→ 保存到 localStorage → 立即生效。

![设置面板流程](流程图/流程图_09_设置面板流程.png)

### 10 — 多模型 AI 架构

AIClient 统一客户端 → 4 模型路由（Deepseek / QWen / Gemini / Claude），统一 Key 管理 + 验证 + 向后兼容。

---

## 🚀 快速开始

### 前置条件

- 可访问的 Sunlike ERP API 服务器
- Deepseek API Key（可选，仅 AI 分析功能需要）
- 现代浏览器（Chrome / Edge / Firefox）

### 运行

```bash
# 方式一：直接打开
# 双击 index.html 或通过 HTTP Server 访问

# 方式二：本地服务器（推荐）
npx serve .
# 或
python -m http.server 8080
```

### 首次配置

1. 打开应用 → 登录页输入公司代码 + 用户名 + 密码
2. 登录后自动弹出设置面板（或点击右上角 ⚙ 图标）
3. 填写 **服务器地址**（仅需 IP:端口，系统自动追加 `/SUNFUSION/API`）
4. （可选）填写 **Deepseek API Key** 并点击验证
5. 保存设置 → 完成！

---

## 📁 项目结构

```
AsCoding/
├── index.html                  ← 生产入口（317 行，零内联 CSS/JS）
├── ui-template.html            ← UI 原型模板（与 index.html 同步）
│
├── css/
│   ├── auth.css                ← 登录页样式
│   ├── dashboard.css           ← Dashboard 布局、侧边栏、表格、分页、Toast
│   └── ai-analysis.css         ← AI Chat、数据源面板、设置弹窗、表格增强
│
├── js/
│   ├── utils.js                ← 通用工具（Toast / 转义 / 格式化）
│   ├── settings-store.js       ← 设置持久化（API Key / 服务器地址）
│   ├── datasource-store.js     ← 数据源 CRUD（localStorage，上限 20）
│   │
│   ├── auth.js                 ← 认证模块（登录/登出/Token/会话恢复）
│   ├── api.js                  ← API 客户端（fetch 封装/认证注入/错误拦截）
│   ├── reports.js              ← 报表引擎（10 报表配置/SEARCH_INFO 构造/动态表格/6 布局筛选）
│   │
│   ├── datasource-list.js      ← 数据源列表 UI（卡片渲染/筛选摘要）
│   ├── tabs.js                 ← Tab 页签切换（数据查询 ↔ AI 分析）
│   │
│   ├── chat-ui.js              ← Chat 消息气泡/操作按钮/滚动
│   ├── chat-core.js            ← Chat 发送流程编排
│   ├── deepseek-client.js      ← Deepseek API 兼容别名 → AIClient
│   ├── ai-client.js             ← 多模型 AI 统一客户端（Deepseek/QWen/Gemini/Claude）
│   ├── ai-suggestions.js        ← AI 推荐提问（🧠 大脑按钮）
│   ├── ai-parser.js            ← Markdown/表格/图表标记解析
│   ├── ai-chart.js             ← Chart.js 图表渲染
│   ├── export.js               ← Excel / HTML / PDF / PPTX 导出
│   │
│   ├── settings-ui.js          ← 设置面板弹窗/验证
│   └── app.js                  ← 主入口（AppState/查询/分页/初始化）
│
├── 流程图/                      ← 10 张 Draw.io 业务流程图
├── scripts/
│   └── build_drawio.py         ← 流程图自动生成脚本
│
├── screenshots/                ← 应用截图（界面预览）
│
└── docs/
    ├── 需求架构文档.md          ← 项目需求 & 技术架构
    ├── 进度追踪表.md            ← 任务进度 & 风险追踪
    ├── 对话记录.md              ← 每轮对话的完整流水账
    ├── API服务调用说明文档.md    ← Login + 报表 API 实测文档
    ├── 标准报表制表API.md        ← v1 6 个 API 原始文档
    ├── 标准报表制表API2.md       ← v2 4 个 API 原始文档（生产制造 + 人力资源）
    ├── 流程图.md                ← 流程图文字参考
    └── 项目经验行动指南.md       ← 通用开发纪律速查卡
```

---

## 🔌 API 对接

### 认证

```http
POST http://{host}/SUNFUSION/API/user/login
Content-Type: application/json

{
    "COMPNO": "AT01",
    "USR": "SAN",
    "PWD": "",
    "LANG_ID": "zh-cn",
    "SYS_TYPE": "ERP"
}

# 成功 → { code: 0, data: { TOKEN: "..." } }
# 后续请求 Header → Authorization: Bearer {TOKEN}
```

### 报表查询（通用结构）

```http
POST http://{host}/SUNFUSION/API/{module}/getReport
Authorization: Bearer {TOKEN}

{
    "PGM": "REP_SOLIST",
    "SEARCH_INFO": [
        { "col": "OS_DD", "value": "2026-01-01", "type": ">=" },
        ...9 more items
    ],
    "DISPLAY_FIELDS": "CUS_NO,CUS_NAME,OS_DD,..."
}

# 成功 → { code: 0, data: { REPORT__TAB: [...], COLUMN_INFO: {...} } }
```

### 10 报表速查

| 报表 | 端点 | PGM | 日期字段 | 分类 |
|------|------|-----|---------|------|
| 采购报表 | `/invpo/getReport` | `REP_POLIST` | `OS_DD` | 进销存 |
| 进货报表 | `/invpc/getReport` | `REP_PCLIST` | `PS_DD` | 进销存 |
| 受订报表 | `/invSO/getReport` | `REP_SOLIST` | `OS_DD` | 进销存 |
| 销货报表 | `/invSa/getReport` | `REP_SALIST` | `PS_DD` | 进销存 |
| 收款明细 | `/monAA/getReport` | `REP_RTLIST` | `RP_DD` | 财务 |
| 付款明细 | `/monBA/getReport` | `REP_PTLIST` | `RP_DD` | 财务 |
| 工单完成情况 | `/mrppk/getReport` | `MRPPK` | `MO_DD` | 生产制造 |
| 完工入库报表 | `/mrpafc/getReport` | `MRPPS` | `MM_DD` | 生产制造 |
| 产品成本分析 | `/mrppu/getList` ⚠️ | `MRPPU` | `DATE_CST` | 生产制造 |
| 员工薪资清册 | `/rptwagcg3/getReport` | `REP_WAGCG3` | `YEARS` | 人力资源 |

> ⚠️ **关键**：成功判断用 `response.code === 0`，不是 `response.ok`！
> ⚠️ **MRPPU** 使用 `getList` 端点（非 `getReport`），请求体含 OTHERINFO + PAGE_INFO，响应数据在 `data.TRANS`。

---

## 🤖 AI 数据分析功能

### 支持模型

| Provider | 模型 | 端点 | 说明 |
|----------|------|------|------|
| Deepseek | `deepseek-v4-flash` | api.deepseek.com | thinking: disabled |
| QWen (通义千问) | `qwen-plus` | dashscope.aliyuncs.com | OpenAI 兼容 |
| Gemini (谷歌) | `gemini-3.6-flash` | generativelanguage.googleapis.com | OpenAI 兼容 |
| Claude (Anthropic) | `claude-sonnet-5` | api.anthropic.com | 原生 API + CORS header |

> 通过 AIClient 统一客户端，一个函数调用所有模型。详见 `js/ai-client.js`。

### 工作流程

1. **数据查询** Tab → 筛选条件 → 点击"查转入数据源"
2. 自动切换到 **AI数据分析** Tab
3. 在 Chat 输入框用自然语言提问
4. AI 结合所有数据源进行分析（支持 4 个模型切换）
5. 回复支持 **表格** / **图表** / **Markdown**（含管道表格自动渲染），可导出 Excel / HTML / PDF / PPTX
6. 🧠 **AI 推荐提问**：点击大脑图标，AI 根据当前数据源自动生成深度分析问题

### System Prompt 定制

AI 被训练为 ERP 数据分析专家，会：
- 📋 **强制使用 ```table 格式** 展示一切结构化数据
- 📊 自动选择合适的图表类型
- 🔢 引用具体数字，不凭空编造
- 📝 按"结论→数据→图表→建议"的结构回复
- ⚠️ 严禁输出思考过程/格式自检/推理链条

---

## 🛠 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| **前端** | Vanilla JS (ES5) | 零框架依赖，IIFE 模块化 |
| **样式** | CSS3 + Design Tokens | Inter 字体，CSS 变量体系 |
| **图表** | Chart.js 4.x | CDN 加载，bar/line/pie/doughnut |
| **AI** | Deepseek/QWen/Gemini/Claude | 4 模型统一客户端，非流式调用 |
| **存储** | localStorage | 认证/设置/数据源持久化 |
| **导出** | CSV + HTML + PDF + PPTX | Excel (CSV UTF-8 BOM) / HTML 报告 / PDF (浏览器打印) / PPTX (PptxGenJS 原生 .pptx) |

### 设计系统

- **配色**：蓝色系主调 (`#1E40AF`) + 琥珀强调 (`#D97706`)
- **字体**：Inter（无衬线正文）+ SF Mono（等宽代码）
- **间距**：8px 基础网格，紧凑 Dashboard 密度
- **响应式**：768px（平板）/ 480px（手机）两个断点
- **A11Y**：`focus-visible`、`prefers-reduced-motion`、`sr-only`

---

## 📋 项目状态

| 阶段 | 状态 |
|------|------|
| 登录 & 认证模块 | ✅ 已完成 |
| 10 大报表查询 | ✅ 已完成 |
| CSS/JS 模块化拆分 | ✅ 已完成 |
| 移动端响应式 | ✅ 已完成 |
| Toast 通知重设计 | ✅ 已完成 |
| AI 数据分析 (Phase A+B) | ✅ 已完成 |
| 多模型 AI 支持 | ✅ 已完成 |
| 生产制造报表 (3 个) | ✅ 已完成 |
| 人力资源报表 (1 个) | ✅ 已完成 |
| AI 流式响应 | ⬜ 待开发 |
| IndexedDB 迁移 | ⬜ 待开发 |
| 正式 .pptx 导出 | ✅ 已完成 |

---

## ⚠️ 开发纪律（来自 CLAUDE.md）

```
编码前      → 查文档、做 PoC、列 checklist
模块完成后  → 对照流程图、覆盖所有路径、补齐边界
对话结束时  → 对话记录 ✅ | 计划书 ✅ | 进度表 ✅ | 流程图 ✅

禁止口头禅：
  "应该是…"     → "文档怎么写的？"
  "我觉得…"     → "实测结果是什么？"
  "等一下一起补" → "现在就写"
  "这个简单"     → "这个已经验证过了吗？"
```

---

## 📄 License

Internal project — Sunlike ERP 报表查询系统。

---

🤖 *Built with Claude Code | 2026-08*
