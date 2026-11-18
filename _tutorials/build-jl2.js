// 把 src/ 下的 JL2 模块幂等注入 index.html 的哨兵块。
// 只替换 //<<JL2-BEGIN>> 与 //<<JL2-END>> 之间的内容，不碰其它代码。
const fs = require('fs');
const path = require('path');
const BASE = path.resolve(__dirname, '..');
const P = path.join(BASE, 'index.html');
const SRC = path.join(BASE, 'src');
const FILES = ['quest2.js', 'progression2.js', 'combat2.js', 'materials2.js', 'dialogue2.js', 'social2.js', 'guides2.js', 'text2.js', 'content2.js', 'loops2.js', 'asks2.js', '_boot.js'];

const missing = FILES.filter(function(f){ return !fs.existsSync(path.join(SRC, f)); });
if (missing.length) { console.error('缺少模块：' + missing.join(', ')); process.exit(1); }

const body = FILES.map(function(f){
  return '// ---- src/' + f + ' ----\n' +
         fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\s+$/, '');
}).join('\n\n');
const BEGIN = '//<<JL2-BEGIN>>';
const END = '//<<JL2-END>>';
const block = BEGIN + '\n' + body + '\n' + END;

const raw = fs.readFileSync(P, 'utf8');
const eol = raw.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
let t = raw.split(/\r?\n/).join('\n');
const i = t.indexOf(BEGIN), j = t.indexOf(END);

if (i >= 0 && j > i) {
  t = t.slice(0, i) + block + t.slice(j + END.length);
} else if (i < 0 && j < 0) {
  const anchor = "// 启动\nwindow.addEventListener('DOMContentLoaded', init);";
  if (t.indexOf(anchor) < 0) { console.error('找不到启动锚点，拒绝注入'); process.exit(1); }
  t = t.replace(anchor, block + '\n\n' + anchor);
} else {
  console.error('哨兵块不完整，拒绝注入'); process.exit(1);
}

fs.writeFileSync(P, t.split('\n').join(eol), 'utf8');
console.log('JL2 注入完成：' + FILES.join(', '));
console.log('块大小：' + block.length + ' 字节');
