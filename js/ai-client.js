/**
 * ai-client.js — 统一 AI 客户端模块
 * 负责：支持 Deepseek / QWen / Gemini / Claude 四种大模型
 *       自动根据 SettingsStore 中的 provider + key 路由到正确 API
 * 依赖：DataSourceStore, SettingsStore
 */

var AIClient = (function() {
  'use strict';

  /* ================================================================
     Provider Configurations
     ================================================================ */

  var PROVIDERS = {
    deepseek: {
      name: 'Deepseek（深度求索）',
      url: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-v4-flash',
      authHeader: 'Authorization',
      authValue: function(key) { return 'Bearer ' + key; },
      buildBody: buildDeepseekBody,
      parseResponse: parseOpenAIResponse,
      validateResp: validateOpenAIResp
    },
    qwen: {
      name: 'QWen（通义千问）',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      authHeader: 'Authorization',
      authValue: function(key) { return 'Bearer ' + key; },
      buildBody: buildOpenAIBody,
      parseResponse: parseOpenAIResponse,
      validateResp: validateOpenAIResp
    },
    gemini: {
      name: 'Gemini（谷歌）',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-3.6-flash',
      authHeader: 'Authorization',
      authValue: function(key) { return 'Bearer ' + key; },
      buildBody: buildOpenAIBody,
      parseResponse: parseOpenAIResponse,
      validateResp: validateOpenAIResp
    },
    claude: {
      name: 'Claude Sonnet（克劳迪）',
      url: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-5',
      authHeader: 'x-api-key',
      authValue: function(key) { return key; },
      buildBody: buildClaudeBody,
      parseResponse: parseClaudeResponse,
      validateResp: validateClaudeResp
    }
  };

  // ── OpenAI-compatible body builder ───────────────────

  function buildOpenAIBody(provider, messages, opts) {
    opts = opts || {};
    return JSON.stringify({
      model: PROVIDERS[provider].model,
      messages: messages,
      temperature: opts.temperature != null ? opts.temperature : 0.3,
      max_tokens: opts.maxTokens || 8192,
      stream: false
    });
  }

  // ── Deepseek-specific body builder (thinking DISABLED) ─

  /**
   * Deepseek V4 默认 thinking: { type: "enabled" }
   * 思维链会大量消耗 token 预算并显著增加延迟，
   * 导致 "卡死"（长时间等待）或 "空响应"（thinking 吃光 max_tokens）
   * 必须显式关闭！
   */
  function buildDeepseekBody(provider, messages, opts) {
    opts = opts || {};
    return JSON.stringify({
      model: PROVIDERS[provider].model,
      messages: messages,
      temperature: opts.temperature != null ? opts.temperature : 0.3,
      max_tokens: opts.maxTokens || 8192,
      stream: false,
      thinking: { type: 'disabled' }
    });
  }
  function parseOpenAIResponse(provider, data) {
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    return null;
  }

  function validateOpenAIResp(provider, resp) {
    // OpenAI-compatible: 200=ok, 401=bad key
    return resp.ok;
  }

  // ── Claude-specific body builder ─────────────────────

  function buildClaudeBody(provider, messages, opts) {
    opts = opts || {};
    var systemMsg = '';
    var claudeMessages = [];
    messages.forEach(function(m) {
      if (m.role === 'system') {
        systemMsg += (systemMsg ? '\n' : '') + m.content;
      } else {
        claudeMessages.push({ role: m.role, content: m.content });
      }
    });
    var body = {
      model: PROVIDERS.claude.model,
      max_tokens: opts.maxTokens || 8192,
      messages: claudeMessages,
      thinking: { type: 'disabled' }
    };
    if (systemMsg) body.system = systemMsg;
    return JSON.stringify(body);
  }


  function parseClaudeResponse(provider, data) {
    if (data.content && data.content.length) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].type === 'text' && data.content[i].text) {
          return data.content[i].text;
        }
      }
    }
    return null;
  }

  function validateClaudeResp(provider, resp) {
    // Claude: 200=ok, 401/403=bad key
    return resp.ok;
  }

  /* ================================================================
     sendRequest — 通用 AI 请求（带超时 + 调试日志）
     ================================================================ */

  /**
   * 发送 AI 请求（内部通用方法）
   * @param {string} provider — 'deepseek'|'qwen'|'gemini'|'claude'
   * @param {string} apiKey
   * @param {Array<object>} messages — [{role, content}, ...]
   * @param {object} opts — {temperature, maxTokens}
   * @param {function} callback — function(err, textContent)
   */
  function sendRequest(provider, apiKey, messages, opts, callback) {
    var cfg = PROVIDERS[provider];
    if (!cfg) { callback('不支持的 AI 模型: ' + provider); return; }

    // 120 秒超时 — 防止请求永久挂起
    var controller = new AbortController();
    var timedOut = false;
    var timeoutId = setTimeout(function() {
      timedOut = true;
      controller.abort();
    }, 120000);

    var headers = { 'Content-Type': 'application/json' };
    headers[cfg.authHeader] = cfg.authValue(apiKey);
    if (provider === 'claude') {
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    // 调试日志（浏览器控制台可见）
    if (window.console) {
      console.log('[AIClient] >>> ' + cfg.name + ' | model=' + PROVIDERS[provider].model +
        ' | messages=' + messages.length + ' | chars~' +
        messages.reduce(function(s, m) { return s + (m.content ? m.content.length : 0); }, 0));
    }

    fetch(cfg.url, {
      method: 'POST',
      headers: headers,
      body: cfg.buildBody(provider, messages, opts),
      signal: controller.signal
    })
    .then(function(resp) {
      clearTimeout(timeoutId);
      if (window.console) {
        console.log('[AIClient] <<< ' + cfg.name + ' status=' + resp.status + ' ok=' + resp.ok);
      }
      if (!resp.ok) {
        return resp.json().then(function(e) {
          var msg = (e.error && e.error.message) ? e.error.message : JSON.stringify(e);
          throw new Error(cfg.name + ' API 错误 (' + resp.status + '): ' + msg);
        }).catch(function(e) {
          if (e.message && e.message.indexOf('API 错误') === 0) throw e;
          throw new Error(cfg.name + ' API 错误 (' + resp.status + ')');
        });
      }
      return resp.json();
    })
    .then(function(data) {
      var text = cfg.parseResponse(provider, data);
      // DEBUG: log raw response structure for troubleshooting
      if (window.console) {
        console.log("[AIClient] <<< " + cfg.name + " stop_reason=" + (data.stop_reason || "none") +
          " content_len=" + (data.content ? data.content.length : 0));
        if (!text || text === "") {
          console.log("[AIClient] <<< RAW data:", JSON.stringify(data).substring(0, 500));
        }
      }
      if (text !== null && text !== undefined && text !== '') {
        if (window.console) {
          console.log('[AIClient] <<< ' + cfg.name + ' response chars=' + text.length);
        }
        callback(null, text);
      } else {
        var rawPreview = '';
	        try { rawPreview = ' [RAW: ' + JSON.stringify(data).substring(0, 300) + ']'; } catch(e) {}
	        callback(cfg.name + ' 返回了空响应，请重试' + rawPreview);
      }
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      if (timedOut) {
        callback(cfg.name + ' 请求超时（120秒），请检查网络或 API Key 是否有效');
      } else if (err && err.name === 'AbortError') {
        callback(cfg.name + ' 请求超时（120秒），请检查网络或 API Key 是否有效');
      } else {
        callback(err.message || '请求失败，请检查网络连接');
      }
    });
  }

  /* ================================================================
     Public API — suggestQuestions (for brain button)
     ================================================================ */

  /**
   * 根据数据源元数据生成推荐问题
   * @param {function} callback — function(err, questionsArray)
   */
  function suggestQuestions(callback) {
    var provider = SettingsStore.getAIProvider();
    var apiKey = SettingsStore.getAIKey();

    if (!apiKey) {
      var cfg = PROVIDERS[provider];
      callback('请先在系统设置中配置 ' + (cfg ? cfg.name : provider) + ' 的 API Key');
      return;
    }

    var sources = DataSourceStore.getAll();
    if (sources.length === 0) {
      callback('没有可用的数据源，请先转入数据');
      return;
    }

    var prompt = buildSuggestionsPrompt(sources);
    var messages = [
      { role: 'system', content: '你是一个ERP数据分析专家。你的任务是根据数据源信息，为用户推荐有深度的分析问题。只返回问题本身，每行一个，不带编号。' },
      { role: 'user', content: prompt }
    ];

    sendRequest(provider, apiKey, messages, { temperature: 0.7, maxTokens: 512 }, function(err, text) {
      if (err) { callback(err); return; }
      var questions = text
        .split('\n')
        .map(function(l) { return l.trim(); })
        .filter(function(l) { return l.length > 0; })
        .map(function(l) { return l.replace(/^\d+[\.\)、\s]\s*/, ''); })
        .filter(function(l) { return l.length >= 8 && l.length <= 120; });
      callback(null, questions);
    });
  }

  /**
   * 构建推荐问题的 Prompt（仅用元数据，控制 token 消耗）
   */
  function buildSuggestionsPrompt(sources) {
    var prompt = '以下是我当前可用的 ERP 数据源列表。请根据这些数据的特征，推荐 4-5 个有深度、能挖掘数据价值的具体分析问题。\n\n';
    prompt += '要求：\n';
    prompt += '1. 问题要具体，能直接用来分析数据（不是泛泛的"分析销售趋势"）\n';
    prompt += '2. 从趋势、对比、排名、异常、关联等角度切入\n';
    prompt += '3. 结合字段名称来提问，让用户知道这些字段可以怎么用\n';
    prompt += '4. 每行一个问句，不带编号、不分组\n\n';

    sources.forEach(function(ds, i) {
      prompt += '【数据源 ' + (i + 1) + '】\n';
      prompt += '  报表名称：' + ds.reportName + '\n';
      prompt += '  筛选条件：' + (ds.filterSummary || '无') + '\n';
      prompt += '  记录条数：' + (ds.recordCount || 0) + '\n';
      if (ds.columnInfo && typeof ds.columnInfo === 'object') {
        var cols = Object.keys(ds.columnInfo).slice(0, 30);
        prompt += '  可用字段：' + cols.join('、') + '\n';
      }
      prompt += '\n';
    });

    return prompt;
  }

  /* ================================================================
     Public API — call (main entry, reads key from SettingsStore)
     ================================================================ */

  /**
   * 调用 AI（自动从 SettingsStore 读取当前 provider + key）
   * @param {string} userMessage — 用户消息
   * @param {Array<object>} chatHistory — 当前会话历史
   * @param {function} callback — function(err, fullResponseText)
   */
  function call(userMessage, chatHistory, callback) {
    var provider = SettingsStore.getAIProvider();
    var apiKey = SettingsStore.getAIKey();

    if (!apiKey) {
      var cfg = PROVIDERS[provider];
      callback('请先在系统设置中配置 ' + (cfg ? cfg.name : provider) + ' 的 API Key');
      return;
    }

    var sources = DataSourceStore.getAll();
    var systemPrompt = buildSystemPrompt(sources);

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    sendRequest(provider, apiKey, messages, null, callback);
  }

  /* ================================================================
     Public API — validateKey (for settings panel)
     ================================================================ */

  /**
   * 验证 API Key 是否有效
   * @param {string} provider
   * @param {string} apiKey
   * @param {function} callback — function(err, successMessage)
   */
  function validateKey(provider, apiKey, callback) {
    if (!apiKey) { callback('请输入 API Key'); return; }
    if (!PROVIDERS[provider]) { callback('不支持的模型'); return; }

    var cfg = PROVIDERS[provider];
    var testMessages = [{ role: 'user', content: 'hi' }];
    var testOpts = { temperature: 0, maxTokens: 5 };

    sendRequest(provider, apiKey, testMessages, testOpts, function(err, text) {
      if (err) {
        callback(err);
      } else {
        callback(null, cfg.name + ' API Key 有效，连接成功');
      }
    });
  }

  /* ================================================================
     System Prompt Builder (same as before)
     ================================================================ */

  /**
   * 构建注入数据源的 System Prompt
   * @param {Array<object>} sources — 数据源列表
   * @returns {string}
   */
  function buildSystemPrompt(sources) {
    var prompt = '你是一个 Sunlike ERP 数据分析助手。你可以帮助用户分析ERP报表数据，发现趋势，制作图表和表格。\n\n';
    prompt += '以下是用户转入的数据源：\n\n';
    prompt += '⚠️ 严禁在回复中输出思考过程、格式自检、推理链条或自我验证。直接给出最终答案。\n\n';

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
    prompt += '\n📋 **数据展示铁律（极其重要！违反将导致输出不可用）**：\n';
    prompt += '• 任何时候需要展示多条数据、清单、排行、统计结果、对比分析 → **必须使用 ```table 格式**\n';
    prompt += '• 永远不要用纯文本列表（- item）来展示结构化数据 — 即不美观也无法导出Excel\n';
    prompt += '• 每个 table 的第一列应该是序号或关键标识，字段名用中文\n';
    prompt += '• 数值列要对齐，金额加千分位逗号\n';
    prompt += '• table 示例：\n';
    prompt += '```table\n[{"序号":1,"客户名称":"某某公司","金额":125000,"占比":"34%"},{"序号":2,"客户名称":"另一公司","金额":98000,"占比":"27%"}]\n```\n';
    prompt += '\n';
    prompt += '\n📊 **图表规范**：\n';
    prompt += '• 展示趋势、占比、对比时使用 chart，格式：\n';
    prompt += '```chart\n{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"label":"销售额","data":[10,20,30]}]},"options":{}}\n```\n';
    prompt += '• 支持的图表类型: bar, line, pie, doughnut\n';
    prompt += '• 图表配置需符合 Chart.js v4 格式\n';
    prompt += '\n';
    prompt += '\n📝 **回复结构**：\n';
    prompt += '1. 先给一句话结论或关键发现（粗体强调）\n';
    prompt += '2. 然后用 ```table 展示详细数据（必须！）\n';
    prompt += '3. 接着用 ```chart 展示可视化图表（如有需要）\n';
    prompt += '4. 最后给 1-3 条洞察建议\n';
    prompt += '5. 中文回复，引用具体数字，不要凭空编造\n';

    return prompt;
  }

  /* ================================================================
     Public API — getter for provider list (for settings UI)
     ================================================================ */

  function getProviders() {
    var list = [];
    Object.keys(PROVIDERS).forEach(function(key) {
      list.push({ id: key, name: PROVIDERS[key].name });
    });
    return list;
  }

  /* ================================================================
     Expose
     ================================================================ */
  return {
    call: call,
    suggestQuestions: suggestQuestions,
    validateKey: validateKey,
    buildSystemPrompt: buildSystemPrompt,
    getProviders: getProviders,
    PROVIDERS: PROVIDERS
  };

})();

// ── Backward compat alias ──────────────────────────────────
// 旧模块 deepseek-client.js 被 chat-core.js 等引用为 DeepseekClient
// 提供兼容别名，保证已有代码无需改动
var DeepseekClient = AIClient;
