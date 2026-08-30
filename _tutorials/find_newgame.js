// 查找 newGame / 开局 look() 的调用链
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function newGame|newGame\(|ss-next|function homeRoom|function hasItem|function addItem|function logTitle/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
