#!/usr/bin/env node
/* scenery_final.js —— 景物转真房间生成器（挂第三批深谈尾）+ 字号/清晰度 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

// 1) 景物房间生成器：挂第三批深谈收尾（杨老头段 + \n});）
const tailAnchor="穷人不问富贵事。'}\n  ]\n});";
if(!src.includes(tailAnchor)) throw new Error('第三批深谈收尾锚未找到');
const block=[
tailAnchor,
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
'      if(madeArea>=8) return; // 每城景物上限',
'      const ar0=ROOMS[anchorRoom]; if(!ar0||!ar0.exits) return;',
'      ["n","e","s","w"].forEach(function(d){',
'        if(madeArea>=8) return;',
'        if(ar0.exits[d]) return;',
'        const h=_h2(anchorRoom+"|"+d);',
'        if(h%100>=22) return; // 约1/5方向有景物',
'        const sc=SCENERY_POOL[h%SCENERY_POOL.length];',
'        const key="景·"+anchorRoom+"·"+d;',
'        ROOMS[key]={area:ar, zone:ar0.zone||"", label:sc[0], desc:sc[1], exits:{}};',
'        ar0.exits[d]=key; ROOMS[key].exits[OP[d]]=anchorRoom;',
'        madeArea++; made++;',
'      });',
'    });',
'  }',
'})();'
].join('\n');
src=src.replace(tailAnchor, block);
console.log('OK 景物房间生成器已挂（每城≤8间）');

// 2) 全局字号 15→16
src=src.replace('html,\nbody{font-size:15px;height:100%;}','html,\nbody{font-size:16px;height:100%;}');
console.log('OK 全局字号 16px');

// 3) 地图节点字黑体（清晰）：node-label / vision-label / fog text / road text
src=src.replace("#map-svg .room-node .node-label{font-family:var(--font-kai);","#map-svg .room-node .node-label{font-family:'SimHei','Microsoft YaHei',sans-serif;");
src=src.replace("#map-svg .node-vision .vision-label{fill:#8fb8d8;font-size:17px;font-weight:600;text-anchor:middle;font-family:'KaiTi','楷体',serif;",
"#map-svg .node-vision .vision-label{fill:#8fb8d8;font-size:17px;font-weight:600;text-anchor:middle;font-family:'SimHei','Microsoft YaHei',sans-serif;");
src=src.replace("#map-svg .node-fog text{fill:#a3937a;font-size:20px;text-anchor:middle;pointer-events:none;",
"#map-svg .node-fog text{fill:#a3937a;font-size:20px;text-anchor:middle;pointer-events:none;font-family:'SimHei','Microsoft YaHei',sans-serif;");
console.log('OK 地图节点字黑体');

// 4) 移动端地点描述放宽（折叠按钮管空间，不再硬裁）
src=src.replace('  #place-desc{max-height:5.2em;overflow-y:auto;flex:0 0 auto;}',
                '  #place-desc{max-height:7.5em;overflow-y:auto;flex:0 0 auto;}');
console.log('OK 移动端描述放宽 7.5em');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== scenery_final 完成 ===');
