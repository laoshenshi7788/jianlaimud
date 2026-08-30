const fs = require('fs');
const path = 'E:/1/mud/2/JianLai mud/index.html';
const html = fs.readFileSync(path, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.log('NO_SCRIPT_FOUND'); process.exit(1); }
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/_script_check.js', m[1], 'utf8');
console.log('script bytes:', m[1].length);
// 静态一致性检查
const checks = [];
// 1. 新 NPC 是否都注册
for (const n of ['文圣','李柳','郑大风','曹慈','裴杯','姜尚真','陆沉','余斗','陈暖树','陈景清','赊月','魏晋','马苦玄','陆台','鸡汤和尚']) {
  const re = new RegExp("'\\s*" + n + "\\s*':\\{\\s*title:");
  checks.push(['NPC ' + n, re.test(m[1])]);
}
// 2. 新任务是否注册
for (const q of ['薪火','问拳','云窟的账','月魄传书','道祖的棋','武神之问','一碗鸡汤']) {
  checks.push(['QUEST ' + q, new RegExp("'" + q + "':\\{\\s*title:").test(m[1])]);
}
// 3. 任务引用的 NPC 是否存在
for (const [q, giver] of [['薪火','文圣'],['问拳','曹慈'],['云窟的账','姜尚真'],['月魄传书','赊月'],['道祖的棋','陆沉'],['武神之问','裴杯'],['一碗鸡汤','鸡汤和尚']]) {
  const re = new RegExp("'" + q + "':\\{[^}]*giver:'" + giver + "'");
  checks.push(['QUEST ' + q + ' giver=' + giver, re.test(m[1])]);
}
// 4. 新函数是否存在
for (const f of ['function updateQuestTracker','function questProgressText','function setMapTip','function setMapLegend','function drawGeoLink','function renderZhouMap','function computeGridLayout']) {
  checks.push(['FN ' + f, m[1].includes(f)]);
}
let fail = 0;
for (const [k, ok] of checks) { if (!ok) { console.log('FAIL', k); fail++; } }
console.log(fail === 0 ? 'ALL_STATIC_CHECKS_PASS (' + checks.length + ')' : 'FAILURES: ' + fail);
