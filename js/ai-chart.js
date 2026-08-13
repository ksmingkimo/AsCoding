/**
 * ai-chart.js — Chart.js 图表渲染模块
 * 负责：在消息气泡中渲染 Chart.js 图表（bar, line, pie, doughnut）
 * 依赖：Chart.js (CDN)、Utils
 */

var AIChart = (function() {
  'use strict';

  /** 默认图表配色（与设计系统一致的蓝色系） */
  var DEFAULT_COLORS = [
    '#1E40AF', '#3B82F6', '#D97706', '#16A34A',
    '#DC2626', '#8B5CF6', '#EC4899', '#06B6D4'
  ];

  /**
   * 在消息容器中找到并渲染指定 chart 的 canvas
   * @param {HTMLElement} msgDiv — 消息气泡的 DOM 元素
   * @param {object} chartConfig — Chart.js 配置对象
   * @param {number} index — chart 在本次回复中的序号
   */
  function render(msgDiv, chartConfig, index) {
    var containers = msgDiv.querySelectorAll('.chart-container canvas');
    var canvas = null;

    // 精确匹配：查找 id 以 "chart-{index}-" 开头且未渲染过的 canvas
    containers.forEach(function(c) {
      if (c.id.startsWith('chart-' + index + '-') && !c._chartRendered) {
        canvas = c;
        c._chartRendered = true;
      }
    });

    // 降级：按索引匹配
    if (!canvas && containers.length > index) {
      canvas = containers[index];
      if (canvas) canvas._chartRendered = true;
    }

    if (!canvas) return;

    try {
      // 填充默认值
      if (!chartConfig.type) { chartConfig.type = 'bar'; }
      if (!chartConfig.data) { chartConfig.data = { labels: [], datasets: [] }; }
      if (!chartConfig.options) { chartConfig.options = {}; }
      if (!chartConfig.options.plugins) { chartConfig.options.plugins = {}; }
      if (!chartConfig.options.plugins.legend) {
        chartConfig.options.plugins.legend = { position: 'bottom' };
      }

      // 自动配色
      if (chartConfig.data && chartConfig.data.datasets) {
        chartConfig.data.datasets.forEach(function(ds, i) {
          // 饼图：设置 backgroundColor 数组
          if (!ds.backgroundColor && chartConfig.type === 'pie') {
            ds.backgroundColor = DEFAULT_COLORS;
          }
          // 柱状图/折线图：设置单个颜色
          if (!ds.backgroundColor && !ds.borderColor) {
            ds.backgroundColor = DEFAULT_COLORS[i % DEFAULT_COLORS.length] + '20';
            ds.borderColor = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            ds.borderWidth = 2;
          }
        });
      }

      // 创建图表实例
      var chart = new Chart(canvas, chartConfig);

      // 全局追踪，供 sidebar resize 等场景使用
      if (!window._chartInstances) { window._chartInstances = []; }
      window._chartInstances.push(chart);

    } catch (e) {
      canvas.parentElement.innerHTML =
        '<p style="color:var(--color-error);font-size:var(--text-xs)">⚠ ' +
        I18n.t('图表渲染失败: {0}', Utils.escapeHtml(e.message)) + '</p>';
    }
  }

  /* ================================================================
     Public API
     ================================================================ */
  return {
    render: render
  };

})();
