const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
f.forEach((l, i) => {
  if (l.includes("it.type==='weapon'") && f[i - 1] && f[i - 1].includes('} else if') || l.includes("} else if(it.type==='weapon')")) console.log('weapon branch ' + (i + 1));
  if (l.includes("else if(it.type==='offhand')")) console.log('offhand branch ' + (i + 1));
});
const s = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const j = s.indexOf("else if(it.type==='weapon')");
console.log(s.slice(j - 200, j + 120));
