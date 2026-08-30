#!/usr/bin/env node
/* roads_step1.js —— 路即房间·第一步（备份后执行）
   1 野区房间起真名（paths 名池，键名保持 ·N 兼容存档）
   2 删「未通小径」渲染块（不能走就不画）
   3 缩放上限 8→14
*/
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const must=(s,t)=>{ if(!src.includes(s)) throw new Error('NOT FOUND: '+t); };

// 1) label 用 paths 名池
const oldMake="ROOMS[c.key]={area:z.area, zone:z.zone, label:z.label, desc:desc, exits:{}};";
must(oldMake,'野区建房间行');
src=src.replace(oldMake,
"const _pname=(z.paths&&z.paths[idx])?z.paths[idx]:(z.label+'小径'+(idx+1));\n"+
"        ROOMS[c.key]={area:z.area, zone:z.zone, label:_pname, desc:desc, exits:{}};");

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
let n=0;
for(const zk in PATHS){
  const anchor="key:'"+zk+"',";
  must(anchor,'野区 '+zk);
  const zStart=src.indexOf(anchor);
  const dd=src.indexOf('deepDesc:',zStart);
  const le=src.indexOf('\n',dd);
  if(src.slice(zStart,le).includes('paths:')) continue;
  src=src.slice(0,le)+'\n      paths:'+JSON.stringify(PATHS[zk])+','+src.slice(le);
  n++;
}
console.log('路名池: '+n+'/10');

// 2) 未通小径由 roads_step1b.js 精确处理（花括号配对法）

// 3) 缩放上限 14
must('mapZoom.s=Math.max(0.5, Math.min(8, s0*factor));','缩放上限');
src=src.replace('mapZoom.s=Math.max(0.5, Math.min(8, s0*factor));','mapZoom.s=Math.max(0.5, Math.min(14, s0*factor));');
console.log('✓ 缩放上限 14');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 第一步完成 ===');
