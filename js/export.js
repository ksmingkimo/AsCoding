/**
 * export.js — 导出模块
 * 负责：AI 回复内容导出为 CSV (Excel) / HTML / PPTX（真正的 .pptx 文件）
 * 依赖：Utils, AIParser, PptxGenJS（CDN）
 */

var Export = (function() {
  'use strict';

  /**
   * 从 AI 回复文本中提取 ```table``` 数据，导出为 CSV 文件
   * @param {string} rawText — AI 回复原始文本
   */
  function toExcel(rawText) {
    var tableRegex = /```table\s*\n([\s\S]*?)```/g;
    var match;
    var allData = [];

    while ((match = tableRegex.exec(rawText)) !== null) {
      try {
        var tableData = JSON.parse(match[1].trim());
        if (Array.isArray(tableData)) {
          allData = allData.concat(tableData);
        }
      } catch (e) {
        // 跳过解析失败的表格
      }
    }

    if (allData.length === 0) {
      Utils.showToast(I18n.t('未在回复中找到表格数据，无法导出 Excel'), 'error');
      return;
    }

    var keys = Object.keys(allData[0]);
    // BOM 确保 Excel 正确识别 UTF-8
    var csv = '﻿' + keys.join(',') + '\n';
    allData.forEach(function(row) {
      csv += keys.map(function(k) {
        var v = row[k];
        if (v === null || v === undefined) return '';
        var s = String(v).replace(/"/g, '""');
        return s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0
          ? '"' + s + '"' : s;
      }).join(',') + '\n';
    });

    downloadFile(csv, I18n.t('AI数据分析结果') + '.csv', 'text/csv;charset=utf-8');
    Utils.showToast(I18n.t('Excel (CSV) 文件已下载'));
  }

  /**
   * 导出为 HTML 报告
   * @param {string} rawText — AI 回复原始文本
   * @param {HTMLElement} msgDiv — 消息气泡 DOM（用于提取 chart 截图）
   */
  /**
   * 构建 HTML 报告内容（toHTML / toPDF 共用）
   * @param {string} rawText
   * @param {HTMLElement} msgDiv
   * @returns {string} 完整的 HTML 文档字符串
   */
  function buildHTMLReport(rawText, msgDiv) {
    var title = I18n.t('AI 数据分析报告');
    var dateStr = new Date().toLocaleDateString('zh-CN');

    // ── Step 1: 提取图表截图 (canvas → base64 PNG) ──
    var chartImages = [];
    if (msgDiv) {
      var canvases = msgDiv.querySelectorAll('canvas');
      canvases.forEach(function(canvas) {
        try {
          chartImages.push(canvas.toDataURL('image/png'));
        } catch (e) { /* cross-origin canvas */ }
      });
    }

    // ── Step 2: 处理特殊块 ──
    var chartIdx = 0;
    var processed = rawText;

    // 2a. ```table``` → 渲染为 HTML <table>
    processed = processed.replace(/```table\s*\n([\s\S]*?)```/g, function(m, json) {
      try {
        var data = JSON.parse(json.trim());
        if (Array.isArray(data) && data.length > 0) {
          return '%%TABLE%%' + AIParser.renderTableHTML(data) + '%%/TABLE%%';
        }
      } catch (e) {}
      return '<p><em>' + I18n.t('(表格数据解析失败)') + '</em></p>';
    });

    // 2a2. 裸 "table\n[JSON]" 补救
    processed = processed.replace(/\btable\s*\n(\s*\[[\s\S]*?\])\s*(?=\n{2,}|$)/gi, function(m, json) {
      try {
        var data = JSON.parse(json.trim());
        if (Array.isArray(data) && data.length > 0) {
          return '%%TABLE%%' + AIParser.renderTableHTML(data) + '%%/TABLE%%';
        }
      } catch (e) {}
      return m;
    });

    // 2b. ```chart``` → 替换为截图 <img>
    processed = processed.replace(/```\s*chart\s*\n([\s\S]*?)```/g, function(m, json) {
      if (chartIdx < chartImages.length) {
        var src = chartImages[chartIdx++];
        return '%%CHART%%<img src="' + src + '" style="max-width:100%;margin:16px 0;display:block" alt="' + I18n.t('图表') + '">%%/CHART%%';
      }
      try {
        JSON.parse(json.trim());
        return '%%CHART%%<p><em>' + I18n.t('（图表数据已嵌入，请在浏览器中查看原始图表）') + '</em></p>%%/CHART%%';
      } catch (e) {}
      return '<p><em>' + I18n.t('(图表数据解析失败)') + '</em></p>';
    });

    // 2c. 其他 ```code``` 块
    processed = processed.replace(/```(?!\s*(?:chart|table)\b)(\w*)\n?([\s\S]*?)```/g, function(m, lang, code) {
      return '%%CODE%%<pre><code>' + Utils.escapeHtml(code.trim()) + '</code></pre>%%/CODE%%';
    });

    // ── Step 3: 按标题拆分为幻灯片 ──
    var slides = processed.split(/\n(?=#{1,3}\s+)/).filter(function(s) { return s.trim(); });
    if (slides.length === 0) { slides = [processed]; }

    // ── Step 4: 逐页渲染 ──
    var slidesHTML = slides.map(function(slide, idx) {
      var body = renderMixed(slide.trim());
      return '<div class="slide">' +
        (idx === 0 ? '<h1>' + Utils.escapeHtml(title) + '</h1>' : '') +
        '<div class="slide-body">' + body + '</div>' +
        '<p class="slide-footer">' + dateStr + ' | ' + I18n.t('Sunlike ERP AI 分析') + '</p>' +
        '</div>';
    }).join('');

    // ── Step 5: 组装完整 HTML ──
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>' +
      '<style>' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:#0F172A;max-width:820px;margin:0 auto;padding:20px}' +
      '.slide{page-break-after:always;padding:24px 0}' +
      '.slide h1{color:#1E40AF;font-size:22px;margin:0 0 20px 0;padding-bottom:12px;border-bottom:2px solid #DBEAFE}' +
      '.slide-body{font-size:14px;line-height:1.85}' +
      '.slide-body h4{font-size:16px;color:#1E3A8A;margin:24px 0 8px 0}' +
      '.slide-body p{margin:0 0 10px 0}' +
      '.slide-body ul,ol{margin:8px 0;padding-left:24px}' +
      '.slide-body li{margin:4px 0}' +
      '.slide-body hr{border:none;border-top:1px solid #DBEAFE;margin:20px 0}' +
      '.slide-body strong{color:#1E3A8A}' +
      '.slide-body code{background:#F1F5F9;padding:1px 5px;border-radius:3px;font-size:13px}' +
      '.slide-body pre{background:#F8FAFC;padding:12px 16px;border-radius:6px;overflow-x:auto;font-size:13px;margin:12px 0;line-height:1.5}' +
      'table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}' +
      'th{background:#1E3A8A;color:#fff;padding:8px 12px;text-align:left;font-weight:600;white-space:nowrap}' +
      'td{padding:7px 12px;border-bottom:1px solid #E2E8F0}' +
      'tr:nth-child(even) td{background:#F8FAFC}' +
      'td.num{text-align:right;font-variant-numeric:tabular-nums;font-family:"SF Mono","Consolas",monospace}' +
      '.slide-footer{color:#94A3B8;font-size:11px;margin-top:28px;padding-top:14px;border-top:1px solid #E2E8F0}' +
      'img{max-width:100%;height:auto;display:block;margin:16px 0}' +
      '@media print{.slide{page-break-after:always}}' +
      '</style></head><body>' + slidesHTML + '</body></html>';
  }

  /**
   * 导出为 HTML 报告并下载
   */
  function toHTML(rawText, msgDiv) {
    var html = buildHTMLReport(rawText, msgDiv);
    downloadFile(html, I18n.t('AI数据分析报告') + '.html', 'text/html;charset=utf-8');
    Utils.showToast(I18n.t('报告 (HTML格式) 已下载'));
  }

  /**
   * 导出为 PDF — 打开新窗口调用浏览器打印（用户选择"另存为 PDF"）
   */
  function toPDF(rawText, msgDiv) {
    var html = buildHTMLReport(rawText, msgDiv);
    var w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      Utils.showToast(I18n.t('PDF 导出被浏览器拦截，请允许弹出窗口后重试'), 'error');
      return;
    }
    w.document.write(html);
    w.document.close();
    // 等图片/样式加载完后触发打印
    w.onload = function() {
      w.print();
    };
    // 部分浏览器 onload 不触发，加个兜底
    setTimeout(function() {
      w.print();
    }, 800);
  }

  // ====================================================================
  //  真正的 PPTX 导出 — 使用 PptxGenJS 生成 Office 可打开的 .pptx 文件
  //  编排策略：扁平化 → 智能合并 → 长文本拆分 → 大表格分页
  // ====================================================================

  /** 16:9 幻灯片布局常量 */
  var MARGIN_L = 0.7;
  var CONTENT_W = 8.6;      // 10 - 0.7*2
  var TITLE_Y = 0.3;
  var TITLE_H = 0.7;
  var ACCENT_Y = 1.05;      // 标题下装饰线 y
  var BODY_Y = 1.3;         // 正文起始 y
  var BODY_H = 3.8;         // 正文可用高度 (1.3 → 5.1)
  var FOOTER_Y = 5.2;       // 页脚 y

  /**
   * 导出为真正的 .pptx 文件（Office PowerPoint 可直接打开）
   * @param {string} rawText — AI 回复原始文本
   * @param {HTMLElement} msgDiv — 消息气泡 DOM（用于提取 chart 截图）
   */
  function toPPTX(rawText, msgDiv) {
    if (typeof PptxGenJS === 'undefined') {
      Utils.showToast(I18n.t('PPTX 生成库未加载，请刷新页面后重试'), 'error');
      return;
    }

    // Step 1: 提取图表截图
    var chartImages = [];
    if (msgDiv) {
      var canvases = msgDiv.querySelectorAll('canvas');
      canvases.forEach(function(canvas) {
        try { chartImages.push(canvas.toDataURL('image/png')); } catch (e) {}
      });
    }

    // Step 2: 解析内容 → 扁平化为 slide units（每个 unit = 一张幻灯片）
    var units = buildSlideUnits(rawText, chartImages);

    if (units.length === 0) {
      Utils.showToast(I18n.t('未找到可导出的内容'), 'error');
      return;
    }

    // Step 3: 创建 Presentation
    var pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';
    pres.author = 'Sunlike ERP';
    pres.title = I18n.t('AI 数据分析报告');
    pres.subject = I18n.t('数据报告');

    var dateStr = new Date().toLocaleDateString('zh-CN');

    // Step 4: 逐 unit 渲染 — 一 unit 一 slide
    units.forEach(function(unit) {
      var slide = pres.addSlide();

      // 标题
      if (unit.title) {
        slide.addText(unit.title, {
          x: MARGIN_L, y: TITLE_Y, w: CONTENT_W, h: TITLE_H,
          fontSize: 26, bold: true, color: '1E3A8A',
          fontFace: 'Microsoft YaHei', valign: 'middle'
        });
        slide.addShape(pres.ShapeType.rect, {
          x: MARGIN_L, y: ACCENT_Y, w: 1.4, h: 0.04,
          fill: { color: '3B82F6' }
        });
      }

      // 主体内容
      switch (unit.type) {
        case 'text':
          renderMainText(slide, unit.text);
          break;
        case 'table':
          renderMainTable(slide, unit.json);
          break;
        case 'chart':
          renderMainChart(slide, unit.image);
          break;
        case 'code':
          renderMainCode(slide, unit.code);
          break;
        case 'combo':
          renderCombo(slide, unit);
          break;
      }

      // 页脚
      slide.addText(I18n.t('Sunlike ERP AI 分析') + ' | ' + dateStr, {
        x: MARGIN_L, y: FOOTER_Y, w: CONTENT_W, h: 0.3,
        fontSize: 9, color: '94A3B8', fontFace: 'Microsoft YaHei'
      });
    });

    // Step 5: 下载
    pres.writeFile({ fileName: I18n.t('AI数据分析报告') + '.pptx' })
      .then(function() {
        Utils.showToast(I18n.t('PPTX 文件已下载'));
      })
      .catch(function(e) {
        console.error('PPTX 生成失败:', e);
        Utils.showToast(I18n.t('PPTX 生成失败，请重试'), 'error');
      });
  }

  // ─── 内容解析：heading blocks → 智能编排的 slide units ────

  /**
   * 估算文本的"展示行数"（考虑长行折行）
   */
  function countTextLines(text) {
    var lines = text.split('\n');
    var total = 0;
    lines.forEach(function(line) {
      if (!line.trim()) { total += 1; return; }
      // 中文字符约占 2 个英文字符宽度；CONTENT_W 8.6" 约容纳 55 个中文字符或 110 个英文字符
      var len = line.replace(/[^\x00-\xff]/g, 'aa').length; // 中文算 2 字符
      total += Math.max(1, Math.ceil(len / 90));
    });
    return total;
  }

  /**
   * 估算表格行数
   */
  function countTableRows(json) {
    try {
      var data = JSON.parse(json.trim());
      return Array.isArray(data) ? data.length : 0;
    } catch (e) { return 0; }
  }

  /**
   * 将 rawText 解析为智能编排的 slide unit 列表
   * 策略：
   *   1. 先扁平化（每个 segment → unit）
   *   2. 智能合并：短文本 + 小表格/图表 → combo
   *   3. 长文本拆分：> 20 行的文本按段落拆成多页
   */
  function buildSlideUnits(rawText, chartImages) {
    var blocks = splitSlides(rawText);
    var units = [];
    var chartIdx = 0;

    // Step 1: 扁平化
    blocks.forEach(function(block) {
      var segments = parseSegments(block.content);
      var hasTitle = !!block.title;

      segments.forEach(function(seg, i) {
        var unit = { title: null };

        if (i === 0 && hasTitle) {
          unit.title = block.title;
        }

        switch (seg.type) {
          case 'text':
            if (!seg.text.trim()) return;
            unit.type = 'text';
            unit.text = seg.text.trim();
            unit._lines = countTextLines(unit.text);
            break;
          case 'table':
            unit.type = 'table';
            unit.json = seg.json;
            unit._rows = countTableRows(seg.json);
            break;
          case 'chart':
            unit.type = 'chart';
            unit.json = seg.json;
            unit.image = chartIdx < chartImages.length ? chartImages[chartIdx++] : null;
            break;
          case 'code':
            unit.type = 'code';
            unit.code = seg.code;
            break;
          default:
            return;
        }

        units.push(unit);
      });
    });

    // Step 2: 智能合并 — 短文本 + 小表格/图表
    var merged = [];
    var i = 0;
    while (i < units.length) {
      var curr = units[i];
      var next = units[i + 1];

      // 短文本(≤10行) + 小表格(≤7行) → combo
      if (curr.type === 'text' && curr._lines <= 10 &&
          next && next.type === 'table' && next._rows <= 7) {
        merged.push({
          type: 'combo',
          title: curr.title,
          parts: [
            { type: 'text', text: curr.text, weight: 35 },
            { type: 'table', json: next.json, weight: 65 }
          ]
        });
        i += 2;
        continue;
      }

      // 短文本(≤6行) + 图表 → combo
      if (curr.type === 'text' && curr._lines <= 6 &&
          next && next.type === 'chart') {
        merged.push({
          type: 'combo',
          title: curr.title,
          parts: [
            { type: 'text', text: curr.text, weight: 22 },
            { type: 'chart', image: next.image, json: next.json, weight: 78 }
          ]
        });
        i += 2;
        continue;
      }

      merged.push(curr);
      i += 1;
    }

    // Step 3: 长文本拆分 — > 20 行按段落边界切成多个 text unit
    var result = [];
    merged.forEach(function(unit) {
      if (unit.type !== 'text' || unit._lines <= 20) {
        result.push(unit);
        return;
      }

      // 按双换行（段落边界）拆分
      var paragraphs = unit.text.split(/\n\n+/);
      var chunks = [];
      var currentChunk = [];
      var currentLines = 0;
      var TARGET = 15; // 每页目标行数

      paragraphs.forEach(function(para) {
        var paraLines = countTextLines(para);
        if (currentLines + paraLines > TARGET && currentChunk.length > 0) {
          chunks.push(currentChunk.join('\n\n'));
          currentChunk = [];
          currentLines = 0;
        }
        currentChunk.push(para);
        currentLines += paraLines;
      });
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
      }

      chunks.forEach(function(chunk, ci) {
        result.push({
          type: 'text',
          title: ci === 0 ? unit.title : null, // 只有第一块保留标题
          text: chunk.trim()
        });
      });
    });

    // Step 4: 大表格拆分 — > MAX_ROWS 行切成多页，每页保留表头
    var MAX_ROWS = 14;
    var finalResult = [];
    result.forEach(function(unit) {
      if (unit.type !== 'table') {
        finalResult.push(unit);
        return;
      }

      var rows = countTableRows(unit.json);
      if (rows <= MAX_ROWS) {
        finalResult.push(unit);
        return;
      }

      try {
        var data = JSON.parse(unit.json.trim());
        if (!Array.isArray(data)) { finalResult.push(unit); return; }

        var totalPages = Math.ceil(data.length / MAX_ROWS);
        for (var p = 0; p < totalPages; p++) {
          var chunk = data.slice(p * MAX_ROWS, (p + 1) * MAX_ROWS);
          var pageTitle = unit.title || null;
          if (pageTitle && p > 0) {
            pageTitle = pageTitle + I18n.t(' (续{0}/{1})', (p + 1), totalPages);
          }
          finalResult.push({
            type: 'table',
            title: pageTitle,
            json: JSON.stringify(chunk),
            _rows: chunk.length
          });
        }
      } catch (e) {
        finalResult.push(unit); // fallback
      }
    });

    return finalResult;
  }

  // ─── Slide 渲染函数 ─────────────────────────────────────────

  /**
   * 渲染文本主体 — 给足高度 + autoFit 兜底
   */
  function renderMainText(slide, text, optY, optH) {
    var y = optY !== undefined ? optY : BODY_Y;
    var h = optH !== undefined ? optH : BODY_H;
    var runs = buildTextRuns(text);
    if (runs.length === 0) return;

    slide.addText(runs, {
      x: MARGIN_L, y: y, w: CONTENT_W, h: h,
      valign: 'top',
      lineSpacingMultiple: 1.3,
      paraSpaceAfter: 6,
      autoFit: true,
      fitTo: 'shrinkText'
    });
  }

  /**
   * 渲染原生 PowerPoint 表格
   */
  function renderMainTable(slide, json, optY, optH) {
    try {
      var data = JSON.parse(json.trim());
      if (!Array.isArray(data) || data.length === 0) return;

      var y = optY !== undefined ? optY : BODY_Y;
      var maxH = optH !== undefined ? optH : BODY_H;

      var keys = Object.keys(data[0]);
      var rows = [keys.map(function(k) {
        return { text: k, options: { bold: true, color: 'FFFFFF', fontSize: 11, fontFace: 'Microsoft YaHei', fill: { color: '1E3A8A' } } };
      })];

      data.forEach(function(row) {
        rows.push(keys.map(function(k) {
          var v = row[k];
          var val = (v === null || v === undefined) ? '' : String(v);
          var isNum = typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()));
          return { text: val, options: {
            fontSize: 11, fontFace: 'Microsoft YaHei', color: '0F172A',
            align: isNum ? 'right' : 'left'
          }};
        }));
      });

      var colCount = keys.length;
      var colW = Math.max(1.0, CONTENT_W / colCount);
      var rowH = data.length <= 6 ? 0.32 : Math.max(0.24, (maxH - 0.3) / (data.length + 1));

      slide.addTable(rows, {
        x: MARGIN_L, y: y, w: CONTENT_W,
        colW: Array(colCount).fill(colW),
        rowH: rowH,
        border: { type: 'solid', pt: 0.5, color: 'CBD5E1' },
        autoPage: false
      });
    } catch (e) { /* 静默跳过 */ }
  }

  /**
   * 渲染图表截图 — 居中缩放
   */
  function renderMainChart(slide, imageDataUrl, optY, optH) {
    var y = optY !== undefined ? optY : BODY_Y;
    var maxH = optH !== undefined ? optH : BODY_H;

    if (!imageDataUrl) {
      slide.addText(I18n.t('（图表 — 请查看原始分析结果）'), {
        x: MARGIN_L, y: y, w: CONTENT_W, h: 0.4,
        fontSize: 12, italic: true, color: '94A3B8', fontFace: 'Microsoft YaHei'
      });
      return;
    }

    var imgH = maxH - 0.3;
    var imgW = Math.min(CONTENT_W, imgH * 1.6);

    slide.addImage({
      data: imageDataUrl,
      x: MARGIN_L, y: y + 0.15, w: imgW, h: imgH,
      sizing: { type: 'contain', w: imgW, h: imgH }
    });
  }

  /**
   * 渲染代码块
   */
  function renderMainCode(slide, code, optY, optH) {
    var y = optY !== undefined ? optY : BODY_Y;
    var h = optH !== undefined ? optH : BODY_H;
    var displayCode = code.length > 1200 ? code.substring(0, 1200) + '\n... (' + I18n.t('已截断') + ')' : code;

    slide.addText(displayCode, {
      x: MARGIN_L, y: y, w: CONTENT_W, h: h,
      fontSize: 10, fontFace: 'Consolas', color: '334155',
      fill: { color: 'F1F5F9' },
      valign: 'top',
      lineSpacingMultiple: 1.25,
      autoFit: true,
      fitTo: 'shrinkText'
    });
  }

  /**
   * 渲染组合 slide — 文本 + 表格/图表，按 weight 比例分配合并高度
   */
  function renderCombo(slide, unit) {
    var parts = unit.parts;
    var totalWeight = 0;
    parts.forEach(function(p) { totalWeight += p.weight; });

    var y = BODY_Y;
    var gap = 0.15; // 块之间的间距

    parts.forEach(function(part, idx) {
      var weight = part.weight / totalWeight;
      var h = (BODY_H - gap * (parts.length - 1)) * weight;

      switch (part.type) {
        case 'text':
          renderMainText(slide, part.text, y, h);
          break;
        case 'table':
          renderMainTable(slide, part.json, y, h);
          break;
        case 'chart':
          renderMainChart(slide, part.image, y, h);
          break;
      }

      y += h + gap;
    });
  }

  // ─── 文本格式化 ─────────────────────────────────────────────

  /**
   * 将 Markdown 文本转为 PptxGenJS text runs 数组
   */
  function buildTextRuns(text) {
    var lines = text.split('\n');
    var runs = [];

    lines.forEach(function(line) {
      var trimmed = line.trim();

      // 空行
      if (!trimmed) {
        runs.push({ text: ' ', options: { fontSize: 12, breakLine: true } });
        return;
      }

      // 列表项
      var isBullet = /^[-*]\s+/.test(trimmed);
      var content = isBullet ? trimmed.replace(/^[-*]\s+/, '') : trimmed;

      // 解析 **粗体**
      var boldParts = parseBoldRuns(content);
      boldParts.forEach(function(part) {
        var opts = {
          fontSize: 14,
          fontFace: 'Microsoft YaHei',
          color: part.bold ? '1E3A8A' : '0F172A',
          bold: part.bold || false,
          bullet: isBullet || false,
          breakLine: true
        };
        runs.push({ text: part.text, options: opts });
      });
    });

    return runs;
  }

  // ─── 共享解析函数 ───────────────────────────────────────────

  /**
   * 按 # / ## / ### 标题拆分原始文本
   */
  function splitSlides(rawText) {
    var parts = rawText.split(/\n(?=#{1,3}\s+)/);
    var blocks = [];

    parts.forEach(function(part) {
      part = part.trim();
      if (!part) return;

      var m = part.match(/^(#{1,3})\s+(.+?)(?:\n|$)/);
      if (m) {
        blocks.push({
          title: m[2].replace(/\*+/g, '').trim(),
          content: part.substring(m[0].length).trim()
        });
      } else {
        blocks.push({ title: null, content: part });
      }
    });

    if (blocks.length === 0 && rawText.trim()) {
      blocks.push({ title: null, content: rawText.trim() });
    }

    return blocks;
  }

  /**
   * 将一段文本解析为 segment 数组（text / table / chart / code）
   */
  function parseSegments(content) {
    var segments = [];
    var SPLIT_RE = /(```\s*(table|chart|(\w*))\s*\n[\s\S]*?```)/gi;

    var parts = [];
    var lastIdx = 0;
    var match;

    while ((match = SPLIT_RE.exec(content)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ raw: content.substring(lastIdx, match.index), isBlock: false });
      }
      parts.push({ raw: match[0], isBlock: true });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < content.length) {
      parts.push({ raw: content.substring(lastIdx), isBlock: false });
    }

    parts.forEach(function(part) {
      if (!part.isBlock) {
        var textParts = splitBareTables(part.raw);
        textParts.forEach(function(tp) {
          if (tp.type === 'bare-table') {
            segments.push({ type: 'table', json: tp.json });
          } else if (tp.text.trim()) {
            segments.push({ type: 'text', text: tp.text.trim() });
          }
        });
      } else {
        var blockMatch = part.raw.match(/```\s*(table|chart)?\s*(\w*)\s*\n([\s\S]*?)```/i);
        if (blockMatch) {
          var blockType = (blockMatch[1] || blockMatch[2] || 'code').toLowerCase();
          var body = blockMatch[3].trim();

          if (blockType === 'table') {
            segments.push({ type: 'table', json: body });
          } else if (blockType === 'chart') {
            segments.push({ type: 'chart', json: body });
          } else {
            segments.push({ type: 'code', code: body, lang: blockMatch[2] || '' });
          }
        }
      }
    });

    return segments;
  }

  /**
   * 在纯文本中切分出裸 table\n[JSON] 块
   */
  function splitBareTables(text) {
    var result = [];
    var re = /\btable\s*\n(\s*\[[\s\S]*?\])\s*(?=\n{2,}|$)/gi;
    var lastIdx = 0;
    var match;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIdx) {
        result.push({ type: 'text', text: text.substring(lastIdx, match.index) });
      }
      result.push({ type: 'bare-table', json: match[1] });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      result.push({ type: 'text', text: text.substring(lastIdx) });
    }

    return result.length > 0 ? result : [{ type: 'text', text: text }];
  }

  /**
   * 解析文本中的 **粗体** 标记为 runs
   */
  function parseBoldRuns(text) {
    var runs = [];
    var re = /\*\*(.+?)\*\*/g;
    var lastIdx = 0;
    var match;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIdx) {
        runs.push({ text: text.substring(lastIdx, match.index), bold: false });
      }
      runs.push({ text: match[1], bold: true });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      runs.push({ text: text.substring(lastIdx), bold: false });
    }
    return runs.length > 0 ? runs : [{ text: text, bold: false }];
  }

  // ─── 共享辅助 ────────────────────────────────────────────────

  /**
   * 混合渲染：Markdown 文本段落 + 已渲染的 HTML 块（表格/图表/代码）
   * 用于 toHTML()
   */
  function renderMixed(text) {
    var BLOCK_RE = /%%(TABLE|CHART|CODE)%%([\s\S]*?)%%\/\1%%/g;
    var parts = [];
    var lastIdx = 0;
    var match;

    while ((match = BLOCK_RE.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(AIParser.renderMarkdown(text.substring(lastIdx, match.index)));
      }
      parts.push(match[2]);
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      parts.push(AIParser.renderMarkdown(text.substring(lastIdx)));
    }

    return parts.join('');
  }

  /**
   * 触发浏览器下载文件
   * @param {string} content — 文件内容
   * @param {string} filename — 文件名
   * @param {string} mimeType — MIME 类型
   */
  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    toExcel: toExcel,
    toHTML: toHTML,
    toPDF: toPDF,
    toPPTX: toPPTX,
    downloadFile: downloadFile
  };

})();
