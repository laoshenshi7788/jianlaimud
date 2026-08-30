#!/usr/bin/env node
/* ================================================================
   roads_as_rooms.js —— 路即房间重构
   1 野区房间起真名（paths 名池，label 显示，键名保持·N 兼容存档）
   2 隔一格的相连对：中间插入真实「路房间」（可走可停，双向连两端）
   3 删「未通小径」路牌渲染（不能走就不画）
   4 删胶囊路牌渲染（已被真路房间取代）
   5 景物改小方框（与房间 UI 统一）
   6 缩放上限 8→12
   ================================================================ */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8');
const must=(oldS,tag)=>{ if(!src.includes(oldS)) throw new Error('NOT FOUND: '+tag); };

// —— 1a) 生成器：label 用 paths 名池 ——
const oldMake="ROOMS[c.key]={area:z.area, zone:z.zone, label:z.label, desc:desc, exits:{}};";
must(oldMake,'野区建房间行');
src=src.replace(oldMake,
  "const _pname=(z.paths&&z.paths[idx])?(z.paths[idx]):(z.label+'小径'+(idx+1));\n        ROOMS[c.key]={area:z.area, zone:z.zone, label:_pname, desc:desc, exits:{}};");

// —— 1b) 十个野区各配 9 段路名 ——
const PATHS={
  '老桃山密林':['林缘小道','落松坪','藤蔓径','兽骨坡','雾隐涧','青苔石阶','岔林口','老桃树坞','林深尽头'],
  '野猪林':['猪林外沿','拱泥洼','断枝坪','密灌丛','野猪塘','青杠林','猎户小径','林中空地','野猪林深处'],
  '披云山山道':['山门石阶','半山亭','云栈道','望崖台','野桃林','断碑坡','登云梯','山巅风口','披云绝顶'],
  '黑松峡':['峡口','黑松径','一线天','松针道','崖鸣泉','石窟沿','风吼涧','松涛台','峡尾幽谷'],
  '白雁滩涂':['滩涂边','苇丛径','观雁洲','浅水湾','烂泥滩','船桩滩','雁羽洲','苇荡深处','滩头尽头'],
  '古沙场':['沙场南缘','残旗坡','白骨滩','箭雨原','点将台','锈矛沙','乱石阵','黄沙脊','沙场正中'],
  '乱葬岗':['岗子口','纸钱径','塌坟坪','枯树洼','夜鸮林','无名牌','义庄前','荒草深处','乱葬深处'],
  '倒马河谷':['下坡岔路','响水滩','卵石滩','深潭边','把手崖','跌马石','水帘沿','谷底幽径','河谷深处'],
  '落枫谷':['谷口枫道','红叶径','枫火坪','响叶林','无名碑','山泉眼','枫根洞','落叶深谷','泉眼石台'],
  '荒废窑址':['窑址路口','碎瓷坡','塌窑口','辘轳场','次品山','烟熏窑壁','野猫洞','龙窑主膛','窑室深处']
};
let pathFix=0;
for(const zk in PATHS){
  const anchor="key:'"+zk+"',";
  must(anchor,'野区 '+zk);
  // 在该野区对象的 deepDesc:'…', 行后插 paths
  const zStart=src.indexOf(anchor);
  const ddIdx=src.indexOf("deepDesc:",zStart);
  const lineEnd=src.indexOf('\n',ddIdx);
  const insert="\n      paths:"+JSON.stringify(PATHS[zk])+",";
  if(src.slice(zStart,lineEnd).indexOf('paths:')>-1){ continue; }
  src=src.slice(0,lineEnd)+insert+src.slice(lineEnd);
  pathFix++;
}
console.log('野区路名池: '+pathFix+'/10');

