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
// 潜能操作
console.log('--- 潜能 set/add/query ---');
let n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (/(set|add|query|improve)\(\s*["']潜能["']/.test(s) && n < 12) { console.log(f + '  x' + (s.match(/["']潜能["']/g) || []).length); n++; }
}
// 平方公式：exp 与 level 平方
console.log('--- squared exp curve ---');
n = 0;
for (const f of out) {
  if (!/\.(c|h)$/i.test(f)) continue;
  let s; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  const m = s.match(/(next|need|cost|level)[^\n]{0,60}(exp|potential)[^\n]{0,80}(\*\*|pow|平方|\/\s*100\s*\*)/i);
  if (m && n < 12) { console.log(f + '  :: ' + m[0].slice(0, 100)); n++; }
}
// combatd 三段判定核心：搜索 attack 函数里的 dodge/parry/armor 顺序
const cd = fs.readFileSync('E:/1/mud/2/mhsj-main/mhsj-main/adm/daemons/combatd.c', 'utf8');
const L = cd.split(/\r?\n/);
console.log('--- combatd: judgment stages ---');
L.forEach((l, i) => {
  if (/dodge_skill|parry_skill|armor_skill|valid_hit|hit_ob|do_attack/i.test(l)) console.log((i + 1) + ': ' + l.trim().slice(0, 110));
});
