/**
 * settings-ui.js — 设置面板 UI 模块
 * 负责：设置模态弹窗的打开/关闭、AI 模型选择、API Key 验证、服务器连接验证
 * 依赖：SettingsStore, AIClient, Utils
 */

var SettingsUI = (function() {
  'use strict';

  var API_PATH = '/SUNFUSION/API';

  // ── Placeholder hints per provider ────────────────────

  var PLACEHOLDERS = {
    deepseek: 'sk-...',
    qwen: 'sk-...',
    gemini: 'AIza...',
    claude: 'sk-ant-...'
  };

  var LABELS = {
    deepseek: 'Deepseek API Key',
    qwen: 'QWen API Key',
    gemini: 'Gemini API Key',
    claude: 'Claude API Key'
  };

  /* ================================================================
     Open / Close
     ================================================================ */

  function openSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (!modal) return;

    var settings = SettingsStore.getSettings();
    var providerEl = document.getElementById('settingAIProvider');
    var apiKeyEl = document.getElementById('settingApiKey');
    var serverUrlEl = document.getElementById('settingServerUrl');

    // 当前选中模型
    var provider = SettingsStore.getAIProvider();
    if (providerEl) providerEl.value = provider;

    // 该模型的 API Key
    if (apiKeyEl) apiKeyEl.value = SettingsStore.getAIKey(provider) || '';

    // 更新 placeholder / label
    updateKeyHint(provider);

    // 服务器地址
    if (serverUrlEl) {
      var host = (settings.serverUrl || 'http://localhost')
        .replace(/\/+$/, '')
        .replace(/\/SUNFUSION\/API$/i, '');
      serverUrlEl.value = host;
    }

    // 清空验证结果
    var keyResult = document.getElementById('keyValidateResult');
    var serverResult = document.getElementById('serverValidateResult');
    if (keyResult) { keyResult.textContent = ''; keyResult.className = 'validation-result'; }
    if (serverResult) { serverResult.textContent = ''; serverResult.className = 'validation-result'; }

    modal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * 首次运行检查：如果没有配置 API Key，自动弹出设置面板
   */
  function checkFirstRun() {
    var key = SettingsStore.getAIKey();
    if (!key) {
      setTimeout(function() { openSettingsModal(); }, 800);
    }
  }

  /* ================================================================
     Model Switch
     ================================================================ */

  function onProviderChange() {
    var providerEl = document.getElementById('settingAIProvider');
    if (!providerEl) return;
    var provider = providerEl.value;

    // 切换 Key 输入框的值和 placeholder
    var apiKeyEl = document.getElementById('settingApiKey');
    if (apiKeyEl) apiKeyEl.value = SettingsStore.getAIKey(provider) || '';

    updateKeyHint(provider);

    // 清空验证结果
    var resultEl = document.getElementById('keyValidateResult');
    if (resultEl) { resultEl.textContent = ''; resultEl.className = 'validation-result'; }
  }

  function updateKeyHint(provider) {
    var apiKeyEl = document.getElementById('settingApiKey');
    var labelEl = document.getElementById('labelApiKey');
    if (apiKeyEl) apiKeyEl.placeholder = I18n.t(PLACEHOLDERS[provider] || '输入 API Key');
    if (labelEl) labelEl.textContent = I18n.t(LABELS[provider] || 'API Key');
  }

  /* ================================================================
     Validate API Key
     ================================================================ */

  function validateApiKey() {
    var providerEl = document.getElementById('settingAIProvider');
    var apiKeyEl = document.getElementById('settingApiKey');
    var resultEl = document.getElementById('keyValidateResult');
    if (!apiKeyEl || !resultEl) return;

    var provider = providerEl ? providerEl.value : 'deepseek';
    var key = apiKeyEl.value.trim();

    if (!key) {
      resultEl.textContent = '❌ ' + I18n.t('请输入 API Key');
      resultEl.className = 'validation-result error';
      return;
    }

    resultEl.textContent = '⏳ ' + I18n.t('正在验证...');
    resultEl.className = 'validation-result';

    AIClient.validateKey(provider, key, function(err, msg) {
      if (err) {
        resultEl.textContent = '❌ ' + Utils.escapeHtml(err);
        resultEl.className = 'validation-result error';
      } else {
        resultEl.textContent = '✅ ' + Utils.escapeHtml(msg);
        resultEl.className = 'validation-result success';
      }
    });
  }

  /* ================================================================
     Validate Server
     ================================================================ */

  function validateServer() {
    var serverUrlEl = document.getElementById('settingServerUrl');
    var resultEl = document.getElementById('serverValidateResult');
    if (!serverUrlEl || !resultEl) return;

    var host = serverUrlEl.value.trim();
    if (!host) {
      resultEl.textContent = '❌ ' + I18n.t('请输入服务器地址');
      resultEl.className = 'validation-result error';
      return;
    }

    resultEl.textContent = '⏳ ' + I18n.t('正在验证...');
    resultEl.className = 'validation-result';

    var fullUrl = host.replace(/\/+$/, '') + API_PATH + '/user/login';

    fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        COMPNO: (document.getElementById('compno') || {}).value || 'AT01',
        USR: (document.getElementById('usr') || {}).value || 'SAN',
        PWD: (document.getElementById('pwd') || {}).value || '',
        LANG_ID: (typeof I18n !== 'undefined' ? I18n.getLang() : 'zh-cn'),
        SYS_TYPE: 'ERP'
      })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.code === 0) {
        resultEl.textContent = '✅ ' + I18n.t('服务器连接正常 (用户: {0})',
          ((data.data && data.data.USR_NAME) || 'OK'));
        resultEl.className = 'validation-result success';
      } else if (typeof data.code !== 'undefined') {
        resultEl.textContent = '✅ ' + I18n.t('服务器可达 (API 响应正常)');
        resultEl.className = 'validation-result success';
      } else {
        resultEl.textContent = '⚠ ' + I18n.t('服务器响应异常 (code: {0}, {1})',
          data.code, data.message || I18n.t('未知'));
        resultEl.className = 'validation-result error';
      }
    })
    .catch(function(err) {
      resultEl.textContent = '❌ ' + I18n.t('无法连接到服务器: {0}', err.message || I18n.t('网络错误'));
      resultEl.className = 'validation-result error';
    });
  }

  /* ================================================================
     Save Settings
     ================================================================ */

  function saveSettings() {
    var providerEl = document.getElementById('settingAIProvider');
    var apiKeyEl = document.getElementById('settingApiKey');
    var serverUrlEl = document.getElementById('settingServerUrl');

    var provider = providerEl ? providerEl.value : 'deepseek';
    var key = apiKeyEl ? apiKeyEl.value.trim() : '';
    var host = serverUrlEl ? serverUrlEl.value.trim() : 'http://localhost';
    host = host.replace(/\/+$/, '').replace(/\/SUNFUSION\/API$/i, '');

    // 保存 provider + key + server（先清除所有旧 Key，只保留当前模型的）
    SettingsStore.clearAllAIKeys();
    var settings = SettingsStore.getSettings();
    settings.serverUrl = host;
    SettingsStore.saveSettings(settings);
    SettingsStore.saveAIProvider(provider);
    SettingsStore.saveAIKey(provider, key);

    closeSettingsModal();
    Utils.showToast(I18n.t('设置已保存'));
  }

  /* ================================================================
     Init
     ================================================================ */

  function init() {
    // 打开/关闭按钮
    var settingsBtn = document.getElementById('settingsBtn');
    var btnModalClose = document.getElementById('btnModalClose');
    var btnCancelSettings = document.getElementById('btnCancelSettings');
    var modal = document.getElementById('settingsModal');

    if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
    if (btnModalClose) btnModalClose.addEventListener('click', closeSettingsModal);
    if (btnCancelSettings) btnCancelSettings.addEventListener('click', closeSettingsModal);

    // 点击遮罩关闭
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) { closeSettingsModal(); }
      });
    }

    // 模型切换
    var providerEl = document.getElementById('settingAIProvider');
    if (providerEl) {
      providerEl.addEventListener('change', onProviderChange);
    }

    // 验证按钮
    var btnValidateKey = document.getElementById('btnValidateKey');
    var btnValidateServer = document.getElementById('btnValidateServer');
    if (btnValidateKey) btnValidateKey.addEventListener('click', validateApiKey);
    if (btnValidateServer) btnValidateServer.addEventListener('click', validateServer);

    // 保存按钮
    var btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveSettings);
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    open: openSettingsModal,
    close: closeSettingsModal,
    checkFirstRun: checkFirstRun,
    init: init
  };

})();
