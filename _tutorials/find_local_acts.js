// 查找「就地行事」按钮与 tutHint 相关的 UI 锚点
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/就地行事|btn-look|就地/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
