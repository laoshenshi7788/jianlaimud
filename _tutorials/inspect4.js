const fs=require('fs');
let h=fs.readFileSync('E:/1/mud/2/JianLai mud/index.html','utf8');
const out=[];
const et=h.indexOf('const EVENT_TEMPLATES');
out.push('=== 500 chars before EVENT_TEMPLATES ===');
out.push(JSON.stringify(h.slice(et-500, et+40)));
// 同时找 615976 之后的第一个行首 ]; 上下文
const d=h.indexOf('const DRAMA={');
const c=h.indexOf('\r\n];', d);
out.push('first \\r\\n]; after DRAMA start at: '+c);
out.push(JSON.stringify(h.slice(c-160, c+60)));
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/inspect4.txt', out.join('\r\n'), 'utf8');
console.log('done');
