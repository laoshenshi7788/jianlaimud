// 定位现有战斗结算：playerAttack / enemyTurn / calcAtk / effMaxHp / battle 结构
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function playerAttack|function enemyTurn|function calcAtk|function effMaxHp|function effMaxMp|function effDef|function startFight|function playerDefend|function tryFlee|function gainRealize|function getSkill\(/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
