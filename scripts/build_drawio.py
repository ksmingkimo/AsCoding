"""
build_drawio.py — 将流程图.md 中的 9 个 Mermaid 图转为 Draw.io .drawio 文件
用法: python scripts/build_drawio.py
输出: 流程图/*.drawio (9 个文件)
"""

import os
import xml.etree.ElementTree as ET
from datetime import datetime
from xml.dom import minidom

# ── 输出目录 ──────────────────────────────────────────
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "流程图")


# ═══════════════════════════════════════════════════════════════
# 样式常量
# ═══════════════════════════════════════════════════════════════

S_PROCESS = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontFamily=Courier New;"
S_DECISION = "rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=12;fontFamily=Courier New;"
S_STARTEND = "ellipse;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontSize=12;fontFamily=Courier New;"
S_SUCCESS = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=12;fontFamily=Courier New;"
S_FAILURE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=12;fontFamily=Courier New;"
S_DATA = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;fillColor=#f5f5f5;strokeColor=#666666;size=15;fontSize=12;fontFamily=Courier New;"
S_API = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=12;fontFamily=Courier New;"
S_TITLE = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontSize=16;fontStyle=1;fontFamily=Courier New;"
S_EDGE = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=11;fontFamily=Courier New;"
S_EDGE_YES = S_EDGE + "strokeColor=#82b366;fontColor=#82b366;"
S_EDGE_NO = S_EDGE + "strokeColor=#b85450;fontColor=#b85450;"
S_GROUP = "rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;dashed=1;dashPattern=8 4;fontSize=13;fontFamily=Courier New;verticalAlign=top;align=left;spacingLeft=12;spacingTop=8;"


# ═══════════════════════════════════════════════════════════════
# DrawioBuilder — 构建 .drawio XML
# ═══════════════════════════════════════════════════════════════

