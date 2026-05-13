const fs = require('fs');
const path = require('path');

const ignore = ['.git', 'node_modules', '.venv', '__pycache__', 'dataset', 'node_modules'];
const maxDepth = 4; // Lặn sâu 4 level để hiển thị rõ cấu trúc Vibe-Agent

function generateTree(dir, prefix = '', currentDepth = 0) {
    if (currentDepth > maxDepth) return '';
    
    let result = '';
    let files;
    try {
        files = fs.readdirSync(dir).filter(f => !ignore.includes(f));
    } catch (e) {
        return '';
    }
    
    // Ưu tiên hiển thị folder trước, file sau cho dễ nhìn
    files.sort((a, b) => {
        const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    files.forEach((file, index) => {
        const isLast = index === files.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        const fullPath = path.join(dir, file);
        const isDir = fs.statSync(fullPath).isDirectory();
        
        if (isDir && currentDepth === maxDepth) {
             result += prefix + pointer + file + '/ (+++)\n';
        } else {
             result += prefix + pointer + file + (isDir ? '/' : '') + '\n';
        }
        
        if (isDir && currentDepth < maxDepth) {
            result += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '), currentDepth + 1);
        }
    });
    
    return result;
}

const tree = `# 🌳 Cây thư mục rút gọn (Max Depth = 2)\n\n\`\`\`text\nAi-Agent/\n${generateTree('.', '', 0)}\`\`\`\n\n> **Chú thích**: Các thư mục có dấu \`(+++)\` bên trong còn chứa nhiều file/thư mục con khác nhưng đã được ẩn đi để dễ nhìn.\n`;
fs.writeFileSync('docs/directory-tree-simplified.md', tree);
