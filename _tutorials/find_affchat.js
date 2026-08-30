const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (i > 6900 && i < 7900 && /aff\b/.test(l) && /<|<=/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 140));
  }
});
