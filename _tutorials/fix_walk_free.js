// 家园/别院寻径改良：优先把房间挂到「有空位」的邻居上（而不是傻走单链）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let txt = raw;
const oldWalk = "let nxt=Object.values(t0.exits).find(function(rr){ return ROOMS[rr]&&!seen[rr]&&ROOMS[rr].area===t0.area&&typeof ROOMS[rr].bld!=='string'; });";
const newWalk = "let nxt=Object.values(t0.exits).find(function(rr){ return ROOMS[rr]&&!seen[rr]&&ROOMS[rr].exits&&ROOMS[rr].area===t0.area&&typeof ROOMS[rr].bld!=='string'&&['n','e','s','w'].some(function(dd){ return !ROOMS[rr].exits[dd]; }); });\r\n      if(!nxt) nxt=Object.values(t0.exits).find(function(rr){ return ROOMS[rr]&&!seen[rr]&&ROOMS[rr].area===t0.area&&typeof ROOMS[rr].bld!=='string'; });";
let n = 0;
while (txt.includes(oldWalk)) { txt = txt.replace(oldWalk, newWalk); n++; }
fs.writeFileSync(file, txt, 'utf8');
console.log('寻径改良已应用 ' + n + ' 处');
