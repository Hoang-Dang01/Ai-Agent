import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [layoutStyle, setLayoutStyle] = useState(localStorage.getItem('layout') || 'cardnav');
  const navigate = useNavigate();

  useEffect(() => {
    const handleLayoutChange = () => {
      setLayoutStyle(localStorage.getItem('layout') || 'cardnav');
    };
    window.addEventListener('layoutChange', handleLayoutChange);
    return () => window.removeEventListener('layoutChange', handleLayoutChange);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className={`layout gl-container layout-${layoutStyle}`}>
      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : 'show'}`} id="app-sidebar">
        <div className="resizer" id="sidebar-resizer"></div>
        <div className="active-indicator" id="active-indicator"></div>

        <div className="logo magnetic" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 24px', cursor: 'pointer' }}>
          <i className="fa-solid fa-graduation-cap" style={{ fontSize: '1.8rem', color: 'var(--accent-blue)' }}></i>
          <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Study Hub</span>
        </div>
        
        <div className="sidebar-content">
          <div className="nav-card">
            <div className="nav-card-label">Menu Chính</div>
            <div className="nav-card-links">
              <NavLink to="/home" className={({isActive}) => `nav-item magnetic ${isActive ? 'active' : ''}`} data-tooltip="Trang chủ">
                <i className="fa-solid fa-house icon"></i> 
                <span className="nav-text">Trang chủ</span>
                <i className="fa-solid fa-arrow-up-right-from-square nav-card-link-icon"></i>
              </NavLink>
              <NavLink to="/chat" className={({isActive}) => `nav-item magnetic ${isActive ? 'active' : ''}`} data-tooltip="Phòng Chat AI">
                <i className="fa-solid fa-comments icon"></i> 
                <span className="nav-text">Phòng Chat AI</span>
                <i className="fa-solid fa-arrow-up-right-from-square nav-card-link-icon"></i>
              </NavLink>
              <NavLink to="/documents" className={({isActive}) => `nav-item magnetic ${isActive ? 'active' : ''}`} data-tooltip="Kiến thức RAG">
                <i className="fa-solid fa-folder-open icon"></i> 
                <span className="nav-text">Kiến thức RAG</span>
                <i className="fa-solid fa-arrow-up-right-from-square nav-card-link-icon"></i>
              </NavLink>
              <NavLink to="/minecraft" className={({isActive}) => `nav-item magnetic ${isActive ? 'active' : ''}`} data-tooltip="Minecraft Engine">
                <i className="fa-solid fa-gamepad icon"></i> 
                <span className="nav-text">Minecraft Engine</span>
                <i className="fa-solid fa-arrow-up-right-from-square nav-card-link-icon"></i>
              </NavLink>
            </div>
          </div>
          
          <div className="nav-card nav-card-bottom">
            <div className="nav-card-label">Hệ thống</div>
            <div className="nav-card-links">
              <NavLink to="/settings" className={({isActive}) => `nav-item magnetic ${isActive ? 'active' : ''}`} data-tooltip="Cài đặt">
                <i className="fa-solid fa-gear icon"></i> 
                <span className="nav-text">Cài đặt</span>
                <i className="fa-solid fa-arrow-up-right-from-square nav-card-link-icon"></i>
              </NavLink>
              <a className="nav-item magnetic" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} data-tooltip="Đăng xuất">
                <i className="fa-solid fa-right-from-bracket icon"></i> 
                <span className="nav-text" style={{ color: '#ef4444' }}>Đăng xuất</span>
                <i className="fa-solid fa-arrow-up-right-from-square nav-card-link-icon"></i>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="icon-btn menu-btn" onClick={toggleSidebar} title="Thu gọn / Mở rộng">
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="header-title" id="hdr-title" style={{ fontWeight: 600, fontSize: '1.25rem' }}>Dashboard</div>
          </div>
          <div className="header-actions">
            <div className="avatar" title="Tài khoản" id="header-avatar" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
              {localStorage.getItem('username')?.substring(0, 2).toUpperCase() || 'US'}
            </div>
          </div>
        </header>

        <main className="main" id="app-content" style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`sidebar-overlay ${isSidebarCollapsed ? '' : 'show'}`} id="mobile-overlay" onClick={() => setSidebarCollapsed(true)}></div>
    </div>
  );
}
