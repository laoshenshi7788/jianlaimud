const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function affGain|function npcViewOf|function giftTierLabel|function gainAff/.test(l)) {
    const j = l.match(/^(\d+):/);
    console.log('DEF ' + (i + 1) + ': ' + l.trim().slice(0, 110));
  }
});
const i0 = lines.findIndex(l => /function affGain/.test(l));
if (i0 > -1) for (let k = i0; k < i0 + 26; k++) console.log((k + 1) + ': ' + lines[k].trim().slice(0, 130));
const i1 = lines.findIndex(l => /function npcViewOf/.test(l));
if (i1 > -1) for (let k = i1; k < i1 + 22; k++) console.log('V' + (k + 1) + ': ' + lines[k].trim().slice(0, 130));
