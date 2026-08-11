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
   * 调用报表查询 API
   * @param {string} module 模块名（如 "invso"）
   * @param {object} params 查询参数 { PGM, SEARCH_INFO, DISPLAY_FIELDS }
   * @returns {Promise<object>} 响应数据 { code, message, data }
   */
  function getReport(module, params) {
    return fetchApi(module + '/getReport', {
      method: 'POST',
      body: JSON.stringify(params)
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
        LANG_ID: 'zh-cn',
        SYS_TYPE: 'ERP'
      })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.code === 0) {
        return { ok: true, message: '服务器连接正常' };
      }
      return { ok: false, message: '服务器响应异常 (code: ' + data.code + ')' };
    })
    .catch(function(err) {
      return { ok: false, message: '无法连接: ' + (err.message || '网络错误') };
    });
  }

  // ── Expose ───────────────────────────────────────

  return {
    getBaseUrl: getBaseUrl,
    fetch: fetchApi,
    getReport: getReport,
    validateServer: validateServer
  };

})();
