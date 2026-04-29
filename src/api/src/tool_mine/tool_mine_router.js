const express = require('express');
const fs = require('fs');
const path = require('path');
const { startBot, stopBot, chatBot, getBotStatus, updateBotConfig } = require('./tool_mine_bot_manager');

module.exports = function(io) {
    const router = express.Router();

    const ACCOUNTS_FILE = path.join(__dirname, '../../../data/tool_mine_data/accounts.json');
    const LOCATIONS_FILE = path.join(__dirname, '../../../data/tool_mine_data/locations.json');

    // Lấy danh sách toạ độ
    function getLocations() {
        if (!fs.existsSync(LOCATIONS_FILE)) {
            return { afk_spots: [], npc_trade: null };
        }
        return JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf8'));
    }

    function saveLocations(locations) {
        fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(locations, null, 4));
    }

    // Lấy danh sách account
    function getAccounts() {
        if (!fs.existsSync(ACCOUNTS_FILE)) return [];
        return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    }

    // Lưu danh sách account
    function saveAccounts(accounts) {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 4));
    }

    // REST API
    router.get('/api/accounts', (req, res) => {
        const accs = getAccounts();
        // Kèm thêm trạng thái hiện tại của bot
        const data = accs.map(acc => ({
            ...acc,
            status: getBotStatus(acc.id)
        }));
        res.json(data);
    });

    router.post('/api/accounts', (req, res) => {
        const { username, pass } = req.body;
        const accs = getAccounts();
        const newAcc = {
            id: `acc-${Date.now()}`,
            username,
            pass
        };
        accs.push(newAcc);
        saveAccounts(accs);
        io.emit('accounts_ui_update');
        res.json({ success: true, account: newAcc });
    });

    router.delete('/api/accounts/:id', (req, res) => {
        const { id } = req.params;
        let accs = getAccounts();
        accs = accs.filter(a => a.id !== id);
        saveAccounts(accs);
        
        // Nếu rớt thì stop
        stopBot(id, io);
        io.emit('accounts_ui_update');
        res.json({ success: true });
    });

    router.post('/api/bots/:id/start', (req, res) => {
        const { id } = req.params;
        const { mode, pvp, afkSpotId, pvStart, pvEnd } = req.body;
        let accs = getAccounts();
        const accIndex = accs.findIndex(a => a.id === id);
        if (accIndex !== -1) {
            // Cập nhật và lưu lại cài đặt mode & pvp
            accs[accIndex].mode = mode || 'afk';
            accs[accIndex].pvpEnabled = pvp;
            accs[accIndex].afkSpotId = afkSpotId;
            accs[accIndex].pvStart = pvStart;
            accs[accIndex].pvEnd = pvEnd;
            saveAccounts(accs);

            startBot(accs[accIndex], io);
            io.emit('accounts_ui_update');
            res.json({ success: true, message: "Bot starting" });
        } else {
            res.status(404).json({ success: false, message: "Account not found" });
        }
    });

    // Nút lưu nóng cấu hình từ Web
    router.post('/api/bots/:id/config', (req, res) => {
        const { id } = req.params;
        const { mode, pvp, afkSpotId, pvStart, pvEnd } = req.body;
        let accs = getAccounts();
        const accIndex = accs.findIndex(a => a.id === id);
        if (accIndex !== -1) {
            accs[accIndex].mode = mode;
            accs[accIndex].pvpEnabled = pvp;
            accs[accIndex].afkSpotId = afkSpotId;
            accs[accIndex].pvStart = pvStart;
            accs[accIndex].pvEnd = pvEnd;
            saveAccounts(accs);
            
            // Cập nhật nóng vào bộ não bot_manager
            updateBotConfig(id, mode, pvp, afkSpotId, pvStart, pvEnd, io);
            io.emit('accounts_ui_update');
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false });
        }
    });

    router.post('/api/bots/:id/stop', (req, res) => {
        const { id } = req.params;
        stopBot(id, io);
        io.emit('accounts_ui_update');
        res.json({ success: true, message: "Bot stopped" });
    });

    router.post('/api/bots/:id/chat', (req, res) => {
        const { id } = req.params;
        const { message } = req.body;
        chatBot(id, message, io);
        res.json({ success: true });
    });

    // API Gửi Lệnh Bầy Đàn (Tất Cả Bot Cùng Gõ)
    router.post('/api/bots/chat-all/send', (req, res) => {
        const { message } = req.body;
        let accs = getAccounts();
        accs.forEach(acc => {
            chatBot(acc.id, message, io);
        });
        res.json({ success: true, message: "Đã gửi lệnh cho tất cả" });
    });

    // === API QUẢN LÝ TOẠ ĐỘ (LOCATIONS) ===
    router.get('/api/locations', (req, res) => {
        res.json(getLocations());
    });

    router.post('/api/locations/afk', (req, res) => {
        const { name, x, y, z } = req.body;
        const locs = getLocations();
        const newSpot = {
            id: `spot-${Date.now()}`,
            name: name || `Góc ${locs.afk_spots.length + 1}`,
            x: parseFloat(x),
            y: parseFloat(y),
            z: parseFloat(z)
        };
        locs.afk_spots.push(newSpot);
        saveLocations(locs);
        // Cập nhật cho tất cả Web Panel khác đang mở
        io.emit('locations_updated', locs);
        res.json({ success: true, spot: newSpot });
    });

    router.delete('/api/locations/afk/:id', (req, res) => {
        const { id } = req.params;
        const locs = getLocations();
        locs.afk_spots = locs.afk_spots.filter(s => s.id !== id);
        saveLocations(locs);
        io.emit('locations_updated', locs);
        res.json({ success: true });
    });

    return router;
};
