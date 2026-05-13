const fs = require('fs');

const readmePath = 'docs/references/agency-agents/README.md';
let content;
try {
    content = fs.readFileSync(readmePath, 'utf8');
} catch (e) {
    console.error("Could not read README.md");
    process.exit(1);
}

const lines = content.split('\n');
let output = '# 🕵️ Danh sách 144 AI Agents (Agency-Agents Overview)\n\n';
output += 'Dưới đây là danh sách tổng hợp toàn bộ các "Chuyên gia AI" từ thư viện `agency-agents`.\n';
output += 'Bạn hãy lướt qua cột **Specialty (Chuyên môn)** và **When to Use (Khi nào cần dùng)** để tick [x] chọn ra những Agent phù hợp với dự án `Ai-Agent` của chúng ta nhé.\n\n';
output += '---\n\n';

let inTable = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Catch Division headings
    if (line.startsWith('### ') && line.includes('Division')) {
        output += '\n## ' + line.replace('### ', '') + '\n\n';
    }
    // Catch sub categories
    else if (line.startsWith('#### ')) {
        output += '\n### ' + line.replace('#### ', '') + '\n\n';
    }
    // Catch descriptions under divisions
    else if (line.match(/^[A-Z]/) && lines[i-1] && lines[i-1].startsWith('### ') && lines[i-1].includes('Division')) {
         output += '*' + line + '*\n\n';
    }
    // Table headers
    else if (line.startsWith('| Agent |') || line.startsWith('| ---') || line.startsWith('|-------|')) {
        output += line + '\n';
        inTable = true;
    }
    // Table content lines
    else if (line.startsWith('|') && inTable) {
        // Change the link to just text so it's readable, or leave it. Leaving it is fine.
        output += line + '\n';
    }
    // End of table
    else if (!line.startsWith('|') && inTable) {
        inTable = false;
    }
}

fs.writeFileSync('docs/references/agency-agents-overview.md', output);
console.log("Successfully generated docs/references/agency-agents-overview.md");
