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
console.log('--- potential (ascii) ---');
let n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'latin1'); } catch (e) { continue; }
  const c = (s.match(/potential/g) || []).length;
  if (c > 3 && /improve_skill|can_improve/.test(s) && n < 10) { console.log(f + '  x' + c); n++; }
}
console.log('--- improve_skill def ---');
n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'latin1'); } catch (e) { continue; }
  if (/varargs\s+(varargs\s+)?int\s+improve_skill|function\s+improve_skill|int\s+can_improve/.test(s) && n < 10) { console.log(f); n++; }
}
console.log('--- level/exp curve ---');
n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'latin1'); } catch (e) { continue; }
  if (/combat_exp.*\*\s*\*|exp.*level\s*\*\s*level|level\s*\*\s*level\s*\*\s*\d|\bexp_need|next_level|exp_for/.test(s) && n < 14) { console.log(f); n++; }
}
