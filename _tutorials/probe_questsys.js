const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
// 任务面板 / 章节系统 / QUESTS 结构
lines.forEach((l, i) => {
  if (/function openQuests|function chapterName|function chapterGoal|game\.chapter\s*=|const QUESTS\s*=|function checkQuest|function grantQuest|function acceptQuest|function startQuest|function tickQuestTtl|function questProgress|function canTurnin/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 125));
  }
});
