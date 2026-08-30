// 展示 applyStartup 全文
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
const idx = src.indexOf('function applyStartup');
if (idx < 0) { console.log('not found'); process.exit(0); }
const body = src.slice(idx, idx + 5000);
console.log(body.split('\n').slice(0, 95).join('\n'));
