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
        console.error("Thiếu thư viện socket.io client!");
        return;
    }

    window.swarmState = new Proxy(rawSwarmState, {
        set(target, property, value) {
            target[property] = value;
            scheduleUIRender();
            return true;
        }
    });

    window.swarmState.bots = {
        'Acetazolamid': { hp: 20, food: 20, x: 50.850, y: 84.0, z: -104.984, delta: 142.5, vel: 0.0, status: 'GREEN', ping: 42, tps: 20.0 },
        'vicentenguyen': { hp: 15, food: 18, x: 10.5, y: 60.0, z: 20.2, delta: 0.0, vel: 0.0, status: 'IDLE', ping: 55, tps: 20.0 },
        'nguthichetocc': { hp: 0, food: 0, x: 0, y: 0, z: 0, delta: 0, vel: 0, status: 'RED', ping: 999, tps: 0.0 }
    };
    window.swarmState.activeBotId = 'Acetazolamid';

    if (!mcSocket) {
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

        mcSocket.on('bot_chat', (data) => appendLog(`[PLAYER] ${data.username}: ${data.message}`, 'log-player'));
        mcSocket.on('admin_alert', (data) => { appendLog(`[ADMIN] ${data.message}`, 'log-admin'); playSiren(); });
    }

    bindEvents();
    initTacticalCursor();
    scheduleUIRender();
    appendLog('[HỆ THỐNG] Đã thiết lập liên kết không gian mạng. Đang giám sát Turing Guard...', 'log-system');
}

// TACTICAL CURSOR V2 (ULTRA SPIN & LOCK)
let tMouseX = window.innerWidth / 2 || 0;
let tMouseY = window.innerHeight / 2 || 0;
let tCurX = tMouseX;
let tCurY = tMouseY;
let tRotation = 0;
let tActiveTarget = null;
let tStrength = 0;
let cursorLoopRunning = false;

