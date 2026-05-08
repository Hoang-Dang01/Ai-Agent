export class CopilotAssistant extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentThemeIndex = 0;
    this.themes = ['theme-darkblue', 'theme-ice', 'theme-copilot'];
    // Default theme right now is darkblue, so let's set it
    this.classList.add(this.themes[0]);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Roboto:wght@300;400;500;700&display=swap');

        /* Default is Dark Blue (#00AEEF) */
        :host {
          --bg-primary: #121212;
          --bg-secondary: #1E1E1E;
          --bg-glass: rgba(30, 30, 30, 0.6);
          --border-color: #2A2A2A;
          --text-primary: #FFFFFF;
          --text-secondary: #AAAAAA;
          --accent-color: #00AEEF;
          --accent-hover: #33BFFF;
          --glow-base: rgba(0, 174, 239, 0.2);
          --user-bubble-bg: #00AEEF;
          --user-bubble-text: #FFFFFF;
          --bot-bubble-bg: #1E1E1E;
          
          display: block;
          height: 100vh;
          width: 100vw;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          overflow: hidden;
          transition: background 0.5s ease;
        }

        /* Theme: Cold Ice (Navy + Cyan) */
        :host(.theme-ice) {
          --bg-primary: #0A1A2F;
          --bg-secondary: #10243D;
          --bg-glass: rgba(16, 36, 61, 0.4);
          --border-color: #1F3A55;
          --text-primary: #FFFFFF;
          --text-secondary: #B0C7D6;
          --accent-color: #00CFFF;
          --accent-hover: #33E1FF;
          --glow-base: rgba(0, 207, 255, 0.3);
          --user-bubble-bg: #00CFFF;
          --user-bubble-text: #0A1A2F;
          --bot-bubble-bg: #10243D;
        }

        /* Theme: Copilot Slate (Dark Gray + Light Gray Accent) */
        :host(.theme-copilot) {
          --bg-primary: #1a1a1c;
          --bg-secondary: #1e1e22;
          --bg-glass: rgba(255, 255, 255, 0.02);
          --border-color: #36363a;
          --text-primary: #ffffff;
          --text-secondary: #a3a3a3;
          --accent-color: #d4d4d8;
          --accent-hover: #ffffff;
          --glow-base: rgba(255, 255, 255, 0.15);
          --user-bubble-bg: #2b2b30;
          --user-bubble-text: #ffffff;
          --bot-bubble-bg: rgba(255, 255, 255, 0.04);
        }

        * { box-sizing: border-box; }

        .app-container {
          display: flex;
          height: 100%;
          width: 100%;
          position: relative;
        }

        .ambient-glow-1 {
          position: absolute;
          top: -100px;
          left: -100px;
          width: 500px;
          height: 500px;
          background: var(--glow-base);
          filter: blur(120px);
          pointer-events: none;
          transition: background 0.5s ease;
        }

        .ambient-glow-2 {
          position: absolute;
          bottom: -100px;
          right: -100px;
          width: 600px;
          height: 600px;
          background: var(--glow-base);
          filter: blur(140px);
          pointer-events: none;
          opacity: 0.6;
          transition: background 0.5s ease;
        }

        .sidebar {
          width: 80px;
          background: var(--bg-glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 0;
          border-right: 1px solid var(--border-color);
          justify-content: space-between;
          z-index: 10;
          transition: border-color 0.5s ease, background 0.5s ease;
        }

        .sidebar-top, .sidebar-bottom {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 12px;
          border-radius: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-btn svg { width: 24px; height: 24px; }
        .icon-btn:hover {
          background: var(--glow-base);
          color: var(--accent-hover);
          transform: scale(1.05);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 10;
        }

        .greeting-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.8s ease-out forwards;
        }

        .greeting-text {
          font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 52px;
          font-weight: 600;
          margin-bottom: 56px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          color: transparent;
          letter-spacing: -0.5px;
          transition: all 0.5s ease;
        }

        .input-capsule {
          width: 100%;
          max-width: 940px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 32px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .input-capsule.centered {
          margin-bottom: 40px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }

        .input-capsule:focus-within {
          border-color: var(--accent-color);
          box-shadow: 0 0 15px var(--glow-base), 0 16px 40px rgba(0,0,0,0.5);
        }

        .input-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .model-select {
          appearance: none;
          background: var(--bg-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 8px 18px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          outline: none;
        }
        .model-select:hover { border-color: var(--accent-color); }
        .model-select option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 18px;
          line-height: 1.6;
          resize: none;
          outline: none;
          padding: 6px 8px;
          max-height: 220px;
          overflow-y: auto;
          font-family: 'Inter', sans-serif;
        }
        textarea::placeholder { color: var(--text-secondary); }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        .send-btn {
          background: var(--accent-color);
          border-radius: 50%;
          width: 44px;
          height: 44px;
          padding: 0;
          display: none;
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: none;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .send-btn svg { width: 20px; height: 20px; stroke: var(--bg-primary); }
        .send-btn:hover { 
          background: var(--accent-hover); 
          transform: scale(1.1); 
          box-shadow: 0 0 15px var(--glow-base);
        }

        .suggestion-chips {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 940px;
          margin-top: 10px;
        }

        .chip {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 14px 24px;
          border-radius: 100px;
          font-size: 15px;
          font-family: inherit;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .chip:hover {
          color: var(--bg-primary);
          transform: translateY(-3px);
          border-color: var(--accent-color);
          background: var(--accent-color);
          box-shadow: 0 6px 15px var(--glow-base);
        }

        /* Nút Crawl TKB luôn mang bóng dáng của Gradient Web 3 */
        #crawl-btn { color: #34d399; }
        #crawl-btn:hover { color: #6ee7b7; background: rgba(52, 211, 153, 0.15); }

        .chat-view {
          flex: 1;
          display: none;
          flex-direction: column;
          height: 100%;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          align-items: center;
          scroll-behavior: smooth;
        }
        .messages::-webkit-scrollbar { width: 6px; }
        .messages::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

        .message-row {
          width: 100%;
          max-width: 940px;
          display: flex;
          opacity: 0;
          animation: slideUp 0.4s ease-out forwards;
        }
        .message-row.user { justify-content: flex-end; }
        .message-row.bot { justify-content: flex-start; }
        
        .message {
          max-width: 85%;
          padding: 20px 26px;
          border-radius: 20px;
          font-size: 16px;
          line-height: 1.6;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .message.user {
          background: var(--user-bubble-bg);
          color: var(--user-bubble-text);
          border-bottom-right-radius: 4px;
          font-weight: 500;
        }
        .message.bot {
          background: var(--bot-bubble-bg);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }

        .bottom-input-area {
          padding: 30px 40px 40px 40px;
          display: flex;
          justify-content: center;
          background: linear-gradient(0deg, var(--bg-primary) 50%, transparent 100%);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        /* Hiển thị Tên Theme đang dùng */
        .theme-toast {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-secondary);
          border: 1px solid var(--accent-color);
          color: var(--text-primary);
          padding: 10px 20px;
          border-radius: 20px;
          font-family: inherit;
          font-weight: 500;
          box-shadow: 0 5px 15px var(--glow-base);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
          z-index: 100;
        }
      </style>

      <div class="app-container">
        <div class="ambient-glow-1"></div>
        <div class="ambient-glow-2"></div>
        <div class="theme-toast" id="theme-toast">Đã đổi Giao diện</div>

        <div class="sidebar">
          <div class="sidebar-top">
            <button class="icon-btn" title="Trang chủ">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button class="icon-btn" title="Lịch sử">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
            <button class="icon-btn" title="Sổ tay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </button>
          </div>
          <div class="sidebar-bottom">
            <!-- Nút Theme Switcher -->
            <button class="icon-btn" id="theme-btn" title="Đổi giao diện (Màu sắc)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
            </button>
            <button class="icon-btn" title="Cài đặt">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>
        
        <div class="main-content">
          <div id="greeting-view" class="greeting-view">
            <h1 class="greeting-text">Này, hôm nay anh đang nghĩ gì thế?</h1>
            
            <div class="input-capsule centered" id="input-capsule">
              <textarea id="chat-input" placeholder="Nhắn tin cho Trợ Lý Học Tập..." rows="1"></textarea>
              <div class="input-row" style="margin-top: 14px; justify-content: space-between;">
                <div style="display:flex; gap:10px;">
                  <button class="icon-btn" title="Đính kèm tài liệu" style="padding: 8px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <select class="model-select" id="model-select" title="Chọn loại Trợ Lý (Model Core)">
                      <option value="google/gemini-1.5-pro">Gemini 1.5</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                      <option value="anthropic/claude-3-haiku">Claude</option>
                      <option value="x-ai/grok-2">Grok</option>
                  </select>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <button class="icon-btn" id="crawl-btn" title="Lấy dữ liệu TKB Web UTH" style="padding: 8px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  </button>
                  <button class="icon-btn" title="Microphone" style="padding: 8px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                  </button>
                  <button class="send-btn" id="send-btn" title="Gửi" style="display: none;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="suggestion-chips">
              <button class="chip">Phân tích tài liệu PDF</button>
              <button class="chip">Cào thời khóa biểu UTH</button>
              <button class="chip">Giải bài tập giải thuật</button>
              <button class="chip">Tạo lịch nhắc nhở deadline</button>
            </div>
          </div>

          <div id="chat-view" class="chat-view">
            <div class="messages" id="message-container"></div>
            <div class="bottom-input-area" id="bottom-input-area"></div>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    const textarea = this.shadowRoot.getElementById('chat-input');
    const sendBtn = this.shadowRoot.getElementById('send-btn');
    const crawlBtn = this.shadowRoot.getElementById('crawl-btn');
    const inputCapsule = this.shadowRoot.getElementById('input-capsule');
    const greetingView = this.shadowRoot.getElementById('greeting-view');
    const chatView = this.shadowRoot.getElementById('chat-view');
    const msgContainer = this.shadowRoot.getElementById('message-container');
    const bottomInputArea = this.shadowRoot.getElementById('bottom-input-area');

    // Theme Switcher Logic
    const themeBtn = this.shadowRoot.getElementById('theme-btn');
    const themeToast = this.shadowRoot.getElementById('theme-toast');
    const themeNames = ['Dark Blue', 'Cold Ice', 'Copilot Gray'];

    themeBtn.addEventListener('click', () => {
      this.classList.remove(this.themes[this.currentThemeIndex]);
      this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
      this.classList.add(this.themes[this.currentThemeIndex]);

      // Hiện Toast thông báo
      themeToast.innerText = `Đã đổi sang: ${themeNames[this.currentThemeIndex]}`;
      themeToast.style.opacity = '1';
      setTimeout(() => { themeToast.style.opacity = '0'; }, 2000);
    });

    let hasStarted = false;

    const transitionToChat = () => {
      if (!hasStarted) {
        hasStarted = true;
        greetingView.style.display = 'none';
        chatView.style.display = 'flex';
        bottomInputArea.appendChild(inputCapsule);
        inputCapsule.classList.remove('centered');
      }
    };

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 220) + 'px';
      
      if (textarea.value.trim().length > 0) {
        sendBtn.style.display = 'flex';
      } else {
        sendBtn.style.display = 'none';
      }
    });

    const addMessage = (text, sender) => {
      transitionToChat();
      const row = document.createElement('div');
      row.className = 'message-row ' + sender;
      
      const msg = document.createElement('div');
      msg.className = 'message ' + sender;
      msg.innerHTML = text.replace(/\\n/g, '<br>');
      
      row.appendChild(msg);
      msgContainer.appendChild(row);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    const sendMessage = () => {
      const text = textarea.value.trim();
      if (!text) return;
      const modelId = this.shadowRoot.getElementById('model-select').value;
      
      addMessage(text, 'user');
      textarea.value = '';
      textarea.style.height = 'auto';
      sendBtn.style.display = 'none';

      fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, modelId: modelId })
      })
      .then(res => res.json())
      .then(data => {
          if (data.error) throw new Error(data.error);
          addMessage(data.reply, 'bot');
      })
      .catch(err => {
          addMessage('🚫 Lỗi kết nối tới Backend: ' + err.message, 'bot');
      });
    };

    sendBtn.addEventListener('click', sendMessage);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    const chips = this.shadowRoot.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
         textarea.value = chip.innerText;
         textarea.dispatchEvent(new Event('input'));
         textarea.focus();
      });
    });

    crawlBtn.addEventListener('click', () => {
      addMessage('Đang mở trình duyệt ảo... Xin mời anh xử lý Captcha và nhấn nút đỏ Cào Dữ Liệu nhé! 🌐', 'bot');
      
      fetch('/api/crawl', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            addMessage(data.reply, 'bot');
        })
        .catch(err => {
            addMessage('🚫 Lỗi tải dữ liệu Web: ' + err.message, 'bot');
        });
    });
  }
}

customElements.define('copilot-assistant', CopilotAssistant);
