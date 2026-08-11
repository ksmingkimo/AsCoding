/**
 * export.js — 导出模块
 * 负责：AI 回复内容导出为 CSV (Excel) / HTML (PPTX 降级)
 * 依赖：Utils
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
      Utils.showToast('未在回复中找到表格数据，无法导出 Excel', 'error');
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
        // 包含逗号、引号或换行时加引号
        return s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0
          ? '"' + s + '"' : s;
      }).join(',') + '\n';
    });

    downloadFile(csv, 'AI数据分析结果.csv', 'text/csv;charset=utf-8');
    Utils.showToast('Excel (CSV) 文件已下载');
  }

  /**
   * 导出为 HTML 报告（PPTX 降级方案）
   * 正式 .pptx 功能开发中
   * @param {string} rawText — AI 回复原始文本
   * @param {HTMLElement} msgDiv — 消息气泡 DOM（用于提取 chart 截图）
   */
  function toPPTX(rawText, msgDiv) {
    var title = 'AI 数据分析报告';
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

    // ── Step 2: 处理特殊块 — 表格渲染为 HTML，图表替换为截图 ──
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
      return '<p><em>(表格数据解析失败)</em></p>';
    });

    // 2b. ```chart``` → 替换为截图 <img>
    processed = processed.replace(/```chart[\s\S]*?```/g, function() {
      if (chartIdx < chartImages.length) {
        var src = chartImages[chartIdx++];
        return '%%CHART%%<img src="' + src + '" style="max-width:100%;margin:16px 0;display:block" alt="图表">%%/CHART%%';
      }
      return '<p><em>(图表)</em></p>';
    });

    // 2c. 其他 ```code``` 块
    processed = processed.replace(/```(\w*)\n?([\s\S]*?)```/g, function(m, lang, code) {
      return '%%CODE%%<pre><code>' + Utils.escapeHtml(code.trim()) + '</code></pre>%%/CODE%%';
    });

    // ── Step 3: 按 # / ## / ### 标题拆分为幻灯片 ──
    var slides = processed.split(/\n#{1,3}\s+/).filter(function(s) { return s.trim(); });
    if (slides.length === 0) { slides = [processed]; }

    // ── Step 4: 逐页渲染 — Markdown 文本 + HTML 块混合 ──
    var slidesHTML = slides.map(function(slide, idx) {
      var body = renderMixed(slide.trim());
      return '<div class="slide">' +
        (idx === 0 ? '<h1>' + Utils.escapeHtml(title) + '</h1>' : '') +
        '<div class="slide-body">' + body + '</div>' +
        '<p class="slide-footer">' + dateStr + ' | Sunlike ERP AI 分析</p>' +
        '</div>';
    }).join('');

    // ── Step 5: 组装完整 HTML 文档 ──
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>' +
      '<style>' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:#0F172A;max-width:820px;margin:0 auto;padding:20px}' +
      '.slide{page-break-after:always;padding:24px 0;min-height:400px}' +
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

    downloadFile(html, 'AI数据分析报告.html', 'text/html;charset=utf-8');
    Utils.showToast('报告 (HTML格式) 已下载');
  }

  /**
   * 混合渲染：Markdown 文本段落 + 已渲染的 HTML 块（表格/图表/代码）
   * 用 %%BLOCK%%...%%/BLOCK%% 标记保护 HTML 不被 escapeHtml 破坏
   * @param {string} text
   * @returns {string} HTML
   */
  function renderMixed(text) {
    var BLOCK_RE = /%%(TABLE|CHART|CODE)%%([\s\S]*?)%%\/\1%%/g;
    var parts = [];
    var lastIdx = 0;
    var match;

    while ((match = BLOCK_RE.exec(text)) !== null) {
      // 块之前的纯文本 → Markdown 渲染
      if (match.index > lastIdx) {
        parts.push(AIParser.renderMarkdown(text.substring(lastIdx, match.index)));
      }
      // HTML 块原样保留
      parts.push(match[2]);
      lastIdx = match.index + match[0].length;
    }

    // 剩余纯文本
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
    toPPTX: toPPTX,
    downloadFile: downloadFile
  };

})();
