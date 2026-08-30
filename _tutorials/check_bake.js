const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
f.forEach((l, i) => {
  if (l.includes('"cheng|cheng_dukou"') || l.includes('BAKED_MAP_POS')) console.log((i + 1) + '\t' + l.trim().slice(0, 100));
});
