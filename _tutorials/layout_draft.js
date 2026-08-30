// 草稿纸重排：多起点模拟退火，把每城房间重排成「相连必相邻、假邻尽量无」的网格布局
// 代价：隔格边(m-1)*12 + 边长*1 + 假邻*20 + 邻接方向错位*2；根钉在(0,0)
const fs = require('fs');
const G = JSON.parse(fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/draft_graph.json', 'utf8'));
const DIRV = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };

function rng(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

function buildCity(area, rooms){
  const nodes = Object.keys(rooms);
  const set = {}; nodes.forEach(n=>set[n]=1);
  const edges = []; const eseen = {};
  const dirEdges = []; // [a,b,d]
  nodes.forEach(a=>{
    const ex = rooms[a]||{};
    for(const d in ex){
      const b = ex[d];
      if(!set[b]||b===a) continue;
      dirEdges.push([a,b,d]);
      const k=[a,b].sort().join('|');
      if(!eseen[k]){ eseen[k]=1; edges.push([a,b]); }
    }
  });
  const adj = {}; nodes.forEach(n=>adj[n]=[]);
  edges.forEach(e=>{ adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
  return { nodes, edges, dirEdges, adj };
}

function directionalSeed(city, root){
  const cell = {}; const occ = {};
  if(root){ cell[root]={x:0,y:0}; occ['0,0']=root; }
  const bq=[root];
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
    const ex = G.areas._cur[c]||{};
    // 四向优先，其余方向键（nw/se 等）贴身安放——保证种子连通
    const dirs = ['n','s','e','w'].filter(d=>ex[d])
      .concat(Object.keys(ex).filter(d=>ex[d] && ['n','s','e','w'].indexOf(d)<0));
    for(const d of dirs){
      const t=ex[d];
      if(!t||cell[t]||!G.areas._set[t]) continue;
      const dv=DIRV[d];
      let tx, ty, k;
      if(dv){ tx=cell[c].x+dv[0]; ty=cell[c].y+dv[1]; k=tx+','+ty; }
      if(!dv || occ[k]){
        const f=freeNear(dv?tx:cell[c].x, dv?ty:cell[c].y);
        if(!f) continue; tx=f.x; ty=f.y; k=f.k;
      }
      occ[k]=t; cell[t]={x:tx,y:ty}; bq.push(t);
    }
  }
  let mx=0; for(const k in occ){ const v=Number(k.split(',')[0]); if(isFinite(v)) mx=Math.max(mx,v); }
  if(!isFinite(mx)) mx=40;
  city.nodes.forEach(n=>{ if(!cell[n]){ mx+=1; cell[n]={x:mx,y:0}; occ[mx+',0']=n; } });
  return { cell, occ };
}

function randomSeed(city, rand){
  const cell={}; const occ={};
  const root = city.root;
  cell[root]={x:0,y:0}; occ['0,0']=root;
  city.nodes.forEach(n=>{
    if(n===root) return;
    for(let r=0;r<40;r++){
      let placed=false;
      for(let dx=-r;dx<=r&&!placed;dx++) for(let dy=-r;dy<=r&&!placed;dy++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
        const jx=dx+Math.round((rand()*2-1)*1), jy=dy+Math.round((rand()*2-1)*1);
        const k=jx+','+jy;
        if(!occ[k]){ occ[k]=n; cell[n]={x:jx,y:jy}; placed=true; }
      }
      if(placed) break;
    }
    if(!cell[n]) console.log('!! randomSeed 放不下: '+n);
  });
  return { cell, occ };
}

function cost(city, cell, occ){
  let c=0, far=0, man=0;
  const stretchPairs=[];
  city.edges.forEach(e=>{
    const a=cell[e[0]], b=cell[e[1]];
    const d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
    man+=d;
    if(d>1){ far++; c+=(d-1)*14; stretchPairs.push([a,b]); }
    c+=d;
  });
  city.dirEdges.forEach(de=>{
    const dv=DIRV[de[2]];
    if(!dv) return;
    const a=cell[de[0]], b=cell[de[1]];
    if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1){
      if(b.x-a.x!==dv[0] || b.y-a.y!==dv[1]) c+=2;
    }
  });
  // 正交假邻：贴着却无路（重罚）
  let fa=0;
  for(const k in occ){
    const [x,y]=k.split(',').map(Number);
    const rn=occ[k];
    [[1,0],[0,1]].forEach(v=>{
      const o=occ[(x+v[0])+','+(y+v[1])];
      if(o && !city.adjSet[rn+'|'+o]) fa++;
    });
  }
  // 斜角假邻：只留极轻惩罚——斜角看着就是斜角，不算「楔在半路」
  let faDiag=0;
  for(const k in occ){
    const [x,y]=k.split(',').map(Number);
    const rn=occ[k];
    [[1,1],[1,-1]].forEach(v=>{
      const o=occ[(x+v[0])+','+(y+v[1])];
      if(o && !city.adjSet[rn+'|'+o]) faDiag++;
    });
  }
  // 楔路：隔格直连的路中间挤进第三间房——「看着在半路，走起来要绕」，重罚
  let wedge=0;
  for(const sp of stretchPairs){
    const mnx=Math.min(sp[0].x,sp[1].x), mxx=Math.max(sp[0].x,sp[1].x);
    const mny=Math.min(sp[0].y,sp[1].y), mxy=Math.max(sp[0].y,sp[1].y);
    for(const k in occ){
      const [x,y]=k.split(',').map(Number);
      if(x>mnx&&x<mxx&&y>mny&&y<mxy) wedge++;
    }
  }
  return { total: c + fa*20 + faDiag*2 + wedge*15, far: far, fa: fa, faDiag: faDiag, wedge: wedge, man: man };
}

function anneal(city, seed, iters, rand){
  const cell={}; const occ={};
  for(const k in seed.occ){ occ[k]=seed.occ[k]; }
  for(const n in seed.cell){ cell[n]={x:seed.cell[n].x, y:seed.cell[n].y}; }
  let cur = cost(city, cell, occ).total;
  let T = 6.0;
  const nodes = city.nodes;
  for(let i=0;i<iters;i++){
    T *= 0.99994;
    const v = nodes[1 + Math.floor(rand()*(nodes.length-1))];
    if(v===city.root || !cell[v]) continue;
    const dx=Math.round((rand()*2-1)*3), dy=Math.round((rand()*2-1)*3);
    if(!dx && !dy) continue;
    const nx=cell[v].x+dx, ny=cell[v].y+dy, k=nx+','+ny;
    if(Math.abs(nx)>22 || Math.abs(ny)>22) continue;   // 限制在边界盒内，防整体漂移
    const oldK=cell[v].x+','+cell[v].y;
    const other=occ[k];
    let newCost;
    if(other && other!==city.root){
      const oldX=cell[v].x, oldY=cell[v].y;
      occ[oldK]=other; occ[k]=v;
      cell[v]={x:nx,y:ny}; cell[other]={x:oldX,y:oldY};
      newCost = cost(city, cell, occ).total;
      if(newCost<=cur || rand()<Math.exp(-(newCost-cur)/Math.max(0.001,T))){
        cur=newCost; continue;
      }
      occ[oldK]=v; occ[k]=other;
      cell[v]={x:oldX,y:oldY}; cell[other]={x:nx,y:ny};
    } else if(!other){
      delete occ[oldK]; occ[k]=v; cell[v]={x:nx,y:ny};
      newCost = cost(city, cell, occ).total;
      if(newCost<=cur || rand()<Math.exp(-(newCost-cur)/Math.max(0.001,T))){
        cur=newCost; continue;
      }
      delete occ[k]; occ[oldK]=v; cell[v]={x:oldK.split(',')[0]*1, y:oldK.split(',')[1]*1};
    }
  }
  return { cell, occ, total: cur };
}

// —— 主流程 ——
// 字典序指标：①隔格边数 ②正交假邻 ③楔路 ④总边距 ⑤标量总代价
function lexMetric(city, cell, occ){
  const m = cost(city, cell, occ);
  return [m.far, m.fa, m.wedge, m.man, m.total];
}
function lexLess(a,b){ for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]<b[i]; } return false; }

