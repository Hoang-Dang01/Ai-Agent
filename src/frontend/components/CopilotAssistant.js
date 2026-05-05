import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

export class CopilotAssistant extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap&subset=vietnamese');

        :host {
          display: block;
          height: 100vh;
          width: 100vw;
          background-color: var(--bg-color, #0f172a);
          color: var(--text-main, #f8fafc);
          --bg-main: var(--bg-color, #0f172a);
          --glass-bg: var(--card-bg, rgba(255, 255, 255, 0.03));
          --glass-border: var(--card-border, rgba(255, 255, 255, 0.05));
          --glass-highlight: rgba(255, 255, 255, 0.1);
          --accent-primary: var(--accent-blue, #8b5cf6);
          --accent-secondary: var(--accent-blue, #3b82f6);
          --accent-glow: rgba(139, 92, 246, 0.5);
          --text-muted: var(--text-muted, #94a3b8);
          --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --sidebar-width: 280px;
          font-family: var(--font-primary, 'Inter', sans-serif);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.02em;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          font-kerning: normal;
          font-feature-settings: "liga" 1, "kern" 1;
          font-weight: 500;
          text-shadow: 0 0 0.4px rgba(0,0,0,0.12);
        }

        * { box-sizing: border-box; }

        /* Aura & Mesh Gradient Background */
        .aura-container {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        .aura-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.6;
          animation: float 20s infinite ease-in-out alternate, pulseOpacity 12s infinite alternate;
        }
        .blob-1 {
          top: -10%; left: -10%;
          width: 500px; height: 500px;
          background: rgba(var(--accent-rgb, 139, 92, 246), 0.35);
          animation-delay: 0s;
        }
        .blob-2 {
          bottom: -20%; right: -10%;
          width: 600px; height: 600px;
          background: rgba(var(--accent-rgb, 59, 130, 246), 0.35);
          animation-delay: -5s;
        }
        .blob-3 {
          top: 30%; left: 30%;
          width: 450px; height: 450px;
          background: rgba(var(--accent-rgb, 236, 72, 153), 0.25);
          animation-delay: -10s;
          animation: float 25s infinite ease-in-out alternate-reverse;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 50px) scale(1.1); }
        }
        @keyframes pulseOpacity {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }

        /* Layout */
        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          position: relative;
          z-index: 1;
        }

        /* Sidebar Glassmorphism */
        .chat-sidebar {
          width: var(--sidebar-width);
          background: rgba(10, 10, 12, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          z-index: 10;
          transition: var(--transition-smooth);
          flex-shrink: 0;
        }
        
        .chat-sidebar.hidden {
          width: 0;
          opacity: 0;
          pointer-events: none;
        }

        .sidebar-header {
          padding: 24px;
        }

        .new-chat-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          color: var(--text-main);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .new-chat-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .chat-history {
          flex: 1;
          padding: 0 16px;
          overflow-y: auto;
        }
        .history-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          padding-left: 8px;
        }
        .history-item {
          padding: 10px 14px;
          border-radius: 10px;
          color: var(--text-muted);
          font-size: 13.5px;
          cursor: pointer;
          transition: var(--transition-smooth);
          margin-bottom: 6px;
          border: 1px solid transparent;
        }
        .history-item:hover {
          background: rgba(255,255,255,0.03);
          color: var(--text-main);
        }
        .history-item.active {
          background: rgba(var(--accent-rgb, 139, 92, 246), 0.1);
          color: var(--text-main);
          border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.2);
          box-shadow: inset 0 0 15px rgba(var(--accent-rgb, 139, 92, 246), 0.05);
        }

        /* Main Chat Area */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Header Component - Glass */
        .chat-header {
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: absolute;
          top: 0; left: 0; width: 100%;
          z-index: 10;
          background: linear-gradient(to bottom, rgba(10,10,12,0.8) 0%, rgba(10,10,12,0) 100%);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn, .back-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
          backdrop-filter: blur(10px);
        }
        .back-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          font-family: inherit;
        }
        .icon-btn:hover, .back-btn:hover {
          background: rgba(255,255,255,0.08);
          color: var(--text-main);
          border-color: var(--glass-highlight);
          transform: translateY(-1px);
        }

        .header-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
        }
        
        #agent-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.5px;
        }

        /* User Profile in Header */
        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px 14px 6px 6px;
          border-radius: 24px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          transition: var(--transition-smooth);
        }
        .user-profile:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--glass-highlight);
        }
        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          color: white;
        }
        .user-name {
          font-size: 13px;
          font-weight: 500;
        }

        /* Message List */
        .message-list {
          flex: 1;
          overflow-y: auto;
          padding: 100px 40px 180px 40px; 
          display: flex;
          flex-direction: column;
          gap: 28px;
          scroll-behavior: smooth;
        }

        .message-row {
          display: flex;
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(15px);
        }
        
        @keyframes slideUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .message-row.user { justify-content: flex-end; }
        .message-row.bot { justify-content: flex-start; }

        .message {
          max-width: 85%;
          padding: 18px 24px;
          border-radius: 18px;
          line-height: 1.65;
          font-size: 16px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          text-shadow: 0 0 0.4px rgba(0,0,0,0.12);
        }

        .message.bot {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-main);
          border-top-left-radius: 6px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .message.user {
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          color: white;
          border-top-right-radius: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 4px 20px rgba(var(--accent-rgb, 139, 92, 246), 0.2);
        }

        /* Markdown Advanced Styling */
        .message code {
          font-family: 'JetBrains Mono', monospace;
          background: rgba(0,0,0,0.4);
          padding: 3px 6px;
          border-radius: 6px;
          font-size: 14px;
        }
        .message pre {
          background: #0f0f11;
          padding: 16px;
          border-radius: 12px;
          overflow-x: auto;
          border: 1px solid var(--glass-border);
          margin: 12px 0;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
        }
        .message pre code {
          background: transparent;
          padding: 0;
        }
        .message h1, .message h2, .message h3 {
          margin-top: 1.2em; margin-bottom: 0.6em; font-weight: 600; color: #fff;
        }
        .message h2 { border-bottom: 1px solid var(--glass-border); padding-bottom: 6px; }
        .message h3 { color: #a5b4fc; }
        .message p { margin: 0 0 1em 0; }
        .message p:last-child { margin-bottom: 0; }
        .message ul, .message ol { margin: 0 0 1em 0; padding-left: 24px; }
        .message table {
          width: 100%; border-collapse: collapse; margin: 1em 0;
          background: rgba(0,0,0,0.2); border-radius: 8px; overflow: hidden;
        }
        .message th, .message td {
          border: 1px solid var(--glass-border); padding: 10px 14px; text-align: left;
        }
        .message th { background: rgba(255,255,255,0.05); font-weight: 600; color: #a5b4fc; }
        .message blockquote {
          border-left: 4px solid var(--accent-primary);
          margin: 1em 0; padding: 10px 16px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 0 8px 8px 0; font-style: italic;
        }

        /* Skeleton Loading Enhanced */
        .skeleton {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
        }
        .skeleton-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent-secondary);
          animation: wave 1.5s infinite ease-in-out;
        }
        .skeleton-dot:nth-child(1) { animation-delay: 0s; }
        .skeleton-dot:nth-child(2) { animation-delay: 0.2s; }
        .skeleton-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes wave {
          0%, 100% { transform: translateY(0); opacity: 0.4;}
          50% { transform: translateY(-4px); opacity: 1;}
        }

        /* Input Box & Quick Actions */
        .input-container {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 960px;
          padding: 0 20px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quick-actions {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .quick-actions::-webkit-scrollbar { display: none; }
        
        .qa-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          padding: 10px 18px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: var(--transition-smooth);
        }
        .qa-btn:hover {
          background: rgba(var(--accent-rgb, 139, 92, 246), 0.15);
          border-color: rgba(var(--accent-rgb, 139, 92, 246), 0.3);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--accent-rgb, 139, 92, 246), 0.15);
        }

        .input-pill {
          background: rgba(15, 15, 18, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          display: flex;
          align-items: flex-end;
          padding: 14px 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          transition: var(--transition-smooth);
        }

        .input-pill:focus-within {
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(139, 92, 246, 0.2);
          background: rgba(15, 15, 18, 0.85);
        }

        .action-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: var(--transition-smooth);
          flex-shrink: 0;
        }
        .action-btn:hover {
          color: var(--text-main);
          background: rgba(255,255,255,0.08);
        }

        .input-pill textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-main);
          padding: 10px 16px;
          resize: none;
          font-family: inherit;
          font-size: 16px;
          line-height: 1.5;
          max-height: 200px;
          outline: none;
        }
        .input-pill textarea::placeholder {
          color: #64748b;
        }

        .send-btn {
          background: var(--accent-primary);
          color: white;
          border-radius: 50%;
        }
        .send-btn:hover:not(:disabled) {
          background: var(--accent-primary);
          box-shadow: 0 0 15px rgba(var(--accent-rgb, 139, 92, 246), 0.5);
        }
        .send-btn:disabled {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.2);
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Drag Overlay */
        .drag-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(27, 26, 25, 0.8);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: var(--transition-smooth);
        }
        .drag-overlay.active { opacity: 1; }
        .drag-content {
          border: 2px dashed var(--text-muted);
          border-radius: 12px;
          padding: 40px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
      </style>

      <!-- Mesh Gradient Background - Trả lại hiệu ứng Aura -->
      <div class="aura-container">
        <div class="aura-blob blob-1"></div>
        <div class="aura-blob blob-2"></div>
        <div class="aura-blob blob-3"></div>
      </div>
      <div class="drag-overlay" id="drag-overlay">
        <div class="drag-content">
          <h2>Thả tài liệu vào đây</h2>
        </div>
      </div>

      <div class="app-container">
        <!-- Sidebar -->
        <div class="chat-sidebar">
          <div class="sidebar-header">
            <button class="new-chat-btn">
              Cuộc trò chuyện mới
            </button>
          </div>
          <div class="chat-history">
            <div class="history-title">Gần đây</div>
            <div class="history-item">Giải thích về OOP</div>
            <div class="history-item active">Sửa lỗi React Hook</div>
          </div>
        </div>

        <!-- Main Area -->
        <div class="chat-main" id="chat-main-area">
          <!-- Header -->
          <div class="chat-header">
            <div class="header-left">
              <button class="icon-btn" id="toggle-sidebar" title="Ẩn/Hiện Sidebar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              </button>
              <button class="back-btn" id="back-btn">
                Quay lại Hub
              </button>
            </div>
            <div class="header-center">
              <h2 id="agent-title">Trợ Lý Học Tập</h2>
            </div>
            <!-- Avatar User -->
            <div class="user-profile">
              <div class="avatar">U</div>
              <span class="user-name">Người dùng</span>
            </div>
          </div>

          <!-- Messages -->
          <div class="message-list" id="message-container">
            <!-- Welcome message injected by JS -->
          </div>

          <!-- Input Box -->
          <div class="input-container">
            <!-- Quick Actions -->
            <div class="quick-actions" id="quick-actions">
              <button class="qa-btn">Tóm tắt lý thuyết</button>
              <button class="qa-btn">Giải thích lỗi code</button>
              <button class="qa-btn">Phân tích tài liệu này</button>
              <button class="qa-btn" id="generate-dataset-btn" style="background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc;">🛠️ Sinh Dữ Liệu Huấn Luyện</button>
            </div>
            
            <div class="input-pill">
              <input type="file" id="file-upload" style="display: none;" accept=".txt,.md,.pdf" />
              <button class="action-btn" id="attach-btn" title="Đính kèm tài liệu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <textarea id="chat-input" placeholder="Hỏi trợ lý hoặc ném code vào đây..." rows="1"></textarea>
              <button class="action-btn send-btn" id="send-btn" disabled>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    const textarea = this.shadowRoot.getElementById('chat-input');
    const sendBtn = this.shadowRoot.getElementById('send-btn');
    const msgContainer = this.shadowRoot.getElementById('message-container');
    const agentTitle = this.shadowRoot.getElementById('agent-title');
    const backBtn = this.shadowRoot.getElementById('back-btn');
    const toggleSidebarBtn = this.shadowRoot.getElementById('toggle-sidebar');
    const sidebar = this.shadowRoot.querySelector('.chat-sidebar');
    const qaBtns = this.shadowRoot.querySelectorAll('.qa-btn:not(#generate-dataset-btn)');
    const generateDatasetBtn = this.shadowRoot.getElementById('generate-dataset-btn');
    const attachBtn = this.shadowRoot.getElementById('attach-btn');
    const fileUpload = this.shadowRoot.getElementById('file-upload');
    const chatMainArea = this.shadowRoot.getElementById('chat-main-area');
    const dragOverlay = this.shadowRoot.getElementById('drag-overlay');
    
    // Biến lưu trữ file đang đính kèm
    let attachedFile = null;

    // Kiểm tra quyền Admin (Premium UI)
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role') || (username?.toLowerCase() === 'admin' ? 'admin' : 'student');
    if (role !== 'admin') {
      generateDatasetBtn.style.opacity = '0.5';
      generateDatasetBtn.style.cursor = 'not-allowed';
    }

    // Xử lý đính kèm file qua nút bấm
    attachBtn.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        attachedFile = e.target.files[0];
        textarea.value = `[Đã đính kèm file: ${attachedFile.name}]\n` + textarea.value;
        textarea.dispatchEvent(new Event('input'));
      }
    });

    // Xử lý nút Sinh dữ liệu huấn luyện
    generateDatasetBtn.addEventListener('click', async () => {
      if (role !== 'admin') {
        alert("Quyền hạn của bạn không cho phép! Tính năng này chỉ dành cho Admin.");
        return;
      }

      if (!attachedFile) {
        alert("Sếp cần đính kèm một file (.txt, .md, .pdf) trước khi chạy lệnh này!");
        return;
      }
      
      const formData = new FormData();
      formData.append('document', attachedFile);
      
      try {
        const token = localStorage.getItem('auth_token');
        textarea.value = "";
        
        // Hiện câu lệnh user
        addMessage(`*Yêu cầu sinh dữ liệu huấn luyện từ file: ${attachedFile.name}*`, 'user');
        
        const response = await fetch('/api/generate-synthetic', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        if (response.ok) {
          addMessage(result.reply, 'bot');
        } else {
          addMessage(`❌ Lỗi: ${result.error}`, 'bot');
        }
        
        // Reset file
        attachedFile = null;
        fileUpload.value = '';
        
      } catch (err) {
        console.error(err);
        addMessage(`❌ Lỗi kết nối mạng hoặc máy chủ không phản hồi.`, 'bot');
      }
    });

    // Toggle Sidebar Logic
    if (toggleSidebarBtn && sidebar) {
      toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
      });
    }

    // Drag & Drop UI Logic
    chatMainArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragOverlay.classList.add('active');
    });
    dragOverlay.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragOverlay.classList.remove('active');
    });
    dragOverlay.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragOverlay.classList.remove('active');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        
        const validExtensions = ['.txt', '.md', '.js', '.py', '.html', '.css', '.json', '.csv', '.java', '.cpp'];
        const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (isValid || file.type.startsWith('text/')) {
          try {
            attachedFile = file; // Lưu lại file object để dùng cho Upload
            
            const originalPlaceholder = textarea.placeholder;
            textarea.placeholder = `Đang đọc file ${file.name}...`;
            
            const text = await file.text();
            const fileExtension = file.name.split('.').pop();
            const formattedText = `\n\n\`\`\`${fileExtension}\n// File: ${file.name}\n${text}\n\`\`\`\n`;
            
            textarea.value += formattedText;
            textarea.placeholder = originalPlaceholder;
            
            const inputPill = this.shadowRoot.querySelector('.input-pill');
            inputPill.style.boxShadow = '0 0 25px rgba(139, 92, 246, 0.8)';
            setTimeout(() => { inputPill.style.boxShadow = ''; }, 1000);
            
            textarea.focus();
            textarea.dispatchEvent(new Event('input'));
          } catch (err) {
            console.error('Lỗi đọc file:', err);
            alert('Không thể đọc nội dung file này!');
          }
        } else {
          alert('Chỉ hỗ trợ kéo thả file văn bản/mã nguồn (.txt, .js, .py...)');
        }
      }
    });

    // Quick Actions Logic cho lần load đầu (nếu có)
    qaBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        textarea.value = btn.innerText.trim() + ": ";
        textarea.focus();
        textarea.dispatchEvent(new Event('input'));
      });
    });

    // Nút quay lại phát ra event cho index.html
    backBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('close-chat', { bubbles: true, composed: true }));
    });

    // Mặc định câu chào
    const showWelcomeMessage = (text) => {
      msgContainer.innerHTML = '';
      const row = document.createElement('div');
      row.className = 'message-row bot';
      row.innerHTML = `<div class="message bot">${text}</div>`;
      msgContainer.appendChild(row);
    };

    // Hàm load lịch sử từ Database
    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/chats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const historyData = await response.json();
        
        if (historyData && historyData.length > 0) {
          msgContainer.innerHTML = ''; // Xóa câu chào mặc định
          
          historyData.forEach(chat => {
            // Dựa vào schema của MySQL (sender = 'user' | 'bot', content = text)
            if (chat.sender === 'user') {
              addMessage(chat.content, 'user', true);
            } else if (chat.sender === 'bot') {
              addMessage(chat.content, 'bot', true);
            }
          });
        } else {
          showWelcomeMessage("Xin chào! Mình là Trợ Lý Học Tập. Hôm nay bạn cần mình giúp gì?");
        }
      } catch (error) {
        console.warn('Chưa thể kết nối tới API Lịch sử. Tải câu chào mặc định.', error);
        showWelcomeMessage("Xin chào! Mình là Trợ Lý Học Tập. Hôm nay bạn cần mình giúp gì?");
      }
    };

    // Lắng nghe sự kiện chuyển Agent từ Dashboard
    this.addEventListener('change-agent', (e) => {
      const { name, welcomeMsg } = e.detail;
      if (agentTitle) agentTitle.textContent = name;
      showWelcomeMessage(welcomeMsg);
      
      // Cập nhật Quick Actions theo từng Agent
      const quickActionsContainer = this.shadowRoot.getElementById('quick-actions');
      if (quickActionsContainer) {
        // Xóa các nút cũ (trừ nút Sinh Dữ Liệu)
        const oldBtns = quickActionsContainer.querySelectorAll('.qa-btn:not(#generate-dataset-btn)');
        oldBtns.forEach(btn => btn.remove());
        
        let actions = [];
        if (name.includes('RAG')) {
          actions = ['Giải thích thuật toán KNN', 'Cách dùng np.matmul', 'Tóm tắt lý thuyết ML'];
        } else if (name.includes('Feynman')) {
          actions = ['Tui sẽ giải thích Gradient Descent', 'Hãy đóng vai học sinh hỏi tui', 'Bắt lỗi tư duy của tui'];
        } else if (name.includes('Thử thách')) {
          actions = ['Cho bài tập Python (Dễ)', 'Thử thách Numpy (Khó)', 'Giải đố SQL'];
        } else {
          actions = ['Giải thích lỗi code', 'Review đoạn code này', 'Phân tích tài liệu'];
        }

        const datasetBtn = quickActionsContainer.querySelector('#generate-dataset-btn');
        actions.forEach(action => {
          const btn = document.createElement('button');
          btn.className = 'qa-btn';
          btn.innerText = action;
          btn.addEventListener('click', () => {
            const textarea = this.shadowRoot.getElementById('chat-input');
            textarea.value = btn.innerText.trim() + ": ";
            textarea.focus();
            textarea.dispatchEvent(new Event('input'));
          });
          quickActionsContainer.insertBefore(btn, datasetBtn);
        });
      }
    });

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
      if (textarea.value.trim() !== '') {
        sendBtn.removeAttribute('disabled');
      } else {
        sendBtn.setAttribute('disabled', 'true');
      }
    });

    const addMessage = (text, sender, isHistory = false) => {
      // Remove skeleton if exists
      const skeleton = this.shadowRoot.getElementById('skeleton-loader');
      if (skeleton) skeleton.remove();

      const row = document.createElement('div');
      row.className = 'message-row ' + sender;
      
      let formattedText = text;
      // Dùng Marked.js để biến đổi cú pháp Markdown thành HTML chuẩn
      try {
        formattedText = marked.parse(text);
      } catch (e) {
        // Fallback nếu lỗi
        formattedText = formattedText.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');
      }

      row.innerHTML = `<div class="message ${sender} markdown-body">${formattedText}</div>`;
      msgContainer.appendChild(row);
      
      // Chỉ scroll xuống nếu không phải đang load history (tránh giật màn hình)
      if (!isHistory) {
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }
    };

    // Khởi chạy load lịch sử khi web vừa lên
    loadChatHistory();
    // Cuộn xuống cuối sau khi load xong history
    setTimeout(() => { msgContainer.scrollTop = msgContainer.scrollHeight; }, 300);

    const addSkeleton = () => {
      const row = document.createElement('div');
      row.className = 'message-row bot';
      row.id = 'skeleton-loader';
      row.innerHTML = `
        <div class="message bot skeleton">
          <div class="skeleton-text">AI đang phân tích...</div>
          <div class="skeleton-dots">
            <div class="skeleton-dot"></div>
            <div class="skeleton-dot"></div>
            <div class="skeleton-dot"></div>
          </div>
        </div>
      `;
      msgContainer.appendChild(row);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    const sendMessage = () => {
      const text = textarea.value.trim();
      if (!text) return;
      
      addMessage(text, 'user');

      textarea.value = '';
      textarea.style.height = 'auto';
      sendBtn.setAttribute('disabled', 'true');
      
      addSkeleton();

      const agentName = agentTitle ? agentTitle.textContent : 'Giáo viên Code';

      fetch('/api/chat', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ 
              message: text,
              sessionId: 'user-session-123',
              agent: agentName
          })
      })
      .then(res => res.json())
      .then(data => {
          const reply = data.output || data.reply || data[0]?.output || JSON.stringify(data);
          addMessage(reply, 'bot');
      })
      .catch(err => {
          addMessage('Lỗi kết nối tới Backend. Vui lòng kiểm tra lại Node Server.\n\n Chi tiết lỗi: ' + err.message, 'bot');
      });
    };

    sendBtn.addEventListener('click', sendMessage);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

customElements.define('copilot-assistant', CopilotAssistant);
