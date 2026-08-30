const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
// 1) 侧栏修为/属性行渲染
lines.forEach((l, i) => {
  if (/修为|潜能|经验/.test(l) && i > 18710 && i < 18800) console.log('SB ' + (i + 1) + ': ' + l.trim().slice(0, 130));
});
// 2) 修炼面板按钮区（找「雪花钱灌顶」附近，演练按钮要加在那）
lines.forEach((l, i) => {
  if (/雪花钱灌顶/.test(l) && i > 10580) console.log('CULT ' + (i + 1) + ': ' + l.trim().slice(0, 120));
});
// 3) 行囊物品行渲染（找 desc 显示处）
lines.forEach((l, i) => {
  if (/function openBackpack|function renderPack/.test(l)) console.log('PACK ' + (i + 1) + ': ' + l.trim().slice(0, 110));
});
// 4) 物品存在性
const src = lines.join('\n');
['寒髓','剑穗','紫金砂','棋谱','五彩绳','山神香','雷击木','蛇胆石','胭脂','灯油','吴钩','金创药'].forEach(n => {
  const re = new RegExp("ITEMS\\['" + n + "'\\]");
  console.log(n + ': ' + (re.test(src) ? '有' : '无'));
});
// 5) onEnemyDefeated 战胜结算（潜能奖励挂钩处）
lines.forEach((l, i) => {
  if (/function onEnemyDefeated|function onPlayerDown/.test(l)) console.log('WIN ' + (i + 1) + ': ' + l.trim().slice(0, 110));
});