function greedyDescent(city, cell, occ){
  // 末段收尾：半径3内挪/换，按字典序只收改进，至收敛
  let improved=true, guard=0;
  while(improved && guard++<300){
    improved=false;
    for(const v of city.nodes){
      if(v===city.root) continue;
      const oldX=cell[v].x, oldY=cell[v].y, oldK=oldX+','+oldY;
      const cur=lexMetric(city, cell, occ);
      let best=null;
      for(let dx=-3;dx<=3;dx++) for(let dy=-3;dy<=3;dy++){
        if(!dx&&!dy) continue;
        const nx=oldX+dx, ny=oldY+dy, k=nx+','+ny;
        const other=occ[k];
        if(other && (other===city.root || !cell[other])) continue;
        delete occ[oldK];
        if(other){
          const oX=cell[other].x, oY=cell[other].y;
          occ[oldK]=other; occ[k]=v; cell[v]={x:nx,y:ny}; cell[other]={x:oldX,y:oldY};
          const c2=lexMetric(city, cell, occ);
          if(lexLess(c2,cur) && (best===null||lexLess(c2,best.c))) best={x:nx,y:ny,k:k,other:other,c:c2};
          occ[oldK]=v; occ[k]=other; cell[v]={x:oldX,y:oldY}; cell[other]={x:oX,y:oY};
        } else {
          occ[k]=v; cell[v]={x:nx,y:ny};
          const c2=lexMetric(city, cell, occ);
          if(lexLess(c2,cur) && (best===null||lexLess(c2,best.c))) best={x:nx,y:ny,k:k,other:null,c:c2};
          delete occ[k]; occ[oldK]=v; cell[v]={x:oldX,y:oldY};
        }
      }
      if(best){
        if(best.other){
          occ[oldK]=best.other; occ[best.k]=v;
          cell[v]={x:best.x,y:best.y}; cell[best.other]={x:oldX,y:oldY};
        } else {
          delete occ[oldK]; occ[best.k]=v; cell[v]={x:best.x,y:best.y};
        }
        improved=true;
      }
    }
  }
}

