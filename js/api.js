/**
 * api.js — API 客户端
 * 封装 fetch，自动注入 Auth Header，拦截认证错误
 * 依赖：Auth 模块 (js/auth.js) 必须先加载
 */

var Api = (function() {
  'use strict';

  var API_PATH = '/SUNFUSION/API';

  /**
   * 获取 Base URL
   * @returns {string}
   */
  function getBaseUrl() {
    try {
      var settings = JSON.parse(localStorage.getItem('sunlike_settings')) || {};
      var raw = (settings.serverUrl || 'http://localhost').replace(/\/+$/, '').replace(/\/SUNFUSION\/API$/i, '');
      return raw.replace(/\/+$/, '') + API_PATH;
    } catch(e) {
      return 'http://localhost' + API_PATH;
    }
  }

  /**
   * 发送 API 请求（自动注入 Auth Header + 拦截认证错误）
   * @param {string} path API 路径（如 "/invso/getReport"）
   * @param {object} options fetch options（method, body 等）
   * @returns {Promise<object>} 解析后的 JSON 响应
   */
  function fetchApi(path, options) {
    options = options || {};
    var url = getBaseUrl() + '/' + path.replace(/^\/+/, '');

    // 注入 Auth headers
    options.headers = options.headers || {};
    if (typeof Auth !== 'undefined' && Auth.getToken()) {
      options.headers['Authorization'] = 'Bearer ' + Auth.getToken();
    }
    if (!options.headers['Content-Type'] && options.body) {
      options.headers['Content-Type'] = 'application/json';
    }

    return fetch(url, options)
      .then(function(resp) {
        return resp.json().then(function(data) {
          // 拦截认证错误 (20001/20004)
          if (typeof Auth !== 'undefined') {
            Auth.handleAuthError(data);
          }
          return data;
        });
      })
      .catch(function(err) {
        // 网络错误透传
        throw err;
      });
  }

  /**
   * 通用 POST 请求（支持完整路径，用于非标准端点）
   * @param {string} apiPath 完整 API 路径（如 "mrppu/getList"）
   * @param {object} body 请求体
   * @returns {Promise<object>} 响应数据
   */
  function post(apiPath, body) {
    return fetchApi(apiPath, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * 调用报表查询 API（标准 getReport 端点）
   * @param {string} module 模块名（如 "invso"）
   * @param {object} params 查询参数 { PGM, SEARCH_INFO, DISPLAY_FIELDS }
   * @returns {Promise<object>} 响应数据 { code, message, data }
   */
  function getReport(module, params) {
    return post(module + '/getReport', params);
  }

  /**
   * 长连接（SSE）报表查询 — POST + ReadableStream 流式解析
   * 三步判别（API服务调用说明文档 9.3 实测）：
   *   1) res.ok === false → HTTP 错误（BOOK_NO 空 → 406，服务端兜底）
   *   2) Content-Type 含 application/json → 错误信封 JSON（20001/20004 认证失效）
   *   3) text/event-stream → 逐行解析 `data: {JSON}` 消息（跨 chunk 行缓冲）
   * 每条消息 { CODE, PERCENT, TITLE, ERR, DATA }：ERR 非空即抛错；
   * PERCENT 驱动进度回调（100.0 结束消息实测存在）；DATA.REPORT__TAB 累积数据行。
   * @param {string} path 相对 /SUNFUSION/API 的路径（如 "accGeneralLedger/GetReportStream"。
   *                      ⚠️ 原文档 URL 里的 /api/ 段就是 /SUNFUSION/API 本身，不要再带 api/ 前缀，
   *                      否则拼成 /API/api/... → 404。同 getReport 的历史教训）
   * @param {object} body 请求体
   * @param {object} callbacks { onProgress(percent, title), onData(data) }
   * @returns {Promise<Array>} 累积的 REPORT__TAB 行数组
   */
  function fetchStreamReport(path, body, callbacks) {
    callbacks = callbacks || {};
    var ctrl = new AbortController();
    var timer = setTimeout(function() { ctrl.abort(); }, 120000);
    var url = getBaseUrl() + '/' + path.replace(/^\/+/, '');
    var headers = { 'Content-Type': 'application/json' };
    if (typeof Auth !== 'undefined' && Auth.getToken()) {
      headers['Authorization'] = 'Bearer ' + Auth.getToken();
    }

    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      signal: ctrl.signal
    }).then(function(res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      var ctype = res.headers.get('content-type') || '';

      // ② 错误信封 JSON（非流）
      if (ctype.indexOf('application/json') !== -1) {
        return res.json().then(function(j) {
          if (typeof Auth !== 'undefined') Auth.handleAuthError(j);
          throw new Error(j.message || ('code ' + j.code));
        });
      }

      // ③ 正常 SSE 流：ReadableStream + TextDecoder 行缓冲
      var reader = res.body.getReader();
      var decoder = new TextDecoder('utf-8');
      var buffer = '';
      var rows = [];

      function handleLine(line) {
        if (line.indexOf('data: ') !== 0) return;
        var msg;
        try { msg = JSON.parse(line.slice(6)); } catch (e) { return; }
        if (msg.ERR) {
          throw new Error(msg.ERR);
        }
        if (typeof callbacks.onProgress === 'function') {
          callbacks.onProgress(msg.PERCENT || 0, msg.TITLE || '');
        }
        if (msg.DATA && Array.isArray(msg.DATA.REPORT__TAB)) {
          rows = rows.concat(msg.DATA.REPORT__TAB);
          if (typeof callbacks.onData === 'function') callbacks.onData(msg.DATA);
        }
      }

      function pump() {
        return reader.read().then(function(chunk) {
          if (chunk.done) {
            // 流结束：处理缓冲区内残留的最后一行
            if (buffer.trim()) {
              buffer.split('\n').forEach(handleLine);
            }
            return rows;
          }
          buffer += decoder.decode(chunk.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop();
          for (var i = 0; i < lines.length; i++) handleLine(lines[i]);
          return pump();
        });
      }
      return pump();
    }).catch(function(err) {
      if (err && err.name === 'AbortError') {
        throw new Error(I18n.t('查询超时（120秒），请稍后重试'));
      }
      throw err;
    }).finally(function() {
      clearTimeout(timer);
    });
  }

  /**
   * 验证服务器连接
   * @param {string} serverUrl 服务器地址
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  function validateServer(serverUrl) {
    var url = serverUrl.replace(/\/+$/, '') + '/user/login';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        COMPNO: 'AT01',
        USR: 'SAN',
        PWD: '',
        LANG_ID: (typeof I18n !== 'undefined' ? I18n.getLang() : 'zh-cn'),
        SYS_TYPE: 'ERP'
      })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.code === 0) {
        return { ok: true, message: I18n.t('服务器连接正常') };
      }
      // code 非 0 但有 code 字段 = API 收到了请求并返回 → 服务器是通的（只是测试账号不匹配）
      if (typeof data.code !== 'undefined') {
        return { ok: true, message: I18n.t('服务器可达 (API 响应正常)') };
      }
      return { ok: false, message: I18n.t('服务器响应格式异常') };
    })
    .catch(function(err) {
      return { ok: false, message: I18n.t('无法连接: {0}', err.message || I18n.t('网络错误')) };
    });
  }

  // ── Expose ───────────────────────────────────────

  return {
    getBaseUrl: getBaseUrl,
    fetch: fetchApi,
    post: post,
    getReport: getReport,
    fetchStreamReport: fetchStreamReport,
    validateServer: validateServer
  };

})();
