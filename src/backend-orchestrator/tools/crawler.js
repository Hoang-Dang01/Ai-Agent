const { chromium } = require('playwright');

/**
 * Mở trình duyệt để người dùng đăng nhập UTH.
 * Bơm một nút "Cào TKB" vào góc màn hình Web UTH.
 * Trả về raw text của toàn bộ trang khi người dùng nhấn nút.
 */
async function crawlUTH() {
    console.log("Khởi động Playwright...");
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Inject script chạy vào mọi trang web (kể cả khi user điều hướng)
    await page.addInitScript(() => {
        window.addEventListener('load', () => {
             const btn = document.createElement('button');
             btn.innerText = "🤖 Trợ Lý: Nhấn vào đây để Cào Thời Khóa Biểu";
             btn.style.position = 'fixed';
             btn.style.top = '20px';
             btn.style.right = '20px';
             btn.style.zIndex = '999999';
             btn.style.padding = '15px 20px';
             btn.style.background = '#e74c3c';
             btn.style.color = 'white';
             btn.style.fontWeight = 'bold';
             btn.style.border = 'none';
             btn.style.borderRadius = '8px';
             btn.style.fontSize = '16px';
             btn.style.cursor = 'pointer';
             btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
             
             btn.onclick = async () => {
                 btn.innerText = "Đang cào dữ liệu... Chờ xíu !";
                 btn.style.background = '#f39c12';
                 
                 // Lấy toàn bộ Text hiển thị trên màn hình
                 const rawText = document.body.innerText;
                 
                 // Gửi dữ liệu về Node.js qua hàm exposeFunction
                 await window.handleTKBScrape(rawText);
                 
                 btn.innerText = "Xong! Đã gửi về Trợ Lý";
                 btn.style.background = '#2ecc71';
                 setTimeout(() => btn.remove(), 3000);
             };
             document.body.appendChild(btn);
        });
    });

    return new Promise((resolve, reject) => {
        // Cấu hình hàm hứng kết quả từ browser
        page.exposeFunction('handleTKBScrape', async (rawText) => {
            console.log("Đã bắt được dữ liệu từ người dùng click!");
            setTimeout(async () => {
                await browser.close();
            }, 1500); // Đợi xíu để user nhìn thấy nút màu xanh
            resolve(rawText);
        });

        // Điều hướng tới web sinh viên UTH
        page.goto('https://sv.ut.edu.vn/').catch(() => {});
    });
}

module.exports = { crawlUTH };