// 远边救援：隔格边端点允许大步跳到 8 格内空位（按标量代价），贪心字典序治不了的漂移链用这个收
function rescueFar(city, cell, occ){
  for(let round=0; round<60; round++){
    let changed=false;
    const farPairs=[];
    city.edges.forEach(e=>{
      const a=cell[e[0]], b=cell[e[1]];
      if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)>1) farPairs.push(e);
    });
    for(const e of farPairs){
      for(const v of e){
        if(v===city.root) continue;
        const oldX=cell[v].x, oldY=cell[v].y, oldK=oldX+','+oldY;
        const cur=cost(city, cell, occ).total;
        let best=null;
        for(let dx=-8;dx<=8;dx++) for(let dy=-8;dy<=8;dy++){
          if(!dx&&!dy) continue;
          const nx=oldX+dx, ny=oldY+dy, k=nx+','+ny;
          if(occ[k]) continue;
          delete occ[oldK]; occ[k]=v; cell[v]={x:nx,y:ny};
          const c2=cost(city, cell, occ).total;
          if(c2<cur && (best===null||c2<best.c)) best={x:nx,y:ny,k:k,c:c2};
          delete occ[k]; occ[oldK]=v; cell[v]={x:oldX,y:oldY};
        }
        if(best){
          delete occ[oldK]; occ[best.k]=v; cell[v]={x:best.x,y:best.y};
          changed=true;
        }
      }
    }
    if(!changed) break;
  }
}

function renderDraft(city, cell, name){
  // 字符网格草稿：每格取房间名前4字，相连同排用名字并排示意
  let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;
  for(const n in cell){ mnx=Math.min(mnx,cell[n].x); mny=Math.min(mny,cell[n].y); mxx=Math.max(mxx,cell[n].x); mxy=Math.max(mxy,cell[n].y); }
  const lines=[];
  for(let y=mny;y<=mxy;y++){
    let row='';
    for(let x=mnx;x<=mxx;x++){
      const rn=occLookup(cell,x,y);
      row += rn? ('〔'+rn.slice(0,4)+'〕') : ' ···· ';
    }
    lines.push(row);
  }
  return lines.join('\n');
}
function occLookup(cell,x,y){
  for(const n in cell){ if(cell[n].x===x&&cell[n].y===y) return n; }
  return null;
}

