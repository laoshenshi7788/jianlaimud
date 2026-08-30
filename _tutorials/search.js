// 用法: node search.js <模式> [起始行] [结束行] [--ctx N]
// 模式按 UTF-8 字面串匹配（非正则），输出行号与内容
const fs = require('fs');
const args = process.argv.slice(2);
const pat = args[0];
const from = args[1] ? parseInt(args[1]) : 1;
const to = args[2] ? parseInt(args[2]) : Infinity;
const ctxIdx = args.indexOf('--ctx');
const ctx = ctxIdx > -1 ? parseInt(args[ctxIdx + 1]) : 0;
const file = 'E:/1/mud/2/JianLai mud/index.html';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
let hits = 0;
for (let i = 0; i < lines.length; i++) {
  const ln = i + 1;
  if (ln < from || ln > to) continue;
  if (lines[i].includes(pat)) {
    hits++;
    if (ctx > 0) {
      for (let j = Math.max(0, i - ctx); j <= Math.min(lines.length - 1, i + ctx); j++) {
        console.log((j + 1) + (j === i ? ' >' : '  ') + '\t' + lines[j]);
      }
      console.log('---');
    } else {
      console.log(ln + '\t' + lines[i].slice(0, 300));
    }
    if (hits > 200) { console.log('...(超过200条截断)'); break; }
  }
}
console.log('## 共 ' + hits + ' 处');
