const fs=require('fs');
const h=fs.readFileSync('E:/1/mud/2/JianLai mud/index.html','utf8');
const out=[];
const d=h.indexOf('const DRAMA={');
const yang=h.indexOf("'杨老头':{", d);
out.push('DRAMA at '+d+' | 杨老头 at '+yang);
if(yang>0){
  out.push('=== 800 chars after 杨老头 ===');
  out.push(JSON.stringify(h.slice(yang, yang+800)));
  const c1=h.indexOf('  }}\r\n];', yang);
  out.push('first `  }}\\r\\n];` after yang at: '+c1);
  if(c1>0) out.push(JSON.stringify(h.slice(c1-200, c1+40)));
}
// 事件数组尾部（拱手婉拒之后）
const adm=h.indexOf('拱手婉拒');
if(adm>0){
  out.push('=== 500 chars after 拱手婉拒 ===');
  out.push(JSON.stringify(h.slice(adm, adm+500)));
}
// 文圣出现次数
let n=0,i=0,ps=[];
while((i=h.indexOf('文圣：读书人的道理',i))>-1){n++;ps.push(i);i+=5;}
out.push('文圣 count: '+n+' at '+ps.join(','));
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/inspect2.txt', out.join('\n'), 'utf8');
console.log('done');