function ensureCursorDOM() {
    let wrapper = document.getElementById('tactical-cursor-wrapper');
    if (wrapper && wrapper.parentElement !== document.body) {
        wrapper.remove();
        wrapper = null;
    }
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'tactical-cursor-wrapper';
        wrapper.className = 'tactical-cursor-wrapper';
        wrapper.innerHTML = \`
            <div class="tactical-cursor-box" id="tactical-cursor-box"></div>
            <div class="tactical-cursor-dot" id="tactical-cursor-dot"></div>
            <div class="tactical-corner corner-tl"></div>
            <div class="tactical-corner corner-tr"></div>
            <div class="tactical-corner corner-br"></div>
            <div class="tactical-corner corner-bl"></div>
        \`;
        document.body.appendChild(wrapper);
    }
    return wrapper;
}

function initTacticalCursor() {
    ensureCursorDOM();

    window.addEventListener('mousemove', (e) => {
        tMouseX = e.clientX;
        tMouseY = e.clientY;
        
        // Hide default cursor safely only when mouse moves
        document.body.style.cursor = 'none';
        const dash = document.querySelector('.ultra-dashboard');
        if(dash) dash.style.cursor = 'none';
    });

    window.addEventListener('mousedown', () => {
        const dot = document.getElementById('tactical-cursor-dot');
        if (dot) dot.style.transform = 'translate(-50%, -50%) scale(0.5)';
    });
    
    window.addEventListener('mouseup', () => {
        const dot = document.getElementById('tactical-cursor-dot');
        if (dot) dot.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    const bindMagnetic = () => {
        const targets = document.querySelectorAll('.ultra-dashboard button, .ultra-dashboard .swarm-item, .ultra-dashboard input, .ultra-dashboard .quick-link, .ultra-dashboard .ultra-checkbox-label');
        targets.forEach(t => {
            if (!t.dataset.magnetBound) {
                t.dataset.magnetBound = 'true';
                t.addEventListener('mouseenter', () => { tActiveTarget = t; });
                t.addEventListener('mouseleave', () => { if (tActiveTarget === t) tActiveTarget = null; });
            }
        });
    };
    
    bindMagnetic();
    const observer = new MutationObserver(bindMagnetic);
    const dash = document.querySelector('.ultra-dashboard');
    if (dash) observer.observe(dash, { childList: true, subtree: true });

    if (!cursorLoopRunning) {
        cursorLoopRunning = true;
        requestAnimationFrame(updateTacticalCursor);
    }
}

function updateTacticalCursor() {
    try {
        const wrapper = ensureCursorDOM();
        const corners = wrapper.querySelectorAll('.tactical-corner');
        const dot = document.getElementById('tactical-cursor-dot');
        const box = document.getElementById('tactical-cursor-box');
        
        // Follow mouse smoothly
        tCurX += (tMouseX - tCurX) * 0.3;
        tCurY += (tMouseY - tCurY) * 0.3;

        // Lock/Spin Logic
        if (tActiveTarget) {
            tStrength += (1 - tStrength) * 0.25;
            if (tStrength < 0.2) tRotation = 0; // Snap to upright before fully locking
            if (dot) dot.style.opacity = '0';
        } else {
            tStrength += (0 - tStrength) * 0.25;
            if (tStrength < 0.2) tRotation += 2; // Only spin when fully detached
            if (dot) dot.style.opacity = '1';
        }

        wrapper.style.transform = \`translate3d(\${tCurX}px, \${tCurY}px, 0) rotate(\${tRotation}deg)\`;

        let tgtTL = {x: -15, y: -15}, tgtTR = {x: 3, y: -15}, tgtBR = {x: 3, y: 3}, tgtBL = {x: -15, y: 3};
        
        if (tActiveTarget && tStrength > 0.01) {
            const rect = tActiveTarget.getBoundingClientRect();
            const bw = 6; // Padding
            const cs = 12; // Corner size
            
            // Calculate relative offset from current wrapper position
            const targetLeft = rect.left - bw - tCurX;
            const targetTop = rect.top - bw - tCurY;
            const targetRight = rect.right + bw - cs - tCurX;
            const targetBottom = rect.bottom + bw - cs - tCurY;

            tgtTL = { x: targetLeft, y: targetTop };
            tgtTR = { x: targetRight, y: targetTop };
            tgtBR = { x: targetRight, y: targetBottom };
            tgtBL = { x: targetLeft, y: targetBottom };
            
            if (box) {
                box.style.width = \`\${rect.width + bw*2}px\`;
                box.style.height = \`\${rect.height + bw*2}px\`;
                box.style.opacity = tStrength > 0.8 ? '1' : '0';
                box.style.transform = \`translate(\${rect.left - tCurX - bw}px, \${rect.top - tCurY - bw}px)\`;
            }
        } else {
            if (box) box.style.opacity = '0';
        }

        const basePos = [
            {x: -15, y: -15}, {x: 3, y: -15}, {x: 3, y: 3}, {x: -15, y: 3}
        ];
        const curTgts = [tgtTL, tgtTR, tgtBR, tgtBL];
        
        if (corners.length === 4) {
            corners.forEach((c, i) => {
                const bx = basePos[i].x;
                const by = basePos[i].y;
                const tx = curTgts[i].x;
                const ty = curTgts[i].y;
                
                const fx = bx + (tx - bx) * tStrength;
                const fy = by + (ty - by) * tStrength;
                
                c.style.transform = \`translate3d(\${fx}px, \${fy}px, 0)\`;
            });
        }
    } catch (e) {
        console.error('Cursor Error:', e);
        document.body.style.cursor = 'auto'; // Fallback
    }
    if (cursorLoopRunning) {
        requestAnimationFrame(updateTacticalCursor);
    }
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
        document.getElementById('mc-hp-percent').textContent = \`\${Math.round(hpPercent*100)}%\`;

        const foodPercent = activeBot.food / 20;
        const foodOffset = maxArc - (foodPercent * maxArc);
        const foodFill = document.querySelector('.food-fill');
        if (foodFill) foodFill.style.strokeDashoffset = foodOffset;
        document.getElementById('mc-food-percent').textContent = \`\${Math.round(foodPercent*100)}%\`;

        // Telemetry
        const velEl = document.getElementById('mc-vel');
        if (velEl) velEl.textContent = \`\${activeBot.vel.toFixed(1)} m/s\`;

        const deltaEl = document.getElementById('mc-delta');
        if (deltaEl) deltaEl.textContent = \`\${activeBot.delta.toFixed(1)}m\`;
        
        const yEl = document.getElementById('mc-y');
        if (yEl) yEl.textContent = activeBot.y.toFixed(1) + ' m';

        const stateEl = document.getElementById('mc-state');
        if (stateEl) stateEl.textContent = activeBot.status;
        
        // Vitals Ping & TPS
        const pingEl = document.getElementById('mc-vitals-ping');
        if (pingEl) pingEl.textContent = activeBot.ping || 0;
        
        const tpsEl = document.getElementById('mc-vitals-tps');
        if (tpsEl) tpsEl.textContent = (activeBot.tps || 20).toFixed(1);

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
                    appendLog(\`[SYSTEM] \${botId.substring(0,8)} -> Bay tới \${x}, \${y}, \${z}\`, 'log-system');
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
                appendLog(\`[SYSTEM] \${botId} -> Lệnh XUẤT PHÁT đã được gửi\`, 'log-system');
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
                appendLog(\`[SYSTEM] \${botId} -> Lệnh GỌI VỀ căn cứ đã được gửi\`, 'log-warning');
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

                if (cmd.startsWith('/')) { mcSocket.emit('cmd_server', cmd); appendLog(\`[HỆ THỐNG] Đã gửi lệnh tới máy chủ.\`, 'log-system'); }
                else if (cmd.startsWith('.')) { mcSocket.emit('cmd_internal', cmd); appendLog(\`[THÔNG TIN] Lệnh nội bộ: \${cmd}\`, 'log-info'); }
                else { mcSocket.emit('cmd_chat', cmd); appendLog(\`[THÔNG TIN] \${cmd}\`, 'log-info'); }
                
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
