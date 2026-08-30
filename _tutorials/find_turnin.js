const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
L.forEach((l, i) => {
  if (/turnLines|turnOptions|function turnInQuest|function openTurnin|交付/.test(l) && i > 8150 && i < 9200) {
    out.push((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
fs.writeFileSync('_tutorials/_turn.txt', out.join('\n') || 'none');
console.log('written ' + out.length);
