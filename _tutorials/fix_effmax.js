const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
// 修 11193（损坏行）：截断尾巴 ]','hands','waist','feet'] 需去掉
const badMp = lines[11192];
if (badMp.includes("artifact']','hands'")) {
  lines[11192] = badMp.replace("artifact']','hands','waist','feet'].forEach", "artifact'].forEach");
  console.log('effMaxMp 行已修复');
} else console.log('effMaxMp 行无需修复');
// 修 11194：加 artifact
const hpLine = lines[11193];
if (hpLine.includes("['accessory','weapon','offhand','armor','head','hands','waist','feet']")) {
  lines[11193] = hpLine.replace("['accessory','weapon','offhand','armor','head','hands','waist','feet']", "['accessory','weapon','offhand','armor','head','hands','waist','feet','artifact']");
  console.log('effMaxHp 行已加 artifact');
} else console.log('effMaxHp 行无需修复');
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('OK');
