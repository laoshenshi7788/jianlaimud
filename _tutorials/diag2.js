const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const iHub = lines.findIndex(l => l.indexOf('const QUESTS_HUB=') > -1);
console.log('QUESTS_HUB at file line ' + (iHub + 1));
// script 起始行（找 <script> 标签）
const iScript = lines.findIndex(l => l.indexOf('<script>') > -1 || /<script\b/.test(l));
console.log('script tag at file line ' + (iScript + 1));
// 因此 m11（script 3588）≈ file 3588+offset
const target = 3588 + (iScript + 1);
console.log('target file line ≈ ' + target);
const line = lines[target - 1];
let bad = [];
for (let i = 0; i < line.length; i++) {
  const c = line.charCodeAt(i);
  if (c < 32 && c !== 9 && c !== 10 && c !== 13) bad.push('ctrl@' + i + ' code' + c + ' ctx=' + JSON.stringify(line.slice(Math.max(0, i - 20), i + 20)));
}
console.log('bad chars: ' + (bad.length ? bad.join('\n') : 'none'));
// 找含 </script 或 <!-- 的注入
if (/<\/script/i.test(line)) console.log('!! contains </script');
console.log('line head: ' + line.slice(0, 120));