const results = {};
const bake = {};
for(const cid in G.areas){
  if(cid==='_cur'||cid==='_set') continue;
  const rooms = G.areas[cid];
  const city = buildCity(cid, rooms);
  city.root = (G.meta[cid] && rooms[G.meta[cid].entry]) ? G.meta[cid].entry : Object.keys(rooms)[0];
  city.adjSet = {};
  city.edges.forEach(e=>{ city.adjSet[e[0]+'|'+e[1]]=1; city.adjSet[e[1]+'|'+e[0]]=1; });
  G.areas._cur = rooms; G.areas._set = {}; city.nodes.forEach(n=>G.areas._set[n]=1);
  let best = null;
  for(let s=0;s<4;s++){
    const rand = rng(1234567 + s*777 + cid.length*13 + (cid.charCodeAt(0)||7));
    const seed = (s%2===0) ? directionalSeed(city, city.root) : randomSeed(city, rand);
    const r = anneal(city, seed, 200000, rand);
    greedyDescent(city, r.cell, r.occ);
    rescueFar(city, r.cell, r.occ);
    greedyDescent(city, r.cell, r.occ);
    r.total = cost(city, r.cell, r.occ).total;
    if(!best || r.total<best.total) best = r;
  }
  // NaN 修复：任何未放置/坐标异常的房间，螺旋找空位放下
  (function repair(){
    const used={}; let bad=null;
    for(const n in best.cell){
      const c=best.cell[n];
      if(!c || !isFinite(c.x) || !isFinite(c.y) || Math.abs(c.x)>60 || Math.abs(c.y)>60) { bad=bad||[]; bad.push(n); continue; }
      used[c.x+','+c.y]=n;
    }
    (bad||[]).forEach(function(n){
      for(let r=0;r<50;r++) for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){
        if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
        const k=dx+','+dy;
        if(!used[k]){ best.cell[n]={x:dx,y:dy}; used[k]=n; r=999; break; }
      }
    });
  })();
  const m = cost(city, best.cell, best.occ);
  if(!isFinite(m.man)) console.log('!! '+cid+' 仍有异常坐标');
  // 归一化坐标（min→0）
  let mnx=1e9,mny=1e9;
  for(const n in best.cell){ mnx=Math.min(mnx,best.cell[n].x); mny=Math.min(mny,best.cell[n].y); }
  const baked={};
  for(const n in best.cell){ baked[n]=[best.cell[n].x-mnx, best.cell[n].y-mny]; }
  bake[cid]=baked;
  results[cid]={ rooms:city.nodes.length, edges:city.edges.length, far:m.far, false:m.fa, wedge:m.wedge, avgMan:+(m.man/city.edges.length).toFixed(3) };
  // 关键城市打印草稿（眼睛验收）
  if(['cheng_lizhu','cheng_dukou','cheng_jingcheng'].indexOf(cid)>-1){
    console.log('\n===== '+cid+' 草稿 =====');
    const draft=renderDraft(city, best.cell, cid);
    console.log(draft);
  }
  delete G.areas._cur; delete G.areas._set;
}
console.log('城市                     房间 边数 隔格 假邻 平均边距');
let tF=0,tFa=0,tW=0,tE=0;
for(const cid in results){
  const r=results[cid];
  tF+=r.far; tFa+=r.false; tW+=r.wedge; tE+=r.edges;
  console.log(cid.padEnd(20) + String(r.rooms).padStart(4) + String(r.edges).padStart(5) + String(r.far).padStart(4) + String(r.false).padStart(4) + String(r.wedge).padStart(4) + String(r.avgMan).padStart(8));
}
console.log('合计 边='+tE+' 隔格='+tF+' 正交假邻='+tFa+' 楔路='+tW);
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/baked_pos.json', JSON.stringify(bake), 'utf8');
console.log('烘焙表已写出: _tutorials/baked_pos.json');
