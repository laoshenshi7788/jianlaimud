// 查找 game 的声明与初始化
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/^\s*(let|var|const)\s+game\b/.test(l) || /^game\s*=/.test(l) || /\bgame\s*=\s*(null|\{\})\s*;?\s*$/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
