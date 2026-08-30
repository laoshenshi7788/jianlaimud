// 移除 build_items2.js 尾部重复的 WDESC/ADESC 定义
const fs = require('fs');
let s = fs.readFileSync('_tutorials/build_items2.js', 'utf8');
const first = s.indexOf('const WDESC');
const second = s.indexOf('const WDESC', first + 1);
if (second > -1) {
  // 找到第二处定义的起止（到 ADESC 行结束）
  const aend = s.indexOf('\n', s.indexOf('const ADESC', second));
  s = s.slice(0, second) + s.slice(aend + 1);
  fs.writeFileSync('_tutorials/build_items2.js', s);
  console.log('removed dup at ' + second);
} else console.log('no dup');
