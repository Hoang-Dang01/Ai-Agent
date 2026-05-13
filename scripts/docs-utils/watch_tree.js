const fs = require('fs');
const { exec } = require('child_process');

let debounce = null;

console.log("👀 Đang theo dõi sự thay đổi của cây thư mục (Watch Mode)...");
console.log("Hãy thử tạo/xóa/sửa tên một file bất kỳ, tôi sẽ tự động cập nhật lại docs/directory-tree-simplified.md!");
console.log("-------------------------------------------------------------------------");

fs.watch('.', { recursive: true }, (eventType, filename) => {
    // Bỏ qua các file không quan trọng hoặc file kết quả để tránh vòng lặp vô hạn
    if (!filename) return;
    if (filename.includes('.git') || 
        filename.includes('node_modules') || 
        filename.includes('directory-tree-simplified.md') ||
        filename.includes('directory-tree.md')) {
        return;
    }

    // Debounce (gom nhóm): Đợi 1 giây sau khi thao tác xong mới chạy script
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] 🔄 Phát hiện thay đổi: ${filename}`);
        
        exec('node scripts/docs-utils/gen_tree_simplified.js', (err, stdout, stderr) => {
            if (err) {
                console.error("❌ Lỗi cập nhật cây thư mục:", err);
                return;
            }
            console.log(`[${time}] ✅ Đã cập nhật thành công: docs/directory-tree-simplified.md`);
        });
    }, 1000); 
});
