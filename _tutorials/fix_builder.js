const fs = require('fs');
let s = fs.readFileSync('_tutorials/build_questhub2.js', 'utf8');
// 前一次误改把 `。')` 变成 `。''`——修正为 `。',`
let n1 = 0;
s = s.replace(/。''/g, function () { n1++; return "。',"; });
s = s.replace(/？''/g, function () { n1++; return "？',"; });
s = s.replace(/！''/g, function () { n1++; return "！',"; });
// 还有未处理的 `。')`（半角右括号残留）
let n2 = 0;
s = s.replace(/。'\)/g, function () { n2++; return "。',"; });
fs.writeFileSync('_tutorials/build_questhub2.js', s);
console.log("fixed quotes:" + n1 + "  remaining parens:" + n2);
