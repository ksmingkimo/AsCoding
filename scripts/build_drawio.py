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
    b = DrawioBuilder(1400, 850)
    cx = 450  # 中心 X

    # 标题
    b.title_node("系统整体流程（含 10 报表 + MRPPU 特殊路径）", cx - 150, 20)

    # 节点
    start = b.start_end("打开应用", cx - 80, 70)
    d1 = b.decision("已登录?", cx - 80, 150)
    login = b.node("登录页面", cx - 240, 270)
    api_login = b.api_node("POST /user/login", cx - 240, 350)
    d2 = b.decision("code === 0?", cx - 240, 440)
    err = b.failure_node("显示错误", cx - 400, 440)
    store = b.success_node("存储 TOKEN", cx - 80, 440)
    dash = b.start_end("进入 Dashboard", cx - 80, 520)
    sidebar = b.node("侧边栏选择报表", cx - 80, 590)
    # 筛选+查询
    filter_9 = b.node("设置筛选条件\n&amp; getReport 查询", 100, 700)
    filter_mrppu = b.api_node("MRPPU getList\n特殊查询路径", 680, 700)

    # 10 个报表节点 (2 行排列)
    row1 = ["采购报表", "进货报表", "受订报表", "销货报表", "收款明细"]
    row2 = ["付款明细", "工单完成", "完工入库", "成本分析", "薪资清册"]
    r_nodes = []
    for i, r in enumerate(row1):
        r_nodes.append(b.node(r, 20 + i * 145, 520, w=130))
    for i, r in enumerate(row2):
        r_nodes.append(b.node(r, 20 + i * 145, 575, w=130))

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
    # sidebar → report nodes → filter
    for rn in r_nodes:
        b.edge(sidebar, rn)
    # 9 standard reports → getReport
    for rn in r_nodes[:-1]:  # all except cost analysis (mrppu)
        b.edge(rn, filter_9)
    # MRPPU (9th node = 成本分析) → getList special path
    mrppu_node = r_nodes[8]  # 成本分析
    b.edge(mrppu_node, filter_mrppu)

    return b.save("系统整体流程", "流程图_01_系统整体流程.drawio")


