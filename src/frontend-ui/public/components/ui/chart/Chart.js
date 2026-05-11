/**
 * Chart.js Wrapper Component 
 * Cần nạp Chart.js CDN trong index.html
 */
var UIChart = (function () {

  /**
   * Sinh một khối thẻ chứa Chart
   * @param {Object} config - { title, type, data, options }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';

    if (config.title) {
      var header = document.createElement('div');
      header.className = 'chart-header';
      header.innerHTML = '<div class="chart-title">' + config.title + '</div>';
      wrapper.appendChild(header);
    }

    var chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    var canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    wrapper.appendChild(chartContainer);

    // Kích hoạt chart mượt sau khi insert vào DOM
    setTimeout(function() {
      if (typeof Chart !== 'undefined') {
        new Chart(canvas, {
          type: config.type || 'bar',
          data: config.data || {},
          options: Object.assign({
            responsive: true,
            maintainAspectRatio: false
          }, config.options || {})
        });
      }
    }, 100);

    return wrapper;
  }

  return {
    create: create
  };
})();
