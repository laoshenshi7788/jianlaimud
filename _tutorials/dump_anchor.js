const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').replace(/\r\n/g,'\n');
const i=src.indexOf('function computeGridLayout');
const seg=src.substr(i, 6000);
const ci=seg.indexOf('CELL_W');
console.log('CELL_W in seg @'+ci);
console.log(seg.substr(Math.max(0,ci-500), 800));
