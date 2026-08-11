/**
 * settings-ui.js — 设置面板 UI 模块
 * 负责：设置模态弹窗的打开/关闭、Deepseek Key 验证、服务器连接验证
 * 依赖：SettingsStore, Utils
 */

var SettingsUI = (function() {
  'use strict';

  var API_PATH = '/SUNFUSION/API';

  /**
   * 打开设置面板（回填当前值、清空验证结果）
   */
  function openSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (!modal) return;

    var settings = SettingsStore.getSettings();
    var apiKeyEl = document.getElementById('settingApiKey');
    var serverUrlEl = document.getElementById('settingServerUrl');

    if (apiKeyEl) apiKeyEl.value = settings.apiKey || '';

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

  /**
   * 关闭设置面板
   */
  function closeSettingsModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * 首次运行检查：如果没有 API Key，自动弹出设置面板
   */
  function checkFirstRun() {
    var settings = SettingsStore.getSettings();
    if (!settings.apiKey) {
      setTimeout(function() { openSettingsModal(); }, 800);
    }
  }

  /**
   * 验证 Deepseek API Key
   */
  function validateApiKey() {
    var apiKey = document.getElementById('settingApiKey');
    var resultEl = document.getElementById('keyValidateResult');
    if (!apiKey || !resultEl) return;

    var key = apiKey.value.trim();
    if (!key) {
      resultEl.textContent = '❌ 请输入 API Key';
      resultEl.className = 'validation-result error';
      return;
    }

    resultEl.textContent = '⏳ 正在验证...';
    resultEl.className = 'validation-result';

    fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      })
    })
    .then(function(resp) {
      if (resp.ok) {
        resultEl.textContent = '✅ API Key 有效，连接成功';
        resultEl.className = 'validation-result success';
      } else if (resp.status === 401) {
        resultEl.textContent = '❌ API Key 无效，请检查后重试';
        resultEl.className = 'validation-result error';
      } else {
        resultEl.textContent = '❌ 服务器返回错误 (' + resp.status + ')';
        resultEl.className = 'validation-result error';
      }
    })
    .catch(function(err) {
      resultEl.textContent = '❌ 网络连接失败: ' + (err.message || '未知错误');
      resultEl.className = 'validation-result error';
    });
  }

  /**
   * 验证 ERP 服务器连接
   */
  function validateServer() {
    var serverUrlEl = document.getElementById('settingServerUrl');
    var resultEl = document.getElementById('serverValidateResult');
    if (!serverUrlEl || !resultEl) return;

    var host = serverUrlEl.value.trim();
    if (!host) {
      resultEl.textContent = '❌ 请输入服务器地址';
      resultEl.className = 'validation-result error';
      return;
    }

    resultEl.textContent = '⏳ 正在验证...';
    resultEl.className = 'validation-result';

    var fullUrl = host.replace(/\/+$/, '') + API_PATH + '/user/login';

    fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        COMPNO: (document.getElementById('compno') || {}).value || 'AT01',
        USR: (document.getElementById('usr') || {}).value || 'SAN',
        PWD: (document.getElementById('pwd') || {}).value || '',
        LANG_ID: 'zh-cn',
        SYS_TYPE: 'ERP'
      })
    })
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.code === 0) {
        resultEl.textContent = '✅ 服务器连接正常 (用户: ' +
          ((data.data && data.data.USR_NAME) || 'OK') + ')';
        resultEl.className = 'validation-result success';
      } else {
        resultEl.textContent = '⚠ 服务器响应异常 (code: ' + data.code + ', ' +
          (data.message || '未知') + ')';
        resultEl.className = 'validation-result error';
      }
    })
    .catch(function(err) {
      resultEl.textContent = '❌ 无法连接到服务器: ' + (err.message || '网络错误');
      resultEl.className = 'validation-result error';
    });
  }

  /**
   * 保存设置
   */
  function saveSettings() {
    var serverUrlEl = document.getElementById('settingServerUrl');
    var apiKeyEl = document.getElementById('settingApiKey');

    var host = serverUrlEl ? serverUrlEl.value.trim() : 'http://localhost';
    host = host.replace(/\/+$/, '').replace(/\/SUNFUSION\/API$/i, '');

    SettingsStore.saveSettings({
      apiKey: apiKeyEl ? apiKeyEl.value.trim() : '',
      serverUrl: host
    });

    closeSettingsModal();
    Utils.showToast('设置已保存');
  }

  /**
   * 绑定所有设置面板事件（在 DOM ready 后调用）
   */
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
