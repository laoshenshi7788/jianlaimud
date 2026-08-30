const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
f.forEach((l, i) => {
  if (l.includes('.hint') && i > 14750 && i < 14840) console.log((i + 1) + '\t' + l.trim().slice(0, 130));
});