class DrawioBuilder:
    def __init__(self, page_width=1200, page_height=900):
        self.next_id = 2
        self.cells = []
        self.page_width = page_width
        self.page_height = page_height

    def _id(self):
        n = self.next_id
        self.next_id += 1
        return str(n)

    # ── 节点 ─────────────────────────────────────────

    def node(self, label, x, y, w=160, h=50, style=S_PROCESS):
        """添加矩形节点"""
        nid = self._id()
        self.cells.append(f'''
        <mxCell id="{nid}" value="{self._esc(label)}" style="{style}" vertex="1" parent="1">
          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>
        </mxCell>''')
        return nid

    def decision(self, label, x, y, w=160, h=80):
        """添加菱形决策节点"""
        return self.node(label, x, y, w, h, S_DECISION)

    def start_end(self, label, x, y, w=160, h=50):
        """添加椭圆(开始/结束)节点"""
        return self.node(label, x, y, w, h, S_STARTEND)

    def success_node(self, label, x, y, w=160, h=50):
        return self.node(label, x, y, w, h, S_SUCCESS)

    def failure_node(self, label, x, y, w=160, h=50):
        return self.node(label, x, y, w, h, S_FAILURE)

    def data_node(self, label, x, y, w=160, h=60):
        return self.node(label, x, y, w, h, S_DATA)

    def api_node(self, label, x, y, w=160, h=50):
        return self.node(label, x, y, w, h, S_API)

    def title_node(self, label, x, y, w=300, h=36):
        return self.node(label, x, y, w, h, S_TITLE)

    def group(self, label, x, y, w, h):
        """添加分组容器(虚线框)"""
        nid = self._id()
        self.cells.append(f'''
        <mxCell id="{nid}" value="{self._esc(label)}" style="{S_GROUP}" vertex="1" parent="1">
          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>
        </mxCell>''')
        return nid

    # ── 连线 ─────────────────────────────────────────

    def edge(self, src, tgt, label="", style=S_EDGE):
        """添加普通连线"""
        nid = self._id()
        lbl = f'value="{self._esc(label)}"' if label else ""
        self.cells.append(f'''
        <mxCell id="{nid}" {lbl} style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>''')
        return nid

    def edge_yes(self, src, tgt, label="是"):
        return self.edge(src, tgt, label, S_EDGE_YES)

    def edge_no(self, src, tgt, label="否"):
        return self.edge(src, tgt, label, S_EDGE_NO)

    # ── 导出 ─────────────────────────────────────────

    def build(self, name):
        """生成完整 .drawio 文件内容"""
        cells_xml = "".join(self.cells)

        xml_str = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="ClaudeCode" modified="{datetime.now().isoformat()}" agent="Claude" version="24.0.0" type="device">
  <diagram id="diagram-1" name="{self._esc(name)}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1"
      page="1" pageScale="1" pageWidth="{self.page_width}" pageHeight="{self.page_height}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
{cells_xml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''
        return xml_str

    def save(self, name, filename):
        """生成并写入文件"""
        os.makedirs(OUT_DIR, exist_ok=True)
        path = os.path.join(OUT_DIR, filename)
        content = self.build(name)
        # 格式化 XML
        dom = minidom.parseString(content)
        pretty = dom.toprettyxml(indent="  ", encoding="UTF-8")
        # minidom 会插入空行, 过滤掉
        lines = [l for l in pretty.decode("utf-8").split("\n") if l.strip()]
        with open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        return path

    @staticmethod
    def _esc(text):
        """转义 XML 特殊字符"""
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


# ═══════════════════════════════════════════════════════════════
# 各流程图定义
# ═══════════════════════════════════════════════════════════════

def diagram_01_system_overview():
    """系统整体流程"""
    b = DrawioBuilder(900, 750)
    cx = 450  # 中心 X

    # 标题
    b.title_node("系统整体流程", cx - 100, 20)

    # 节点
    start = b.start_end("打开应用", cx - 80, 70)
    d1 = b.decision("已登录?", cx - 80, 150)
    login = b.node("登录页面", cx - 240, 270)
    api_login = b.api_node("POST /user/login", cx - 240, 350)
    d2 = b.decision("code === 0?", cx - 240, 440)
    err = b.failure_node("显示错误", cx - 400, 440)
    store = b.success_node("存储 TOKEN", cx - 80, 440)
    dash = b.start_end("进入 Dashboard", cx - 80, 520)
    sidebar = b.node("侧边栏选择报表", cx - 80, 600)
    filter_cond = b.node("设置筛选条件 & 查询", cx - 80, 680)

    # 6 个报表节点 (横向排列)
    reports = ["采购报表", "进货报表", "受订报表", "销货报表", "收款明细", "付款明细"]
    r_nodes = []
    start_x = 30
    for i, r in enumerate(reports):
        r_nodes.append(b.node(r, start_x + i * 145, 520, w=130))

    # 连线
    b.edge(start, d1)
    b.edge_no(d1, login)
    b.edge_yes(d1, dash)
    b.edge(login, api_login)
    b.edge(api_login, d2)
    b.edge_no(d2, err)
    b.edge(err, login)  # 回到登录
    b.edge_yes(d2, store)
    b.edge(store, dash)
    # sidebars report nodes
    for rn in r_nodes:
        b.edge(sidebar, rn)
        b.edge(rn, filter_cond)

    return b.save("系统整体流程", "流程图_01_系统整体流程.drawio")


def diagram_02_single_report():
    """单报表查询流程（以采购报表为例）"""
    b = DrawioBuilder(800, 900)
    cx = 200

    b.title_node("单报表查询流程（以采购报表为例）", 150, 20)

    enter = b.start_end("进入采购报表", cx, 70)
    build = b.node("构建查询条件", cx, 150)
    # 筛选条件 (右侧平行节点)
    date = b.node("日期范围: OS_DD", cx - 180, 250, w=170)
    cust = b.node("客户/厂商: CUS_NO", cx + 10, 250, w=170)
    prd = b.node("货品: PRD_NO", cx - 180, 330, w=170)
    dep = b.node("部门: PO_DEP", cx + 10, 330, w=170)
    wh = b.node("仓库: WH", cx - 180, 410, w=170)
    status = b.node("审核状态: CHK_STATUS", cx + 10, 410, w=170)
    fields = b.node("选择展示字段 + 排序", cx - 80, 490)
    assemble = b.node("组装 SEARCH_INFO 数组", cx - 80, 560)
    api = b.api_node("POST /invpo/getReport", cx - 80, 630)
    d_code = b.decision("code === 0?", cx - 80, 720)
    err_msg = b.failure_node("显示错误: message", cx - 280, 720)
    table = b.node("渲染数据表格", cx - 80, 820)
    user = b.decision("用户操作?", cx - 80, 910)
    back_build = b.node("改筛选", cx - 300, 990, h=50)
    paginate = b.node("翻页", cx - 80, 990, h=50)

    b.edge(enter, build)
    for c in [date, cust, prd, dep, wh, status]:
        b.edge(build, c)
        b.edge(c, fields)
    b.edge(fields, assemble)
    b.edge(assemble, api)
    b.edge(api, d_code)
    b.edge_no(d_code, err_msg)
    b.edge(err_msg, enter)
    b.edge_yes(d_code, table)
    b.edge(table, user)
    b.edge(user, back_build, "改筛选")
    b.edge(user, paginate, "翻页")
    b.edge(back_build, build)
    b.edge(paginate, api)

    return b.save("单报表查询流程", "流程图_02_单报表查询流程.drawio")


def diagram_03_api_request():
    """API 请求构造流程"""
    b = DrawioBuilder(700, 750)
    b.title_node("API 请求构造流程（SEARCH_INFO 组装）", 120, 20)

    # SEARCH_INFO[0]~[9]
    entries = [
        ("[0] 分页", "offset + temp"),
        ("[1] 展示", "displayFields + sumFields"),
        ("[2] 固定条件", "fixCondition"),
        ("[3] 日期范围", "field + operator + value"),
        ("[4] 客户/厂商", "CUS_NO"),
        ("[5] 货品", "PRD_NO"),
        ("[6] 部门", "DEP / PO_DEP"),
        ("[7] 仓库", "WH"),
        ("[8] 审核状态", "CHK_STATUS"),
        ("[9] 排序", "orderBy"),
    ]

    e_nodes = []
    for i, (label, detail) in enumerate(entries):
        col = i // 5  # 0 = left, 1 = right
        row = i % 5
        x = 40 + col * 340
        y = 70 + row * 95
        n = b.node(f"{label}\n{detail}", x, y, w=300, h=75)
        e_nodes.append(n)

    # 请求体
    y_body = 70 + 5 * 95 + 30
    body = b.api_node("{ PGM, SEARCH_INFO: [...], DISPLAY_FIELDS }", 200, y_body, w=300, h=60)

    for en in e_nodes:
        b.edge(en, body)

    return b.save("API请求构造流程", "流程图_03_API请求构造流程.drawio")


def diagram_04_auth():
    """认证流程（Token 生命周期）"""
    b = DrawioBuilder(800, 800)
    cx = 300

    b.title_node("认证流程（Token 生命周期）", 200, 20)

    start = b.start_end("应用启动", cx, 70)
    d_token = b.decision("localStorage\n有 TOKEN?", cx, 160)
    d_expire = b.decision("TOKEN 过期?", cx, 360, w=140)
    dash = b.start_end("进入 Dashboard", cx + 240, 250)
    clear = b.failure_node("清除过期 TOKEN", cx, 270)
    goto_login = b.node("跳转登录页", cx - 130, 270)
    form = b.node("填写登录表单", cx - 130, 350)
    api = b.api_node("POST /user/login", cx - 130, 430)
    d_code = b.decision("code === 0?", cx - 130, 520)
    err = b.failure_node("显示错误", cx - 320, 520)
    store = b.success_node("存 TOKEN 到 localStorage", cx - 130, 610)
    set_auth = b.node("设置 Authorization Header", cx - 130, 680)
    # 合并路径
    merge = b.node("发起报表请求", cx + 80, 710)
    d_401 = b.decision("HTTP 401?", cx + 80, 790)

    b.edge(start, d_token)
    b.edge_no(d_token, goto_login)
    b.edge_yes(d_token, d_expire)
    b.edge_no(d_expire, dash)
    b.edge_yes(d_expire, clear)
    b.edge(clear, goto_login)
    b.edge(goto_login, form)
    b.edge(form, api)
    b.edge(api, d_code)
    b.edge_no(d_code, err)
    b.edge(err, form)
    b.edge_yes(d_code, store)
    b.edge(store, set_auth)
    b.edge(set_auth, dash)
    b.edge(dash, merge)
    b.edge(merge, d_401)
    b.edge_yes(d_401, clear)
    b.edge(d_401, b.success_node("正常处理响应", cx + 280, 790), "否")

    return b.save("认证流程", "流程图_04_认证流程.drawio")


def diagram_05_api_comparison():
    """各报表 API 差异对照（可视对照图）"""
    b = DrawioBuilder(1100, 700)

    b.title_node("各报表 API 差异对照", 350, 15)

    # 表头
    headers = ["要素", "采购", "进货", "受订", "销货", "收款", "付款"]
    col_w = [100, 140, 140, 140, 140, 140, 140]
    header_x = [30]
    for cw in col_w[:-1]:
        header_x.append(header_x[-1] + cw + 5)

    for i, (h, hx) in enumerate(zip(headers, header_x)):
        b.node(h, hx, 55, w=col_w[i], h=32,
               style="rounded=1;whiteSpace=wrap;html=1;fillColor=#6c8ebf;strokeColor=#6c8ebf;fontColor=#ffffff;fontSize=12;fontStyle=1;fontFamily=Courier New;")

    # 行数据
    rows = [
        ("端点", ["/invpo", "/invpc", "/invSO", "/invSa", "/monAA", "/monBA"]),
        ("PGM", ["REP_POLIST", "REP_PCLIST", "REP_SOLIST", "REP_SALIST", "REP_RTLIST", "REP_PTLIST"]),
        ("日期字段", ["OS_DD", "PS_DD", "OS_DD", "PS_DD", "RP_DD", "RP_DD"]),
        ("日期含义", ["采购日期", "进货日期", "受订日期", "销货日期", "单据日期", "单据日期"]),
        ("部门字段", ["PO_DEP", "DEP", "DEP", "DEP", "DEP", "DEP"]),
        ("fixCondition\n特殊字段", ["无", "SA_BILLS", "SUB_CUS", "SA_BILLS +\nSEND_GROUP_FIELD\n+ SUB_CUS", "LINE +\nSHOW_LSIT×3\n+ INCLUDESON", "LINE +\nSHOW_LSIT×3\n+ INCLUDESON"]),
        ("额外筛选", ["-", "-", "-", "-", "YW_TYPE\n+ KB", "YW_TYPE\n+ KB"]),
    ]

    for ri, (label, values) in enumerate(rows):
        y = 100 + ri * 78
        # 行标签
        b.node(label, header_x[0], y, w=col_w[0], h=68,
               style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;fontStyle=1;fontFamily=Courier New;")
        # 值
        for vi, val in enumerate(values):
            b.node(val, header_x[vi + 1], y, w=col_w[vi + 1], h=68,
                   style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#cccccc;fontSize=10;fontFamily=Courier New;")

    # 底部提醒
    y_bottom = 100 + len(rows) * 78 + 20
    b.node("⚠️ 每个报表的 SEARCH_INFO 结构看似相同，实则细节差异多，必须逐报表对照 API 文档，不可复制粘贴后直接改 PGM。",
           30, y_bottom, w=1000, h=40,
           style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;fontFamily=Courier New;align=left;spacingLeft=10;")

    return b.save("API差异对照", "流程图_05_API差异对照.drawio")


def diagram_06_ui_pages():
    """UI 页面流"""
    b = DrawioBuilder(1100, 600)

    b.title_node("UI 页面流", 400, 20)

    login = b.start_end("登录页", 30, 80, w=120)
    dash = b.node("Dashboard 主界面", 210, 80, w=160)

    b.edge(login, dash)

    # 侧边栏分组
    b.group("侧边栏导航", 30, 170, 200, 380)
    reports = ["采购报表", "进货报表", "受订报表", "销货报表", "收款明细", "付款明细"]
    r_nodes = []
    for i, r in enumerate(reports):
        r_nodes.append(b.node(r, 60, 210 + i * 50, w=140, h=36))

    # 筛选面板
    filter_group = b.group("筛选面板", 270, 170, 220, 380)
    filters = ["日期范围", "客户/厂商", "货品", "部门", "仓库", "审核状态"]
    f_nodes = []
    for i, f in enumerate(filters):
        f_nodes.append(b.node(f, 300, 210 + i * 50, w=160, h=36))

    # 数据表格
    table = b.node("数据表格", 530, 280, w=160, h=50)
    pagination = b.node("分页组件", 530, 370, w=160, h=40)

    for rn in r_nodes:
        for fn in f_nodes:
            b.edge(rn, fn)
        b.edge(rn, dash)
    for fn in f_nodes:
        b.edge(fn, table)
    b.edge(table, pagination)

    # AI Tab (右侧)
    b.group("AI 数据分析 Tab", 750, 170, 300, 380)
    ai_source = b.node("数据源列表", 780, 210, w=140, h=36)
    ai_chat = b.node("Chat 对话界面", 780, 270, w=140, h=36)
    ai_ds = b.node("Deepseek LLM", 780, 330, w=140, h=50, style=S_API)
    ai_export = b.node("导出 Excel/PPTX", 780, 400, w=140, h=36)

    b.edge(dash, ai_source)
    b.edge(ai_source, ai_chat)
    b.edge(ai_chat, ai_ds)
    b.edge(ai_ds, ai_chat)
    b.edge(ai_ds, ai_export)

    return b.save("UI页面流", "流程图_06_UI页面流.drawio")


def diagram_07_ai_analysis():
    """AI 数据分析流程"""
    b = DrawioBuilder(900, 1000)

    b.title_node("AI 数据分析流程", 280, 20)

    # ── 数据查询 Tab 子图 ──
    b.group("数据查询 Tab", 30, 60, 400, 400)
    sel = b.node("选择报表", 60, 100)
    set_filter = b.node("设置筛选条件", 60, 160)
    query = b.node("点击查询", 60, 220)
    show_table = b.node("展示数据表格", 60, 280)
    d_user = b.decision("用户操作?", 60, 340)
    adjust = b.node("调整条件", 250, 340, w=100)
    save_ds_btn = b.node("查转入数据源", 250, 410, w=130)
    save_ds = b.success_node("保存数据源到\nlocalStorage", 60, 410)

    b.edge(sel, set_filter)
    b.edge(set_filter, query)
    b.edge(query, show_table)
    b.edge(show_table, d_user)
    b.edge(d_user, adjust, "调整条件")
    b.edge(adjust, set_filter)
    b.edge(d_user, save_ds_btn, "查转入数据源")

    # ── 切换 ──
    switch = b.node("→ 自动切换到\nAI 数据分析 Tab →", 440, 340, w=170, h=50, style=S_SUCCESS)

    b.edge(save_ds_btn, switch)
    b.edge(switch, save_ds)  # dummy - the real target is in next subgraph

    # ── AI 数据分析 Tab 子图 ──
    b.group("AI 数据分析 Tab", 480, 60, 390, 480)
    list_ds = b.node("显示数据源列表", 510, 100)
    user_input = b.node("用户输入问题", 510, 160)
    build_prompt = b.node("构建 System Prompt", 510, 220)
    inject = b.node("注入所有数据源摘要", 510, 280)
    call_ds = b.api_node("调用 Deepseek API", 510, 350)
    d_resp = b.decision("响应成功?", 510, 440)
    render = b.success_node("渲染 AI 回复", 510, 540)
    parse = b.node("解析 Markdown\n/ Table / Chart", 510, 610)
    bubble = b.node("渲染消息气泡\n+ 操作按钮", 510, 680)
    d_user2 = b.decision("用户操作?", 510, 760)
    copy = b.node("复制到剪贴板", 240, 850, w=130)
    extend = b.node("延申问答", 380, 850, w=100)
    excel = b.node("导出 Excel", 490, 850, w=110)
    pptx = b.node("导出 PPTX", 610, 850, w=110)
    err_ai = b.failure_node("显示错误 + 重试", 740, 440)

    b.edge(switch, list_ds)
    b.edge(list_ds, user_input)
    b.edge(user_input, build_prompt)
    b.edge(build_prompt, inject)
    b.edge(inject, call_ds)
    b.edge(call_ds, d_resp)
    b.edge_yes(d_resp, render)
    b.edge_no(d_resp, err_ai)
    b.edge(err_ai, call_ds)
    b.edge(render, parse)
    b.edge(parse, bubble)
    b.edge(bubble, d_user2)
    b.edge(d_user2, copy, "复制")
    b.edge(d_user2, extend, "延申问答")
    b.edge(d_user2, excel, "导出Excel")
    b.edge(d_user2, pptx, "导出PPTX")
    b.edge(extend, user_input)
    b.edge(copy, user_input, "继续提问")

    return b.save("AI数据分析流程", "流程图_07_AI数据分析流程.drawio")


def diagram_08_tab_switch():
    """Tab 页签切换流程"""
    b = DrawioBuilder(600, 500)

    b.title_node("Tab 页签切换流程", 150, 20)

    dash = b.node("Dashboard 主界面", 200, 70)
    d_tab = b.decision("当前 Tab?", 200, 160)
    query_tab = b.node("数据查询 Tab\n(筛选面板 + 数据表格)", 40, 280, w=250, h=56)
    ai_tab = b.node("AI 数据分析 Tab\n(数据源列表 + Chat 界面)", 310, 280, w=250, h=56)
    btn = b.node("点击「查转入数据源」", 40, 380, w=250, h=48)
    save = b.success_node("保存数据源", 40, 460)
    switch_to_ai = b.node("→ 切换到 AI Tab", 310, 380, w=250, h=48)
    back_query = b.node("← 点击「数据查询」Tab", 310, 460, w=250, h=48)

    b.edge(dash, d_tab)
    b.edge(d_tab, query_tab, "数据查询")
    b.edge(d_tab, ai_tab, "AI数据分析")
    b.edge(query_tab, btn)
    b.edge(btn, save)
    b.edge(save, switch_to_ai)
    b.edge(switch_to_ai, ai_tab)
    b.edge(ai_tab, back_query)
    b.edge(back_query, query_tab)

    return b.save("Tab页签切换流程", "流程图_08_Tab页签切换流程.drawio")


def diagram_09_settings():
    """设置面板流程"""
    b = DrawioBuilder(700, 850)

    b.title_node("设置面板流程", 200, 20)

    trigger = b.node("首次使用 / 点击⚙️", 240, 70)
    open_modal = b.node("打开设置模态弹窗", 240, 140)
    # 两路并行
    ds_key = b.node("填写 Deepseek\nAPI Key", 40, 230, w=150, h=56)
    server = b.node("填写 ERP\n服务器地址", 440, 230, w=150, h=56)
    verify_ds = b.node("点击验证", 40, 320, w=150)
    verify_srv = b.node("点击验证", 440, 320, w=150)
    d_ds = b.decision("API 响应?", 40, 400)
    d_srv = b.decision("服务器响应?", 440, 400)
    ds_ok = b.success_node("✅ 验证成功", 40, 500, w=150)
    ds_fail = b.failure_node("❌ 验证失败", 180, 500, w=150)
    srv_ok = b.success_node("✅ 连接成功", 440, 500, w=150)
    srv_fail = b.failure_node("❌ 连接失败", 600, 500, w=150)

    save = b.node("用户点击保存", 240, 620)
    write_ls = b.data_node("写入 localStorage", 240, 690)
    close = b.start_end("关闭弹窗", 240, 780)

    b.edge(trigger, open_modal)
    b.edge(open_modal, ds_key)
    b.edge(open_modal, server)
    b.edge(ds_key, verify_ds)
    b.edge(server, verify_srv)
    b.edge(verify_ds, d_ds)
    b.edge(verify_srv, d_srv)
    b.edge_yes(d_ds, ds_ok)
    b.edge_no(d_ds, ds_fail)
    b.edge_yes(d_srv, srv_ok)
    b.edge_no(d_srv, srv_fail)
    b.edge(ds_ok, save)
    b.edge(ds_fail, save)
    b.edge(srv_ok, save)
    b.edge(srv_fail, save)
    b.edge(save, write_ls)
    b.edge(write_ls, close)

    return b.save("设置面板流程", "流程图_09_设置面板流程.drawio")


# ═══════════════════════════════════════════════════════════════
# 主入口
# ═══════════════════════════════════════════════════════════════

def main():
    print(f"[Output] {OUT_DIR}")
    os.makedirs(OUT_DIR, exist_ok=True)

    diagrams = [
        diagram_01_system_overview,
        diagram_02_single_report,
        diagram_03_api_request,
        diagram_04_auth,
        diagram_05_api_comparison,
        diagram_06_ui_pages,
        diagram_07_ai_analysis,
        diagram_08_tab_switch,
        diagram_09_settings,
    ]

    for fn in diagrams:
        path = fn()
        print(f"  [OK] {path}")

    print(f"\nGenerated {len(diagrams)} .drawio files.")


if __name__ == "__main__":
    main()
