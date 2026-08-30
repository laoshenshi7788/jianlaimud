const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function expNeeded|function updateSidebar|s-skills|function openSpy|function spyBuff|game\.spy=|function castSpy|function QUESTS|QUESTS_EXTRA2\s*=|NPC_DEEP_EXTRA\s*=|function masteryTier|MASTERY_STEPS\s*=|function enemyReduction|function dmgReduction|QUALITY_ORDER|function qualityColor/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 118));
  }
});
