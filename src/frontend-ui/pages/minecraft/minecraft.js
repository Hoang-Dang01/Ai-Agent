// Client-side Logic cho Minecraft Dashboard (TURING DRONE V9.0 CYBER)
const SECRET_KEY = "SANTINO_AI_AGENT_2026";
let mcSocket = null;

const rawSwarmState = {
    bots: {},
    activeBotId: null,
    broadcastMode: false,
    selectedGroup: new Set()
};

let uiUpdatePending = false;
let commandHistory = [];
let historyIndex = -1;

function initMinecraftDashboard() {
    console.log("Khởi tạo TURING DRONE V9.0 CYBER...");
    
    if (typeof io === 'undefined') {
        console.warn("[CẢNH BÁO] Thiếu thư viện socket.io client! Chạy chế độ Offline Simulator.");
    }

    let saveTimeout = null;
    window.swarmState = new Proxy(rawSwarmState, {
        set(target, property, value) {
            target[property] = value;
            scheduleUIRender();
            
            if (['bots', 'activeBotId', 'broadcastMode'].includes(property)) {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    try {
                        localStorage.setItem('turing-swarm-state', JSON.stringify({
                            bots: target.bots,
                            activeBotId: target.activeBotId,
                            broadcastMode: target.broadcastMode
                        }));
                    } catch(e) {}
                }, 1000);
            }
            return true;
        }
    });

    const defaultBots = {
        'Acetazolamid': { hp: 20, food: 20, x: 50.850, y: 84.0, z: -104.984, delta: 142.5, vel: 0.0, status: 'GREEN', ping: 42, tps: 20.0 },
        'vicentenguyen': { hp: 15, food: 18, x: 10.5, y: 60.0, z: 20.2, delta: 0.0, vel: 0.0, status: 'IDLE', ping: 55, tps: 20.0 },
        'nguthichetocc': { hp: 0, food: 0, x: 0, y: 0, z: 0, delta: 0, vel: 0, status: 'RED', ping: 999, tps: 0.0 }
    };

    const savedState = localStorage.getItem('turing-swarm-state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            window.swarmState.bots = parsed.bots || defaultBots;
            window.swarmState.activeBotId = parsed.activeBotId || 'Acetazolamid';
            window.swarmState.broadcastMode = parsed.broadcastMode || false;
            window.swarmState.selectedGroup = new Set([window.swarmState.activeBotId]);
        } catch(e) {
            window.swarmState.bots = defaultBots;
            window.swarmState.activeBotId = 'Acetazolamid';
        }
    } else {
        window.swarmState.bots = defaultBots;
        window.swarmState.activeBotId = 'Acetazolamid';
    }

    if (typeof io !== 'undefined' && !mcSocket) {
        mcSocket = io('http://localhost:3001', {
            auth: { token: SECRET_KEY }
        });

        mcSocket.on('connect', () => {
            const status = document.getElementById('mc-status');
            if (status) {
                status.innerHTML = 'UPLINK ACTIVE <span class="badge-dot"></span>';
                status.className = 'cyber-badge';
            }
            mcSocket.emit('request_snapshot');
        });

        mcSocket.on('disconnect', () => {
            const status = document.getElementById('mc-status');
            if (status) {
                status.innerHTML = 'CONNECTION LOST <span class="badge-dot"></span>';
                status.className = 'cyber-badge offline';
            }
        });

        mcSocket.on('bot_telemetry', (data) => {
            const bots = { ...window.swarmState.bots };
            if (!bots[data.id]) bots[data.id] = {};
            if (bots[data.id].delta !== undefined) bots[data.id].prevDelta = bots[data.id].delta;
            bots[data.id] = { ...bots[data.id], ...data };
            window.swarmState.bots = bots;
        });

        mcSocket.on('bot_vitals', (data) => {
            const bots = { ...window.swarmState.bots };
            if (!bots[window.swarmState.activeBotId]) return;
            bots[window.swarmState.activeBotId] = { 
                ...bots[window.swarmState.activeBotId], 
                hp: data.health, 
                food: data.food,
                x: data.position.x,
                y: data.position.y,
                z: data.position.z,
                playerCount: data.playerCount
            };
            window.swarmState.bots = bots;
        });

        mcSocket.on('bot_chat', (data) => appendLog(`[PLAYER] ${data.username}: ${data.message}`, 'log-player'));
        mcSocket.on('bot_log', (data) => {
            const cssClass = data.type === 'error' ? 'text-danger' : (data.type === 'warning' ? 'text-warning' : 'text-info');
            appendLog(`[SYSTEM] ${data.message}`, cssClass);
        });
        mcSocket.on('admin_alert', (data) => { appendLog(`[ADMIN] ${data.message}`, 'log-admin'); playSiren(); });
    }

    bindEvents();
    initGridStack();
    scheduleUIRender();
    appendLog('[HỆ THỐNG] Đã thiết lập liên kết không gian mạng. Đang giám sát Turing Guard...', 'log-system');
}

