const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
f.forEach((l, i) => {
  if (l.includes('function tickEstates()')) console.log('tickEstates at ' + (i + 1));
  if (l.includes("logSuccess('（锤声三响")) console.log('smith success at ' + (i + 1));
  if (l.includes('铁料裂了纹')) console.log('fail at ' + (i + 1));
});
