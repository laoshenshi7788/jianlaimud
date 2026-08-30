const fs=require('fs');
const src=fs.readFileSync(__dirname+'\\..\\index.html','utf8').replace(/\r\n/g,'\n');
const i=src.indexOf('madeArea++; made++;');
console.log('made++ @'+i);
console.log(src.substr(i, 900));
