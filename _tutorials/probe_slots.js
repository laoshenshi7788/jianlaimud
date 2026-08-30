const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
L.forEach((l, i) => {
  if (/SAVE_SLOTS|function saveGame|function loadGame|function hasAnySave|ts-continue|function showTitleScreen|function renderTitleSaves|_curSlot\s*=/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 120));
  }
});
