const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mineflayer = require('mineflayer');
const VaultManager = require('./VaultManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let activeBot = null;
let botVaultManager = null;
let isDisconnecting = false;

// Config mặc định (Web UI có thể thay đổi sau)
let botConfig = {
    host: 'localhost',
    port: 25565,
    username: 'AfkBot_01',
    version: false, // auto-detect
    targetItems: ['diamond', 'emerald', 'iron_ingot', 'gold_ingot'] // Các đồ xịn cần cất
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
        viewDistance: 'tiny', // Tối ưu RAM
        physicsEnabled: true
    });

    botVaultManager = new VaultManager(activeBot);

    // --- EVENTS LÕI ---

    activeBot.on('spawn', () => {
        console.log(`[Bot Server] 🚀 Bot ${botConfig.username} đã vào server thành công!`);
        io.emit('bot_status', { status: 'connected', username: botConfig.username });
        
        updateVitals();

        // Kích hoạt Stochastic Fake Fatigue (10-40 phút)
        scheduleNextFatigue();
    });

    activeBot.on('health', () => {
        updateVitals();
        
        // Logic hoảng loạn nếu sắp chết
        if (activeBot.health < 6) { // Dưới 3 tim
            console.log("⚠️ [Bot Server] Báo động đỏ! Máu quá thấp. Đang kích hoạt Disconnect khẩn cấp!");
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

    // Lắng nghe khung chat an toàn
    activeBot.on('message', (jsonMsg, position) => {
        // Chỉ gửi chat thông thường (position === 'chat' hoặc 'system') về UI
        const message = jsonMsg.toString();
        if (message.trim()) {
            io.emit('bot_chat', { message, timestamp: Date.now() });
        }
    });

    activeBot.on('error', (err) => {
        console.error(`[Bot Server] ❌ Lỗi Bot: ${err.message}`);
        io.emit('bot_error', { message: err.message });
    });

    activeBot.on('end', (reason) => {
        console.log(`[Bot Server] 🔴 Bot đã thoát. Lý do: ${reason}`);
        io.emit('bot_status', { status: 'disconnected', reason });
        activeBot = null;
        botVaultManager = null;

        // Cơ chế Persistent Bot: Tự động kết nối lại nếu không phải do user yêu cầu
        if (!isDisconnecting) {
            console.log("[Bot Server] ⏳ Tự động kết nối lại sau 15 giây...");
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
        position: activeBot.entity?.position || { x: 0, y: 0, z: 0 }
    });
}

async function checkAndStashInventory() {
    if (!activeBot || !botVaultManager) return;

    const emptySlots = activeBot.inventory.emptySlotCount();
    
    // Nếu balo còn dưới 2 ô trống -> Gọi Vault Manager
    if (emptySlots < 2) {
        console.log("[Bot Server] 📦 Balo gần đầy. Đang gọi VaultManager cất đồ xịn...");
        
        // TODO: Hàm vứt rác (Drop Trash) ở đây trước khi mở rương
        // dropTrashItems()

        // Lấy danh sách tên đồ xịn đang có trong rương để đưa vào lệnh cất
        const stashQueue = activeBot.inventory.items()
            .filter(i => botConfig.targetItems.includes(i.name))
            .map(i => i.name);
        
        if (stashQueue.length > 0) {
            await botVaultManager.openAndStash([...new Set(stashQueue)]); // Lọc trùng lặp
        } else {
            console.log("[Bot Server] Rương đầy nhưng toàn rác, không có đồ xịn để cất.");
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
        // Cập nhật cấu hình từ giao diện web
        botConfig = { ...botConfig, ...config };
        startBot();
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
