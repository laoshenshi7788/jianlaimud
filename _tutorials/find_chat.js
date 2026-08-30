const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function chatNpc|function casualChat|'闲聊'|闲聊|function npcChat/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 125));
  }
});
