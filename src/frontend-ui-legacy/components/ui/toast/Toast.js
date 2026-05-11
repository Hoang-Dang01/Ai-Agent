/**
 * Toast Component
 * Khác với Alert (Gây gián đoạn), Toast hiện lên lặng lẽ ở góc và tự biến mất sau 3s
 */
var UIToast = (function () {

  // Auto-init container
  var container = null;
  document.addEventListener('DOMContentLoaded', function() {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  });

  /**
   * Gọi thông báo
   * @param {string} msg - Nội dung thông báo
   * @param {string} type - 'success', 'error', 'warning', 'info'
   */
  function show(msg, type) {
    if (!container) return; // Fallback

    var toast = document.createElement('div');
    toast.className = 'ui-toast ' + (type || 'success');

    var iconMap = {
      'success': 'check_circle',
      'error': 'error',
      'warning': 'warning',
      'info': 'info'
    };

    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined ui-toast-icon';
    icon.innerText = iconMap[type || 'success'] || 'info';

    var txt = document.createElement('div');
    txt.className = 'ui-toast-content';
    txt.innerText = msg;

    toast.appendChild(icon);
    toast.appendChild(txt);
    container.appendChild(toast);

    // Trigger animate in
    requestAnimationFrame(function() {
      toast.classList.add('show');
    });

    // Tự động tắt sau 3 giây
    setTimeout(function() {
      toast.classList.remove('show');
      // Đợi animation chạy xong rồi xóa node
      setTimeout(function() {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, 3000);
  }

  return {
    show: show
  };
})();
