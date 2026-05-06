/**
 * File Upload Component
 * Cung cấp vùng Drag & Drop để upload Ảnh Món Ăn, Logo...
 */
var UIFileUpload = (function () {

  /**
   * Sinh vùng Dropzone
   * @param {Object} config - { id, text, hint, accept, onChange }
   */
  function create(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ui-file-upload';

    var input = document.createElement('input');
    input.type = 'file';
    if (config.id) input.id = config.id;
    if (config.accept) input.accept = config.accept;

    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined ui-upload-icon';
    icon.innerText = 'cloud_upload';

    var text = document.createElement('div');
    text.className = 'ui-upload-text';
    text.innerText = config.text || 'Kéo thả file hoặc Click để tải lên';

    var hint = document.createElement('div');
    hint.className = 'ui-upload-hint';
    hint.innerText = config.hint || 'Hỗ trợ: JPG, PNG... Tối đa 5MB';

    wrapper.appendChild(input);
    wrapper.appendChild(icon);
    wrapper.appendChild(text);
    wrapper.appendChild(hint);

    // Xử lý sự kiện Drag & Drop css ảo diệu
    wrapper.addEventListener('dragover', function(e) {
      wrapper.classList.add('dragover');
    });

    wrapper.addEventListener('dragleave', function(e) {
      wrapper.classList.remove('dragover');
    });

    wrapper.addEventListener('drop', function(e) {
      wrapper.classList.remove('dragover');
    });

    if (typeof config.onChange === 'function') {
      input.addEventListener('change', function(e) {
        if (e.target.files && e.target.files.length > 0) {
          config.onChange(e.target.files[0]);
        }
      });
    }

    return wrapper;
  }

  return {
    create: create
  };
})();
