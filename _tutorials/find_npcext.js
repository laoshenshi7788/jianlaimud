const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/NPCS_EXT\s*=|Object\.assign\(NPCS,\s*NPCS_EXT/.test(l)) console.log((i + 1) + ': ' + l.trim().slice(0, 110));
});
// 找 NPCS_EXT 第一条数据样例
const i0 = lines.findIndex(l => /const NPCS_EXT\s*=/.test(l));
if (i0 > -1) {
  console.log('--- NPCS_EXT 样例 ---');
  for (let i = i0; i < i0 + 14; i++) console.log((i + 1) + ': ' + lines[i].trim().slice(0, 130));
}
