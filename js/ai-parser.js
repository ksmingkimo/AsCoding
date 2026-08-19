/**
 * ai-parser.js — AI 响应解析模块
 * 负责：解析 AI 回复中的 Markdown、```table```、```chart``` 标记
 *       将原始文本转换为可渲染的 HTML（含管道表格自动美化）
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
      // 图表块之前的文本 → 表格渲染（```table/裸 JSON 必须在这里也生效，
      // 否则 chart 之前的 table 围栏会退化成代码块 —— Round 53 浏览器实测修复）
      html += renderWithTables(rawText.substring(lastIndex, chartMatch.index));
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

    html += renderJsonTables(text.substring(lastIdx));
    return html;
  }

  /**
   * 判断值是否为普通对象（非 null、非数组）
   */
  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  /**
   * 判断值是否为非空对象数组（可渲染成表格的最小形态）
   */
  function isObjectArray(v) {
    return Array.isArray(v) && v.length > 0 && v.every(isPlainObject);
  }

  /**
   * 从 s[start]（必为 '['）起做括号平衡扫描（字符串/转义感知），
   * 返回与之配对的 ']' 下标；未闭合或中途失衡返回 -1
   */
  function findJsonEnd(s, start) {
    var depth = 0;
    var inStr = false;
    var esc = false;
    for (var i = start; i < s.length; i++) {
      var c = s.charAt(i);
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') {
        depth--;
        if (depth === 0) return i;
        if (depth < 0) return -1;
      }
    }
    return -1;
  }

  /**
   * ```json 围栏内容：非空对象数组 → 表格；其余（解析失败/非对象数组/单对象）→ 代码块展示
   */
  function tryTableOrCode(jsonText) {
    var trimmed = jsonText.trim();
    try {
      var data = JSON.parse(trimmed);
      if (isObjectArray(data)) return renderTableHTML(data);
    } catch (e) { /* 解析失败 → 代码块 */ }
    return '<pre><code>' + Utils.escapeHtml(trimmed) + '</code></pre>';
  }

  /**
   * 扫描文本中的裸 JSON 数组（行首 '[' 开头、无任何围栏标记）并渲染为表格。
   * 防误伤：代码围栏内不转换；解析失败 / 非对象数组 / 单对象 → 原样走 Markdown
   */
  function bareJsonScan(text) {
    var html = '';
    var inFence = false;
    var segStart = 0;
    var i = 0;
    while (i < text.length) {
      // 仅当 i 位于行首时才做行级判断（围栏切换 / 裸 JSON 起点）
      if (i === 0 || text.charAt(i - 1) === '\n') {
        var lineEnd = text.indexOf('\n', i);
        if (lineEnd === -1) lineEnd = text.length;
        var rawLine = text.substring(i, lineEnd);
        var trimmed = rawLine.replace(/^\s+/, '');
        // ``` 开头（任意语言）→ 切换围栏态
        if (trimmed.indexOf('```') === 0) {
          var langMatch = trimmed.match(/^```(\w*)\s*$/);
          var fenceLang = langMatch ? langMatch[1].toLowerCase() : '';
          // 未闭合的 ```table/```json 围栏（闭合的早已在前面被消费）：
          // 不进入跳过态、围栏行丢弃，下方 JSON 由裸 JSON 规则转换
          if (!inFence && (fenceLang === 'table' || fenceLang === 'json')) {
            html += renderMarkdown(text.substring(segStart, i));
            i = lineEnd + 1;
            segStart = i;
            continue;
          }
          inFence = !inFence;
          i = lineEnd + 1;
          continue;
        }
        // 围栏外且行首是 '[' → 尝试提取完整 JSON
        if (!inFence && trimmed.charAt(0) === '[') {
          var start = i + (rawLine.length - trimmed.length); // 跳过行首缩进
          var end = findJsonEnd(text, start);
          if (end !== -1) {
            try {
              var data = JSON.parse(text.substring(start, end + 1));
              if (isObjectArray(data)) {
                html += renderMarkdown(text.substring(segStart, start));
                html += renderTableHTML(data);
                i = end + 1;
                segStart = i;
                continue;
              }
            } catch (e) { /* 解析失败 → 原样走 Markdown */ }
          }
        }
      }
      i++;
    }
    html += renderMarkdown(text.substring(segStart));
    return html;
  }

  /**
   * 渲染剩余文本：先处理 ```json 围栏（对象数组 → 表格），围栏外再扫描裸 JSON 数组
   */
  function renderJsonTables(text) {
    var html = '';
    var jsonFenceRe = /```json\s*\n([\s\S]*?)```/g;
    var m;
    var last = 0;
    while ((m = jsonFenceRe.exec(text)) !== null) {
      html += bareJsonScan(text.substring(last, m.index));
      html += tryTableOrCode(m[1]);
      last = m.index + m[0].length;
    }
    html += bareJsonScan(text.substring(last));
    return html;
  }

  /**
   * 判断字符串是否可转为数字（用于右对齐）
   */
  function isNumeric(val) {
    if (val === null || val === undefined || val === '') return false;
    var s = String(val).replace(/[,，\s%￥¥$]/g, '').replace(/^\((.+)\)$/, '-$1');
    return !isNaN(parseFloat(s)) && isFinite(s);
  }

  /**
   * 将 JSON 数据渲染为 HTML <table>
   * @param {Array<object>} data
   * @returns {string} HTML
   */
  function renderTableHTML(data) {
    if (!Array.isArray(data) || data.length === 0) return '<p>' + I18n.t('(空表格)') + '</p>';

    // Union ALL keys across every row — not just data[0].
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
   * 将 Markdown 管道表格解析为 HTML <table>
   * 输入示例：| A | B |\n|---|----|\n| 1 | 2 |
   */
  function parseMarkdownTable(md) {
    var lines = md.trim().split('\n');
    if (lines.length < 3) return Utils.escapeHtml(md);

    // 表头行
    var headerCells = lines[0].split('|').map(function(c) { return c.trim(); });
    // 去除首尾空（来自 leading/trailing |）
    if (headerCells.length > 0 && !headerCells[0]) headerCells.shift();
    if (headerCells.length > 0 && !headerCells[headerCells.length - 1]) headerCells.pop();
    // 过滤纯空列
    headerCells = headerCells.filter(function(c, i, arr) {
      return c || (i > 0 && i < arr.length - 1);
    });
    if (headerCells.length === 0) return Utils.escapeHtml(md);

    // 数据行（跳过第二行分隔符）
    var dataRows = [];
    for (var i = 2; i < lines.length; i++) {
      var cells = lines[i].split('|').map(function(c) { return c.trim(); });
      if (cells.length > 0 && !cells[0]) cells.shift();
      if (cells.length > 0 && !cells[cells.length - 1]) cells.pop();
      if (cells.length > 0) dataRows.push(cells);
    }
    if (dataRows.length === 0) return Utils.escapeHtml(md);

    // 检测每列是否数值（右对齐）
    var numericCols = {};
    for (var ci = 0; ci < headerCells.length; ci++) {
      var allNumeric = dataRows.every(function(row) {
        return isNumeric(row[ci] || '');
      });
      if (allNumeric) numericCols[ci] = true;
    }

    var html = '<div class="table-wrap"><table><thead><tr>';
    headerCells.forEach(function(h) {
      html += '<th>' + Utils.escapeHtml(h) + '</th>';
    });
    html += '</tr></thead><tbody>';
    dataRows.forEach(function(row) {
      html += '<tr>';
      row.forEach(function(cell, ci) {
        var v = cell || '';
        html += '<td' + (numericCols[ci] ? ' class="num"' : '') + '>' + Utils.escapeHtml(v) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  /**
   * 基本 Markdown → HTML 渲染
   * 支持：管道表格、标题(#)、粗体(**)、斜体(*)、行内代码(`)、代码块(```)、列表(-)、分隔线(---)
   * @param {string} text
   * @returns {string} HTML
   */
  function renderMarkdown(text) {
    if (!text) return '';

    // Step 0: 提取管道表格 → 占位符保护（避免被 escapeHtml 破坏）
    var tables = [];
    // 匹配：header |...|, separator |---|, one+ data rows |...|
    var TABLE_RE = /(\|[^\n]+\|\s*\n\|[-:\s|]+\|\s*\n(?:\|[^\n]*\|\s*\n?)+)/g;
    text = text.replace(TABLE_RE, function(match) {
      var idx = tables.length;
      tables.push(parseMarkdownTable(match));
      return '%%MDTBL' + idx + '%%';
    });

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
    // 段落（双换行 → 新段落）
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    // 确保包裹在 <p> 中
    if (!html.startsWith('<')) { html = '<p>' + html + '</p>'; }
    // 清理空段落
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    html = html.replace(/<p>(\s|<br>)*<\/p>/g, '');

    // 还原管道表格
    html = html.replace(/%%MDTBL(\d+)%%/g, function(m, idx) {
      return tables[parseInt(idx, 10)] || '';
    });

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
