/**
 * Input Component
 * Sinh ra các ô nhập liệu (Text, Number, Date...) kèm Label bằng DOM Node chuẩn.
 * An toàn XSS, tiện lợi khi build Form hoàn toàn bằng JavaScript.
 */
var UIInput = (function () {

  /**
   * Sinh cấu trúc Label + DOM Input
   */
  function _createBaseWrapper(config, inputType) {
    var wrapper = document.createElement('div');
    wrapper.className = 'form-group ' + (config.className || '');

    if (config.label) {
      var lbl = document.createElement('label');
      lbl.innerText = config.label;
      if (config.required) {
        var req = document.createElement('span');
        req.innerText = ' *';
        req.style.color = 'var(--color-danger)';
        lbl.appendChild(req);
      }
      wrapper.appendChild(lbl);
    }

    var input = document.createElement('input');
    input.type = inputType;
    input.className = 'ui-input';
    if (config.id) input.id = config.id;
    if (config.name) input.name = config.name;
    if (config.placeholder) input.placeholder = config.placeholder;
    if (config.value !== undefined) input.value = config.value;
    if (config.disabled) input.disabled = true;
    if (config.readonly) input.readOnly = true;

    wrapper.appendChild(input);

    return { wrapper: wrapper, input: input };
  }

  /**
   * Ô nhập Text thông thường
   */
  function createText(config) {
    return _createBaseWrapper(config, 'text').wrapper;
  }

  /**
   * Ô nhập Số
   */
  function createNumber(config) {
    var obj = _createBaseWrapper(config, 'number');
    if (config.min !== undefined) obj.input.min = config.min;
    if (config.max !== undefined) obj.input.max = config.max;
    if (config.step !== undefined) obj.input.step = config.step;
    return obj.wrapper;
  }

  /**
   * Ô chọn Ngày
   */
  function createDate(config) {
    return _createBaseWrapper(config, 'date').wrapper;
  }

  return {
    createText: createText,
    createNumber: createNumber,
    createDate: createDate
  };
})();
