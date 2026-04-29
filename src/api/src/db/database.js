const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_study_hub',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    try {
        // Tạo riêng 1 connection để đảm bảo database được tạo
        const tempConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'ai_study_hub'}\``);
        await tempConn.end();

        // Tạo các bảng
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS chats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_name VARCHAR(255) NOT NULL,
                start_time VARCHAR(100),
                end_time VARCHAR(100),
                priority VARCHAR(50) DEFAULT 'normal',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('📦 MySQL Database Initialized!');
    } catch (error) {
        console.error('❌ Lỗi khởi tạo MySQL:', error);
    }
}

initDB();

module.exports = pool;
