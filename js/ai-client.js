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
      name: I18n.t('Deepseek（深度求索）'),
      url: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-v4-flash',
      authHeader: 'Authorization',
      authValue: function(key) { return 'Bearer ' + key; },
      buildBody: buildDeepseekBody,
      parseResponse: parseOpenAIResponse,
      validateResp: validateOpenAIResp
    },
    qwen: {
      name: I18n.t('QWen（通义千问）'),
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      authHeader: 'Authorization',
      authValue: function(key) { return 'Bearer ' + key; },
      buildBody: buildOpenAIBody,
      parseResponse: parseOpenAIResponse,
      validateResp: validateOpenAIResp
    },
    gemini: {
      name: I18n.t('Gemini（谷歌）'),
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-3.6-flash',
      authHeader: 'Authorization',
      authValue: function(key) { return 'Bearer ' + key; },
      buildBody: buildOpenAIBody,
      parseResponse: parseOpenAIResponse,
      validateResp: validateOpenAIResp
    },
    claude: {
      name: I18n.t('Claude Sonnet（克劳迪）'),
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
    if (!cfg) { callback(I18n.t('不支持的 AI 模型: {0}', provider)); return; }

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
          var err = new Error(cfg.name + ' ' + I18n.t('API 错误 ({0}): {1}', resp.status, msg));
          err._isApiError = true;
          throw err;
        }).catch(function(e) {
          // 用标记区分「自己抛的 API 错误」与「JSON 解析失败」，跨语言可靠（原文案探测在英文下会失效）
          if (e._isApiError) throw e;
          var err2 = new Error(cfg.name + ' ' + I18n.t('API 错误 ({0})', resp.status));
          err2._isApiError = true;
          throw err2;
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
	        callback(cfg.name + ' ' + I18n.t('返回了空响应，请重试') + rawPreview);
      }
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      if (timedOut) {
        callback(cfg.name + ' ' + I18n.t('请求超时（120秒），请检查网络或 API Key 是否有效'));
      } else if (err && err.name === 'AbortError') {
        callback(cfg.name + ' ' + I18n.t('请求超时（120秒），请检查网络或 API Key 是否有效'));
      } else {
        callback(err.message || I18n.t('请求失败，请检查网络连接'));
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
      callback(I18n.t('请先在系统设置中配置 {0} 的 API Key', (cfg ? cfg.name : provider)));
      return;
    }

    var sources = DataSourceStore.getAll();
    if (sources.length === 0) {
      callback(I18n.t('没有可用的数据源，请先转入数据'));
      return;
    }

    var prompt = buildSuggestionsPrompt(sources);
    var messages = [
      { role: 'system', content: SUGGEST_SYSTEM_PROMPTS[I18n.getLang()] || SUGGEST_SYSTEM_PROMPTS['zh-cn'] },
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

  /* ── 推荐问题提示词（三语）── */

  var SUGGEST_SYSTEM_PROMPTS = {
    'zh-cn': '你是一个ERP数据分析专家。你的任务是根据数据源信息，为用户推荐有深度的分析问题。只返回问题本身，每行一个，不带编号。',
    'zh-tw': '你是一個ERP資料分析專家。你的任務是根據資料來源資訊，為使用者推薦有深度的分析問題。只回傳問題本身，每行一個，不帶編號。',
    'en': 'You are an ERP data analysis expert. Based on the data source information, recommend insightful analysis questions. Return only the questions, one per line, without numbering.'
  };

  /**
   * 构建推荐问题的 Prompt（仅用元数据，控制 token 消耗）
   */
  function buildSuggestionsPrompt(sources) {
    var lang = I18n.getLang();
    if (lang === 'zh-tw') return buildSuggestionsPromptZhTw(sources);
    if (lang === 'en') return buildSuggestionsPromptEn(sources);
    return buildSuggestionsPromptZhCn(sources);
  }

  function buildSuggestionsPromptZhCn(sources) {
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

  function buildSuggestionsPromptZhTw(sources) {
    var prompt = '以下是我目前可用的 ERP 資料來源列表。請根據這些資料的特徵，推薦 4-5 個有深度、能挖掘資料價值的具體分析問題。\n\n';
    prompt += '要求：\n';
    prompt += '1. 問題要具體，能直接用來分析資料（不是泛泛的「分析銷售趨勢」）\n';
    prompt += '2. 從趨勢、對比、排名、異常、關聯等角度切入\n';
    prompt += '3. 結合欄位名稱來提問，讓使用者知道這些欄位可以怎麼用\n';
    prompt += '4. 每行一個問句，不帶編號、不分組\n\n';

    sources.forEach(function(ds, i) {
      prompt += '【資料來源 ' + (i + 1) + '】\n';
      prompt += '  報表名稱：' + ds.reportName + '\n';
      prompt += '  篩選條件：' + (ds.filterSummary || '無') + '\n';
      prompt += '  記錄筆數：' + (ds.recordCount || 0) + '\n';
      if (ds.columnInfo && typeof ds.columnInfo === 'object') {
        var cols = Object.keys(ds.columnInfo).slice(0, 30);
        prompt += '  可用欄位：' + cols.join('、') + '\n';
      }
      prompt += '\n';
    });

    return prompt;
  }

  function buildSuggestionsPromptEn(sources) {
    var prompt = 'Below is the list of ERP data sources I currently have. Based on their characteristics, recommend 4-5 specific, in-depth analysis questions that can unlock data value.\n\n';
    prompt += 'Requirements:\n';
    prompt += '1. Questions must be concrete and directly usable for analysis (not generic ones like "analyze sales trends")\n';
    prompt += '2. Approach from angles such as trends, comparison, ranking, anomalies, and correlation\n';
    prompt += '3. Reference field names in the questions so users see how the fields can be used\n';
    prompt += '4. One question per line, no numbering, no grouping\n\n';

    sources.forEach(function(ds, i) {
      prompt += '[Data source ' + (i + 1) + ']\n';
      prompt += '  Report name: ' + ds.reportName + '\n';
      prompt += '  Filters: ' + (ds.filterSummary || 'None') + '\n';
      prompt += '  Records: ' + (ds.recordCount || 0) + '\n';
      if (ds.columnInfo && typeof ds.columnInfo === 'object') {
        var cols = Object.keys(ds.columnInfo).slice(0, 30);
        prompt += '  Available fields: ' + cols.join(', ') + '\n';
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
      callback(I18n.t('请先在系统设置中配置 {0} 的 API Key', (cfg ? cfg.name : provider)));
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
    if (!apiKey) { callback(I18n.t('请输入 API Key')); return; }
    if (!PROVIDERS[provider]) { callback(I18n.t('不支持的模型')); return; }

    var cfg = PROVIDERS[provider];
    var testMessages = [{ role: 'user', content: 'hi' }];
    var testOpts = { temperature: 0, maxTokens: 5 };

    sendRequest(provider, apiKey, testMessages, testOpts, function(err, text) {
      if (err) {
        callback(err);
      } else {
        callback(null, cfg.name + ' ' + I18n.t('API Key 有效，连接成功'));
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
    var lang = I18n.getLang();
    if (lang === 'zh-tw') return buildSystemPromptZhTw(sources);
    if (lang === 'en') return buildSystemPromptEn(sources);
    return buildSystemPromptZhCn(sources);
  }

  function buildSystemPromptZhCn(sources) {
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

  function buildSystemPromptZhTw(sources) {
    var prompt = '你是一個 Sunlike ERP 資料分析助手。你可以幫助使用者分析ERP報表資料，發現趨勢，製作圖表和表格。\n\n';
    prompt += '以下是使用者轉入的資料來源：\n\n';
    prompt += '⚠️ 嚴禁在回覆中輸出思考過程、格式自檢、推理鏈條或自我驗證。直接給出最終答案。\n\n';

    sources.forEach(function(ds, i) {
      prompt += '---\n';
      prompt += '[資料來源 ' + (i + 1) + ': ' + ds.reportName + ']\n';
      prompt += '篩選條件: ' + ds.filterSummary + '\n';
      prompt += '記錄數: ' + (ds.recordCount || 0) + ' 筆\n';

      if (ds.data && ds.data.length > 0) {
        var sampleKeys = Object.keys(ds.data[0]).slice(0, 20);
        prompt += '欄位: ' + sampleKeys.join(', ') + '\n\n';
        prompt += '資料樣本(前' + Math.min(20, ds.data.length) + '列):\n';
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
    prompt += '\n📋 **資料展示鐵律（極其重要！違反將導致輸出不可用）**：\n';
    prompt += '• 任何時候需要展示多筆資料、清單、排行、統計結果、對比分析 → **必須使用 ```table 格式**\n';
    prompt += '• 永遠不要用純文字列表（- item）來展示結構化資料 — 既不美觀也無法匯出Excel\n';
    prompt += '• 每個 table 的第一列應該是序號或關鍵識別，欄位名用繁體中文\n';
    prompt += '• 數值列要對齊，金額加千分位逗號\n';
    prompt += '• table 範例：\n';
    prompt += '```table\n[{"序號":1,"客戶名稱":"某某公司","金額":125000,"佔比":"34%"},{"序號":2,"客戶名稱":"另一公司","金額":98000,"佔比":"27%"}]\n```\n';
    prompt += '\n';
    prompt += '\n📊 **圖表規範**：\n';
    prompt += '• 展示趨勢、佔比、對比時使用 chart，格式：\n';
    prompt += '```chart\n{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"label":"銷售額","data":[10,20,30]}]},"options":{}}\n```\n';
    prompt += '• 支援的圖表類型: bar, line, pie, doughnut\n';
    prompt += '• 圖表設定需符合 Chart.js v4 格式\n';
    prompt += '\n';
    prompt += '\n📝 **回覆結構**：\n';
    prompt += '1. 先給一句話結論或關鍵發現（粗體強調）\n';
    prompt += '2. 然後用 ```table 展示詳細資料（必須！）\n';
    prompt += '3. 接著用 ```chart 展示視覺化圖表（如有需要）\n';
    prompt += '4. 最後給 1-3 條洞察建議\n';
    prompt += '5. 繁體中文回覆，引用具體數字，不要憑空捏造\n';

    return prompt;
  }

  function buildSystemPromptEn(sources) {
    var prompt = 'You are a Sunlike ERP data analysis assistant. You help users analyze ERP report data, discover trends, and create charts and tables.\n\n';
    prompt += 'The following are the data sources transferred by the user:\n\n';
    prompt += '⚠️ Never output thinking processes, format self-checks, reasoning chains, or self-verification in your reply. Give the final answer directly.\n\n';

    sources.forEach(function(ds, i) {
      prompt += '---\n';
      prompt += '[Data source ' + (i + 1) + ': ' + ds.reportName + ']\n';
      prompt += 'Filters: ' + ds.filterSummary + '\n';
      prompt += 'Records: ' + (ds.recordCount || 0) + '\n';

      if (ds.data && ds.data.length > 0) {
        var sampleKeys = Object.keys(ds.data[0]).slice(0, 20);
        prompt += 'Fields: ' + sampleKeys.join(', ') + '\n\n';
        prompt += 'Data sample (first ' + Math.min(20, ds.data.length) + ' rows):\n';
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
    prompt += '\n📋 **Data presentation rules (extremely important! Violating them makes your output unusable)**：\n';
    prompt += '• Whenever you need to show multiple records, lists, rankings, statistics, or comparisons → **you MUST use the ```table format**\n';
    prompt += '• Never use plain-text lists (- item) for structured data — they are neither readable nor exportable to Excel\n';
    prompt += '• The first column of each table should be a sequence number or key identifier; use English field names\n';
    prompt += '• Align numeric columns; use thousands separators for amounts\n';
    prompt += '• Table example:\n';
    prompt += '```table\n[{"#":1,"Customer":"Acme Corp","Amount":125000,"Share":"34%"},{"#":2,"Customer":"Another Corp","Amount":98000,"Share":"27%"}]\n```\n';
    prompt += '\n';
    prompt += '\n📊 **Chart guidelines**：\n';
    prompt += '• Use chart for trends, shares, and comparisons, format:\n';
    prompt += '```chart\n{"type":"bar","data":{"labels":["A","B","C"],"datasets":[{"label":"Sales","data":[10,20,30]}]},"options":{}}\n```\n';
    prompt += '• Supported chart types: bar, line, pie, doughnut\n';
    prompt += '• Chart config must follow Chart.js v4 format\n';
    prompt += '\n';
    prompt += '\n📝 **Reply structure**：\n';
    prompt += '1. Start with a one-sentence conclusion or key finding (bold)\n';
    prompt += '2. Then show detailed data with ```table (required!)\n';
    prompt += '3. Then show a ```chart visualization (if applicable)\n';
    prompt += '4. End with 1-3 actionable insights\n';
    prompt += '5. Reply in English, cite specific numbers, never fabricate\n';

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
