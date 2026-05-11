import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [font, setFont] = useState(localStorage.getItem('font') || 'Inter');
  const [layout, setLayout] = useState(localStorage.getItem('layout') || 'cardnav');
  const [color, setColor] = useState(localStorage.getItem('color') || '#06b6d4');

  const colorOptions = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

  // Effect kích hoạt thay đổi CSS trực tiếp vào thẻ HTML gốc
  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('font', font);
    localStorage.setItem('color', color);
    localStorage.setItem('layout', layout);
    
    // Bắn sự kiện ra toàn hệ thống để Layout.jsx bắt được
    window.dispatchEvent(new Event('layoutChange'));

    // 1. Thay đổi Font chữ toàn trang (Đồng bộ cả Glassmorphism và Legacy CSS)
    const fontString = `'${font}', sans-serif`;
    document.body.style.setProperty('font-family', fontString, 'important');
    document.documentElement.style.setProperty('--font-family', fontString);
    document.documentElement.style.setProperty('--font-primary', fontString);

    // 2. Thay đổi màu nhấn (Accent Color)
    document.documentElement.style.setProperty('--gl-cyan', color);
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--accent-blue', color);

    // 3. Thay đổi chế độ Sáng/Tối
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.style.setProperty('--gl-bg-solid', '#f1f5f9');
      document.documentElement.style.setProperty('--gl-text-main', '#0f172a');
      document.documentElement.style.setProperty('--gl-bg', 'rgba(0, 0, 0, 0.05)');
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    } else {
      document.documentElement.style.setProperty('--gl-bg-solid', '#0f172a');
      document.documentElement.style.setProperty('--gl-text-main', '#f8fafc');
      document.documentElement.style.setProperty('--gl-bg', 'rgba(255, 255, 255, 0.05)');
      document.body.style.backgroundColor = '#1a222c';
      document.body.style.color = '#dee4ee';
    }
  }, [theme, font, color, layout]);

  return (
    <div style={{ padding: '40px 24px', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Header */}
      <div>
        <h2 className="gl-text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
          Cài Đặt Giao Diện
        </h2>
        <p className="gl-text-muted">Cá nhân hóa trải nghiệm sử dụng AI Study Hub của bạn.</p>
      </div>

      {/* Theme Settings */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Chế độ Hệ thống (Theme)</h3>
        <p className="gl-text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Chuyển đổi giao diện sáng tối phù hợp với môi trường làm việc.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          
          <div 
            className={`gl-card gl-card-hover`} 
            style={{ cursor: 'pointer', border: theme === 'light' ? `1px solid ${color}` : '' }}
            onClick={() => setTheme('light')}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>☀️</div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Chế độ Sáng</div>
            <div className="gl-text-muted" style={{ fontSize: '0.8rem' }}>Giao diện hiện đại, tươi sáng.</div>
          </div>

          <div 
            className={`gl-card gl-card-hover`} 
            style={{ cursor: 'pointer', border: theme === 'dark' ? `1px solid ${color}` : '' }}
            onClick={() => setTheme('dark')}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🌙</div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Chế độ Tối</div>
            <div className="gl-text-muted" style={{ fontSize: '0.8rem' }}>Giao diện hiện đại, nền tối dịu mắt.</div>
          </div>

        </div>
      </div>

      {/* Font Settings */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Phông chữ (Typography)</h3>
        <p className="gl-text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Tùy chỉnh phông chữ hiển thị cho toàn bộ hệ thống.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          
          {['Inter', 'Plus Jakarta Sans', 'JetBrains Mono'].map(f => (
            <div 
              key={f}
              className={`gl-card gl-card-hover`} 
              style={{ cursor: 'pointer', border: font === f ? `1px solid ${color}` : '' }}
              onClick={() => setFont(f)}
            >
              <div style={{ fontFamily: f, fontSize: '20px', marginBottom: '12px' }}>Aa Bb Cc</div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{f}</div>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem' }}>
                {f === 'Inter' ? 'Hiện đại, thân thiện' : f === 'JetBrains Mono' ? 'Code Focus' : 'Sang trọng, sắc nét'}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Layout Settings */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Kiểu Menu (Sidebar Layout)</h3>
        <p className="gl-text-muted" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>Chọn kiểu hiển thị thanh menu phù hợp với thói quen sử dụng.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          
          {[
            { id: 'cardnav', name: 'CardNav (Hiện đại)', desc: 'Thiết kế dạng thẻ nổi, trực quan.' },
            { id: 'classic', name: 'Classic (Truyền thống)', desc: 'Đơn giản, tối giản không gian.' },
            { id: 'mac-dock', name: 'MacOS Dock', desc: 'Hiệu ứng siêu thu phóng như Mac.' },
            { id: 'navbar', name: 'Thanh ngang (Navbar)', desc: 'Tối ưu không gian dọc.' },
          ].map(l => (
            <div 
              key={l.id}
              className={`gl-card gl-card-hover`} 
              style={{ cursor: 'pointer', border: layout === l.id ? `1px solid ${color}` : '' }}
              onClick={() => setLayout(l.id)}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{l.name}</div>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem' }}>{l.desc}</div>
            </div>
          ))}

        </div>
      </div>

      {/* Color Settings */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Màu sắc Chủ đạo (Color)</h3>
        <p className="gl-text-muted" style={{ fontSize: '0.9rem', marginBottom: '24px' }}>Thay đổi màu sắc nổi bật chính của ứng dụng.</p>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {colorOptions.map(c => (
            <div 
              key={c}
              onClick={() => setColor(c)}
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: c,
                cursor: 'pointer',
                border: color === c ? '3px solid white' : 'none',
                boxShadow: color === c ? `0 0 15px ${c}` : 'none',
                transition: 'all 0.2s'
              }}
            />
          ))}
          
          <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          
          <label style={{ 
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ opacity: 0, position: 'absolute', width: '40px', height: '40px', cursor: 'pointer' }} />
          </label>
        </div>
      </div>

    </div>
  );
}
