/**
 * Button Component
 * Sinh Nút bấm (Button) bằng DOM manipulation.
 */
var UIButton = (function () {

  /**
   * Tạo Nút bấm mới
   * @param {Object} config - { id, text, icon, type, className, onClick, disabled, tooltip }
   */
  function create(config) {
    var btn = document.createElement('button');
    
    // Base class
    var typeClass = config.type ? 'btn-' + config.type : 'btn-primary';
    if (config.type === 'tool') typeClass = 'btn-tool'; // Special case for toolbar
    
    btn.className = 'btn ' + typeClass + (config.className ? ' ' + config.className : '');
    
    if (config.id) btn.id = config.id;
    if (config.disabled) btn.disabled = true;
    if (config.tooltip) btn.title = config.tooltip;

    // Build nội dung
    var innerHTML = '';
    if (config.icon) {
      innerHTML += '<span class="material-symbols-outlined">' + config.icon + '</span>';
    }
    if (config.text) {
      innerHTML += '<span>' + config.text + '</span>';
    }
    btn.innerHTML = innerHTML;

    // Gắn sự kiện
    if (typeof config.onClick === 'function') {
      btn.addEventListener('click', function(e) {
        if (!btn.disabled) {
          config.onClick(e);
        }
      });
    }

    return btn;
  }

  /**
   * Tạo Bar chứa danh sách các nút
   * @param {Array} buttonsConfig - Mảng config của các nút
   */
  function createBar(buttonsConfig) {
    var bar = document.createElement('div');
    bar.className = 'button-bar';

    buttonsConfig.forEach(function(cfg) {
      if (cfg === '|') {
        var div = document.createElement('div');
        div.className = 'divider';
        bar.appendChild(div);
      } else {
        bar.appendChild(create(cfg));
      }
    });

    return bar;
  }

  return {
    create: create,
    createBar: createBar
  };
})();
