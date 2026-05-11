import React, { useState } from 'react';

export default function Minecraft() {
  const [bots, setBots] = useState([]);
  const [newBotUser, setNewBotUser] = useState('');
  const [newBotPass, setNewBotPass] = useState('');

  const handleAddBot = () => {
    if (newBotUser.trim()) {
      setBots([...bots, { username: newBotUser, status: 'connecting' }]);
      setNewBotUser('');
      setNewBotPass('');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 'calc(100vh - 80px)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gl-text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>TURING DRONE V9.0</h1>
          <p className="gl-text-muted" style={{ fontSize: '0.9rem' }}>Micro-Tactical Command Swarm Center | Industrial Grade</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>PING: 42ms</span>
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            UPLINK ACTIVE 🟢
          </span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(12, 1fr)', 
        gridTemplateRows: 'auto auto',
        gap: '24px',
        flex: 1
      }}>

        {/* 1. Roster Panel */}
        <div className="gl-card" style={{ gridColumn: 'span 4' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span>DANH SÁCH BOT (SWARM)</span>
            <button className="gl-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444' }}>NGẮT ALL</button>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <input 
              type="text" 
              className="gl-input" 
              placeholder="Tên đăng nhập (Ex: Drone-01)" 
              value={newBotUser}
              onChange={(e) => setNewBotUser(e.target.value)}
            />
            <input 
              type="password" 
              className="gl-input" 
              placeholder="Mật khẩu (Trống nếu offline)" 
              value={newBotPass}
              onChange={(e) => setNewBotPass(e.target.value)}
            />
            <button className="gl-btn-primary" onClick={handleAddBot}>+ THÊM BOT</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bots.length === 0 ? (
              <p className="gl-text-muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>Chưa có bot nào hoạt động</p>
            ) : (
              bots.map((bot, idx) => (
                <div key={idx} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{bot.username}</span>
                  <span style={{ color: '#f59e0b' }}>{bot.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Vitals Panel */}
        <div className="gl-card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>CHỈ SỐ SINH TỒN</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {/* HP */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 0 15px rgba(6,182,212,0.5)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#06b6d4' }}>20</span>
              </div>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem' }}>MÁU (100%)</div>
            </div>
            
            {/* Food */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 0 15px rgba(245,158,11,0.5)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>20</span>
              </div>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem' }}>THỨC ĂN (100%)</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="gl-text-muted">TPS MÁY CHỦ:</span> <span style={{ color: '#10b981' }}>20.0</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="gl-text-muted">NGƯỜI CHƠI (TAB):</span> <span style={{ color: '#3b82f6' }}>0</span></div>
          </div>
        </div>

        {/* 3. Telemetry Panel */}
        <div className="gl-card" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>GIÁM SÁT CHIẾN THUẬT</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>NGUY CƠ BỊ BAN (RISK)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>THẤP (SAFE)</div>
            </div>
            
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>THỜI GIAN ONLINE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#06b6d4' }}>00:00:00</div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>TÌNH TRẠNG CHUNG</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>ỔN ĐỊNH</div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <div className="gl-text-muted" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>ĐANG LÀM GÌ?</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>Chờ lệnh...</div>
            </div>
          </div>
        </div>

        {/* 4. Coordinates Control */}
        <div className="gl-card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>PHÂN CHIA TỌA ĐỘ</span>
            <label style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" /> ĐỒNG LOẠT
            </label>
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" className="gl-input" placeholder="X" style={{ padding: '8px' }} />
            <input type="number" className="gl-input" placeholder="Y" style={{ padding: '8px' }} />
            <input type="number" className="gl-input" placeholder="Z" style={{ padding: '8px' }} />
          </div>
          <button className="gl-btn-primary" style={{ marginTop: 'auto' }}>▶ THỰC THI</button>
        </div>

        {/* 5. Coordinates Display */}
        <div className="gl-card" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>VỊ TRÍ HIỆN TẠI</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="gl-text-muted">VĨ ĐỘ (X)</span> <span style={{ fontWeight: 'bold' }}>0.000</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="gl-text-muted">ĐỘ CAO (Y)</span> <span style={{ fontWeight: 'bold' }}>0.000</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="gl-text-muted">KINH ĐỘ (Z)</span> <span style={{ fontWeight: 'bold' }}>0.000</span></div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button className="gl-btn-secondary" style={{ flex: 1, padding: '8px' }}>XUẤT PHÁT</button>
            <button className="gl-btn-secondary" style={{ flex: 1, padding: '8px' }}>GỌI VỀ</button>
          </div>
        </div>

        {/* 6. Event Log */}
        <div className="gl-card" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>NHẬT KÝ & TRUNG TÂM LỆNH</h3>
          
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#10b981', overflowY: 'auto', minHeight: '120px' }}>
            <div>[SYSTEM] Uplink established...</div>
            <div>[SYSTEM] Waiting for command...</div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>&gt;_</span>
            <input type="text" className="gl-input" placeholder="Nhập lệnh..." style={{ flex: 1, padding: '12px' }} />
          </div>
        </div>

      </div>
    </div>
  );
}
