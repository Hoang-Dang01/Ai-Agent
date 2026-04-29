const db = require('./src/db/database');
setTimeout(async () => {
    try {
        const [rows] = await db.execute('SELECT 1');
        console.log('SUCCESS:', rows);
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit();
}, 2000);
