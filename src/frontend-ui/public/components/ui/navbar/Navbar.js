/**
 * Navbar Component
 * Thanh điều hướng ngang trên cùng — thay thế sidebar dọc.
 * Có dropdown xổ xuống cho từng nhóm menu.
 * Hỗ trợ chuyển đổi layout ngang ↔ dọc (sidebar mode).
 */
var Navbar = (function () {

  /* ─────────────────────────────────────────
     Layout Mode (lưu vào localStorage)
  ───────────────────────────────────────── */
  var LAYOUT_KEY = 'app_layout_mode';
  var LAYOUT_HORIZONTAL = 'horizontal';
  var LAYOUT_VERTICAL   = 'vertical';

  function getLayout() {
    return localStorage.getItem(LAYOUT_KEY) || LAYOUT_HORIZONTAL;
  }

  function setLayout(mode) {
    localStorage.setItem(LAYOUT_KEY, mode);
  }

  /* Áp dụng layout lên <body> */
  function applyLayout(mode) {
    document.body.setAttribute('data-layout', mode);

    var $app = document.getElementById('app');
    if (!$app) return;

    if (mode === LAYOUT_VERTICAL) {
      $app.classList.add('layout-vertical');
      $app.classList.remove('layout-horizontal');
    } else {
      $app.classList.add('layout-horizontal');
      $app.classList.remove('layout-vertical');
    }
  }

  /* ─────────────────────────────────────────
     Cấu hình menu — groups + single links
  ───────────────────────────────────────── */
  var NAV_CONFIG = [
    // Single link: Tổng quan
    {
      type: 'link',
      href: '#/dashboard',
      icon: 'dashboard',
      label: 'Tổng quan'
    },

    // Dropdown: Quản lý tiệc
    {
      type: 'group',
      icon: 'celebration',
      label: 'Quản lý tiệc',
      items: [
        { href: '#/customers',   icon: 'manage_accounts', label: 'Hồ sơ khách hàng' },
        { href: '#/calendar',    icon: 'calendar_month',  label: 'Lịch tiệc' },
        { href: '#/hall-status', icon: 'meeting_room',    label: 'Trạng thái sảnh' },
        { href: '#/visitor',     icon: 'hail',            label: 'Khách tham quan' },
        { href: '#/booking',     icon: 'edit_document',   label: 'Biên nhận cọc' },
        { href: '#/contract',    icon: 'contract',        label: 'Hợp đồng tiệc' },
        { href: '#/checkout',    icon: 'receipt_long',    label: 'Quyết toán' }
      ]
    },

    // Dropdown: Hệ thống
    {
      type: 'group',
      icon: 'admin_panel_settings',
      label: 'Hệ thống',
      items: [
        { href: '#/users',       icon: 'group',                 label: 'Người dùng' },
        { href: '#/permissions', icon: 'admin_panel_settings',  label: 'Phân quyền' },
        { href: '#/menus',       icon: 'list_alt',              label: 'Danh mục Menu' },
        { href: '#/settings',    icon: 'settings_applications', label: 'Thiết lập chung' }
      ]
    },

    // Single link: Nhân sự
    {
      type: 'link',
      href: '#/staff',
      icon: 'badge',
      label: 'Nhân sự'
    },

    // Single link: Danh mục
    {
      type: 'link',
      href: '#/categories',
      icon: 'category',
      label: 'Danh mục'
    },

    // Dropdown: Báo cáo
    {
      type: 'group',
      icon: 'bar_chart',
      label: 'Báo cáo',
      items: [
        { href: '#/report-revenue', icon: 'bar_chart',    label: 'Doanh thu tiệc' },
        { href: '#/report-cost',    icon: 'price_change', label: 'Chi phí tiệc' },
        { href: '#/report-other',   icon: 'assessment',   label: 'Báo cáo khác' }
      ]
    },

    // Single: Components demo
    {
      type: 'link',
      href: '#/components-demo',
      icon: 'integration_instructions',
      label: 'UI Demo'
    }
  ];

  /* ─────────────────────────────────────────
     Build HTML helpers
  ───────────────────────────────────────── */
  function _buildMenuHTML() {
    return NAV_CONFIG.map(function (item) {
      if (item.type === 'link') {
        return `
          <a href="${item.href}" class="nav-link" data-href="${item.href}">
            <span class="material-symbols-outlined nav-icon">${item.icon}</span>
            ${item.label}
          </a>`;
      }

      var dropdownItems = item.items.map(function (di) {
        return `
          <a href="${di.href}" class="dropdown-item" data-href="${di.href}">
            <span class="material-symbols-outlined drop-icon">${di.icon}</span>
            ${di.label}
          </a>`;
      }).join('');

      return `
        <div class="nav-group" data-group>
          <button class="nav-group-btn">
            <span class="material-symbols-outlined nav-icon">${item.icon}</span>
            ${item.label}
            <span class="material-symbols-outlined chevron">expand_more</span>
          </button>
          <div class="nav-dropdown">
            ${dropdownItems}
          </div>
        </div>`;
    }).join('');
  }

  /* Sidebar nav items (for vertical mode) */
  function _buildSidebarNavHTML() {
    var html = '';
    NAV_CONFIG.forEach(function (item) {
      if (item.type === 'link') {
        html += `
          <a href="${item.href}" class="nav-item" data-href="${item.href}">
            <span class="material-symbols-outlined icon">${item.icon}</span>
            ${item.label}
          </a>`;
        return;
      }
      html += `<div class="nav-group-title">${item.label}</div>`;
      item.items.forEach(function (di) {
        html += `
          <a href="${di.href}" class="nav-item" data-href="${di.href}">
            <span class="material-symbols-outlined icon">${di.icon}</span>
            ${di.label}
          </a>`;
      });
    });
    return html;
  }

  /* Mobile drawer nav */
  function _buildMobileNavHTML() {
    var html = '';
    NAV_CONFIG.forEach(function (item) {
      if (item.type === 'link') {
        html += `
          <a href="${item.href}" class="mobile-nav-item" data-href="${item.href}">
            <span class="material-symbols-outlined">${item.icon}</span>
            ${item.label}
          </a>`;
        return;
      }
      html += `<div class="mobile-nav-divider"></div>
               <div class="mobile-nav-section-label">${item.label}</div>`;
      item.items.forEach(function (di) {
        html += `
          <a href="${di.href}" class="mobile-nav-item" data-href="${di.href}">
            <span class="material-symbols-outlined">${di.icon}</span>
            ${di.label}
          </a>`;
      });
    });
    return html;
  }

  /* ── Layout switcher buttons HTML ── */
  function _buildLayoutSwitcherHTML(currentLayout) {
    var isH = currentLayout === LAYOUT_HORIZONTAL;
    var isV = !isH;
    return `
      <div class="layout-switcher-row">
        <div class="layout-switcher-label">
          <span class="material-symbols-outlined" style="font-size:15px;opacity:.6">tune</span>
          Giao diện
        </div>
        <div class="layout-toggle-group">
          <button class="layout-toggle-btn ${isH ? 'active' : ''}" 
                  id="btn-layout-horizontal" 
                  title="Thanh ngang (Navbar)">
            <span class="material-symbols-outlined">view_agenda</span>
          </button>
          <button class="layout-toggle-btn ${isV ? 'active' : ''}" 
                  id="btn-layout-vertical" 
                  title="Thanh dọc (Sidebar)">
            <span class="material-symbols-outlined">view_sidebar</span>
          </button>
        </div>
      </div>`;
  }

  /* ─────────────────────────────────────────
     Render — Horizontal (Navbar) mode
  ───────────────────────────────────────── */
  function _renderHorizontal(container) {
    var layout = getLayout();
    var html = `
      <!-- ═══ TOP NAVBAR ═══ -->
      <nav class="app-navbar" id="app-navbar">

        <!-- Hamburger (mobile only) -->
        <button class="navbar-hamburger" id="navbar-hamburger">
          <span class="material-symbols-outlined">menu</span>
        </button>

        <!-- Brand / Logo -->
        <div class="navbar-brand" onclick="window.location.hash='#/'">
          <span class="material-symbols-outlined brand-icon">diamond</span>
          <span class="brand-text">PMQL Tiệc Cưới</span>
        </div>

        <!-- Desktop Menu -->
        <ul class="navbar-menu" id="navbar-menu">
          ${_buildMenuHTML()}
        </ul>

        <!-- Right Actions -->
        <div class="navbar-right">
          <div class="navbar-icon-btn" onclick="var isDark = document.body.classList.toggle('dark-theme'); localStorage.setItem('app_theme', isDark ? 'dark' : 'light'); this.querySelector('span').innerText = isDark ? 'light_mode' : 'dark_mode';" title="Chuyển giao diện">
            <span class="material-symbols-outlined" id="header-theme-icon-horizontal">dark_mode</span>
          </div>
          <div class="navbar-icon-btn" id="navbar-btn-notif" title="Thông báo">
            <span class="material-symbols-outlined">notifications</span>
            <span class="badge-dot"></span>
          </div>
          <div class="navbar-user" id="navbar-user">
            <div class="user-avatar-nav">
              <img src="https://ui-avatars.com/api/?name=Admin&background=3C50E0&color=fff" alt="User">
            </div>
            <div class="user-info-nav">
              <div class="user-name-nav">Admin</div>
              <div class="user-role-nav">Quản trị hệ thống</div>
            </div>
            <span class="material-symbols-outlined expand-icon">expand_more</span>

            <!-- User dropdown -->
            <div class="user-dropdown" id="user-dropdown">
              <div class="user-dropdown-header">
                <div class="user-dropdown-name">Admin</div>
                <div class="user-dropdown-role">Quản trị hệ thống</div>
              </div>

              <div class="user-dropdown-item">
                <span class="material-symbols-outlined">person</span>
                Hồ sơ cá nhân
              </div>
              <div class="user-dropdown-item" onclick="Alert.info('Thông báo', 'Bạn không có thông báo mới')">
                <span class="material-symbols-outlined">notifications</span>
                Thông báo
              </div>
              <a href="#/appearance" class="user-dropdown-item" style="text-decoration: none;">
                <span class="material-symbols-outlined">palette</span>
                Cài đặt Giao diện
              </a>

              <div class="dropdown-divider"></div>

              <div class="user-dropdown-item danger" onclick="ConfirmModal.show({ title: 'Đăng xuất', message: 'Bạn muốn đăng xuất khỏi hệ thống?', onConfirm: window.logoutApp })">
                <span class="material-symbols-outlined">logout</span>
                Đăng xuất
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- ═══ MOBILE DRAWER ═══ -->
      <div class="mobile-drawer-overlay" id="mobile-drawer-overlay"></div>
      <div class="mobile-drawer" id="mobile-drawer">
        <div class="mobile-drawer-header">
          <div class="mobile-drawer-brand">
            <span class="material-symbols-outlined brand-icon" style="margin-right:12px;font-size:28px;color:var(--color-primary)">diamond</span>
            Quản lý tiệc cưới
          </div>
          <button class="mobile-drawer-close" id="mobile-drawer-close">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <nav class="mobile-drawer-nav" id="mobile-drawer-nav">
          ${_buildMobileNavHTML()}
        </nav>
      </div>
    `;
    container.innerHTML = html;
    _attachHorizontalEvents();
  }

  /* ─────────────────────────────────────────
     Render — Vertical (Sidebar) mode
  ───────────────────────────────────────── */
  function _renderVertical(container) {
    var layout = getLayout();
    var html = `
      <!-- ════ VERTICAL LAYOUT: Sidebar + Header ════ -->
      <div class="vertical-layout-shell" id="vertical-layout-shell">

        <!-- Sidebar -->
        <aside class="app-sidebar" id="app-sidebar">
          <div class="sidebar-header">
            <div style="display:flex;align-items:center;font-size:18px;font-weight:700;">
              <span class="material-symbols-outlined"
                style="margin-right:12px;font-size:28px;color:var(--color-primary)">diamond</span>
              Quản lý tiệc cưới
            </div>
            <button class="btn-close-sidebar" id="btn-close-sidebar">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
          </div>
          <nav class="sidebar-nav" id="sidebar-nav">
            ${_buildSidebarNavHTML()}
          </nav>
        </aside>

        <!-- Sidebar overlay (mobile) -->
        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <!-- Main area (header + content) -->
        <div class="vertical-main" id="vertical-main">

          <!-- Vertical Header -->
          <header class="app-header" id="app-header">
            <div class="header-left">
              <button class="btn-hamburger" id="btn-hamburger">
                <span class="material-symbols-outlined">menu</span>
              </button>
              <div class="search-box">
                <span class="material-symbols-outlined">search</span>
                <input type="text" placeholder="Type to search...">
              </div>
            </div>

            <div class="header-right">
              <div class="navbar-icon-btn" onclick="var isDark = document.body.classList.toggle('dark-theme'); localStorage.setItem('app_theme', isDark ? 'dark' : 'light'); this.querySelector('span').innerText = isDark ? 'light_mode' : 'dark_mode';" title="Chuyển giao diện">
                <span class="material-symbols-outlined" id="header-theme-icon-vertical">dark_mode</span>
              </div>
              <div class="navbar-icon-btn" onclick="Alert.info('Thông báo', 'Bạn không có thông báo mới')">
                <span class="material-symbols-outlined">notifications</span>
                <span class="badge-dot"></span>
              </div>
              <div class="navbar-user" id="vertical-user-profile">
                <div class="user-avatar-nav">
                  <img src="https://ui-avatars.com/api/?name=Admin&background=3C50E0&color=fff" alt="User">
                </div>
                <div class="user-info-nav">
                  <div class="user-name-nav">Admin</div>
                  <div class="user-role-nav">Quản trị hệ thống</div>
                </div>
                <span class="material-symbols-outlined expand-icon">expand_more</span>

                <!-- Vertical user dropdown -->
                <div class="user-dropdown" id="vertical-user-dropdown">
                  <div class="user-dropdown-header">
                    <div class="user-dropdown-name">Admin</div>
                    <div class="user-dropdown-role">Quản trị hệ thống</div>
                  </div>
                  <div class="user-dropdown-item">
                    <span class="material-symbols-outlined">person</span>
                    Hồ sơ cá nhân
                  </div>
                  <a href="#/appearance" class="user-dropdown-item" style="text-decoration: none;">
                    <span class="material-symbols-outlined">palette</span>
                    Cài đặt Giao diện
                  </a>

                  <div class="dropdown-divider"></div>

                  <div class="user-dropdown-item danger" onclick="ConfirmModal.show({ title: 'Đăng xuất', message: 'Bạn muốn đăng xuất?', onConfirm: window.logoutApp })">
                    <span class="material-symbols-outlined">logout</span>
                    Đăng xuất
                  </div>
                </div>
              </div>
            </div>
          </header>

        </div><!-- /vertical-main -->
      </div><!-- /vertical-layout-shell -->
    `;
    container.innerHTML = html;
    _attachVerticalEvents();
  }

  /* ─────────────────────────────────────────
     Main render — dispatch by layout mode
  ───────────────────────────────────────── */
  function render(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var mode = getLayout();
    applyLayout(mode);
    _adjustAppLayout(mode);

    if (mode === LAYOUT_VERTICAL) {
      _renderVertical(container);
    } else {
      _renderHorizontal(container);
    }
  }

  /* Adjust #app and #app-content structure per mode */
  function _adjustAppLayout(mode) {
    var $app = document.getElementById('app');
    var $content = document.getElementById('app-content');
    if (!$app) return;

    // Reset any inline styles that might interfere
    $app.style.flexDirection = '';
  }

  /* ─────────────────────────────────────────
     Move #app-content into vertical-main
     (only for vertical mode)
  ───────────────────────────────────────── */
  function _moveContentToVerticalMain() {
    var $vertMain = document.getElementById('vertical-main');
    var $content  = document.getElementById('app-content');
    if ($vertMain && $content && !$vertMain.contains($content)) {
      $vertMain.appendChild($content);
    }
  }

  /* Move #app-content back to #app (horizontal mode) */
  function _moveContentToApp() {
    var $app     = document.getElementById('app');
    var $content = document.getElementById('app-content');
    if ($app && $content && $content.parentNode !== $app) {
      $app.appendChild($content);
    }
  }

  /* ─────────────────────────────────────────
     Events — Horizontal mode
  ───────────────────────────────────────── */
  function _attachHorizontalEvents() {
    var groups = document.querySelectorAll('.nav-group[data-group]');
    groups.forEach(function (group) {
      var btn = group.querySelector('.nav-group-btn');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = group.classList.contains('open');
          groups.forEach(function (g) { g.classList.remove('open'); });
          _closeUserDropdown();
          if (!isOpen) group.classList.add('open');
        });
      }
    });

    var $user = document.getElementById('navbar-user');
    if ($user) {
      $user.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = $user.classList.contains('open');
        groups.forEach(function (g) { g.classList.remove('open'); });
        if (isOpen) {
          _closeUserDropdown();
        } else {
          $user.classList.add('open');
        }
      });
    }

    var $notif = document.getElementById('navbar-btn-notif');
    if ($notif) {
      $notif.addEventListener('click', function () {
        Alert.info('Thông báo', 'Bạn không có thông báo mới');
      });
    }

    document.addEventListener('click', function () {
      groups.forEach(function (g) { g.classList.remove('open'); });
      _closeUserDropdown();
    });

    // Mobile drawer
    var $hamburger  = document.getElementById('navbar-hamburger');
    var $overlay    = document.getElementById('mobile-drawer-overlay');
    var $drawer     = document.getElementById('mobile-drawer');
    var $drawerClose = document.getElementById('mobile-drawer-close');

    function openDrawer()  { if ($drawer) $drawer.classList.add('open'); if ($overlay) $overlay.classList.add('active'); }
    function closeDrawer() { if ($drawer) $drawer.classList.remove('open'); if ($overlay) $overlay.classList.remove('active'); }

    if ($hamburger)   $hamburger.addEventListener('click', openDrawer);
    if ($drawerClose) $drawerClose.addEventListener('click', closeDrawer);
    if ($overlay)     $overlay.addEventListener('click', closeDrawer);

    document.querySelectorAll('.mobile-nav-item').forEach(function (item) {
      item.addEventListener('click', function () { setTimeout(closeDrawer, 150); });
    });

    _highlightActive();
    window.addEventListener('hashchange', _highlightActive);
  }

  /* ─────────────────────────────────────────
     Events — Vertical mode
  ───────────────────────────────────────── */
  function _attachVerticalEvents() {
    // Move content into vertical-main
    _moveContentToVerticalMain();

    // Sidebar toggle
    var $sidebar  = document.getElementById('app-sidebar');
    var $overlay  = document.getElementById('sidebar-overlay');
    var $btnOpen  = document.getElementById('btn-hamburger');
    var $btnClose = document.getElementById('btn-close-sidebar');

    function openSidebar()  { if ($sidebar) $sidebar.classList.add('open'); if ($overlay) $overlay.classList.add('active'); }
    function closeSidebar() { if ($sidebar) $sidebar.classList.remove('open'); if ($overlay) $overlay.classList.remove('active'); }

    if ($btnOpen)  $btnOpen.addEventListener('click', openSidebar);
    if ($btnClose) $btnClose.addEventListener('click', closeSidebar);
    if ($overlay)  $overlay.addEventListener('click', closeSidebar);

    // User dropdown in vertical header
    var $uProf = document.getElementById('vertical-user-profile');
    var $uDrop = document.getElementById('vertical-user-dropdown');
    if ($uProf && $uDrop) {
      $uProf.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = $uProf.classList.contains('open');
        $uProf.classList.toggle('open', !isOpen);
        
        // Also toggle 'open' on dropdown if needed by other CSS
        $uDrop.classList.toggle('open', !isOpen);

        var expandIcon = $uProf.querySelector('.expand-icon');
        if (expandIcon) {
          expandIcon.textContent = isOpen ? 'expand_more' : 'expand_less';
        }
      });
    }

    document.addEventListener('click', function () {
      if ($uDrop) $uDrop.classList.remove('open');
      if ($uProf) $uProf.classList.remove('open');
    });

    _highlightActive();
    window.addEventListener('hashchange', _highlightActive);
  }

  /* ─────────────────────────────────────────
     Helpers
  ───────────────────────────────────────── */
  function _closeUserDropdown() {
    var $user = document.getElementById('navbar-user');
    if ($user) $user.classList.remove('open');
  }

  function _highlightActive() {
    var hash = window.location.hash || '#/dashboard';

    // Horizontal: nav-links & dropdown items
    document.querySelectorAll('.navbar-menu .nav-link').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-href') === hash);
    });
    document.querySelectorAll('.navbar-menu .dropdown-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-href') === hash);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-href') === hash);
    });

    // Vertical: sidebar items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-href') === hash);
    });
  }

  return {
    render: render,
    getLayout: getLayout,
    setLayout: setLayout,
    applyLayout: applyLayout,
    moveContentToApp: _moveContentToApp,
    moveContentToVerticalMain: _moveContentToVerticalMain
  };
})();
