const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let txt = raw;
const FREE = "ROOMS[rr].exits&&ROOMS[rr].area===AREA&&typeof ROOMS[rr].bld!=='string'&&['n','e','s','w'].some(function(dd){ return !ROOMS[rr].exits[dd]; })";
const patterns = [
  // ensureHomeRooms 变体（t0.area）
  { o: "ROOMS[rr]&&!seen[rr]&&ROOMS[rr].area===t0.area&&typeof ROOMS[rr].bld!=='string'", a: "t0.area" },
  // ensureVillaRooms 变体（ROOMS[host].area）
  { o: "ROOMS[rr]&&!seen[rr]&&ROOMS[rr].area===ROOMS[host].area&&typeof ROOMS[rr].bld!=='string'", a: "ROOMS[host].area" }
];
let n = 0;
patterns.forEach(function(p){
  const oldS = "let nxt=Object.values(t0.exits).find(function(rr){ return " + p.o + "; });";
  // 优先找「有空位」的邻居；找不到再退回普通邻居
  const newS = "let nxt=Object.values(t0.exits).find(function(rr){ return ROOMS[rr]&&!seen[rr]&&" + FREE.replace(/AREA/g, p.a) + "; });\n      if(!nxt) nxt=Object.values(t0.exits).find(function(rr){ return ROOMS[rr]&&!seen[rr]&&" + p.o + "; });";
  while (txt.includes(oldS)) { txt = txt.replace(oldS, newS); n++; }
});
fs.writeFileSync(file, txt, 'utf8');
console.log('寻径改良应用 ' + n + ' 处');
