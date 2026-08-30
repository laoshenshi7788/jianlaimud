// 核查：哪些任务奖励了新批次物品（法宝/锻造兵器/新丹药）
const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
// 收集所有任务定义中的 reward.item
const qStart = f.findIndex(l => l.includes('const QUESTS = {'));
let depth = 0, qEnd = -1;
for (let i = qStart; i < f.length; i++) {
  for (const ch of f[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > qStart) { qEnd = i; break; }
}
const rewardItems = [];
for (let i = qStart; i <= qEnd; i++) {
  const m = f[i].match(/item:\s*'([^']+)'/);
  if (m) rewardItems.push(m[1]);
}
console.log('任务奖励物品 (' + rewardItems.length + '):');
rewardItems.forEach(r => console.log('  ' + r));
// 检查新批次物品是否被任务奖励覆盖
const newItemNames = ['断浪','偃月刀','破军枪','玄铁剑','缚妖索','照妖古镜','玄龟背盾符','紫金铃','摄魂幡','剑心通明佩','番天印','山河社稷图','聚灵丹','凝神丹','小还丹','洗髓丹','九转还魂丹','精钢护腕','疾风靴','踏云履','逐日靴','玄铁盔','藤盔','嵌玉腰带','蟒筋束带','圆木盾','精钢小盾','玄铁鸢盾','云锦仙绫'];
const covered = newItemNames.filter(n => rewardItems.includes(n));
const uncovered = newItemNames.filter(n => !rewardItems.includes(n));
console.log('\n已覆盖: ' + covered.length + '/' + newItemNames.length);
console.log('未覆盖: ' + uncovered.join(', '));
// 检查锻造产出是否在任务奖励中
const smithKeys = ['青锋','断浪','玄铁剑','破军枪','偃月刀','太白','开天·锤·造化品','后羿·弓·造化品','青冥·剑·造化品'];
console.log('\n锻造产出任务覆盖: ' + smithKeys.filter(s => rewardItems.includes(s)).length + '/' + smithKeys.length);
