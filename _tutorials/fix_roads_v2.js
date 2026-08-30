#!/usr/bin/env node
/* 修复 roads_as_rooms.js 造成的切割事故：
   1) 修补景物 IIFE 收尾
   2) 重插完整 insertRoadRooms
   3) 字体注释去重（4→1） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

// 1) 修景物收尾：坏串 = 残留 }+});+_gridCache 尾巴+})();（紧接景物 for 结束后）
const badTail=
"      svg.appendChild(g);\n"+
"    }\n"+
"      }\n"+
"  });\n"+
"  _gridCache=null; // 让正式渲染按含路房间的路网重新布局\n"+
"})();";
if(!src.includes(badTail)){ throw new Error('坏尾串未找到——可能已修或结构不同'); }
const goodTail=
"      svg.appendChild(g);\n"+
"    }\n"+
"  })();";
src=src.replace(badTail,goodTail);
console.log('✓ 景物 IIFE 收尾已修');

// 2) 在景物 IIFE 之后、字体锚点之前，重插完整 insertRoadRooms
const insertRoads=
"\n\n// —— 路即房间：隔一格的相连对，中间插一间真实的「路房间」（可走可停） ——\n"+
"(function insertRoadRooms(){\n"+
"  _gridCache=null;\n"+
"  const L=computeGridLayout();\n"+
"  const done={}; let added=0;\n"+
"  const OP={n:'s',s:'n',e:'w',w:'e'};\n"+
"  const all=Object.keys(ROOMS).filter(function(n){ const r=ROOMS[n]; return r&&r.area&&typeof r.bld!=='string'&&r.exits; });\n"+
"  all.forEach(function(a){\n"+
"    const ra=ROOMS[a];\n"+
"    for(const d in ra.exits){\n"+
"      if(!OP[d]) continue;\n"+
"      const b=ra.exits[d]; const rb=ROOMS[b];\n"+
"      if(!rb||rb.area!==ra.area) continue;\n"+
"      const key=a<b? a+'|'+b : b+'|'+a;\n"+
"      if(done[key]) continue; done[key]=1;\n"+
"      const pa=L.pos[a], pb=L.pos[b]; if(!pa||!pb) continue;\n"+
"      const cw=Math.abs(pa.x-pb.x)/MAP_CELL_W, ch=Math.abs(pa.y-pb.y)/MAP_CELL_H;\n"+
"      if(!((cw===2&&ch===0)||(ch===2&&cw===0)||(cw===1&&ch===1))) continue;\n"+
"      const nm=_roadName(a,b);\n"+
"      const rk='路·'+nm+'·'+key.replace(/\\|/g,'-');\n"+
"      if(ROOMS[rk]) continue;\n"+
"      ROOMS[rk]={area:ra.area, zone:ra.zone||rb.zone, label:nm,\n"+
"        desc:'一段'+nm+'，路面被行人踩得瓷实。',\n"+
"        exits:{}};\n"+
"      ROOMS[rk].exits[OP[d]]=a; ROOMS[rk].exits[d]=b;\n"+
"      ra.exits[d]=rk; rb.exits[OP[d]]=rk;\n"+
"      added++;\n"+
"    }\n"+
"  });\n"+
"  _gridCache=null;\n"+
"})();";
const anchor='/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */';
if(!src.includes(anchor)){ throw new Error('字体锚点未找到'); }
src=src.replace(anchor, insertRoads+'\n\n'+anchor);
console.log('✓ insertRoadRooms 已重插');

// 3) 字体注释去重：连续重复合并为一个
const dupRe=/(?:\/\* ===== 字体 \/ 标题色 \/ 背景图 \/ 诗句 \/ 音乐 常量 ===== \*\/\s*){2,}/g;
src=src.replace(dupRe, anchor+'\n');
console.log('✓ 字体注释去重');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 手术完成 ===');
