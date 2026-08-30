const fs=require('fs');
const src=fs.readFileSync(__dirname+'\\..\\index.html','utf8').replace(/\r\n/g,'\n');
const i=src.indexOf("sc[1]");
if(i<0){ console.log('sc[1] not found'); process.exit(0); }
console.log('sc[1] @'+i);
console.log(src.substr(i, 600));
