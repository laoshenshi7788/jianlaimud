const fs=require('fs');
const src=fs.readFileSync(__dirname+'\\_check.js','utf8');
let depth=0, line=1, inS=null, esc=false;
const bad=[];
for(let i=0;i<src.length;i++){
  const c=src[i];
  if(c==='\n'){ line++; continue; }
  if(esc){ esc=false; continue; }
  if(c==='\\'){ esc=true; continue; }
  if(inS){ if(c===inS) inS=null; continue; }
  if(c==='"'||c==="'"||c==='`'){ inS=c; continue; }
  if(c==='/'&&src[i+1]==='/'){ while(i<src.length&&src[i]!=='\n') i++; continue; }
  if(c==='/'&&src[i+1]==='*'){ i+=2; while(i<src.length&&!(src[i]==='*'&&src[i+1]==='/')){ if(src[i]==='\n') line++; i++; } continue; }
  if(c==='{'||c==='('||c==='[') depth++;
  if(c==='}'||c===')'||c===']'){
    depth--;
    if(depth<0){
      bad.push('NEG @ line '+line+' ctx: '+src.substr(Math.max(0,i-70),90).replace(/\n/g,'|'));
      depth=0;
    }
  }
}
console.log(bad.length? bad.slice(0,6).join('\n\n') : ('no negative. EOF depth='+depth));
