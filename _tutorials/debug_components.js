const fs = require('fs');
const G = JSON.parse(fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/draft_graph.json', 'utf8'));
const rooms = G.areas['cheng_lizhu'];
const nodes = Object.keys(rooms);
const set = {}; nodes.forEach(n=>set[n]=1);
// 连通分量
const comp = {}; let cid=0;
nodes.forEach(s=>{
  if(comp[s]!==undefined) return;
  cid++; const q=[s]; comp[s]=cid;
  while(q.length){
    const c=q.shift();
    const ex=rooms[c]||{};
    for(const d in ex){
      const t=ex[d];
      if(!set[t]||comp[t]!==undefined) continue;
      comp[t]=cid; q.push(t);
    }
  }
});
const byComp={};
nodes.forEach(n=>{ (byComp[comp[n]]=byComp[comp[n]]||[]).push(n); });
console.log('连通分量数:', cid);
for(const k in byComp){
  console.log('\n== 分量'+k+' ('+byComp[k].length+'间): '+byComp[k].slice(0,8).join('、')+(byComp[k].length>8?' …':''));
}
// 找跨分量断边：某房出口指向本层内另一分量（不可能，连通分量已含所有层内边）
// 所以断点=出口指向层外房间（被导出过滤掉）。列出每间房的层外出口：
console.log('\n== 各房间指向层外的出口（被过滤的边）==');
nodes.forEach(n=>{
  const ex=rooms[n]||{};
  for(const d in ex){
    const t=ex[d];
    if(!set[t]) console.log(n+' --'+d+'--> '+t);
  }
});