let gridStackInstance = null;

function initGridStack() {
    if (typeof GridStack === 'undefined') {
        console.warn("[CẢNH BÁO] GridStack.js chưa được tải!");
        return;
    }
    
    gridStackInstance = GridStack.init({
        column: 12,
        cellHeight: '80px',
        margin: 16,
        handle: '.panel-title',
        animate: true
    }, '#tactical-hud-grid');

    // Layout Persistence (LocalStorage Sync)
    const savedLayout = localStorage.getItem('turing-v10-layout');
    if (savedLayout) {
        try {
            gridStackInstance.load(JSON.parse(savedLayout));
        } catch (e) {
            console.error('Lỗi khi tải Layout:', e);
        }
    }

    gridStackInstance.on('change', function() {
        const layout = gridStackInstance.save();
        localStorage.setItem('turing-v10-layout', JSON.stringify(layout));
        // Force canvas redraw
        window.dispatchEvent(new Event('resize'));
    });
}



function scheduleUIRender() {
    if (!uiUpdatePending) {
        uiUpdatePending = true;
        requestAnimationFrame(() => {
            renderUI();
            uiUpdatePending = false;
        });
    }
}

function renderUI() {
    const state = window.swarmState;
    const activeId = state.activeBotId;
    const activeBot = state.bots[activeId];

    // 1. Roster
    const swarmList = document.querySelector('.swarm-list');
    if (swarmList) {
        swarmList.innerHTML = Object.entries(state.bots).map(([id, bot]) => `
            <div class="swarm-item ${id === activeId ? 'active' : ''} ${state.selectedGroup.has(id) ? 'selected' : ''}" data-id="${id}">
                <div class="bot-info">
                    <span class="bot-name"><i class="fa-solid fa-drone bot-icon"></i> ${id}</span>
                    <span class="bot-status-text ${bot.status === 'RED' || bot.status === 'OFFLINE' ? 'offline' : ''}">
                        <div class="bot-status-dot"></div> ${bot.status === 'GREEN' ? 'Active' : bot.status}
                    </span>
                </div>
                <div class="bot-right">
                    <div class="battery-bar"><div class="battery-fill" style="width: ${Math.max(10, (bot.hp/20)*100)}%"></div></div>
                    <i class="fa-solid fa-chart-simple waveform-icon ${bot.status === 'RED' || bot.status === 'OFFLINE' ? 'offline' : ''}"></i>
                </div>
            </div>
        `).join('');
    }

    // 2. Vitals Arc Gauges
    if (activeBot) {
        const hpLabel = document.getElementById('mc-health');
        if (hpLabel) hpLabel.textContent = Math.round(activeBot.hp);
        
        const foodLabel = document.getElementById('mc-food');
        if (foodLabel) foodLabel.textContent = Math.round(activeBot.food);
        
        // Arc Math (circle length for r=42 is 263.9, gap is 25% -> 197.9 active length)
        const maxArc = 197.9;
        const hpPercent = activeBot.hp / 20;
        const hpOffset = maxArc - (hpPercent * maxArc);
        const hpFill = document.querySelector('.hp-fill');
        if (hpFill) hpFill.style.strokeDashoffset = hpOffset;
        document.getElementById('mc-hp-percent').textContent = `${Math.round(hpPercent*100)}%`;
        
        // Critical HP Alert
        const hpGlow = document.querySelector('.hp-glow');
        if (hpGlow) {
            if (activeBot.hp < 5) hpGlow.classList.add('critical-alert');
            else hpGlow.classList.remove('critical-alert');
        }

        const foodPercent = activeBot.food / 20;
        const foodOffset = maxArc - (foodPercent * maxArc);
        const foodFill = document.querySelector('.food-fill');
        if (foodFill) foodFill.style.strokeDashoffset = foodOffset;
        document.getElementById('mc-food-percent').textContent = `${Math.round(foodPercent*100)}%`;

        // Tactical Metrics
        const riskEl = document.getElementById('mc-risk-level');
        if (riskEl) {
            if (activeBot.status === 'RED' || activeBot.status === 'OFFLINE') {
                riskEl.textContent = 'NGUY HIỂM (CRITICAL)';
                riskEl.className = 'stat-value text-danger';
            } else if (activeBot.hp < 10) {
                riskEl.textContent = 'CẢNH BÁO (WARNING)';
                riskEl.className = 'stat-value text-warning';
            } else {
                riskEl.textContent = 'THẤP (SAFE)';
                riskEl.className = 'stat-value text-success';
            }
        }

        const uptimeEl = document.getElementById('mc-uptime');
        if (uptimeEl) {
            // Fake uptime based on a generic calculation for now, or use server data if available
            uptimeEl.textContent = activeBot.uptimeStr || '00:15:30';
        }

        const overallEl = document.getElementById('mc-overall-status');
        if (overallEl) {
            overallEl.textContent = activeBot.status === 'GREEN' ? 'ỔN ĐỊNH (ACTIVE)' : (activeBot.status === 'IDLE' ? 'ĐANG CHỜ (IDLE)' : 'MẤT KẾT NỐI (OFFLINE)');
            overallEl.className = `stat-value ${activeBot.status === 'GREEN' ? 'text-success' : (activeBot.status === 'IDLE' ? 'text-info' : 'text-danger')}`;
        }

        const actionEl = document.getElementById('mc-current-action');
        if (actionEl) {
            actionEl.textContent = activeBot.currentAction || 'Đang rình mồi...';
        }
        
        // Vitals Ping & TPS
        const pingEl = document.getElementById('mc-vitals-ping');
        if (pingEl) pingEl.textContent = activeBot.ping || 0;
        
        const tpsEl = document.getElementById('mc-vitals-tps');
        if (tpsEl) tpsEl.textContent = (activeBot.tps || 20).toFixed(1);

        const playersEl = document.getElementById('mc-vitals-players');
        if (playersEl) playersEl.textContent = activeBot.playerCount || 0;

        // Coordinate Control Info
        const localX = document.getElementById('mc-local-x');
        if (localX) localX.textContent = activeBot.x ? activeBot.x.toFixed(4) : '0.0000';
        
        const localY = document.getElementById('mc-local-y');
        if (localY) localY.textContent = activeBot.y ? activeBot.y.toFixed(4) : '0.0000';
        
        const localZ = document.getElementById('mc-local-z');
        if (localZ) localZ.textContent = activeBot.z ? activeBot.z.toFixed(4) : '0.0000';
    }
}

