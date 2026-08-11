/**
 * auth.js — 认证模块
 * 负责登录/登出/Token 管理/自动恢复会话
 * 依赖：无外部依赖，仅浏览器 localStorage + fetch
 */

var Auth = (function() {
  'use strict';

  var LS_KEY = 'sunlike_auth';

  // ── Private ──────────────────────────────────────

  var API_PATH = '/SUNFUSION/API';

  function getBaseUrl() {
    // 从同级模块获取（或降级读 localStorage）
    if (typeof Api !== 'undefined' && Api.getBaseUrl) {
      return Api.getBaseUrl();
    }
    try {
      var settings = JSON.parse(localStorage.getItem('sunlike_settings')) || {};
      var raw = (settings.serverUrl || 'http://localhost').replace(/\/+$/, '').replace(/\/SUNFUSION\/API$/i, '');
      return raw.replace(/\/+$/, '') + API_PATH;
    } catch(e) {
      return 'http://localhost' + API_PATH;
    }
  }

  function save(authData) {
    authData.LOGIN_TIME = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(authData));
  }

  // ── Public API ───────────────────────────────────

  /**
   * 登录
   * @param {string} compno 公司代码
   * @param {string} usr 用户代号
   * @param {string} pwd 密码
   * @returns {Promise<{success: boolean, error?: string, data?: object}>}
   */
  function login(compno, usr, pwd) {
    return fetch(getBaseUrl() + '/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        COMPNO: compno,
        USR: usr,
        PWD: pwd || '',
        LANG_ID: 'zh-cn',
        SYS_TYPE: 'ERP'
      })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.code === 0) {
        save({
          TOKEN: data.data.TOKEN,
          USR: data.data.USR,
          USR_NAME: data.data.USR_NAME || usr,
          COMPNO: compno,
          PWD: pwd || ''
        });
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || ('Login failed (code: ' + data.code + ')') };
      }
    })
    .catch(function(err) {
      return { success: false, error: '无法连接服务器: ' + (err.message || '网络错误') };
    });
  }

  /**
   * 登出 — 清除本地认证数据
   */
  function logout() {
    localStorage.removeItem(LS_KEY);
  }

  /**
   * 检查认证状态 — 向服务器验证 Token 是否仍有效
   * @returns {Promise<boolean>}
   */
  function checkAuth() {
    var auth = get();
    if (!auth || !auth.TOKEN) {
      return Promise.resolve(false);
    }
    return fetch(getBaseUrl() + '/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        COMPNO: auth.COMPNO || 'AT01',
        USR: auth.USR,
        PWD: '',
        LANG_ID: 'zh-cn',
        SYS_TYPE: 'ERP'
      })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.code === 0) {
        // 刷新 Token
        save({
          TOKEN: data.data.TOKEN,
          USR: data.data.USR,
          USR_NAME: data.data.USR_NAME || auth.USR,
          COMPNO: auth.COMPNO
        });
        return true;
      }
      logout();
      return false;
    })
    .catch(function() {
      // 网络错误时不清除 auth，允许离线使用已缓存的 Token
      return true;
    });
  }

  /**
   * 获取当前 Token
   * @returns {string|null}
   */
  function getToken() {
    var auth = get();
    return auth ? auth.TOKEN : null;
  }

  /**
   * 获取认证请求头
   * @returns {{Authorization: string, 'Content-Type': string}}
   */
  function getAuthHeaders() {
    return {
      'Authorization': 'Bearer ' + (getToken() || ''),
      'Content-Type': 'application/json'
    };
  }

  /**
   * 获取当前用户信息
   * @returns {{usr: string, usrName: string, compno: string}|null}
   */
  function getUser() {
    var auth = get();
    if (!auth) return null;
    return {
      usr: auth.USR,
      usrName: auth.USR_NAME,
      compno: auth.COMPNO
    };
  }

  /**
   * 获取上次登录凭据用于表单回填
   * 密码仅在非空时返回，避免填入空字符串覆盖用户输入
   * @returns {{compno: string, usr: string, pwd: string}}
   */
  function getLoginPrefill() {
    var auth = get();
    if (!auth) return { compno: '', usr: '', pwd: '' };
    var pwd = (auth.PWD && auth.PWD.trim()) ? auth.PWD : '';
    return {
      compno: auth.COMPNO || '',
      usr: auth.USR || '',
      pwd: pwd
    };
  }

  /**
   * 判断是否已登录（本地有 Token）
   * @returns {boolean}
   */
  function isLoggedIn() {
    return !!getToken();
  }

  /**
   * 检测是否为认证错误（Token 缺失/过期）
   * 如果是则自动清除 auth 并触发登出事件
   * @param {object} responseData API 返回的 JSON
   * @returns {boolean} true=已处理并触发登出
   */
  function handleAuthError(responseData) {
    if (responseData && (responseData.code === 20001 || responseData.code === 20004)) {
      logout();
      // 触发自定义事件，让 UI 层响应
      var event = new CustomEvent('auth:expired', { detail: responseData });
      window.dispatchEvent(event);
      return true;
    }
    return false;
  }

  // ── Private helpers ──────────────────────────────

  function get() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || null;
    } catch(e) { return null; }
  }

  // ── Expose ───────────────────────────────────────

  return {
    login: login,
    logout: logout,
    checkAuth: checkAuth,
    getToken: getToken,
    getAuthHeaders: getAuthHeaders,
    getUser: getUser,
    getLoginPrefill: getLoginPrefill,
    isLoggedIn: isLoggedIn,
    handleAuthError: handleAuthError
  };

})();
