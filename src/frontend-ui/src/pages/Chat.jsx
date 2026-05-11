import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agent') || 'default';
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Xin chào! Tôi là Trợ lý AI (${agentId}). Hôm nay tôi có thể giúp gì cho bạn?` }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Gọi API thật từ Backend Kiến trúc đa tầng (Multilayered Architecture)
    const sendToBackend = async () => {
      try {
        const response = await axios.post('http://localhost:8000/api/v1/chat/ask', { message: input });
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.reply || `[Lỗi Logic Backend] Không nhận được phản hồi`,
          steps: response.data.steps,
          confidenceScore: response.data.confidence_score
        }]);
      } catch (error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `🚨 Mất kết nối tới Hệ Thống Cốt Lõi (Tầng API). Chi tiết: ${error.message}` 
        }]);
      }
    };
    
    sendToBackend();
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Info */}
      <div className="gl-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
        <div style={{ fontSize: '2rem' }}>🤖</div>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Phiên trò chuyện: {agentId}</h2>
          <p className="gl-text-muted" style={{ fontSize: '0.9rem' }}>Đang sẵn sàng nhận lệnh...</p>
        </div>
      </div>

      {/* Chat History Area */}
      <div className="gl-card" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        padding: '24px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '16px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, var(--gl-cyan), var(--gl-blue))' : 'rgba(255,255,255,0.05)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              lineHeight: '1.5'
            }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              
              {/* Hiển thị Mock Data Steps từ Backend Đa tầng */}
              {msg.steps && msg.steps.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gl-cyan)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-microchip"></i> Suy luận Đa đặc vụ (Độ tin cậy: {msg.confidenceScore * 100}%)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {msg.steps.map((step, i) => (
                      <div key={i} style={{ fontSize: '0.85rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--gl-purple)', fontWeight: 'bold', minWidth: '75px', paddingTop: '2px' }}>{step.agent_id}:</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{step.action}</div>
                          <div style={{ color: 'var(--gl-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>↳ {step.output}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          className="gl-input" 
          placeholder="Nhập yêu cầu của bạn vào đây..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: '16px' }}
        />
        <button type="submit" className="gl-btn-primary" style={{ padding: '0 32px' }}>
          <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i> Gửi
        </button>
      </form>
    </div>
  );
}
