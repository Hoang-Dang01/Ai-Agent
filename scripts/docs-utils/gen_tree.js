const fs = require('fs');
const path = require('path');

const ignore = ['.git', 'node_modules', '.venv', '__pycache__'];

function generateTree(dir, prefix = '') {
    let result = '';
    const files = fs.readdirSync(dir).filter(f => !ignore.includes(f));
    
    files.forEach((file, index) => {
        const isLast = index === files.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        const fullPath = path.join(dir, file);
        const isDir = fs.statSync(fullPath).isDirectory();
        
        result += prefix + pointer + file + (isDir ? '/' : '') + '\n';
        
        if (isDir) {
            result += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    });
    
    return result;
}

const tree = `# Project Directory Tree\n\n\`\`\`text\nAi-Agent/\n${generateTree('.')}\`\`\`\n`;
fs.writeFileSync('docs/directory-tree.md', tree);
