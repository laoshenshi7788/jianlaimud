const fs = require('fs');
const P = 'E:/1/mud/2/JianLai mud/index.html';
let h = fs.readFileSync(P, 'utf8');
const die = m => { console.log('FATAL: ' + m); process.exit(1); };

// —— 1) 从事件数组摘除文戏块（它当前长在 EVENT_TEMPLATES 尾部） ——
const s1 = h.indexOf('  // —— 文圣：读书人的道理 ——');
if (s1 < 0) die('scenes not found');
const ENC = h.indexOf('const ENC_RECENT', s1);
const evClose = h.lastIndexOf('];', ENC);
const scenesCore = h.slice(s1, evClose).replace(/\s+$/, ''); // '  // 文圣 ... 姜尚真 }\r\n  }'——以 `  }` 结尾
let preEv = h.slice(0, s1).replace(/\s+$/, '');
if (!/  }},$/.test(preEv)) die('preEv tail: ' + JSON.stringify(preEv.slice(-30)));
preEv = preEv.slice(0, -1); // 去掉逗号 → `  }}`
h = preEv + '\r\n];\r\n' + h.slice(ENC);

// —— 2) 插入 DRAMA（对象！闭合为 `};`）。锚点：茅小冬场景收尾 + `};` + 突发事件注释 ——
const anchor = '      ] }\r\n  }\r\n};';
const a = h.indexOf(anchor, h.indexOf('const DRAMA={'));
if (a < 0) die('drama anchor not found');
const head = h.slice(0, a);
// anchor 前缀形如 `...      ] }\r\n  }`——把最后的 `  }`（茅小冬场景收尾）改为 `  },`
const headFixed = head.replace(/  }\r\n$/, '  },\r\n');
h = headFixed + scenesCore + '\r\n' + h.slice(a).replace(/^      \] \}\r\n  \}\r\n\};/, '};');
// 修正：茅小冬场景收尾与文戏之间的逗号（若 headFixed 未命中则在此兜底）
h = h.replace(/  }\r\n(  \/\/ —— 文圣：读书人的道理 ——)/, '  },\r\n$1');

fs.writeFileSync(P, h, 'utf8');
// —— 3) 校验 ——
const dI = h.indexOf('const DRAMA={');
const etI = h.indexOf('const EVENT_TEMPLATES');
const wI = h.indexOf("'文圣':{", dI);
const cnt = (h.match(/文圣：读书人的道理/g) || []).length;
console.log('inside DRAMA:', wI > dI && wI < etI, '| count:', cnt, '| at', wI, '(ET at', etI + ')');