function bindEvents() {
    // --- TACTICAL DEPLOYMENT MATRIX ---
    const btnToggleAdd = document.getElementById('btn-toggle-add');
    const formAdd = document.getElementById('bot-add-form');
    const inputUser = document.getElementById('input-bot-user');
    const inputPass = document.getElementById('input-bot-pass');
    const btnSubmitBot = document.getElementById('btn-submit-bot');

    // --- RESET LAYOUT ---
    const btnResetLayout = document.getElementById('btn-reset-layout');
    if (btnResetLayout) {
        btnResetLayout.addEventListener('click', () => {
            if (confirm("Xác nhận khôi phục bố cục mặc định?")) {
                localStorage.removeItem('turing-v10-layout');
                window.location.reload();
            }
        });
    }

    if (btnToggleAdd && formAdd) {
        let realPassword = '';

        btnToggleAdd.addEventListener('click', () => {
            const isActive = formAdd.classList.toggle('active');
            if (isActive) {
                document.body.classList.add('input-mode-active');
                setTimeout(() => inputUser.focus(), 300); // Wait for transition
            } else {
                document.body.classList.remove('input-mode-active');
            }
        });

        // Input Masking logic (Terminal style *)
        inputPass.addEventListener('input', (e) => {
            const val = inputPass.value;
            if (val.length < realPassword.length) {
                realPassword = realPassword.substring(0, val.length);
            } else if (val.length > realPassword.length) {
                realPassword += val.substring(realPassword.length);
            }
            inputPass.value = '*'.repeat(realPassword.length);
        });

        const deployNewBot = () => {
            const user = inputUser.value.trim();
            const pass = realPassword;
            if (!user) {
                appendLog('[SYSTEM] Lỗi: Tên Bot không được để trống!', 'log-admin');
                return;
            }

            appendLog(`[SYSTEM] Khởi động quy trình Deployment cho: ${user}`, 'log-info');
            btnSubmitBot.innerHTML = '<span class="pulse">DEPLOYING...</span>';
            btnSubmitBot.disabled = true;

            const resetForm = () => {
                btnSubmitBot.innerHTML = '+ THÊM';
                btnSubmitBot.disabled = false;
                formAdd.classList.remove('active');
                document.body.classList.remove('input-mode-active');
                inputUser.value = '';
                inputPass.value = '';
                realPassword = '';
            };

            let timeoutId;
            if (mcSocket) {
                mcSocket.emit('cmd_spawn_bot', { botName: user, password: pass });
                
                // Server ACK/NACK (Thành công / Thất bại)
                mcSocket.once('bot_spawn_success', (data) => {
                    if (timeoutId) clearTimeout(timeoutId);
                    appendLog(`[SYSTEM] ${data.botName || user} đã gia nhập bầy đàn thành công!`, 'log-success');
                    resetForm();
                });
                
                mcSocket.once('bot_spawn_error', (err) => {
                    if (timeoutId) clearTimeout(timeoutId);
                    appendLog(`[SYSTEM] Lỗi Deploy: ${err.message || 'Không xác định'}`, 'log-admin');
                    btnSubmitBot.innerHTML = '+ THÊM';
                    btnSubmitBot.disabled = false;
                });
            } else {
                // OFFLINE SIMULATOR
                setTimeout(() => {
                    const state = window.swarmState;
                    if (!state.bots[user]) {
                        state.bots[user] = { hp: 20, food: 20, x: 0, y: 0, z: 0, delta: 0, vel: 0, status: 'GREEN', ping: 25, tps: 20.0 };
                        window.swarmState.bots = { ...state.bots };
                        appendLog(`[SYSTEM] [OFFLINE SIM] ${user} đã gia nhập bầy đàn!`, 'log-success');
                    }
                    if (timeoutId) clearTimeout(timeoutId);
                    resetForm();
                }, 1000);
            }

            // Safety timeout (Chống Spam kẹt nút)
            timeoutId = setTimeout(() => {
                appendLog(`[SYSTEM] Timeout: Không nhận được phản hồi từ Server.`, 'log-admin');
                btnSubmitBot.innerHTML = '+ THÊM';
                btnSubmitBot.disabled = false;
            }, 10000);
        };

        btnSubmitBot.addEventListener('click', deployNewBot);

        // Hotkeys
        inputPass.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') deployNewBot();
        });
        inputUser.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') inputPass.focus();
        });
        
        // Escape để đóng Form nhanh
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && formAdd.classList.contains('active')) {
                formAdd.classList.remove('active');
                document.body.classList.remove('input-mode-active');
            }
        });
    }

    const list = document.querySelector('.swarm-list');
    if (list) {
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.swarm-item');
            if (!item) return;
            const id = item.dataset.id;
            if (e.shiftKey || e.ctrlKey) {
                const group = new Set(window.swarmState.selectedGroup);
                if (group.has(id)) group.delete(id); else group.add(id);
                window.swarmState.selectedGroup = group;
            } else {
                window.swarmState.activeBotId = id;
                window.swarmState.selectedGroup = new Set([id]);
            }
        });
    }

    const broadcastToggle = document.getElementById('broadcast-toggle');
    if (broadcastToggle) {
        broadcastToggle.addEventListener('change', (e) => {
            window.swarmState.broadcastMode = e.target.checked;
        });
    }

    const execBtn = document.querySelector('.btn-execute');
    if (execBtn) {
        execBtn.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.coord-inputs input');
            const x = inputs[0]?.value, y = inputs[1]?.value, z = inputs[2]?.value;
            if (!x || !y || !z) { appendLog('[SYSTEM] Lỗi: Tọa độ mục tiêu trống!', 'log-admin'); return; }

            const state = window.swarmState;
            const targetBots = state.broadcastMode ? Object.keys(state.bots) : [state.activeBotId];
            
            targetBots.forEach((botId) => {
                const staggerDelay = state.broadcastMode ? 500 + Math.random() * 1500 : 0;
                setTimeout(() => {
                    appendLog(`[SYSTEM] ${botId.substring(0,8)} -> Bay tới ${x}, ${y}, ${z}`, 'log-system');
                    mcSocket.emit('cmd_fly', { botId, x, y, z });
                    
                    // Simulate setting a new target delta for the bot
                    if (state.bots[botId]) {
                        state.bots[botId].delta = 100 + Math.random() * 200; // Fake distance
                        window.swarmState.bots = { ...state.bots };
                    }
                }, staggerDelay);
            });
        });
    }

    const btnDeploy = document.getElementById('btn-deploy');
    if (btnDeploy) {
        btnDeploy.addEventListener('click', () => {
            const state = window.swarmState;
            const targetBots = state.broadcastMode ? Object.keys(state.bots) : [state.activeBotId];
            targetBots.forEach((botId) => {
                appendLog(`[SYSTEM] ${botId} -> Lệnh XUẤT PHÁT đã được gửi`, 'log-system');
                mcSocket.emit('cmd_deploy', { botId });
                if (state.bots[botId]) state.bots[botId].status = 'GREEN';
            });
            // Trigger state update
            window.swarmState.bots = { ...state.bots };
        });
    }

    const btnRecall = document.getElementById('btn-recall');
    if (btnRecall) {
        btnRecall.addEventListener('click', () => {
            const state = window.swarmState;
            const targetBots = state.broadcastMode ? Object.keys(state.bots) : [state.activeBotId];
            targetBots.forEach((botId) => {
                appendLog(`[SYSTEM] ${botId} -> Lệnh GỌI VỀ căn cứ đã được gửi`, 'log-warning');
                mcSocket.emit('cmd_recall', { botId });
            });
        });
    }

    const panicBtn = document.querySelector('.btn-panic');
    if (panicBtn) {
        panicBtn.addEventListener('click', () => {
            appendLog('[SYSTEM] SIGKILL KÍCH HOẠT! ĐÓNG TOÀN BỘ KẾT NỐI!', 'log-admin');
            mcSocket.emit('cmd_panic');
            setTimeout(() => window.close(), 100);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panic = document.querySelector('.btn-panic');
            if (panic) {
                panic.classList.add('flash-active');
                appendLog('[SYSTEM] TÍN HIỆU ESC! CHUẨN BỊ SIGKILL...', 'log-admin');
                setTimeout(() => {
                    mcSocket.emit('cmd_panic');
                    setTimeout(() => window.close(), 100);
                }, 300);
            }
        }
    });

    const chatInput = document.getElementById('mc-chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                const cmd = e.target.value.trim();
                commandHistory.unshift(cmd);
                if (commandHistory.length > 50) commandHistory.pop();
                historyIndex = -1;

                if (cmd.startsWith('/')) { mcSocket.emit('cmd_server', cmd); appendLog(`[HỆ THỐNG] Đã gửi lệnh tới máy chủ.`, 'log-system'); }
                else if (cmd.startsWith('.')) { mcSocket.emit('cmd_internal', cmd); appendLog(`[THÔNG TIN] Lệnh nội bộ: ${cmd}`, 'log-info'); }
                else { mcSocket.emit('cmd_chat', cmd); appendLog(`[THÔNG TIN] ${cmd}`, 'log-info'); }
                
                e.target.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault(); if (historyIndex < commandHistory.length - 1) e.target.value = commandHistory[++historyIndex];
            } else if (e.key === 'ArrowDown') {
                e.preventDefault(); if (historyIndex > 0) e.target.value = commandHistory[--historyIndex];
                else if (historyIndex === 0) { historyIndex = -1; e.target.value = ''; }
            }
        });
    }
}

