const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const workflowRunner = require('./core/WorkflowRunner');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Lưu trữ io vào global để các BaseNode có thể emit lỗi hoặc tiến trình
global.io = io;

// API RESTful mặc định (Fallback nếu không dùng Socket)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, agentName } = req.body;
        const response = await workflowRunner.dispatch(agentName, { message }, req);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Giao thức Socket.io (Real-time)
io.on('connection', (socket) => {
    console.log(`[Socket] 🟢 Client kết nối: ${socket.id}`);

    socket.on('user_message', async (data) => {
        const { message, agentName } = data;
        console.log(`[Socket] Nhận tin nhắn từ web: ${message}`);
        
        try {
            // Thực thi luồng AI
            const response = await workflowRunner.dispatch(agentName, { message }, { socketId: socket.id });
            
            // Trả kết quả về cho client
            socket.emit('bot_reply', response);
        } catch (error) {
            socket.emit('agent_error', { error: 'Lỗi thực thi luồng AI' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] 🔴 Client ngắt kết nối: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000; // Node.js chạy port 3000, Python chạy 8000
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Node.js AI Orchestrator chạy tại port ${PORT}`);
    console.log(`=========================================`);
});
