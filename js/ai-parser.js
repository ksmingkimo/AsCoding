/**
 * ai-parser.js — AI 响应解析模块
 * 负责：解析 AI 回复中的 Markdown、```table```、```chart``` 标记
 *       将原始文本转换为可渲染的 HTML
 * 依赖：Utils
 */

var AIParser = (function() {
  'use strict';

  /**
   * 解析 AI 原始回复文本，分离出 HTML 和图表配置
   * @param {string} rawText — AI 返回的原始文本
   * @returns {{ html: string, charts: Array<object> }}
   */
  function parse(rawText) {
    var html = '';
    var charts = [];
    var lastIndex = 0;

    // Step 1: 提取 ```chart``` 块
    var chartRegex = /```\s*chart\s*\n([\s\S]*?)```/g;
    var chartMatch;

    while ((chartMatch = chartRegex.exec(rawText)) !== null) {
      // 图表块之前的文本 → Markdown 渲染
      html += renderMarkdown(rawText.substring(lastIndex, chartMatch.index));
      try {
        var chartConfig = JSON.parse(chartMatch[1].trim());
        var chartIdx = charts.length;
        charts.push(chartConfig);
        html += '<div class="chart-container"><canvas id="chart-' + chartIdx + '-' + Date.now() +
                '" style="max-width:100%;max-height:350px"></canvas></div>';
      } catch (e) {
        html += '<pre><code>' + Utils.escapeHtml(chartMatch[1]) + '</code></pre>';
      }
      lastIndex = chartMatch.index + chartMatch[0].length;
    }

    // Step 2: 剩余文本 → 提取 ```table``` 块
    html += renderWithTables(rawText.substring(lastIndex));

    return { html: html, charts: charts };
  }

  /**
   * 渲染文本中的 ```table``` 代码块
   * @param {string} text
   * @returns {string} HTML
   */
  function renderWithTables(text) {
    var html = '';
    // Match both ```table``` fenced blocks and bare "table\n[JSON]" patterns
    var tableRegex = /```table\s*\n([\s\S]*?)```|\btable\s*\n(\s*\[[\s\S]*?\])\s*(?=\n{2,}|$)/gi;
    var tableMatch;
    var lastIdx = 0;

    while ((tableMatch = tableRegex.exec(text)) !== null) {
      html += renderMarkdown(text.substring(lastIdx, tableMatch.index));
      try {
        // Group 1 = fenced ```table```, Group 2 = bare table\n[JSON]
        var json = (tableMatch[1] || tableMatch[2]).trim();
        var tableData = JSON.parse(json);
        html += renderTableHTML(tableData);
      } catch (e) {
        html += '<pre><code>' + Utils.escapeHtml(tableMatch[1] || tableMatch[2]) + '</code></pre>';
      }
      lastIdx = tableMatch.index + tableMatch[0].length;
    }

    html += renderMarkdown(text.substring(lastIdx));
    return html;
  }

  /**
   * 将 JSON 数据渲染为 HTML <table>
   * @param {Array<object>} data
   * @returns {string} HTML
   */
  /**
   * 判断字符串是否可转为数字（用于右对齐）
   */
  function isNumeric(val) {
    if (val === null || val === undefined || val === '') return false;
    var s = String(val).replace(/[,，\s%￥¥$]/g, '').replace(/^\((.+)\)$/, '-$1');
    return !isNaN(parseFloat(s)) && isFinite(s);
  }

  function renderTableHTML(data) {
    if (!Array.isArray(data) || data.length === 0) return '<p>(空表格)</p>';

    // Union ALL keys across every row — not just data[0].
    // AI often outputs heterogeneous rows (e.g. row 1 = summary, row 2 = detail
    // with different column names). Using only the first row's keys silently
    // drops all columns unique to later rows.
    var keys = [];
    var seenKeys = {};
    data.forEach(function(row) {
      Object.keys(row).forEach(function(k) {
        if (!seenKeys[k]) {
          seenKeys[k] = true;
          keys.push(k);
        }
      });
    });

    // Detect which columns are purely numeric (for right-alignment)
    var numericCols = {};
    keys.forEach(function(k) {
      var allNumeric = data.every(function(row) {
        var v = row[k];
        return v === null || v === undefined || v === '' || isNumeric(v);
      });
      if (allNumeric) numericCols[k] = true;
    });

    var html = '<div class="table-wrap"><table><thead><tr>';
    keys.forEach(function(k) {
      html += '<th' + (numericCols[k] ? ' class="num"' : '') + '>' + Utils.escapeHtml(k) + '</th>';
    });
    html += '</tr></thead><tbody>';
    data.forEach(function(row) {
      html += '<tr>';
      keys.forEach(function(k) {
        var v = row[k];
        if (v === null || v === undefined) v = '';
        html += '<td' + (numericCols[k] ? ' class="num"' : '') + '>' + Utils.escapeHtml(String(v)) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  /**
   * 基本 Markdown → HTML 渲染
   * 支持：标题(#)、粗体(**)、斜体(*)、行内代码(`)、代码块(```)、列表(-)、分隔线(---)
   * @param {string} text
   * @returns {string} HTML
   */
  function renderMarkdown(text) {
    if (!text) return '';
    var html = Utils.escapeHtml(text);

    // 代码块（已处理过 table/chart，这里处理普通代码块）
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function(m, lang, code) {
      return '<pre><code>' + code.trim() + '</code></pre>';
    });
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // 粗体 / 斜体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^# (.+)$/gm, '<h4>$1</h4>');
    // 列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // 分隔线
    html = html.replace(/^---$/gm, '<hr>');
    // 段落（双换行 → 新段落，避免连续空行产生多个空 <p>）
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    // 确保包裹在 <p> 中
    if (!html.startsWith('<')) { html = '<p>' + html + '</p>'; }
    // 清理空段落和纯换行的段落
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    html = html.replace(/<p>(\s|<br>)*<\/p>/g, '');

    return html;
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    parse: parse,
    renderWithTables: renderWithTables,
    renderTableHTML: renderTableHTML,
    renderMarkdown: renderMarkdown
  };

})();
