/**
 * Popover Component
 * Một khung form nổi lên nhỏ gọn nằm cạnh Nút được bấm (Ví dụ: Form nhập nhanh số lượng)
 */
var UIPopover = (function () {
  
  var currentPopover = null;

  /**
   * Mở popover ngay dưới 1 trigger element
   * @param {Node} triggerNode - DOM Node vừa được click (hoặc hover)
   * @param {Object} config - { title, content (Node) }
   */
  function show(triggerNode, config) {
    hide(); // Đóng popover cũ nếu có

    var popover = document.createElement('div');
    popover.className = 'ui-popover';

    if (config.title) {
      var header = document.createElement('div');
      header.className = 'ui-popover-header';
      header.innerText = config.title;
      popover.appendChild(header);
    }

    var body = document.createElement('div');
    body.className = 'ui-popover-body';
    if (config.content instanceof Node) {
      body.appendChild(config.content);
    } else if (typeof config.content === 'string') {
      body.innerHTML = config.content;
    }
    popover.appendChild(body);

    document.body.appendChild(popover);

    // Tính toán position
    var rect = triggerNode.getBoundingClientRect();
    popover.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    // Căn giữa theo trigger
    var pWidth = popover.offsetWidth || 250;
    var left = rect.left + window.scrollX + (rect.width / 2) - (pWidth / 2);
    // Tránh tràn viền
    if (left < 10) left = 10;
    if (left + pWidth > window.innerWidth - 10) left = window.innerWidth - pWidth - 10;
    
    popover.style.left = left + 'px';

    // Show animation
    requestAnimationFrame(function() {
      popover.classList.add('show');
    });

    currentPopover = popover;

    // Click outside to hide
    setTimeout(function() { // Delay xíu để không bắt nhầm sự kiện click hiện tại
      document.addEventListener('click', hideOnOutsideClick);
    }, 10);
  }

  function hide() {
    if (currentPopover) {
      currentPopover.remove();
      currentPopover = null;
    }
  }

  function hideOnOutsideClick(e) {
    if (currentPopover && !currentPopover.contains(e.target)) {
      hide();
      document.removeEventListener('click', hideOnOutsideClick);
    }
  }

  return {
    show: show,
    hide: hide
  };
})();
