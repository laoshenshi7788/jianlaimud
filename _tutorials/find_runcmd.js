// 查找 runCmd 定义与 'look' 分支
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function runCmd|case\s*'look'|===\s*'look'/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
