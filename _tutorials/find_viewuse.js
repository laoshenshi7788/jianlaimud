const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/npcViewOf\(|view_scorn|view_cold|VIEW_TXT|viewTxt|view\s*===?\s*'冷淡'|view\s*===?\s*'戒备'/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 135));
  }
});
