const fs = require('fs');
const h = fs.readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const i = h.indexOf('文圣：读书人的道理');
console.log('marker at', i);
console.log(JSON.stringify(h.slice(i - 80, i + 20)));
