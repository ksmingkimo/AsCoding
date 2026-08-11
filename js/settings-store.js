/**
 * settings-store.js — 设置数据管理模块
 * 负责：Deepseek API Key / 服务器地址的本地持久化读写
 * 依赖：无外部依赖，仅浏览器 localStorage
 */

var SettingsStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_settings';
  var API_PATH = '/SUNFUSION/API';

  /**
   * 获取所有设置
   * @returns {object} { apiKey, serverUrl }
   */
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  /**
   * 保存设置
   * @param {object} settings - { apiKey, serverUrl }
   */
  function saveSettings(settings) {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }

  /**
   * 获取 Deepseek API Key
   * @returns {string}
   */
  function getApiKey() {
    return getSettings().apiKey || '';
  }

  /**
   * 获取完整的 API 服务器 URL（自动追加 /SUNFUSION/API）
   * 向后兼容：如果用户之前存了完整 URL，自动清洗
   * @returns {string}
   */
  function getServerUrl() {
    var raw = (getSettings().serverUrl || 'http://localhost');
    // 向后兼容：去掉旧格式中的完整路径
    raw = raw.replace(/\/+$/, '').replace(/\/SUNFUSION\/API$/i, '');
    return raw.replace(/\/+$/, '') + API_PATH;
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    getSettings: getSettings,
    saveSettings: saveSettings,
    getApiKey: getApiKey,
    getServerUrl: getServerUrl
  };

})();
