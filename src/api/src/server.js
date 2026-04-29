const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const multer = require('multer');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./db/database');
const { processQuery } = require('./agents/agent');
const { crawlUTH } = require('./tools/crawler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Cấu hình Multer để upload tài liệu làm Synthetic Data
const rawDocsDir = path.join(__dirname, '../../../data/raw_docs');
if (!fs.existsSync(rawDocsDir)){
    fs.mkdirSync(rawDocsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, rawDocsDir);
    },
    filename: function (req, file, cb) {
        // Đặt tên an toàn, ép đuôi .txt cho Python script dễ đọc
        const safeName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${safeName}_${Date.now()}.txt`);
    }
});
const upload = multer({ storage: storage });

// Cho phép request từ Vite frontend
app.use(cors());
app.use(express.json());

// Gộp chung: Phục vụ Frontend trên cùng một cổng 3000
app.use(express.static(path.join(__dirname, '../../frontend')));



// Middleware xác thực JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    });
}

// API: Đăng ký
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: "Username và Password hợp lệ (pass >= 6 ký tự)" });
    }

    // Logic Đồ án: Nếu đăng ký tài khoản tên 'admin', tự động cấp quyền admin. Còn lại là student.
    const role = (username.toLowerCase() === 'admin') ? 'admin' : 'student';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        res.json({ success: true, message: `Đăng ký thành công tài khoản (${role})!` });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
        } else {
            console.error(err);
            res.status(500).json({ error: "Lỗi máy chủ" });
        }
    }
});

// API: Đăng nhập
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];
        
        if (!user) return res.status(400).json({ error: "Tài khoản không tồn tại" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Sai mật khẩu" });

        // Ký token kèm theo role
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role || 'student' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        res.json({ success: true, token, username: user.username, role: user.role || 'student' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi máy chủ" });
    }
});


// API: Lấy toàn bộ lịch sử chat
app.get('/api/chats', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM chats ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi lấy danh sách chat" });
    }
});

// API: Tiến hành Gửi & Trả lời tin nhắn AI
app.post('/api/chat', authenticateToken, async (req, res) => {
    const { message, modelId } = req.body;
    if (!message) return res.status(400).json({ error: "Tham số message không hợp lệ" });

    // Lưu tin nhắn USER vào DB
    await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['user', message]);

    try {
        // Gửi qua Task Router LLM
        const { botReply, extractedTasks } = await processQuery(message, modelId);

        // Lưu tin nhắn BOT vào DB
        await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', botReply]);

        // Lưu danh sách Tasks (nếu AI đọc hiểu được lịch trình)
        if (extractedTasks.length > 0) {
            for (let t of extractedTasks) {
                await db.execute('INSERT INTO tasks (task_name, start_time, end_time, priority) VALUES (?, ?, ?, ?)', 
                    [t.task_name, t.start_time || null, t.end_time || null, t.priority || 'normal']
                );
            }
        }

        res.json({ reply: botReply, tasks: extractedTasks });
    } catch (error) {
        console.error("Error /api/chat:", error);
        res.status(500).json({ error: "Lỗi nội bộ khi liên hệ tới Agent Ảo" });
    }
});

// API: Tra cứu toàn bộ thời khóa biểu / Lịch
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tasks ORDER BY start_time ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi lấy danh sách lịch" });
    }
});

// API: Ra lệnh cào Web Sinh Viên
app.post('/api/crawl', authenticateToken, async (req, res) => {
    // Lưu tin nhắn đại diện
    await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', 'Đang khởi động Trình duyệt ảo để vào web UTH...']);

    try {
        // 1. Mở Playwright lấy raw text
        const rawWebText = await crawlUTH();
        
        await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', 'Thu thập thành công dữ liệu thô! Đang cho Gemini phân tích ép thành Lịch Trình...']);

        // 2. Ép Gemini phân tích văn bản siêu dài thành mảng Sự kiện/Task
        const promptAnalyze = `Đây là dữ liệu thô cào từ trang Thời Khóa Biểu đại học UTH của tôi:\n\n${rawWebText.substring(0, 15000)}\n\nHãy tìm kiếm Lịch học, Môn học, Thời gian và trích xuất thành mảng JSON Tasks. Yêu cầu định dạng JSON Block y hệt Task Router.`;
        
        const { extractedTasks } = await processQuery(promptAnalyze);

        // 3. Lưu mảng vào database
        if (extractedTasks.length > 0) {
            for (let t of extractedTasks) {
                await db.execute('INSERT INTO tasks (task_name, start_time, end_time, priority) VALUES (?, ?, ?, ?)', 
                    [t.task_name, t.start_time || null, t.end_time || null, t.priority || 'high']
                );
            }
        }

        const replyMsg = `Quá đỉnh! Em đã cào và phân tích thành công **${extractedTasks.length}** lịch học đưa vào hệ thống cho anh rồi nhé!`;
        await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', replyMsg]);
        res.json({ reply: replyMsg, tasks: extractedTasks });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi trong quá trình cào dữ liệu UTH" });
    }
});

// API: Kích hoạt sinh dữ liệu huấn luyện (Dành riêng cho Admin)
app.post('/api/generate-synthetic', authenticateToken, upload.single('document'), async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Chỉ Admin mới có quyền sinh dữ liệu huấn luyện!" });
    }

    if (!req.file) {
        return res.status(400).json({ error: "Vui lòng đính kèm file tài liệu (.txt, .md)." });
    }

    const replyMsg = `Đã nhận được file **${req.file.originalname}**. Hệ thống đang khởi động luồng Python ngầm để sinh Synthetic Data. Vui lòng kiểm tra thư mục data/synthetic_datasets sau ít phút...`;
    
    // Lưu tin nhắn thông báo lên UI ngay lập tức
    await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', replyMsg]);
    res.json({ reply: replyMsg });

    // Chạy ngầm Python Script
    const pythonScriptPath = path.join(__dirname, '../../../src/ai/synthetic_data_generator.py');
    const pythonProcess = spawn('python', [pythonScriptPath], {
        cwd: path.join(__dirname, '../../..') // Set working directory to project root so paths match
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python Data Gen]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Data Gen Error]: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
        console.log(`Tiến trình sinh dữ liệu đã hoàn tất với mã code ${code}`);
        if (code === 0) {
            await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', `✅ Quá trình sinh dữ liệu từ file **${req.file.originalname}** đã HOÀN TẤT! Dữ liệu đã được lưu an toàn.`]);
        } else {
            await db.execute('INSERT INTO chats (sender, content) VALUES (?, ?)', ['bot', `❌ Quá trình sinh dữ liệu gặp lỗi (Code: ${code}). Vui lòng xem log Backend.`]);
        }
    });
});



// Routing về trang chủ cho các route không có API
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Hệ thống All-in-One đang chạy tại http://localhost:${PORT}`);
});
