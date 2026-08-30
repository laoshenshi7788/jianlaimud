const fs = require('fs');
const P = 'E:/1/mud/2/JianLai mud/index.html';
let h = fs.readFileSync(P, 'utf8');
const bad = '  }\r\n  // —— 文圣：读书人的道理 ——';
if (!h.includes(bad)) { console.log('pattern not found'); process.exit(1); }
h = h.replace(bad, '  },\r\n  // —— 文圣：读书人的道理 ——');
fs.writeFileSync(P, h, 'utf8');
console.log('comma added');
