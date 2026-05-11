import React, { useState } from 'react';

export default function Documents() {
  const [documents, setDocuments] = useState([
    { id: 1, name: '01-coding-standards.mdc', type: 'MDC', size: '1.2 KB', status: 'Vectorized', date: '2026-05-11' },
    { id: 2, name: 'spec.md', type: 'Markdown', size: '3.4 KB', status: 'Vectorized', date: '2026-05-11' },
    { id: 3, name: 'GenerativeAICourse.pdf', type: 'PDF', size: '24.5 MB', status: 'Processing...', date: 'Hôm nay' },
  ]);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gl-text-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Quản Trị Tri Thức (RAG)</h1>
          <p className="gl-text-muted" style={{ fontSize: '0.9rem' }}>Nơi tiếp nạp và nhúng dữ liệu vào Vector Database cho hệ thống AI.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="gl-btn-secondary"><i className="fa-solid fa-arrows-rotate"></i> Đồng bộ DB</button>
          <button className="gl-btn-primary"><i className="fa-solid fa-plus"></i> Thêm Tài Liệu</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div className="gl-card gl-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.5rem', color: '#06b6d4' }}>📚</div>
          <div>
            <div className="gl-text-muted" style={{ fontSize: '0.9rem' }}>Tổng tài liệu</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>142</div>
          </div>
        </div>
        
        <div className="gl-card gl-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.5rem', color: '#8b5cf6' }}>🧩</div>
          <div>
            <div className="gl-text-muted" style={{ fontSize: '0.9rem' }}>Vector Chunks</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>12,450</div>
          </div>
        </div>

        <div className="gl-card gl-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.5rem', color: '#10b981' }}>⚡</div>
          <div>
            <div className="gl-text-muted" style={{ fontSize: '0.9rem' }}>Trạng thái DB</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>Khỏe mạnh</div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="gl-card gl-card-hover" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '40px 20px', cursor: 'pointer' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px', color: '#3b82f6' }}>📥</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Kéo thả File PDF, Markdown hoặc TXT vào đây</h3>
        <p className="gl-text-muted">Dữ liệu sẽ được tự động chia nhỏ (Chunking) và nhúng (Embedding) vào pgvector.</p>
      </div>

      {/* Document List */}
      <div className="gl-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Tài liệu đang lưu trữ</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px', color: 'var(--gl-text-muted)' }}>TÊN FILE</th>
                <th style={{ padding: '12px', color: 'var(--gl-text-muted)' }}>LOẠI</th>
                <th style={{ padding: '12px', color: 'var(--gl-text-muted)' }}>KÍCH THƯỚC</th>
                <th style={{ padding: '12px', color: 'var(--gl-text-muted)' }}>TRẠNG THÁI</th>
                <th style={{ padding: '12px', color: 'var(--gl-text-muted)' }}>NGÀY TẢI LÊN</th>
                <th style={{ padding: '12px', color: 'var(--gl-text-muted)' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{doc.name}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {doc.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--gl-text-muted)' }}>{doc.size}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ 
                      color: doc.status === 'Vectorized' ? '#10b981' : '#f59e0b',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      {doc.status === 'Vectorized' ? '🟢' : '🟡'} {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--gl-text-muted)' }}>{doc.date}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <button className="gl-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444' }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
