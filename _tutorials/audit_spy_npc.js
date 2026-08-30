const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
// 间谍系统
f.forEach((l, i) => {
  if (/spy|间谍|探子|暗桩/.test(l) && /function|const|let|var/.test(l)) console.log('SPY ' + (i + 1) + '\t' + l.trim().slice(0, 120));
});
// NPC 装备字段
f.forEach((l, i) => {
  if (/npc\.equip|npc\.weapon|npc\.artifact|npc\.gongfa/.test(l)) console.log('NPC-EQ ' + (i + 1) + '\t' + l.trim().slice(0, 120));
});
// NPC 功法
f.forEach((l, i) => {
  if (/npc\.skills|npcSkill/.test(l)) console.log('NPC-SK ' + (i + 1) + '\t' + l.trim().slice(0, 120));
});
