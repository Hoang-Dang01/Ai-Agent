/**
 * Context Menu Component
 * Bắt sự kiện Click Chuột Phải -> Hiện Menu thả xuống tùy chỉnh (Ví dụ: Tick/Bỏ Tick dòng, Đổi trạng thái)
 */
var UIContextMenu = (function () {
  
  var currentMenu = null;

  /**
   * Khởi tạo Menu 
   * @param {Event} e - Sự kiện chuột phải (Dùng để lấy toạ độ X, Y)
   * @param {Array} items - [{ label, icon, onClick }, '|' ]
   */
  function show(e, items) {
    e.preventDefault();
    hide();

    var menu = document.createElement('div');
    menu.className = 'ui-context-menu';
    
    // Position
    menu.style.top = e.pageY + 'px';
    menu.style.left = e.pageX + 'px';

    items.forEach(function(item) {
      if (item === '|') {
        var div = document.createElement('div');
        div.className = 'context-menu-divider';
        menu.appendChild(div);
      } else {
        var btn = document.createElement('div');
        btn.className = 'context-menu-item';
        
        var iconHtml = item.icon ? '<span class="material-symbols-outlined">' + item.icon + '</span>' : '';
        btn.innerHTML = iconHtml + '<span>' + item.label + '</span>';
        
        btn.onclick = function() {
          hide();
          if (typeof item.onClick === 'function') item.onClick();
        };

        menu.appendChild(btn);
      }
    });

    document.body.appendChild(menu);
    currentMenu = menu;

    // Nghe sự kiện click ngoài -> Đóng menu
    document.addEventListener('click', hideOnOutsideClick);
  }

  function hide() {
    if (currentMenu) {
      currentMenu.remove();
      currentMenu = null;
    }
  }

  function hideOnOutsideClick(e) {
    if (currentMenu && !currentMenu.contains(e.target)) {
      hide();
      document.removeEventListener('click', hideOnOutsideClick);
    }
  }

  return {
    show: show,
    hide: hide
  };
})();
