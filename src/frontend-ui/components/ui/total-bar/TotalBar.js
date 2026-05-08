/**
 * Total Bar Component
 * Thanh tổng cộng ở cuối bảng / trang (Ví dụ: Tổng chi phí, Tổng doanh thu)
 */
var UITotalBar = (function () {

  /**
   * Sinh thanh TotalBar
   * @param {Object} config - { label, valueStr, className }
   */
  function create(config) {
    var bar = document.createElement('div');
    bar.className = 'total-bar ' + (config.className || '');
    
    var label = document.createElement('div');
    label.className = 'total-bar-label';
    label.innerText = config.label || 'Tổng cộng';

    var val = document.createElement('div');
    val.className = 'total-bar-value';
    val.innerText = config.valueStr || '0';

    bar.appendChild(label);
    bar.appendChild(val);

    return bar;
  }

  return {
    create: create
  };
})();
