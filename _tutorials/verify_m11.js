const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const i = L.findIndex(l => l.indexOf("'m11':Object.assign") > -1);
fs.writeFileSync('_tutorials/_v.txt', 'm11: ' + L[i].slice(0, 200) + '\n...\n' + L[i].slice(-300));
console.log('ok');