function appendLog(text, className) {
    const consoleBox = document.getElementById('mc-console');
    if (!consoleBox) return;
    const p = document.createElement('p'); p.className = className || ''; p.innerHTML = text;
    consoleBox.appendChild(p);
    while (consoleBox.children.length > 50) consoleBox.removeChild(consoleBox.firstChild);
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

// Cleaned up legacy telemetry graphs

setInterval(() => {
    if (window.swarmState && window.swarmState.activeBotId) {
        const bots = { ...window.swarmState.bots };
        const activeBot = bots[window.swarmState.activeBotId];
        
        if (activeBot && (activeBot.status === 'GREEN' || activeBot.status === 'IDLE')) {
            // Simulate Vitals fluctuation
            activeBot.ping = Math.floor(20 + Math.random() * 30);
            activeBot.tps = 19.5 + Math.random() * 0.5;
            
            // Simulate Movement if delta > 0
            if (activeBot.delta > 0.1) {
                activeBot.vel = Math.random() * 5 + 2; // Moving
                activeBot.delta = Math.max(0, activeBot.delta - (activeBot.vel * 0.2)); // 200ms tick
                
                // Randomly fluctuate coordinates towards target
                activeBot.x += (Math.random() - 0.5) * 2;
                activeBot.y += (Math.random() - 0.5) * 0.5;
                activeBot.z += (Math.random() - 0.5) * 2;
            } else {
                activeBot.vel = 0;
            }
        }
        window.swarmState.bots = bots;
    }
}, 200);

// Auto-initialize when the script is loaded by the router
$(function() {
    initMinecraftDashboard();
});
