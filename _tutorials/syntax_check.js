const fs = require('fs');
const raw = fs.readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const blocks = [];
const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(raw)) !== null) blocks.push(m[1]);
blocks.forEach((code, bi) => {
  if (!code.trim()) return;
  try {
    new Function(code);
    console.log('script#' + bi + ' OK (' + code.length + ' chars)');
  } catch (e) {
    console.log('script#' + bi + ' SYNTAX ERROR: ' + e.message);
    // 定位：二分插入解析（利用 e.stack 的行号无法直接拿，改用逐段拼接检测）
    const lines = code.split('\n');
    // 用 vm 的 Script 拿行号
    const vm = require('vm');
    try { new vm.Script(code); } catch (e2) {
      const mm = (e2.stack || '').match(/<anonymous>:(\d+)/);
      if (mm) {
        const ln = parseInt(mm[1]);
        console.log('  大约在 script 内第 ' + ln + ' 行附近:');
        for (let j = Math.max(0, ln - 4); j <= Math.min(lines.length - 1, ln + 2); j++) {
          console.log('  ' + (j + 1) + '\t' + lines[j].slice(0, 120));
        }
      }
    }
  }
});
