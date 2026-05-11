/**
 * Slider Component
 * Thanh kéo trượt chọn giá trị (Ví dụ: Khoảng giá, Phần trăm giảm giá)
 */
var UISlider = (function () {

  /**
   * Sinh thanh Slider
   * @param {Object} config - { min, max, value, step, onChange, formatValue }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-slider-container';

    var slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'ui-slider';
    slider.min = config.min || 0;
    slider.max = config.max || 100;
    slider.step = config.step || 1;
    slider.value = config.value || 0;

    var valDisplay = document.createElement('div');
    valDisplay.className = 'ui-slider-value';
    
    function updateDisplay(val) {
      if (typeof config.formatValue === 'function') {
        valDisplay.innerText = config.formatValue(val);
      } else {
        valDisplay.innerText = val;
      }
    }
    updateDisplay(slider.value);

    wrapper.appendChild(slider);
    wrapper.appendChild(valDisplay);

    slider.addEventListener('input', function(e) {
      updateDisplay(e.target.value);
    });

    if (typeof config.onChange === 'function') {
      slider.addEventListener('change', function(e) {
        config.onChange(e.target.value);
      });
    }

    return wrapper;
  }

  return {
    create: create
  };
})();
