const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/STONE_RATE|lingStone\s*[*\/]|jinjing|xiaoshu|guyu/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
