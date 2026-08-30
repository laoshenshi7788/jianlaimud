const fs=require('fs');
let h=fs.readFileSync('E:/1/mud/2/JianLai mud/index.html','utf8');
const out=[];
const d=h.indexOf('const DRAMA={');
const et=h.indexOf('const EVENT_TEMPLATES');
out.push('DRAMA at '+d+' | EVENT_TEMPLATES at '+et);
// DRAMA 区内所有 2 空格缩进 NPC 键
const seg=h.slice(d, et);
const re=/^  '([^']+)':\{/gm;
let m, keys=[];
while((m=re.exec(seg))){ keys.push({name:m[1], pos:d+m.index}); }
out.push('npc keys: '+keys.length+' | last: '+JSON.stringify(keys[keys.length-1]));
const last=keys[keys.length-1];
out.push('=== 700 chars from last NPC ===');
out.push(JSON.stringify(h.slice(last.pos, last.pos+700)));
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/inspect3.txt', out.join('\r\n'), 'utf8');
console.log('done');