// —— 2) 野区生成器之后：插真实路房间（隔格相连对 → 中间一格路房） ——
const afterWild="(function insertRoadRooms(){\n"+
"  // 预布局一次，找出「隔一格」的相连对，在中间放一间真实的路房间\n"+
"  _gridCache=null;\n"+
"  const L=computeGridLayout();\n"+
"  const done={}; let added=0;\n"+
"  const OP={n:'s',s:'n',e:'w',w:'e'};\n"+
"  const all=Object.keys(ROOMS).filter(function(n){ const r=ROOMS[n]; return r&&r.area&&typeof r.bld!=='string'&&r.exits; });\n"+
"  all.forEach(function(a){\n"+
"    const ra=ROOMS[a];\n"+
"    for(const d in ra.exits){\n"+
"      if(!OP[d]) continue; // 只处理四向\n"+
"      const b=ra.exits[d]; const rb=ROOMS[b];\n"+
"      if(!rb||rb.area!==ra.area) continue; // 同城才插路\n"+
"      const key=a<b? a+'|'+b : b+'|'+a;\n"+
"      if(done[key]) continue; done[key]=1;\n"+
"      const pa=L.pos[a], pb=L.pos[b]; if(!pa||!pb) continue;\n"+
"      const cw=Math.abs(pa.x-pb.x)/MAP_CELL_W, ch=Math.abs(pa.y-pb.y)/MAP_CELL_H;\n"+
"      if(!((cw===2&&ch===0)||(ch===2&&cw===0)||(cw===1&&ch===1))) continue;\n"+
"      const nm=_roadName(a,b);\n"+
"      const rk='路·'+nm+'·'+key.replace(/\\|/g,'-');\n"+
"      if(ROOMS[rk]) continue;\n"+
"      ROOMS[rk]={area:ra.area, zone:ra.zone||rb.zone, label:nm,\n"+
"        desc:'一段'+nm+'，'+(nm.indexOf('阶')>-1?'石阶被岁月磨得温润。':(nm.indexOf('桥')>-1?'桥板走在上面咯吱作响。':'路面被行人踩得瓷实。')),\n"+
"        exits:{}};\n"+
"      ROOMS[rk].exits[OP[d]]=a; ROOMS[rk].exits[d]=b;\n"+
"      ra.exits[d]=rk; rb.exits[OP[d]]=rk;\n"+
"      added++;\n"+
"    }\n"+
"  });\n"+
"  _gridCache=null; // 让正式渲染按含路房间的路网重新布局\n"+
"})();";
const tailAnchor='/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */';
must(tailAnchor,'字体锚点');
src=src.replace(tailAnchor, afterWild+'\n\n'+tailAnchor);
console.log('✓ insertRoadRooms 已接入');

// —— 3) 删「未通小径」渲染块（不能走就不画） ——
const tStart=src.indexOf("  // 2) 未通小径：正交贴着、图上却不相连的房间对——中点立一块小路牌，说明绕行");
if(tStart>-1){
  const tEnd=src.indexOf('\n  })();',tStart);
  // 未通小径块在景物 IIFE 内部——找到其结束（下一个 “    }\n  });” 前）直接删 for 循环体
  const forEnd=src.indexOf('\n  }\n  });',tStart);
  const cutEnd=(forEnd>-1)?forEnd+('\n  }').length:src.indexOf('    }\n  });',tStart);
  src=src.slice(0,tStart)+src.slice(cutEnd>=0?cutEnd:src.length);
  console.log('✓ 未通小径渲染已删');
} else { console.log('- 未通小径块已不在'); }

// —— 4) 删胶囊路牌渲染调用段（「—— 道路节点：…」整段循环） ——
const rStart=src.indexOf("  // —— 道路节点：隔一格的直路中点、拐角空位，铺一段有名字的「路」");
if(rStart>-1){
  const rEnd=src.indexOf('\n  // 节点（方框）',rStart);
  if(rEnd>rStart){ src=src.slice(0,rStart)+src.slice(rEnd); console.log('✓ 胶囊路牌渲染已删'); }
} else { console.log('- 胶囊路牌渲染已不在'); }

// —— 5) 景物改小方框（与房间 UI 统一） ——
const scOld="        const g=document.createElementNS(SVG_NS,'g');\n        g.setAttribute('class','scenery-node');\n        const dot=document.createElementNS(SVG_NS,'circle');\n        dot.setAttribute('cx',x); dot.setAttribute('cy',y-9); dot.setAttribute('r',5);";
const scNew="        const g=document.createElementNS(SVG_NS,'g');\n        g.setAttribute('class','scenery-node');\n        const dot=document.createElementNS(SVG_NS,'rect');\n        dot.setAttribute('x',x-26); dot.setAttribute('y',y-20); dot.setAttribute('width',52); dot.setAttribute('height',26); dot.setAttribute('rx',6);";
if(src.includes(scOld)){ src=src.replace(scOld,scNew); console.log('✓ 景物改小方框'); }
else console.log('- 景物样式锚点已变（跳过）');

// —— 6) 缩放上限 8→12 ——
must('mapZoom.s=Math.max(0.5, Math.min(8, s0*factor));','缩放上限');
src=src.replace('mapZoom.s=Math.max(0.5, Math.min(8, s0*factor));','mapZoom.s=Math.max(0.5, Math.min(12, s0*factor));');
console.log('✓ 缩放上限 12');

fs.writeFileSync(FILE,src,{encoding:'utf8'});
console.log('=== 路即房间重构完成 ===');
