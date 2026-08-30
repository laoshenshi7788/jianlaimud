// 深挖 mhsj：潜能双池 / 平方进度条 / 三段战斗判定的实现文件
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
// 1) 文件名直接相关的
const nameHit = out.filter(f => /combat|potential|qianneng|exp|level|progress|bar|combatd/i.test(path.basename(f)));
console.log('--- name hits ---');
nameHit.slice(0, 40).forEach(f => console.log(f));
// 2) 内容扫描：潜能+双池式定义（score/潜能在 .c 中被 query 和 add）
console.log('--- content: 潜能 in feature/daemon ---');
let n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  if (!/feature|daemon|adm/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (/潜能/.test(s) && /(query|set|add)_.*potential|potential.*exp/i.test(s) && n < 10) { console.log(f); n++; }
}
// 3) 平方：Math/pow/square 型公式（LPC: * * 或 float pow）
console.log('--- content: squared formulas ---');
n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (/exp_to_lv|level_exp|exp.*\*\s*exp|pow\s*\(/.test(s) && n < 10) { console.log(f); n++; }
}
// 4) 三段判定：combat 里的 judge/dodge/parry 阶段
console.log('--- combat files ---');
n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (/void\s+fight|mixed\s+combat|int\s+hit_ob|dodge_skill|parry_skill|armor_skill/.test(s) && n < 12) { console.log(f); n++; }
}