def diagram_02_single_report():
    """单报表查询流程（标准 getReport + MRPPU getList）"""
    b = DrawioBuilder(900, 1100)
    cx = 200

    b.title_node("单报表查询流程（标准 getReport + MRPPU getList）", 120, 20)

    # ═══ 标准 getReport 路径（左侧）═══
    enter = b.start_end("进入报表", cx, 70)
    d_type = b.decision("报表类型?", cx - 80, 150)

    # ── 标准 getReport 分支 ──
    build = b.node("构建查询条件", cx - 250, 230)
    date = b.node("日期范围", cx - 430, 310, w=160)
    cust = b.node("筛选条件\n(客户/货品/部门/仓库/审核)", cx - 250, 310, w=160)
    order_by = b.node("排序 orderBy", cx - 70, 310, w=160)
    assemble = b.node("组装 SEARCH_INFO\n[0]~[9] 固定索引", cx - 250, 410, w=340)
    api = b.api_node("POST /{module}/getReport\n+ DISPLAY_FIELDS", cx - 250, 500, w=340, h=56)
    d_code = b.decision("code === 0?", cx - 250, 590)
    err_msg = b.failure_node("显示错误", cx - 440, 590)
    data_report = b.success_node("解析 REPORT__TAB\n+ COLUMN_INFO.REPORT__TAB", cx - 250, 690, w=340, h=56)

    # ── MRPPU getList 分支 ──
    build_mrppu = b.node("构建 MRPPU 请求", cx + 400, 230)
    otherinfo = b.node("OTHERINFO\nDEP_GROUP + INCLUDESON", cx + 280, 310, w=180, h=56)
    page_info = b.node("PAGE_INFO\nPAGE_SIZE + CURRENT_PAGE", cx + 480, 310, w=180, h=56)
    si_mrppu = b.node("SEARCH_INFO\nshowBody + 4 固定元素 + DEP + PRD_NO\n(无 orderBy)", cx + 280, 390, w=380, h=56)
    api_mrppu = b.api_node("POST /mrppu/getList\n(无 DISPLAY_FIELDS)", cx + 280, 480, w=380, h=56)
    d_code_mrppu = b.decision("code === 0?", cx + 280, 570)
    err_mrppu = b.failure_node("显示错误", cx + 90, 570)
    data_trans = b.success_node("解析 TRANS\n+ COLUMN_INFO（扁平）\n+ PAGE_INFO", cx + 280, 670, w=380, h=56)

    # ── 汇聚：渲染 + 用户操作 ──
    table = b.node("渲染数据表格（动态列头）", 200, 800)
    user = b.decision("用户操作?", 200, 910)
    back_build = b.node("改筛选", -20, 1000, h=50)
    paginate = b.node("翻页", 200, 1000, h=50)

    # 连线 — 入口
    b.edge(enter, d_type)
    # 标准路径
    b.edge(d_type, build, "getReport")
    for c in [date, cust, order_by]:
        b.edge(build, c)
        b.edge(c, assemble)
    b.edge(assemble, api)
    b.edge(api, d_code)
    b.edge_no(d_code, err_msg)
    b.edge(err_msg, enter)
    b.edge_yes(d_code, data_report)
    # MRPPU 路径
    b.edge(d_type, build_mrppu, "getList (MRPPU)")
    b.edge(build_mrppu, otherinfo)
    b.edge(build_mrppu, page_info)
    b.edge(otherinfo, si_mrppu)
    b.edge(page_info, si_mrppu)
    b.edge(si_mrppu, api_mrppu)
    b.edge(api_mrppu, d_code_mrppu)
    b.edge_no(d_code_mrppu, err_mrppu)
    b.edge(err_mrppu, enter)
    b.edge_yes(d_code_mrppu, data_trans)
    # 汇聚渲染
    b.edge(data_report, table)
    b.edge(data_trans, table)
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
    """各报表 API 差异对照（可视对照图）— 10 报表"""
    b = DrawioBuilder(1700, 780)

    b.title_node("各报表 API 差异对照（10 报表）", 500, 15)

    # 表头 — 11 columns (要素 + 10 报表)
    headers = ["要素", "采购", "进货", "受订", "销货", "收款", "付款", "工单", "完工入库", "成本分析", "薪资"]
    col_w = [90, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120]
    header_x = [30]
    for cw in col_w[:-1]:
        header_x.append(header_x[-1] + cw + 5)

    for i, (h, hx) in enumerate(zip(headers, header_x)):
        b.node(h, hx, 55, w=col_w[i], h=32,
               style="rounded=1;whiteSpace=wrap;html=1;fillColor=#6c8ebf;strokeColor=#6c8ebf;fontColor=#ffffff;fontSize=11;fontStyle=1;fontFamily=Courier New;")

    # 行数据
    rows = [
        ("端点", ["/invpo", "/invpc", "/invSO", "/invSa", "/monAA", "/monBA", "/mrppk", "/mrpafc", "/mrppu", "/rptwagcg3"]),
        ("PGM", ["REP_POLIST", "REP_PCLIST", "REP_SOLIST", "REP_SALIST", "REP_RTLIST", "REP_PTLIST", "MRPPK", "MRPPS", "MRPPU", "REP_WAGCG3"]),
        ("日期字段", ["OS_DD", "PS_DD", "OS_DD", "PS_DD", "RP_DD", "RP_DD", "MO_DD", "MM_DD", "DATE_CST", "YEARS"]),
        ("日期含义", ["采购日期", "进货日期", "受订日期", "销货日期", "单据日期", "单据日期", "工单日期", "入库日期", "成本年月", "年度"]),
        ("部门字段", ["PO_DEP", "DEP", "DEP", "DEP", "DEP", "DEP", "DEP", "DEP", "DEP", "-"]),
        ("fixCondition\n特殊字段", [
            "无", "SA_BILLS", "SUB_CUS",
            "SA_BILLS +\nSEND_GROUP\n+ SUB_CUS",
            "LINE +\nSHOW_LSIT×3\n+ INCLUDESON",
            "LINE +\nSHOW_LSIT×3\n+ INCLUDESON",
            "无",
            "COMBOFCP\n+ WL_CHK\n+ COMBODATE",
            "CHK_ALL\n(7 字段)",
            "SZ_NO_TYPE\n等 7 字段",
        ]),
        ("额外筛选", [
            "-", "-", "-", "-",
            "YW_TYPE\n+ KB", "YW_TYPE\n+ KB",
            "MO_NO\n+ MRP_NO",
            "MM_NO\n+ MRP_NO",
            "PRD_NO",
            "YG_NO\n+ OUT_DAY_TYPE",
        ]),
        ("特殊点", [
            "-", "-", "-", "-", "-", "-",
            "SEARCH_INFO\n8 元素",
            "fieldType:\nbilNo",
            "⚠️ getList\n+ OTHERINFO\n+ TRANS 响应",
            "showLadder:T\n年度筛选",
        ]),
    ]

    for ri, (label, values) in enumerate(rows):
        y = 100 + ri * 78
        # 行标签
        b.node(label, header_x[0], y, w=col_w[0], h=68,
               style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;fontStyle=1;fontFamily=Courier New;")
        # 值
        for vi, val in enumerate(values):
            b.node(val, header_x[vi + 1], y, w=col_w[vi + 1], h=68,
                   style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#cccccc;fontSize=9;fontFamily=Courier New;")

    # 底部提醒
    y_bottom = 100 + len(rows) * 78 + 20
    b.node("⚠️ 每个报表的 SEARCH_INFO 结构看似相同，实则细节差异多。MRPPU 使用 getList 端点，架构完全不同（OTHERINFO + PAGE_INFO + TRANS 响应）。",
           30, y_bottom, w=1600, h=40,
           style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;fontFamily=Courier New;align=left;spacingLeft=10;")

    return b.save("API差异对照", "流程图_05_API差异对照.drawio")


def diagram_06_ui_pages():
    """UI 页面流（10 报表 + 6 布局筛选系统）"""
    b = DrawioBuilder(1400, 700)

    b.title_node("UI 页面流（10 报表 + 6 布局筛选系统）", 400, 20)

    login = b.start_end("登录页", 30, 80, w=120)
    dash = b.node("Dashboard 主界面", 210, 80, w=160)

    b.edge(login, dash)

    # 侧边栏分组 — 4 sections
    b.group("侧边栏导航（4 分组，10 报表）", 30, 170, 200, 490)
    # 进销存
    reports_p1 = ["采购报表", "进货报表", "受订报表", "销货报表"]
    r1_nodes = []
    for i, r in enumerate(reports_p1):
        r1_nodes.append(b.node(r, 60, 210 + i * 45, w=140, h=32))
    # 财务
    reports_p2 = ["收款明细", "付款明细"]
    r2_nodes = []
    for i, r in enumerate(reports_p2):
        r2_nodes.append(b.node(r, 60, 395 + i * 45, w=140, h=32))
    # 生产制造
    reports_p3 = ["工单完成情况", "完工入库报表", "成本分析表"]
    r3_nodes = []
    for i, r in enumerate(reports_p3):
        r3_nodes.append(b.node(r, 60, 490 + i * 45, w=140, h=32))
    # 人力资源
    r4_node = b.node("薪资清册", 60, 630, w=140, h=32)
    all_r_nodes = r1_nodes + r2_nodes + r3_nodes + [r4_node]

    # 筛选面板 — 6 布局说明
    filter_group = b.group("筛选面板（6 布局配置驱动）", 270, 170, 280, 490)
    layouts = [
        "inv: date+cust+prd+dep+wh+status",
        "payment: date+cust+dep+ywType+kb",
        "mrpPK: date+docNo+mrpNo+dep",
        "mrpPS: date+docNo+mrpNo+dep+wh+status",
        "mrppu: dateCst+dep+prd",
        "wagCG3: dateYear+ygNo+outDayType",
    ]
    f_nodes = []
    for i, f in enumerate(layouts):
        f_nodes.append(b.node(f, 285, 210 + i * 65, w=250, h=50))

    # 数据表格 & 分页
    table = b.node("数据表格（动态列头，10 报表共享）", 600, 280, w=280, h=50)
    pagination = b.node("分页组件", 600, 370, w=160, h=40)

    for rn in all_r_nodes:
        for fn in f_nodes[:1]:  # all reports use inv layout by default
            b.edge(rn, fn)
        b.edge(rn, dash)
    for fn in f_nodes:
        b.edge(fn, table)
    b.edge(table, pagination)

    # AI Tab (右侧) + 多模型 AI
    b.group("AI 数据分析 Tab（多模型：Deepseek/QWen/Gemini/Claude）", 620, 170, 360, 490)
    ai_source = b.node("数据源列表", 650, 210, w=140, h=36)
    ai_chat = b.node("Chat 对话界面", 650, 270, w=140, h=36)
    ai_llm = b.node("多模型 LLM\nDeepseek/QWen/Gemini/Claude", 650, 330, w=180, h=56, style=S_API)
    ai_export = b.node("导出 Excel/PPTX", 650, 410, w=140, h=36)
    ai_brain = b.node("🧠 AI 推荐提问", 650, 480, w=140, h=36)

    b.edge(dash, ai_source)
    b.edge(ai_source, ai_chat)
    b.edge(ai_chat, ai_llm)
    b.edge(ai_llm, ai_chat)
    b.edge(ai_llm, ai_export)
    b.edge(ai_llm, ai_brain)

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


def diagram_10_multi_model_ai():
    """多模型 AI 架构"""
    b = DrawioBuilder(900, 600)

    b.title_node("多模型 AI 调用架构（4 模型统一客户端）", 180, 20)

    caller = b.node("AIClient.call()\n统一入口", 320, 70, w=200, h=56)

    # 4 个模型节点
    ds = b.node("Deepseek V4 Flash\nOpenAI 兼容\nthinking: disabled", 30, 190, w=190, h=68)
    qwen = b.node("QWen Plus\nOpenAI 兼容\n(aliyuncs.com)", 240, 190, w=190, h=68)
    gemini = b.node("Gemini 3.6 Flash\nOpenAI 兼容\n(googleapis.com)", 450, 190, w=190, h=68)
    claude = b.node("Claude Sonnet 5\nAnthropic 原生\nx-api-key + thinking:disabled", 660, 190, w=210, h=68)

    b.edge(caller, ds)
    b.edge(caller, qwen)
    b.edge(caller, gemini)
    b.edge(caller, claude)

    # 特性标注
    b.node("🔑 统一 Key 管理\nSettingsStore.aiConfig", 30, 320, w=190, h=56,
           style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;fontFamily=Courier New;")
    b.node("🔧 统一验证\nAIClient.validateKey()", 240, 320, w=190, h=56,
           style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;fontFamily=Courier New;")
    b.node("🔄 向后兼容\nvar DeepseekClient = AIClient", 450, 320, w=190, h=56,
           style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;fontFamily=Courier New;")
    b.node("🌐 浏览器直连\nCORS + cephalic-dangerous", 660, 320, w=210, h=56,
           style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;fontFamily=Courier New;")

    return b.save("多模型AI架构", "流程图_10_多模型AI架构.drawio")


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
        diagram_10_multi_model_ai,
    ]

    for fn in diagrams:
        path = fn()
        print(f"  [OK] {path}")

    print(f"\nGenerated {len(diagrams)} .drawio files.")


if __name__ == "__main__":
    main()
