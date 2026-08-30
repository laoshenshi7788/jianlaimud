const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/#log\s*\{|#log:|\.modal\s*\{|#overlay\s*\{|#log\b.*overflow|overflow.*#log/.test(l) || (/border-radius/.test(l) && /log|modal/i.test(l)) || (/max-height/.test(l) && i < 800)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 150));
  }
});
