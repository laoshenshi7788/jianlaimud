// 扫描 E:/1/mud/2/mhsj-main：找 潜能/进度条/三段判定 相关文件
const fs = require('fs');
const path = require('path');
const base = 'E:/1/mud/2/mhsj-main';
const out = [];
(function walk(d) {
  let list;
  try { list = fs.readdirSync(d); } catch (e) { return; }
  for (const f of list) {
    if (f === 'node_modules' || f === '.git') continue;
    const p = path.join(d, f);
    let st; try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) walk(p);
    else out.push(p);
  }
})(base);
console.log('files: ' + out.length);
const exts = {};
out.forEach(f => { const e = path.extname(f).toLowerCase(); exts[e] = (exts[e] || 0) + 1; });
console.log('exts:', exts);
let ptn = 0, sd = 0, bar = 0;
for (const f of out) {
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (s.length > 1500000) continue;
  if (/潜能/.test(s) && ptn < 8) { console.log('POTENT ' + f); ptn++; }
  if (/三段/.test(s) && sd < 8) { console.log('SANDUAN ' + f); sd++; }
  if (/进度/.test(s) && /潜/.test(s) && bar < 8) { console.log('BAR+POTENT ' + f); bar++; }
}
