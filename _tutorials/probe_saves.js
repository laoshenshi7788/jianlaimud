const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/SAVE_SLOTS|function saveGame|function loadGame|function hasAnySave|function backToTitle|ts-new|ts-continue|function showTitleScreen|function hideTitleScreen|_curSlot\s*=/i.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 125));
  }
});
