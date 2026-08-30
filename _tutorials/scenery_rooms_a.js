#!/usr/bin/env node
/* scenery_rooms.js —— 景物转真房间（A 生成器 + B 删渲染点） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

// A1) 景物房间生成器（挂野区尾部）
const wildTail='  _gridCache=null; // 让正式渲染按含路房间的路网重新布局\n})();';
if(!src.includes(wildTail)) throw new Error('野区尾部锚未找到');
if(src.includes('buildStreetRooms')){ console.log('景物生成器已存在，跳过A1'); }
else{
const block=[
wildTail,
'',
'// —— 街巷烟火：景物全部转为真实房间（土地庙/荷塘/老槐树……可走进可查看） ——',
'(function buildStreetRooms(){',
'  const SCENERY_POOL=[',
"    ['草屋','一座无人草屋，门虚掩着，灶膛里还有余温。'],",
"    ['菜畦','几畦青菜刚浇过水，叶子上还挂着水珠。'],",
"    ['老槐树','一棵老槐树，树底下的石墩都被人坐光滑了。'],",
"    ['石碾','一盘石碾，碾盘上还剩着半把谷壳。'],",
"    ['水井','一口水井，井绳磨得发亮。'],",
"    ['篱笆院','半人高的篱笆院，院子里晾着几件打补丁的旧衣。'],",
"    ['荷塘','一小片荷塘，蛙声忽远忽近。'],",
"    ['歇脚亭','一座歇脚亭，亭柱上刻满了过路人的名字。'],",
"    ['土地庙','巴掌大的土地庙，香炉里插着三炷残香。'],",
"    ['柴垛','一垛柴禾码得整整齐齐，是谁家过冬的储积。']",
'  ];',
'  function _h2(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*33+s.charCodeAt(i))>>>0; return h; }',
'  const OP={n:"s",s:"n",e:"w",w:"e"};',
'  const areas={};',
'  for(const rn in ROOMS){ const r=ROOMS[rn]; if(!r||!r.area||typeof r.bld==="string") continue; (areas[r.area]=areas[r.area]||[]).push(rn); }',
'  let made=0;',
'  for(const ar in areas){',
'    const rooms=areas[ar]; if(!rooms.length) continue;',
'    let madeArea=0;',
'    rooms.forEach(function(anchorRoom){',
'      if(madeArea>=10) return;',
'      const ar0=ROOMS[anchorRoom]; if(!ar0||!ar0.exits) return;',
'      ["n","e","s","w"].forEach(function(d){',
'        if(madeArea>=10) return;',
'        if(ar0.exits[d]) return;',
'        const h=_h2(anchorRoom+"|"+d);',
'        if(h%100>=26) return;',
'        const sc=SCENERY_POOL[h%SCENERY_POOL.length];',
'        const key="景·"+anchorRoom+"·"+d;',
'        ROOMS[key]={area:ar, zone:ar0.zone||"", label:sc[0], desc:sc[1], exits:{}};',
'        ar0.exits[d]=key; ROOMS[key].exits[OP[d]]=anchorRoom;',
'        madeArea++; made++;',
'      });',
'    });',
'  }',
'  if(typeof _gridCache!=="undefined") _gridCache=null;',
'})();'
].join('\n');
src=src.replace(wildTail, block);
console.log('OK A1 景物房间生成器（挂野区尾）');
}

// A2 取消：A1 顶层一次生成已覆盖全部城池（含野区），渲染期不重复生成

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== A 完成 ===');
