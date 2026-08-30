const fs = require('fs');
const G = JSON.parse(fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/draft_graph.json', 'utf8'));
const DIRV = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };
const rooms = G.areas['cheng_lizhu'];
const nodes = Object.keys(rooms);
const set = {}; nodes.forEach(n=>set[n]=1);
const root = G.meta['cheng_lizhu'].entry;
console.log('root=', root, ' nodes=', nodes.length);
const cell = {}; const occ = {};
cell[root] = {x:0,y:0}; occ['0,0'] = root;
const bq = [root];
function freeNear(cx,cy){
  for(let r=1;r<=4;r++){
    let best=null;
    for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
      const k=(cx+dx)+','+(cy+dy);
      if(occ[k]) continue;
      const man=Math.abs(dx)+Math.abs(dy);
      if(!best||man<best.man) best={x:cx+dx,y:cy+dy,man:man};
    }
    if(best) return best;
  }
  return null;
}
while(bq.length){
  const c=bq.shift(); if(!cell[c]) continue;
  const ex=rooms[c]||{};
  for(const d of ['n','s','e','w']){
    const t=ex[d];
    if(!t||cell[t]||!set[t]) continue;
    let tx=cell[c].x+DIRV[d][0], ty=cell[c].y+DIRV[d][1];
    let k=tx+','+ty;
    if(occ[k]){ const f=freeNear(tx,ty); if(!f) continue; tx=f.x; ty=f.y; k=f.k; }
    if(Math.abs(tx)>30 || Math.abs(ty)>30) console.log('巨坐标!', c, d, '->', t, tx, ty, '父@', cell[c].x, cell[c].y);
    occ[k]=t; cell[t]={x:tx,y:ty}; bq.push(t);
  }
}
let mx=0; for(const k in occ) mx=Math.max(mx, Number(k.split(',')[0]));
console.log('BFS后 max_x=', mx, ' 已放=', Object.keys(cell).length, '/', nodes.length);
nodes.forEach(n=>{ if(!cell[n]){ mx+=1; cell[n]={x:mx,y:0}; occ[mx+',0']=n; console.log('孤立补位:', n, mx, 0); } });
