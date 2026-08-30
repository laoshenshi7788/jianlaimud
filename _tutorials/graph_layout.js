#!/usr/bin/env node
/* graph_layout.js v2 —— 图距离校正（锚点=实际文本「// 网格参数（城镇/内室）」） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

const anchor='  // 网格参数（城镇/内室）';
if(!src.includes(anchor)) throw new Error('网格参数锚未找到');

const layoutBlock=[
"  // —— 图距离校正（力导向思想的确定性实现）：",
"  //    让「网格距离」尽量贴合「图最短路径距离」——视觉近=走得近 ——",
"  (function graphDistanceCorrection(){",
"    const keys=Object.keys(cell);",
"    if(keys.length<3) return;",
"    const adj={};",
"    keys.forEach(function(k){ adj[k]=[]; });",
"    edges.forEach(function(e){",
"      if(cell[e[0]] && cell[e[1]]){ adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); }",
"    });",
"    const deg={}; keys.forEach(function(k){ deg[k]=(adj[k]||[]).length; });",
"    const cx=function(k){ return cell[k]?cell[k].cx:0; };",
"    const cy=function(k){ return cell[k]?cell[k].cy:0; };",
"    // 全源 BFS 图距离",
"    const gd={};",
"    keys.forEach(function(s){",
"      const d={}; d[s]=0; const q=[s];",
"      while(q.length){ const c=q.shift(); (adj[c]||[]).forEach(function(nb){ if(d[nb]===undefined){ d[nb]=d[c]+1; q.push(nb); } }); }",
"      gd[s]=d;",
"    });",
"    // 引力：相连但格距>1 → deg≤2 远端拉到近端旁",
"    for(let pass=0;pass<3;pass++){",
"      let moved=false;",
"      edges.forEach(function(e){",
"        [[e[0],e[1]],[e[1],e[0]]].forEach(function(pr){",
"          const far=pr[0], near=pr[1];",
"          if(!cell[far]||!cell[near]||far===root) return;",
"          if((deg[far]||0)>2) return;",
"          const man=Math.abs(cx(far)-cx(near))+Math.abs(cy(far)-cy(near));",
"          if(man<=1) return;",
"          const oldK=cx(far)+','+cy(far);",
"          delete occ[oldK];",
"          const dx=cx(near)-cx(far), dy=cy(near)-cy(far);",
"          const sx=dx>0?1:(dx<0?-1:0), sy=dy>0?1:(dy<0?-1:0);",
"          const cand=[[cx(near)+sx, cy(near)+sy],[cx(near)+sx, cy(near)],[cx(near), cy(near)+sy],[cx(near), cy(near)]];",
"          let placed=false;",
"          for(const c of cand){",
"            const k2=c[0]+','+c[1];",
"            if(!occ[k2]){ cell[far]={cx:c[0],cy:c[1]}; occ[k2]=far; placed=true; break; }",
"          }",
"          if(placed){ moved=true; } else { occ[oldK]=far; }",
"        });",
"      });",
"      if(!moved) break;",
"    }",
"    // 斥力：切比雪夫≤2 且图距≥4 → deg≤2 的一端沿 anc→mv 方向外推",
"    for(let pass=0;pass<2;pass++){",
"      edges.forEach(function(e){",
"        [[e[0],e[1]],[e[1],e[0]]].forEach(function(pr){",
"          const mv=pr[0], anc=pr[1];",
"          if(!cell[mv]||!cell[anc]||mv===root) return;",
"          if((deg[mv]||0)>2) return;",
"          const man=Math.abs(cx(mv)-cx(anc))+Math.abs(cy(mv)-cy(anc));",
"          if(man<=1 || man>3) return;",
"          const gdMv=gd[mv]?(gd[mv][anc]||0):0;",
"          if(gdMv<4) return;",
"          const dx=(cx(mv)-cx(anc))||0, dy=(cy(mv)-cy(anc))||0;",
"          const len=Math.max(1,Math.max(Math.abs(dx),Math.abs(dy)));",
"          const ux=Math.round(dx/len), uy=Math.round(dy/len);",
"          const oldK2=cx(mv)+','+cy(mv);",
"          delete occ[oldK2];",
"          for(let t=man+1;t<=6;t++){",
"            const k2=(cx(anc)+ux*t)+','+(cy(anc)+uy*t);",
"            if(!occ[k2]){ cell[mv]={cx:cx(anc)+ux*t, cy:cy(anc)+uy*t}; occ[k2]=mv; break; }",
"          }",
"        });",
"      });",
"    }",
"  })();",
"",
anchor
].join('\n');
src=src.replace(anchor, layoutBlock);
console.log('✓ 图距离校正已接入');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== graph_layout v2 完成 ===');
