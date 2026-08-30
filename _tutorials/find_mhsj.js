// 在 E:\1\mud 下找 mhsj 并搜关键词
const fs = require('fs');
const path = require('path');
const root = 'E:/1/mud';
const entries = fs.readdirSync(root);
console.log('dirs:', entries.filter(e => /mhsj/i.test(e)).map(e => path.join(root, e)));
const mhsjDir = entries.find(e => /mhsj/i.test(e) && fs.statSync(path.join(root, e)).isDirectory());
if (!mhsjDir) { console.log('no mhsj dir'); process.exit(0); }
const base = path.join(root, mhsjDir);
const out = [];
(function walk(d) {
  let list;
  try { list = fs.readdirSync(d); } catch (e) { return; }
  for (const f of list) {
    if (f === 'node_modules' || f === '.git') continue;
    const p = path.join(d, f);
    let st; try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) walk(p);
    else if (/\.(js|c|h|json|txt|md|xml|html)$/i.test(f)) out.push(p);
  }
})(base);
console.log('files: ' + out.length);
const kw = /潜能|进度|三段|判定|square|potential|池/i;
const hits = out.filter(f => kw.test(f));
console.log('name hits:', hits.slice(0, 30));
// 关键词内容扫描（只扫中小文件）
let found = 0;
for (const f of out) {
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (s.length > 800000) continue;
  if (/潜能/.test(s)) { console.log('POTENT: ' + f); found++; }
  if (/三段/.test(s)) { console.log('SANDUAN: ' + f); found++; }
  if (found > 12) break;
}
