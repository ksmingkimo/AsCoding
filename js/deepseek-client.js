/**
 * deepseek-client.js — Deepseek API 客户端模块
 * 负责：调用 Deepseek Chat API、构建 System Prompt（注入数据源）
 * 依赖：DataSourceStore
 */

var DeepseekClient = (function() {
  'use strict';

  var API_URL = 'https://api.deepseek.com/v1/chat/completions';
  var MODEL = 'deepseek-chat';

  /**
   * 构建注入数据源的 System Prompt
   * @param {Array<object>} sources — 数据源列表
   * @returns {string}
   */
  function buildSystemPrompt(sources) {
    var prompt = '你是一个 Sunlike ERP 数据分析助手。你可以帮助用户分析ERP报表数据，发现趋势，制作图表和表格。\n\n';
    prompt += '以下是用户转入的数据源：\n\n';

    sources.forEach(function(ds, i) {
      prompt += '---\n';
      prompt += '[数据源 ' + (i + 1) + ': ' + ds.reportName + ']\n';
      prompt += '筛选条件: ' + ds.filterSummary + '\n';
      prompt += '记录数: ' + (ds.recordCount || 0) + ' 条\n';

      if (ds.data && ds.data.length > 0) {
        var sampleKeys = Object.keys(ds.data[0]).slice(0, 20);
        prompt += '字段: ' + sampleKeys.join(', ') + '\n\n';
        prompt += '数据样本(前' + Math.min(20, ds.data.length) + '行):\n';
        var sample = ds.data.slice(0, 20).map(function(row) {
          return sampleKeys.map(function(k) {
            var v = row[k];
            if (v === null || v === undefined) return '';
            return String(v);
          }).join(' | ');
        }).join('\n');
        prompt += sample + '\n';
      }
      prompt += '\n';
    });

    prompt += '---\n';
    prompt += '📋 **数据展示铁律（极其重要！违反将导致输出不可用）**：\n';
    prompt += '• 任何时候需要展示多条数据、清单、排行、统计结果、对比分析 → **必须使用 ```table 格式**\n';
    prompt += '• 永远不要用纯文本列表（- item）来展示结构化数据 — 即不美观也无法导出Excel\n';
    prompt += '• 每个 table 的第一列应该是序号或关键标识，字段名用中文\n';
    prompt += '• 数值列要对齐，金额加千分位逗号\n';
    prompt += '• table 示例：\n';
    prompt += '```table\n[{"序号":1,"客户名称":"某某公司","金额":125000,"占比":"34%"},{"序号":2,"客户名称":"另一公司","金额":98000,"占比":"27%"}]\n```\n';
    prompt += '\n';
    prompt += '📊 **图表规范**：\n';
    prompt += '• 展示趋势、占比、对比时使用 chart，格式：\n';
    prompt += '```chart\n{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"label":"销售额","data":[10,20,30]}]},"options":{}}\n```\n';
    prompt += '• 支持的图表类型: bar, line, pie, doughnut\n';
    prompt += '• 图表配置需符合 Chart.js v4 格式\n';
    prompt += '\n';
    prompt += '📝 **回复结构**：\n';
    prompt += '1. 先给一句话结论或关键发现（粗体强调）\n';
    prompt += '2. 然后用 ```table 展示详细数据（必须！）\n';
    prompt += '3. 接着用 ```chart 展示可视化图表（如有需要）\n';
    prompt += '4. 最后给 1-3 条洞察建议\n';
    prompt += '5. 中文回复，引用具体数字，不要凭空编造\n';

    return prompt;
  }

  /**
   * 调用 Deepseek Chat API（非流式）
   * @param {string} apiKey — Deepseek API Key
   * @param {string} userMessage — 用户消息文本
   * @param {Array<object>} chatHistory — 当前会话历史（不含 system prompt）
   * @param {function} callback — function(err, fullResponseText)
   */
  function call(apiKey, userMessage, chatHistory, callback) {
    var sources = DataSourceStore.getAll();
    var systemPrompt = buildSystemPrompt(sources);

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.3,
        max_tokens: 4096,
        stream: false
      })
    })
    .then(function(resp) {
      if (!resp.ok) {
        return resp.json().then(function(e) {
          throw new Error('API 错误 (' + resp.status + '): ' +
            (e.error && e.error.message ? e.error.message : JSON.stringify(e)));
        });
      }
      return resp.json();
    })
    .then(function(data) {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        callback(null, data.choices[0].message.content);
      } else {
        callback('AI 返回了空响应，请重试');
      }
    })
    .catch(function(err) {
      callback(err.message || '网络请求失败，请检查网络连接和 API Key');
    });
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    call: call,
    buildSystemPrompt: buildSystemPrompt
  };

})();
