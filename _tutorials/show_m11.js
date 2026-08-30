const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const i = lines.findIndex(l => l.indexOf("'m11':Object.assign") > -1);
console.log('m11 at file line ' + (i + 1));
const line = lines[i];
console.log('len ' + line.length);
for (let k = 0; k < line.length; k++) {
  const c = line.charCodeAt(k);
  if (c < 32 && c !== 9) console.log('ctrl@' + k + ' code' + c);
}
// 在 "?" 附近找异常（token 错误多半是未闭合引号）
console.log(line.slice(0, 400));
