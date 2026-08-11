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

    // 提取图表截图 (canvas → base64 PNG)
    var chartImages = '';
    if (msgDiv) {
      var canvases = msgDiv.querySelectorAll('canvas');
      canvases.forEach(function(canvas) {
        try {
          chartImages += '<img src="' + canvas.toDataURL('image/png') +
                         '" style="max-width:100%;margin:10px 0">';
        } catch (e) {
          // 跨域 canvas 无法导出
        }
      });
    }

    // 清理文本中的标记
    var cleanText = rawText
      .replace(/```chart[\s\S]*?```/g, '[图表]')
      .replace(/```table[\s\S]*?```/g, '[数据表格]')
      .replace(/```[\s\S]*?```/g, '[代码]');

    // 按标题分割幻灯片
    var slides = cleanText.split(/\n#{1,3}\s+/).filter(function(s) { return s.trim(); });
    if (slides.length === 0) { slides = [cleanText]; }

    var slidesHTML = slides.map(function(slide, i) {
      return '<div class="slide" style="page-break-after:always;padding:40px;min-height:400px">' +
        '<h2 style="color:#1E40AF;margin-bottom:20px">' + (i === 0 ? title : '') + '</h2>' +
        '<div style="white-space:pre-wrap;font-size:14px;line-height:1.8">' +
          Utils.escapeHtml(slide.trim()).replace(/\n/g, '<br>') +
        '</div>' +
        (i === slides.length - 1 ? chartImages : '') +
        '<p style="color:#94A3B8;font-size:11px;margin-top:30px">' +
          dateStr + ' | Sunlike ERP AI 分析</p>' +
        '</div>';
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>' +
      '<style>body{font-family:"Microsoft YaHei",sans-serif;color:#0F172A;max-width:800px;margin:0 auto}</style>' +
      '</head><body>' + slidesHTML + '</body></html>';

    downloadFile(html, 'AI数据分析报告.html', 'text/html;charset=utf-8');
    Utils.showToast('报告 (HTML格式) 已下载。正式 .pptx 功能开发中');
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
