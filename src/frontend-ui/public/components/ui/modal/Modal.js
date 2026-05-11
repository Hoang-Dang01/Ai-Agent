/**
 * Generic Modal Builder
 * Mở các Pop-up Window Nhập liệu / Báo cáo không cần code cứng HTML
 */
var UIModal = (function () {

  /**
   * Mở một form Modal bất kỳ
   * @param {Object} config - { id, title, width, content (Node/String), footer (Node), onClose }
   */
  function show(config) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    if (config.id) overlay.id = config.id;

    var contentWidth = config.width || '600px';

    var html = `
      <div class="modal" style="width: ${contentWidth};">
        <div class="modal-hdr">
          <h3>${config.title || 'Tiêu đề'}</h3>
          <button class="btn-icon btn-close-modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="ui-modal-body"></div>
        <div class="modal-actions"></div>
      </div>
    `;
    overlay.innerHTML = html;

    var bodyWrapper = overlay.querySelector('.ui-modal-body');
    if (typeof config.content === 'string') {
      bodyWrapper.innerHTML = config.content;
    } else if (config.content instanceof Node) {
      bodyWrapper.appendChild(config.content);
    }

    var footerWrapper = overlay.querySelector('.modal-actions');
    if (config.footer instanceof Node) {
      footerWrapper.appendChild(config.footer);
    } else {
      footerWrapper.style.display = 'none';
    }

    document.getElementById('modal-container').appendChild(overlay);

    function close() {
      overlay.remove();
      if (typeof config.onClose === 'function') config.onClose();
    }

    overlay.querySelector('.btn-close-modal').addEventListener('click', close);
    // Optional: close on click outside
    /* overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    }); */

    return {
      close: close,
      node: overlay
    };
  }

  return {
    show: show
  };
})();
