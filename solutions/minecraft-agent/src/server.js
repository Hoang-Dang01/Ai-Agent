const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const mineflayer = require('mineflayer');
const VaultManager = require('./VaultManager');

function loadAccountConfig(username) {
    try {
        const dataPath = path.join(__dirname, '../../shared-knowledge/data/minecraft/accounts.json');
        const data = fs.readFileSync(dataPath, 'utf-8');
        const accounts = JSON.parse(data);
        return accounts.find(acc => acc.username === username);
    } catch (err) {
        console.error(`[Bot Server] Lỗi đọc accounts.json: ${err.message}`);
        return null;
    }
}
function loadServerProfile(profileName) {
    try {
        const dataPath = path.join(__dirname, '../../shared-knowledge/data/minecraft/server_profiles.json');
        if (!fs.existsSync(dataPath)) return null;
        const data = fs.readFileSync(dataPath, 'utf-8');
        const profiles = JSON.parse(data);
        return profiles[profileName] || null;
    } catch (err) {
        console.error(`[Bot Server] Lỗi đọc server_profiles.json: ${err.message}`);
        return null;
    }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let activeBot = null;
let botVaultManager = null;
let isDisconnecting = false;

function tacticalLog(message, type = 'info') {
    console.log(message);
    io.emit('bot_log', { message, type });
}

// Config mặc định (Web UI có thể thay đổi sau)
let serverProfile = loadServerProfile('luckyvn') || {
    host: 'localhost', port: 25565, version: false, fakeHost: '', loginDelayMs: 3000, antibotTriggers: [], antibotFreezeDurationMs: 0, targetItems: ['diamond']
};

let botConfig = {
    username: 'Matizw2', // Username mặc định
    ...serverProfile
};

function startBot() {
    if (activeBot) {
        console.log("[Bot Server] Bot đã hoạt động, không thể tạo thêm.");
        return;
    }

    console.log(`[Bot Server] Đang kết nối vào ${botConfig.host}...`);
    isDisconnecting = false;

    activeBot = mineflayer.createBot({
        host: botConfig.host,
        port: botConfig.port,
        username: botConfig.username,
        version: botConfig.version,
        fakeHost: botConfig.fakeHost,
        viewDistance: 'tiny', // Tối ưu RAM
        physicsEnabled: true
    });

    botVaultManager = new VaultManager(activeBot);

    // --- EVENTS LÕI ---

    activeBot.on('spawn', () => {
        tacticalLog(`🚀 Bot ${botConfig.username} đã vào server thành công!`, 'success');
        io.emit('bot_status', { status: 'connected', username: botConfig.username });
        
        // --- AUTO LOGIN & VAULT LOGIC (SPRINT 2) ---
        const accInfo = loadAccountConfig(botConfig.username);
        if (accInfo) {
            if (accInfo.pass) {
                // Tự động gõ lệnh login sau x giây theo cấu hình Server Profile
                setTimeout(() => {
                    activeBot.chat(`/login ${accInfo.pass}`);
                    console.log(`[Bot Server] 🔑 Đã tự động gửi lệnh /login cho ${botConfig.username}`);
                }, botConfig.loginDelayMs || 5000);
            }
            if (botVaultManager && accInfo.pvStart && accInfo.pvEnd) {
                botVaultManager.setVaultBounds(accInfo.pvStart, accInfo.pvEnd);
            }
        } else {
            console.log(`[Bot Server] ⚠️ Không tìm thấy data của ${botConfig.username} trong accounts.json`);
        }

        updateVitals();

        // Kích hoạt Stochastic Fake Fatigue (10-40 phút)
        scheduleNextFatigue();
        
        // Theo dõi số người chơi (TAB)
        activeBot.on('playerJoined', () => updateVitals());
        activeBot.on('playerLeft', () => updateVitals());
    });

    activeBot.on('health', () => {
        updateVitals();
        
        // Logic hoảng loạn nếu sắp chết
        if (activeBot.health < 6) { // Dưới 3 tim
            tacticalLog("⚠️ Báo động đỏ! Máu quá thấp. Đang kích hoạt Disconnect khẩn cấp!", 'error');
            stopBot('Low Health Panic');
        }
    });

    // Cập nhật Inventory liên tục về Dashboard
    activeBot.inventory.on('updateSlot', (oldItem, newItem) => {
        if (!activeBot || !activeBot.inventory) return;
        
        io.emit('bot_inventory', {
            emptySlots: activeBot.inventory.emptySlotCount(),
            items: activeBot.inventory.items().map(i => ({ name: i.name, count: i.count }))
        });

        // Trigger Event-Driven Storage (Nhặt rác / Cất đồ)
        checkAndStashInventory();
    });

    // Lắng nghe khung chat an toàn và xử lý ANTI-BOT
    activeBot.on('message', (jsonMsg, position) => {
        const message = jsonMsg.toString();
        
        // --- TURING GUARD: DYNAMIC ANTI-BOT BYPASS ---
        if (botConfig.antibotTriggers && botConfig.antibotTriggers.length > 0) {
            const isTriggered = botConfig.antibotTriggers.every(trigger => message.includes(trigger));
            if (isTriggered) {
                tacticalLog(`🛑 Phát hiện luồng Xác Minh Anti-Bot! Đang xử lý né tránh...`, 'warning');
                activeBot.clearControlStates(); // Thả mọi nút bấm (WASD, Jump)
                
                // Ép buộc dừng mọi di chuyển nếu đang dùng pathfinder
                if (activeBot.pathfinder) {
                    activeBot.pathfinder.setGoal(null);
                }
            }
        }

        // Chỉ gửi chat thông thường (position === 'chat' hoặc 'system') về UI
        if (message.trim()) {
            io.emit('bot_chat', { message, timestamp: Date.now() });
        }
    });

    activeBot.on('error', (err) => {
        tacticalLog(`❌ Lỗi Bot: ${err.message}`, 'error');
        io.emit('bot_error', { message: err.message });
    });

    activeBot.on('end', (reason) => {
        tacticalLog(`🔴 Bot đã thoát. Lý do: ${reason}`, 'warning');
        io.emit('bot_status', { status: 'disconnected', reason });
        activeBot = null;
        botVaultManager = null;

        // Cơ chế Persistent Bot: Tự động kết nối lại nếu không phải do user yêu cầu
        if (!isDisconnecting) {
            tacticalLog("⏳ Đang đợi mạng ổn định... Tự động kết nối lại sau 15 giây.", 'info');
            setTimeout(startBot, 15000);
        }
    });
}

function stopBot(reason = 'User Requested') {
    isDisconnecting = true;
    if (activeBot) {
        activeBot.quit(reason);
        activeBot = null;
        botVaultManager = null;
    }
}

// Hàm phân phối thời gian Gauss (Stochastic Behavior)
function scheduleNextFatigue() {
    if (!activeBot || isDisconnecting) return;
    // Random từ 10 đến 40 phút
    const nextTimeMs = Math.floor(Math.random() * (40 - 10 + 1) + 10) * 60 * 1000;
    console.log(`[Turing Guard] Sắp xếp lịch giả vờ mỏi tay tiếp theo sau ${(nextTimeMs / 60000).toFixed(1)} phút.`);
    setTimeout(triggerFakeFatigue, nextTimeMs);
}

function triggerFakeFatigue() {
    if (!activeBot || isDisconnecting) return;
    console.log("[Turing Guard] 🥱 Đang giả vờ mỏi tay / afk vặt...");

    const actions = [
        () => { 
            activeBot.setControlState('sneak', true); 
            setTimeout(() => activeBot.setControlState('sneak', false), 800); 
        },
        () => activeBot.look(activeBot.entity.yaw + (Math.random() - 0.5), activeBot.entity.pitch, true)
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();

    // Tiếp tục đệ quy cho lần sau
    scheduleNextFatigue();
}

function updateVitals() {
    if (!activeBot) return;
    io.emit('bot_vitals', {
        health: activeBot.health,
        food: activeBot.food,
        position: activeBot.entity?.position || { x: 0, y: 0, z: 0 },
        playerCount: activeBot.players ? Object.keys(activeBot.players).length : 0
    });
}

async function checkAndStashInventory() {
    if (!activeBot || !botVaultManager) return;

    const emptySlots = activeBot.inventory.emptySlotCount();
    
    // Nếu balo còn dưới 2 ô trống -> Gọi Vault Manager
    if (emptySlots < 2) {
        tacticalLog("📦 Balo gần đầy. Đang gọi Robot Thủ Kho cất đồ xịn...", 'info');
        
        // TODO: Hàm vứt rác (Drop Trash) ở đây trước khi mở rương
        // dropTrashItems()

        // Lấy danh sách tên đồ xịn đang có trong rương để đưa vào lệnh cất
        const stashQueue = activeBot.inventory.items()
            .filter(i => botConfig.targetItems.includes(i.name))
            .map(i => i.name);
        
        if (stashQueue.length > 0) {
            await botVaultManager.openAndStash([...new Set(stashQueue)]); // Lọc trùng lặp
        } else {
            tacticalLog("⚠️ Rương đầy nhưng toàn rác, không có đồ xịn để cất.", 'warning');
            // Ở đây sẽ kích hoạt hàm vứt rác mạnh tay hơn.
        }
    }
}

// --- SECURE WEBSOCKET API ---
// Lớp bảo mật chống Hijacking (Chỉ nhận IP có Secret Key)
const SECRET_KEY = "SANTINO_AI_AGENT_2026";

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === SECRET_KEY) {
        next();
    } else {
        console.error(`[Security] 🚫 Chặn kết nối WebSocket lạ. Sai Token! IP: ${socket.handshake.address}`);
        next(new Error("Unauthorized"));
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket] Trình duyệt đã kết nối an toàn (ID: ${socket.id})`);

    // Gửi trạng thái hiện tại ngay khi kết nối
    if (activeBot) {
        socket.emit('bot_status', { status: 'connected', username: botConfig.username });
        updateVitals();
    } else {
        socket.emit('bot_status', { status: 'disconnected' });
    }

    socket.on('cmd_start', (config) => {
        // Cập nhật cấu hình từ giao diện web (Legacy)
        botConfig = { ...botConfig, ...config };
        startBot();
    });

    socket.on('cmd_spawn_bot', (data) => {
        console.log(`[Socket] Nhận lệnh Deploy Bot: ${data.botName}`);
        
        // Cập nhật username muốn chạy
        if (data.botName) botConfig.username = data.botName;
        
        // Tùy chọn: Chọn profile server nếu Frontend gửi lên
        if (data.serverProfile) {
            const newProfile = loadServerProfile(data.serverProfile);
            if (newProfile) {
                botConfig = { ...botConfig, ...newProfile };
            }
        }
        
        startBot();
        
        // Gửi ACK lại cho Web UI biết là nhận lệnh OK
        socket.emit('bot_spawn_success', { botName: botConfig.username });
    });

    socket.on('cmd_stop', () => {
        console.log("[Socket] Nhận lệnh Disconnect từ Dashboard.");
        stopBot();
    });

    socket.on('cmd_chat', (msg) => {
        if (activeBot && msg) {
            activeBot.chat(msg);
        }
    });
    
    socket.on('cmd_set_vaults', (maxCount) => {
        if (botVaultManager) {
            botVaultManager.setMaxVaults(maxCount);
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`⛏️  MINECRAFT AFK ENGINE ĐÃ CHẠY TẠI PORT ${PORT}`);
    console.log(`=========================================`);
});
