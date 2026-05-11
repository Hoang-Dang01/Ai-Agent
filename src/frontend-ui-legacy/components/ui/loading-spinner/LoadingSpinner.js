/**
 * Loading Spinner Component
 * Hiện vòng xoay tải trang toàn màn hình
 */
var LoadingSpinner = (function () {
  var overlay = null;
  var textElement = null;

  function init() {
    if (document.getElementById('loading-spinner-overlay')) return;

    overlay = document.createElement('div');
    overlay.id = 'loading-spinner-overlay';
    overlay.className = 'loading-overlay';

    var spinner = document.createElement('div');
    spinner.className = 'spinner';

    textElement = document.createElement('div');
    textElement.className = 'loading-text';
    textElement.innerText = 'Đang tải dữ liệu...';

    overlay.appendChild(spinner);
    overlay.appendChild(textElement);
    document.body.appendChild(overlay);
  }

  function show(message) {
    if (!overlay) init();
    if (message) textElement.innerText = message;
    else textElement.innerText = 'Đang tải dữ liệu...';
    overlay.classList.add('active');
  }

  function hide() {
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  return {
    show: show,
    hide: hide
  };
})();
