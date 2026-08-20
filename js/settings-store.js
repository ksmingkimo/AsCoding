/**
 * settings-store.js — 设置数据管理模块
 * 负责：AI 模型选择 + API Key + 服务器地址的本地持久化读写
 * 依赖：无外部依赖，仅浏览器 localStorage
 */

var SettingsStore = (function() {
  'use strict';

  var LS_KEY = 'sunlike_settings';
  var API_PATH = '/SUNFUSION/API';

  /**
   * 获取所有设置
   * @returns {object} { aiConfig: {provider, keys}, serverUrl }
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
   * @param {object} settings
   */
  function saveSettings(settings) {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }

  // ── AI Model & Key ──────────────────────────────────

  /**
   * 获取当前选中的 AI 模型
   * @returns {string} 'deepseek' | 'qwen' | 'gemini' | 'claude'
   */
  function getAIProvider() {
    var s = getSettings();
    return (s.aiConfig && s.aiConfig.provider) || 'deepseek';
  }

  /**
   * 保存当前选中的 AI 模型
   * @param {string} provider
   */
  function saveAIProvider(provider) {
    var s = getSettings();
    if (!s.aiConfig) s.aiConfig = { provider: 'deepseek', keys: {} };
    s.aiConfig.provider = provider;
    saveSettings(s);
  }

  /**
   * 获取指定模型的 API Key
   * @param {string} provider — 不传则返回当前激活模型的 Key
   * @returns {string}
   */
  function getAIKey(provider) {
    var s = getSettings();
    var p = provider || getAIProvider();
    if (s.aiConfig && s.aiConfig.keys && s.aiConfig.keys[p]) {
      return s.aiConfig.keys[p];
    }
    // 向后兼容：旧版单 Key 迁移到 Deepseek
    if (p === 'deepseek' && s.apiKey && !(s.aiConfig && s.aiConfig.keys && s.aiConfig.keys.deepseek)) {
      s.aiConfig = s.aiConfig || { provider: 'deepseek', keys: {} };
      s.aiConfig.keys = s.aiConfig.keys || {};
      s.aiConfig.keys.deepseek = s.apiKey;
      delete s.apiKey;
      saveSettings(s);
      return s.aiConfig.keys.deepseek;
    }
    return '';
  }

  /**
   * 保存指定模型的 API Key
   * @param {string} provider
   * @param {string} key
   */
  function saveAIKey(provider, key) {
    var s = getSettings();
    if (!s.aiConfig) s.aiConfig = { provider: 'deepseek', keys: {} };
    if (!s.aiConfig.keys) s.aiConfig.keys = {};
    s.aiConfig.keys[provider] = key || '';
    saveSettings(s);
  }

  /**
   * 清除所有已保存的 API Key
   */
  function clearAllAIKeys() {
    var s = getSettings();
    if (s.aiConfig) s.aiConfig.keys = {};
    saveSettings(s);
  }

  // ── Server ──────────────────────────────────────────

  /**
   * 获取完整的 API 服务器 URL（自动追加 /SUNFUSION/API）
   * 向后兼容：如果用户之前存了完整 URL，自动清洗
   * @returns {string}
   */
  function getServerUrl() {
    var raw = (getSettings().serverUrl || 'http://localhost');
    raw = raw.replace(/\/+$/, '').replace(/\/SUNFUSION\/API$/i, '');
    return raw.replace(/\/+$/, '') + API_PATH;
  }

  // ── 配置校验（登录前置检查） ─────────────────────────

  /**
   * 判断系统设置是否已正确配置（登录前调用）
   * 判定标准：设置已保存 且 服务器地址非空、格式合法（http:// 或 https:// 开头）
   * 其他机器浏览器 localStorage 为空 → false → 登录页拦截并引导去系统设置
   * @returns {boolean}
   */
  function isConfigured() {
    var s = getSettings();
    var url = String(s.serverUrl || '').trim();
    if (!url) return false;
    return /^https?:\/\//i.test(url);
  }

  // ── Legacy (kept for backward compat) ───────────────

  /**
   * @deprecated Use getAIKey() instead
   */
  function getApiKey() {
    return getAIKey('deepseek');
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    getSettings: getSettings,
    saveSettings: saveSettings,
    // AI
    getAIProvider: getAIProvider,
    saveAIProvider: saveAIProvider,
    getAIKey: getAIKey,
    saveAIKey: saveAIKey,
    clearAllAIKeys: clearAllAIKeys,
    // Server
    getServerUrl: getServerUrl,
    // 配置校验（登录前置检查）
    isConfigured: isConfigured,
    // Legacy
    getApiKey: getApiKey
  };

})();
