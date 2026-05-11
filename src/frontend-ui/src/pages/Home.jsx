import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const agents = [
    {
      id: 'code-mentor',
      title: 'Giáo viên Code',
      icon: '💻',
      desc: 'Hỗ trợ review code, tìm bug và giải thích logic. Rèn luyện tư duy lập trình.',
      color: '#3b82f6',
    },
    {
      id: 'analyst',
      title: 'Chuyên gia Phân tích',
      icon: '📊',
      desc: 'Đọc hiểu tài liệu, tổng hợp kiến thức và tóm tắt cực nhanh.',
      color: '#8b5cf6',
    },
    {
      id: 'rag-engineer',
      title: 'Kỹ sư AI (RAG)',
      icon: '🧠',
      desc: 'Truy xuất kiến thức chuẩn mực từ Docs. Giải thích chi tiết thuật toán.',
      color: '#10b981',
    },
    {
      id: 'feynman',
      title: 'Chế độ Feynman',
      icon: '🗣️',
      desc: 'Đóng vai người phản biện để giúp bạn khắc sâu kiến thức hơn là học thuộc.',
      color: '#f59e0b',
    },
    {
      id: 'code-challenge',
      title: 'Thử thách Code',
      icon: '🎮',
      desc: 'Tạo các bài tập code tình huống thực tế theo cấp độ. Chạy thử trên hệ thống.',
      color: '#ec4899',
    }
  ];

  const handleAgentClick = (agentId) => {
    // Chuyển hướng sang trang Chat và truyền ID của agent
    navigate(`/chat?agent=${agentId}`);
  };

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="gl-text-gradient" style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>
          AI Study Hub
        </h1>
        <p className="gl-text-muted" style={{ fontSize: '1.2rem' }}>
          Chào mừng trở lại! Chọn một trợ lý AI chuyên biệt bên dưới để bắt đầu phiên học tập của bạn.
        </p>
      </div>

      {/* Agents Grid */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🤖 Đội ngũ Trợ lý (Agents)
        </h2>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '24px' 
        }}>
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className="gl-card gl-card-hover" 
              onClick={() => handleAgentClick(agent.id)}
              style={{ 
                width: 'calc(33.333% - 16px)', 
                minWidth: '320px',
                cursor: 'pointer', 
                display: 'flex', 
                gap: '20px', 
                alignItems: 'flex-start', 
                position: 'relative', 
                overflow: 'hidden' 
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: agent.color,
                boxShadow: `0 0 15px ${agent.color}`
              }}></div>
              
              <div style={{ 
                fontSize: '2.5rem', 
                background: 'rgba(255,255,255,0.05)', 
                padding: '16px', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {agent.icon}
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: agent.color }}>{agent.title}</h3>
                <p className="gl-text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{agent.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Base Upload */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🗄️ Dữ liệu Kiến thức (Knowledge Base)
        </h2>
        <div className="gl-card gl-card-hover" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed', cursor: 'pointer' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', color: '#06b6d4' }}>☁️</div>
          <h3 style={{ marginBottom: '8px' }}>Kéo thả tài liệu vào đây để nạp kiến thức cho AI</h3>
          <p className="gl-text-muted">Hỗ trợ định dạng .md, .pdf, .txt (Tối đa 10MB)</p>
          <button className="gl-btn-primary" style={{ marginTop: '24px' }}>
            📁 Chọn File
          </button>
        </div>
      </div>
    </div>
  );
}
