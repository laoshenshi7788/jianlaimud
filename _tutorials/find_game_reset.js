// 查找 game 重新赋值的位置（新开局重置）
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/\bgame\s*=\s*(?!.*==)/.test(l) && !/game\s*=\s*null/.test(l) === false || /^\s*game\s*=/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
console.log('---');
lines.forEach((l, i) => {
  if (/function\s+\w*[Nn]ew\w*Game|function\s+resetGame|function\s+startNew/.test(l)) {
    console.log('FN ' + (i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
