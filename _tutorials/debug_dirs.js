const fs = require('fs');
const G = JSON.parse(fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/draft_graph.json', 'utf8'));
const keys = {};
let total = 0;
for(const cid in G.areas){
  const rooms = G.areas[cid];
  for(const rn in rooms){
    const ex = rooms[rn]||{};
    for(const d in ex){ keys[d]=(keys[d]||0)+1; total++; }
  }
}
console.log('全部出口方向键统计 (共 '+total+' 条):');
const arr = Object.entries(keys).sort((a,b)=>b[1]-a[1]);
arr.forEach(e=>console.log('  '+JSON.stringify(e[0])+': '+e[1]));
