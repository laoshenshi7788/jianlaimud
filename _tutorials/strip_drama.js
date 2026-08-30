const fs = require('fs');
const P = 'E:/1/mud/2/JianLai mud/index.html';
let h = fs.readFileSync(P, 'utf8');
let removed = 0;
for (let guard = 0; guard < 10; guard++) {
  const s = h.indexOf('  // —— 文圣：读书人的道理 ——');
  if (s < 0) break;
  const lastline = h.indexOf("经验 +12。');", s);
  if (lastline < 0) { console.log('FATAL: block end marker not found'); process.exit(1); }
  const endToken = '      ] }\r\n  }';
  const eRel = h.indexOf(endToken, lastline);
  if (eRel < 0) { console.log('FATAL: closing token not found'); process.exit(1); }
  const e = eRel + endToken.length;
  // 前缀：宿主条目收尾（可能带逗号），去掉末行逗号
  let prefix = h.slice(0, s).replace(/\s+$/, '');
  prefix = prefix.replace(/,$/, '');
  // 后缀：块后的宿主闭合（\r\n]... 等）原样保留
  h = prefix + h.slice(e);
  removed++;
}
console.log('removed blocks:', removed);
if (h.indexOf('文圣：读书人的道理') > -1) { console.log('FATAL: marker still present'); process.exit(1); }
fs.writeFileSync(P, h, 'utf8');
// 语法验证
const m = h.match(/<script>([\s\S]*?)<\/script>/);
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/_s.js', m[1], 'utf8');
