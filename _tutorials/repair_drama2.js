const fs = require('fs');
const P = 'E:/1/mud/2/JianLai mud/index.html';
let h = fs.readFileSync(P, 'utf8');

// 1) 定位误插在事件数组里的文戏块
const s1 = h.indexOf('  // —— 文圣：读书人的道理 ——');
if (s1 < 0) { console.log('scenes not found'); process.exit(1); }
const enc = h.indexOf('const ENC_RECENT', s1);
const evClose = h.lastIndexOf('];', enc);
const scenesCore = h.slice(s1, evClose).replace(/\s+$/, ''); // 以 `  }` 结尾
// 2) 还原事件数组：`  }},` → `  }}` + `];`
const before = h.slice(0, s1);
if (!/  }},\r\n$/.test(before)) { console.log('unexpected before-tail: ' + JSON.stringify(before.slice(-30))); process.exit(1); }
h = before.replace(/  }},\r\n$/, '  }}\r\n];\r\n') + h.slice(enc);
// 3) 找 DRAMA 真正收尾：杨老头（最后一幕）之后的 `  }}\r\n];`
const d = h.indexOf('const DRAMA={');
const yang = h.indexOf("'杨老头':{", d);
const pat = '  }}\r\n];';
const pClose = h.indexOf(pat, yang);
if (pClose < 0) { console.log('drama close pattern not found'); process.exit(1); }
const beforeD = h.slice(0, pClose);
h = beforeD.replace(/  }}\r\n$/, '  }},\r\n') + scenesCore + '\r\n];' + h.slice(pClose + pat.length);

fs.writeFileSync(P, h, 'utf8');
// 4) 验证
const inDrama = h.indexOf("'文圣':{", h.indexOf('const DRAMA={')) < h.indexOf('const EVENT_TEMPLATES');
const notInEvents = h.indexOf("'文圣':{", h.indexOf('EVENT_TEMPLATES=')) === -1;
console.log('scenes inside DRAMA:', inDrama, '| events clean:', notInEvents);
