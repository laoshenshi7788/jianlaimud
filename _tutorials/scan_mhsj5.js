// feature 目录列表 + improve_skill / potential 定义位置
const fs = require('fs');
const path = require('path');
const base = 'E:/1/mud/2/mhsj-main/mhsj-main';
let lines = [];
(function walk(d) {
  let list;
  try { list = fs.readdirSync(d); } catch (e) { return; }
  for (const f of list) {
    const p = path.join(d, f);
    let st; try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) walk(p);
    else if (/feature|daemons|include/i.test(p) && /\.(c|h)$/i.test(f)) {
      let s; try { s = fs.readFileSync(p, 'latin1'); } catch (e) { return; }
      if (/int\s+improve_skill|void\s+improve_skill|can_improve_skill|query_skill_mapped/.test(s)) lines.push('IMPROVE: ' + p);
      if (/potential/.test(p.split(/[\\\/]/).pop())) lines.push('NAME: ' + p);
    }
  }
})(base);
fs.writeFileSync('_tutorials/_mhsj_improve.txt', lines.join('\n'));
console.log('wrote ' + lines.length);
