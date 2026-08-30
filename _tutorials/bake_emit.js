// 把草稿纸烘焙表生成 JS 字面量，并植入 index.html：
// 1) 在 let _gridCache=null; 前插入 const BAKED_MAP_POS = {...};
// 2) computeGridLayout 改为「烘焙表优先，运行时算法兜底」
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const bake = JSON.parse(fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/baked_pos.json', 'utf8'));

// —— 生成字面量 ——
let lit = '// —— 烘焙舆图坐标表：离线草稿纸（多起点退火+字典序贪心）验收后按房间名落位 ——\n';
lit += '// 命中则 computeGridLayout 直接查表；未来新房间未入表时自动回退运行时算法。\n';
lit += 'const BAKED_MAP_POS={\n';
const cids = Object.keys(bake).sort();
cids.forEach(function(cid, idx){
  const rooms = bake[cid];
  const entries = Object.keys(rooms).map(function(rn){ return JSON.stringify(rn)+':['+rooms[rn][0]+','+rooms[rn][1]+']'; });
  lit += JSON.stringify('cheng|'+cid)+':{'+entries.join(',')+'}'+(idx<cids.length-1?',':'')+'\n';
});
lit += '};\n';

const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
// 1) 插入烘焙表（若已存在则先移除旧表）
const anchor = lines.findIndex(l => l.includes('let _gridCache=null;'));
if (anchor < 0) { console.error('未找到 _gridCache 锚点'); process.exit(1); }
// 移除旧表（若有）
const oldStart = lines.findIndex(l => l.includes('const BAKED_MAP_POS={'));
if (oldStart >= 0) {
  let depth = 0, oldEnd = -1;
  for (let i = oldStart; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch==='{') depth++; else if (ch==='}') depth--; }
    if (depth === 0 && i > oldStart) { oldEnd = i; break; }
  }
  // 连带上方两行注释
  let rmFrom = oldStart;
  while (rmFrom > 0 && lines[rmFrom-1].trim().startsWith('//')) rmFrom--;
  lines = lines.slice(0, rmFrom).concat(lines.slice(oldEnd + 1));
}
const anchor2 = lines.findIndex(l => l.includes('let _gridCache=null;'));
const litLines = lit.split('\n');
if (litLines[litLines.length-1] === '') litLines.pop();
lines = lines.slice(0, anchor2).concat(litLines, lines.slice(anchor2));
// 注意：computeGridLayout 的「查表优先」前导段是一次性手工改动，这里不再插入（幂等）
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK: 烘焙表 ' + cids.length + ' 城 ' + Object.values(bake).reduce((s,a)=>s+Object.keys(a).length,0) + ' 间已更新（幂等，不重复插表）');
