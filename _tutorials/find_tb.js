// 查找所有写 travel-bar 的地方
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/travel-bar/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
