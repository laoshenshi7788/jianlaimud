const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/function doTravel|function enterCheng|function exitToZhou|function exitToCheng|function gotoCheng|function travelTo|CHENG_CFG\[.*\]\s*\)|mapLevel\s*===?\s*'zhou'/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
