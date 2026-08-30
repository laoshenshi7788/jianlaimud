const fs = require('fs');
const path = require('path');
function walk(d, depth, out) {
  if (depth > 2) return;
  let list;
  try { list = fs.readdirSync(d); } catch (e) { return; }
  for (const f of list) {
    const p = path.join(d, f);
    let st; try { st = fs.statSync(p); } catch (e) { continue; }
    if (st.isDirectory()) { out.push('D ' + p); walk(p, depth + 1, out); }
    else out.push('F ' + p);
  }
}
const out = [];
walk('E:/1/mud', 0, out);
out.filter(x => /mhsj/i.test(x)).slice(0, 40).forEach(x => console.log(x));
console.log('total entries scanned: ' + out.length);
