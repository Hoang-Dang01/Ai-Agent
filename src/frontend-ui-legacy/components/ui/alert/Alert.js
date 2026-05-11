/**
 * Alert (Toast) Component
 * Hiển thị thông báo trượt góc phải màn hình
 */
var Alert = (function () {
  var container = null;

  function init() {
    if (!document.getElementById('toast-container')) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    } else {
      container = document.getElementById('toast-container');
    }
  }

  /**
   * Hiển thị thông báo
   * @param {string} type - 'success', 'danger', 'warning', 'info'
   * @param {string} title - Tiêu đề
   * @param {string} message - Nội dung
   * @param {number} duration - Thời gian hiển thị (ms)
   */
  function show(type, title, message, duration) {
    if (!container) init();
    duration = duration || 3000;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;

    var iconMap = {
      'success': 'check_circle',
      'danger': 'error',
      'warning': 'warning',
      'info': 'info'
    };

    var html = `
      <div class="toast-icon">
        <span class="material-symbols-outlined">${iconMap[type] || 'info'}</span>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">
        <span class="material-symbols-outlined" style="font-size:18px;">close</span>
      </button>
    `;

    toast.innerHTML = html;
    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', function() {
      removeToast(toast);
    });

    // Trigger animation
    setTimeout(function() {
      toast.classList.add('show');
    }, 10);

    // Auto remove
    setTimeout(function() {
      removeToast(toast);
    }, duration);
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400); // Wait for transition
  }

  return {
    success: function(title, message, duration) { show('success', title, message, duration); },
    error: function(title, message, duration) { show('danger', title, message, duration); },
    warning: function(title, message, duration) { show('warning', title, message, duration); },
    info: function(title, message, duration) { show('info', title, message, duration); }
  };
})();
