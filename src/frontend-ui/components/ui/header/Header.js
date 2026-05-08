/**
 * Header Component
 * Cấu trúc thanh Header trên cùng
 */
var Header = (function () {
  
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var html = `
      <header class="app-header">
        <div class="header-left">
          <!-- Nút Hamburger Mở Sidebar (Chỉ hiện trên Mobile) -->
          <button class="btn-hamburger" id="btn-hamburger">
            <span class="material-symbols-outlined">menu</span>
          </button>

          <!-- Thanh tìm kiếm kiểu Tailadmin -->
          <div class="search-box">
            <span class="material-symbols-outlined">search</span>
            <input type="text" placeholder="Type to search...">
          </div>
        </div>

        <div class="header-right">
          <!-- Các nút Notification / Chat -->
          <div class="icon-btn" onclick="Alert.info('Thông báo', 'Bạn không có thông báo mới')">
            <span class="material-symbols-outlined" style="font-size:20px;">notifications</span>
            <span class="badge"></span>
          </div>


          <!-- Thông tin User -->
          <div class="user-profile">
            <div class="user-text">
              <div class="user-name">Admin</div>
              <div class="user-role">Quản trị hệ thống</div>
            </div>
            <div class="user-avatar">
              <img src="https://ui-avatars.com/api/?name=Admin&background=3C50E0&color=fff" alt="User">
            </div>
            <span class="material-symbols-outlined" style="color:var(--color-text-secondary)">expand_more</span>
          </div>
        </div>
      </header>
    `;

    container.innerHTML = html;

    _attachEvents();
  }

  function _attachEvents() {
    var $btnHamburger = document.getElementById('btn-hamburger');
    var $sidebar = document.getElementById('app-sidebar');
    var $sidebarOverlay = document.getElementById('sidebar-overlay');

    if ($btnHamburger) {
      $btnHamburger.addEventListener('click', function() {
        if ($sidebar) $sidebar.classList.add('open');
        if ($sidebarOverlay) $sidebarOverlay.classList.add('active');
      });
    }
  }

  return {
    render: render
  };
})();
