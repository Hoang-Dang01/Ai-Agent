/**
 * Sidebar Component
 * Cấu trúc thanh điều hướng bên trái cho AI Study Hub B2B
 */
var Sidebar = (function () {
  
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var html = `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="sidebar-header">
          <div style="display:flex; align-items:center;">
            <span class="material-symbols-outlined"
              style="margin-right:12px; font-size:32px; color:var(--color-primary)">local_mall</span>
            AI Study Hub B2B
          </div>
          <!-- Nút đóng Sidebar trên Mobile -->
          <button class="btn-close-sidebar" id="btn-close-sidebar">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        <nav class="sidebar-nav" id="sidebar-nav">
          
          <div class="nav-group-title">Nghiệp Vụ Bán Sỉ</div>
          <a href="#/dashboard" class="nav-item">
            <span class="material-symbols-outlined icon">shopping_cart_checkout</span>
            Tạo Đơn Hàng
          </a>
          <a href="#/orders" class="nav-item">
            <span class="material-symbols-outlined icon">receipt_long</span>
            Quản Lý Đơn Đồng Bộ
          </a>

          <div class="nav-group-title">Kho Hàng & Chính Sách</div>
          <a href="#/products" class="nav-item">
            <span class="material-symbols-outlined icon">inventory_2</span>
            Sản Phẩm & Tồn Kho
          </a>
          <a href="#/policy" class="nav-item">
            <span class="material-symbols-outlined icon">loyalty</span>
            Chiết Khấu & TLDL
          </a>
          
          <div class="nav-group-title">Hệ Thống</div>
          <a href="#/settings" class="nav-item">
            <span class="material-symbols-outlined icon">api</span>
            Cấu Hình API Local
          </a>
        </nav>
      </aside>
    `;
    container.innerHTML = html;
  }

  function attachEvents() {
    // Đóng mở sidebar mobile
    var btnClose = document.getElementById('btn-close-sidebar');
    var sidebar = document.getElementById('app-sidebar');
    var overlay = document.querySelector('.panel-overlay');
    if (btnClose && sidebar) {
      btnClose.addEventListener('click', function () {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
      });
    }

    // Highlight active link
    var links = document.querySelectorAll('.sidebar-nav .nav-item');
    links.forEach(link => {
      link.addEventListener('click', function() {
        links.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        // Auto close on mobile
        if(window.innerWidth <= 768 && sidebar) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        }
      });
    });

    // Auto highlight based on hash
    const currentHash = window.location.hash || '#/dashboard';
    const activeLink = document.querySelector(`.sidebar-nav .nav-item[href="${currentHash}"]`);
    if(activeLink) activeLink.classList.add('active');
  }

  return {
    render: render,
    attachEvents: attachEvents
  };
})();
