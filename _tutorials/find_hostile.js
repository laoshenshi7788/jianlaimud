const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/敌意|冷眼|爱答不理|不悦|scowl|hostile|aff<\d+|aff<=\d+|好感低/.test(l) && /aff|好感/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
