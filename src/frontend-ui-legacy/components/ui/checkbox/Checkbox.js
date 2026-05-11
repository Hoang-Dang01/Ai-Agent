/**
 * Custom Checkbox Component
 */
var UIControls = window.UIControls || {};

UIControls.createCheckbox = function(options) {
  var wrapper = document.createElement('label');
  wrapper.className = 'modern-checkbox-wrapper';

  var input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'modern-checkbox';
  if (options.checked) input.checked = true;

  input.addEventListener('change', function(e) {
    if (typeof options.onChange === 'function') {
      options.onChange(e.target.checked);
    }
  });

  var span = document.createElement('span');
  span.innerText = options.label || '';

  wrapper.appendChild(input);
  wrapper.appendChild(span);

  return wrapper;
};
