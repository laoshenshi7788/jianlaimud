// 查找 tutHint / tutFlags 的调用点
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/tutHint|tutFlags|tutDone|tutSkip|TUT_STEPS/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
