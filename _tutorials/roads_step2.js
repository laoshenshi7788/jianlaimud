#!/usr/bin/env node
/* roads_step2.js —— 第二步：插真实路房间
   预布局 → 找隔一格的相连对 → 中间生成路房间（label=路名，双向连两端）
   → 清布局缓存让正式渲染重排。 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const anchor='  // 节点（方框）\n  layerRooms.forEach(function(rn){';
if(!src.includes(anchor)) throw new Error('anchor missing');
const block=[
"  // —— 路即房间：隔一格的相连对，中间生成真实「路房间」（可走可停，双向连两端） ——",
"  (function insertRoadRooms(){",
"    _gridCache=null;",
"    const L=computeGridLayout();",
"    const done={}; let added=0;",
"    const OP={n:'s',s:'n',e:'w',w:'e'};",
"    const pool=Object.keys(ROOMS).filter(function(n){ const r=ROOMS[n]; return r&&r.area&&typeof r.bld!=='string'&&r.exits; });",
"    pool.forEach(function(a){",
"      const ra=ROOMS[a];",
"      for(const d in ra.exits){",
"        if(!OP[d]) continue; // 只处理正交方向",
"        const b=ra.exits[d]; const rb=ROOMS[b];",
"        if(!rb||rb.area!==ra.area) continue; // 同城才插路",
"        const key=a<b? a+'|'+b : b+'|'+a;",
"        if(done[key]) continue; done[key]=1;",
"        const pa=L.pos[a], pb=L.pos[b]; if(!pa||!pb) continue;",
"        const cw=Math.abs(pa.x-pb.x)/MAP_CELL_W, ch=Math.abs(pa.y-pb.y)/MAP_CELL_H;",
"        if(!((cw===2&&ch===0)||(ch===2&&cw===0)||(cw===1&&ch===1))) continue;",
"        const nm=_roadName(a,b);",
"        const rk='路·'+nm+'·'+key.replace(/\\|/g,'-');",
"        if(ROOMS[rk]) continue;",
"        ROOMS[rk]={area:ra.area, zone:ra.zone||rb.zone, label:nm,",
"          desc:'一段'+nm+'，路面被行人踩得瓷实。', exits:{}};",
"        ROOMS[rk].exits[OP[d]]=a; ROOMS[rk].exits[d]=b;",
"        ra.exits[d]=rk; rb.exits[OP[d]]=rk;",
"        added++;",
"      }",
"    });",
"    if(added){ _gridCache=null; } // 有新路则重排",
"  })();",
""
].join('\n');
src=src.replace(anchor, block+anchor);
src=src.replace(/\n/g,'\r\n');
fs.writeFileSync(FILE,src,{encoding:'utf8'});
console.log('✓ insertRoadRooms 已接入 renderChengMap');
