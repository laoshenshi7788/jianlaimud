const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
for (let i = 3583; i < 3596 && i < L.length; i++) {
  const s = L[i];
  console.log((i + 1) + ' (len ' + s.length + '): ' + s.slice(0, 200));
}
