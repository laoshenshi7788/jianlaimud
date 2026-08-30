const fs = require('fs');
const P = 'E:/1/mud/2/JianLai mud/index.html';
let h = fs.readFileSync(P, 'utf8');
const die = m => { console.log('FATAL: ' + m); process.exit(1); };

// —— a) 从事件数组取出文戏，还原事件数组闭合 ——
const s1 = h.indexOf('  // —— 文圣：读书人的道理 ——');
if (s1 < 0) die('scenes not found');
const enc = h.indexOf('const ENC_RECENT', s1);
if (enc < 0) die('enc not found');
const evClose = h.lastIndexOf('];', enc);
if (evClose < s1) die('evClose before s1');
const scenesCore = h.slice(s1, evClose).replace(/\s+$/, '');
if (!/  }$/.test(scenesCore)) die('scenesCore tail unexpected: ' + JSON.stringify(scenesCore.slice(-40)));
const preEv = h.slice(0, s1);
if (!/      \]};\r\n$/.test(preEv)) die('preEv tail unexpected: ' + JSON.stringify(preEv.slice(-40)));
h = preEv + '  }}\r\n];\r\n' + h.slice(enc);

// —— b) 定位 DRAMA 收尾（起点后第一个行首 `];`），取最后一个 NPC 键校验 ——
const d = h.indexOf('const DRAMA={');
const c = h.indexOf('\r\n];', d);
if (c < 0) die('drama close not found');
const seg = h.slice(d, c);
const keys = (seg.match(/^  '([^']+)':\{/gm) || []).map(m => m[1]);
if (!keys.length) die('no npc keys in drama');
console.log('drama npcs:', keys.length, '| last:', keys[keys.length - 1]);
let prefix = h.slice(0, c).replace(/\s+$/, '');
if (!/[}]$/.test(prefix)) die('prefix tail unexpected: ' + JSON.stringify(prefix.slice(-40)));
if (!/,$/.test(prefix)) prefix += ',';
h = prefix + '\r\n' + scenesCore + '\r\n];' + h.slice(c + 4);

fs.writeFileSync(P, h, 'utf8');
// —— c) 验证 ——
const dI = h.indexOf('const DRAMA={');
const etI = h.indexOf('const EVENT_TEMPLATES');
const wI = h.indexOf("'文圣':{", dI);
console.log('scenes inside DRAMA:', wI > 0 && wI < etI, '| at', wI);
console.log('events region clean:', h.indexOf("'文圣':{", etI) === -1);
