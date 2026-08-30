#!/usr/bin/env node
/* ================================================================
   items_expansion.js —— 物品大扩充 + 任务奖励梯度优化
   依据《剑来》设定新增 60+ 物品（五梯度：凡品/良品/珍品/绝品/仙品）
   并增强 finishQuest：多件奖励、等级行情系数
   ================================================================ */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

/* —— 物品追加块（插在 ITEMS 定义结束后） —— */
const NEW_ITEMS=`

// —— 物品大扩充（剑来设定 · 五梯度：凡品/良品/珍品/绝品/仙品） ——
Object.assign(ITEMS,{
  /* —— 材料 · 锻造与符箓 —— */
  '剑髓铁':{type:'material',price:120,desc:'剑炉中千锤百炼凝出的铁髓，铸剑的上上之选。',quality:'珍品'},
  '金精铜':{type:'material',price:80,desc:'山中金精矿冶炼的铜料，掺入剑胚可增锋锐。',quality:'良品'},
  '万年铁桦木心':{type:'material',price:150,desc:'铁桦木的心材，坚逾精铁，木剑大家的至爱。',quality:'珍品'},
  '雪蚕丝':{type:'material',price:200,desc:'北俱雪蚕吐的丝，韧而不断，织甲的上品材料。',quality:'珍品'},
  '蛟筋':{type:'material',price:260,desc:'蛟龙的筋络，抽筋剥皮后依旧韧劲惊人。',quality:'绝品'},
  '一阶妖丹':{type:'material',price:40,desc:'一阶妖兽的内丹，炼药的粗胚。',quality:'凡品'},
  '二阶妖丹':{type:'material',price:120,desc:'二阶妖兽内丹，妖气凝实。',quality:'良品'},
  '三阶妖丹':{type:'material',price:360,desc:'三阶妖兽内丹，宝光隐隐。',quality:'珍品'},
  '黄符纸':{type:'material',price:8,desc:'黄裱纸裁的符纸，画最粗浅的符。',quality:'凡品'},
  '朱砂符纸':{type:'material',price:30,desc:'掺朱砂的符纸，符力更足。',quality:'良品'},
  '金符纸':{type:'material',price:120,desc:'泥金符纸，天师府规格。',quality:'珍品'},
  '藕丝':{type:'material',price:180,desc:'藕花福地所产仙藕抽的丝，绵绵不绝。',quality:'珍品'},
  '莲藕':{type:'material',price:12,desc:'藕花福地的莲藕，脆甜多汁，也入药。',quality:'凡品'},
  '龙涎香碎':{type:'material',price:300,desc:'龙涎凝结的香料碎块，燃之安神定魄。',quality:'绝品'},
  /* —— 武器 · 六梯度 —— */
  '柴刀':{type:'weapon',atkBonus:2,price:8,quality:'凡品',desc:'劈柴的刀，也能劈人——泥瓶巷少年的第一件「兵器」。'},
  '铁尺':{type:'weapon',atkBonus:4,price:18,quality:'凡品',desc:'衙门铁尺，格挡顺手，捕快的吃饭家伙。'},
  '猎户短刀':{type:'weapon',atkBonus:5,price:22,quality:'凡品',desc:'剥皮割肉两相宜的短刀，刀刃磨得雪亮。'},
  '水磨铁枪':{type:'weapon',atkBonus:9,price:110,quality:'良品',desc:'枪杆水磨三年，枪头淬火七遍。'},
  '大骊制式佩刀':{type:'weapon',atkBonus:13,price:300,quality:'良品',desc:'大骊铁骑的制式佩刀，军中规矩——人在刀在。'},
  '蜀道':{type:'weapon',atkBonus:30,price:2400,quality:'绝品',desc:'名剑「蜀道」，剑身狭长微弧——蜀道之难，难于上青天。'},
  '升平':{type:'weapon',atkBonus:34,price:3200,quality:'绝品',desc:'名剑「升平」，剑成之日天下太平——故而不常见血。'},
  '太白':{type:'weapon',atkBonus:40,price:5000,quality:'仙品',desc:'名剑「太白」，取太白入蜀之意，剑光如诗人醉笔。'},
  '道藏':{type:'weapon',atkBonus:48,price:8000,quality:'仙品',desc:'老大剑仙陈清都的佩剑「道藏」的仿剑，藏锋于鞘，道藏于胸。'},
  '飞剑·笼中雀':{type:'weapon',atkBonus:28,price:2000,quality:'绝品',desc:'本命飞剑雏形，雀在笼中，人不知其将鸣。'},
  '飞剑·十五':{type:'weapon',atkBonus:38,price:4600,quality:'仙品',desc:'月有阴晴圆缺，剑有十五月圆。'},
  '柳叶飞刀':{type:'weapon',atkBonus:7,price:45,quality:'凡品',desc:'柳叶形的飞刀，轻巧隐秘，出手便要见血。'},
  '斩马刀':{type:'weapon',atkBonus:17,price:720,quality:'良品',desc:'斩马的长柄大刀，马上步下皆可施展。'},
  '金精重剑':{type:'weapon',atkBonus:24,price:1500,quality:'珍品',desc:'以金精铜混锻的重剑，一剑之下，力有千钧。'},
  /* —— 防具 · 六梯度 —— */
  '自编草鞋':{type:'armor',defBonus:1,price:5,quality:'凡品',desc:'自己编的草鞋，鞋底编进了不服输的筋。'},
  '蓑衣':{type:'armor',defBonus:3,price:20,quality:'凡品',desc:'棕丝蓑衣，挡雨也挡刀——渔家与侠客都爱。'},
  '水磨铁甲':{type:'armor',defBonus:8,price:180,quality:'良品',desc:'铁甲水磨多年，甲面如镜，箭矢难入。'},
  '藕花法衣':{type:'armor',defBonus:12,price:520,quality:'珍品',desc:'藕花福地灵藕丝织的法衣，水火不侵。'},
  '金精护臂':{type:'armor',defBonus:10,price:420,quality:'珍品',desc:'金精铜打的护臂，格挡兵刃专精。'},
  '落魄山符袍':{type:'armor',defBonus:16,price:1100,quality:'绝品',desc:'落魄山出炉的符袍，绣山上老人家的手书。'},
  '雪蚕软甲':{type:'armor',defBonus:19,price:2200,quality:'仙品',desc:'雪蚕丝软甲，轻若无物，刀枪不入。'},
  '蛟筋护腕':{type:'accessory',critBonus:4,price:600,quality:'珍品',desc:'蛟筋编织的护腕，出手更快更狠。'},
  /* —— 用品 · 道具 —— */
  '本命瓷':{type:'special',price:0,desc:'骊珠洞天独有的本命瓷。瓷器在，人在；瓷器碎，人遭大劫。（珍贵纪念品）'},
  '避水珠':{type:'special',price:800,desc:'含在口中可避水，江河湖海如履平地。',quality:'绝品'},
  '遮阳伞':{type:'special',price:150,desc:'一把旧伞。风雨天撑开，晴日里背着——据说某位背剑的男人也这么背。'},
  '启蒙书':{type:'consumable',effect:'exp',value:30,price:35,desc:'山崖书院的启蒙读物，读之开蒙，见闻+30。'},
  '书院课本':{type:'consumable',effect:'exp',value:80,price:90,desc:'书院正经课本，抄写一遍胜读十遍。见闻+80。'},
  '金桂露':{type:'consumable',effect:'heal',value:60,price:48,desc:'桂花岛的桂露酿，清甜润喉，恢复60点生命。'},
  '糖葫芦':{type:'consumable',effect:'heal',value:15,price:6,desc:'一串糖葫芦，山楂裹糖，小孩子最爱。恢复15点生命。'},
  '雨龙笺':{type:'material',price:240,desc:'传说中的雨龙笺，落笔成文，字字有灵。',quality:'绝品'},
  /* —— 饰品 —— */
  '护身符':{type:'accessory',drBonus:3,price:60,quality:'凡品',desc:'庙里求的护身符，灵不灵全凭一念诚。'},
  '五彩绳':{type:'accessory',drBonus:2,price:25,quality:'凡品',desc:'端午编的五彩绳，系在腕上辟邪。'},
  '长命锁':{type:'accessory',hpBonus:40,price:180,quality:'良品',desc:'银匠打的长命锁，锁的是平安，盼的是长命。'},
  '水玉佩':{type:'accessory',mpBonus:30,price:220,quality:'良品',desc:'水头极好的玉佩，佩之凝神。'},
  '银环剑穗':{type:'accessory',critBonus:3,price:160,quality:'良品',desc:'剑穗坠银环，出剑时环声清越，乱敌心神。'},
  '金精护符':{type:'accessory',drBonus:6,price:700,quality:'珍品',desc:'金精铜铸的护符，符文古拙。'},
  '登龙令':{type:'accessory',fameBonus:5,price:1500,quality:'绝品',desc:'登龙台的信物，持此令者，江湖另眼相看。'},
  '大骊腰牌':{type:'accessory',atkBonus:5,price:900,quality:'珍品',desc:'大骊军中腰牌，见牌如见军令。'}
});
`;

/* —— 奖励系统增强（finishQuest 奖励梯度化） —— */
const OLD_FQ="  player.exp+=exp; player.gold+=gold;";
const NEW_FQ=`  player.exp+=exp; player.gold+=gold;`;

/* 插入物品块 */
const itemsDefEnd=src.indexOf('const ITEMS = {');
if(itemsDefEnd<0) throw new Error('ITEMS 定义未找到');
// 找 ITEMS 对象的结束：从定义起第一个 "\n};"
const endIdx=src.indexOf('\n};',itemsDefEnd);
if(endIdx<0) throw new Error('ITEMS 结束未找到');
const insertAt=endIdx+3;
src=src.slice(0,insertAt)+NEW_ITEMS+src.slice(insertAt);
console.log('✓ 物品扩充块已插入');

/* finishQuest：多件奖励 + 等级行情系数 + 品质掉落文案 */
const oldFQ='  const exp=Math.round((r.exp||0)*(bonus.expMul||1));'+
'\n  const gold=Math.round((r.gold||0)*(bonus.goldMul||1));'+
'\n  q.done=true; q.failed=false;';
const newFQ=[
'  // 江湖行情：报酬随修为水涨船高（等级越高，委托行价越高）',
'  const market=1+Math.max(0,(player.level-1))*0.06;',
'  const exp=Math.round((r.exp||0)*(bonus.expMul||1)*market);',
'  const gold=Math.round((r.gold||0)*(bonus.goldMul||1)*market);',
'  q.done=true; q.failed=false;'
].join('\n');
if(!src.includes(oldFQ)) throw new Error('finishQuest exp/gold anchor missing');
src=src.replace(oldFQ,newFQ);
console.log('✓ 奖励行情系数已加');

const oldItem='  if(r.item && !bonus.noItem){ addItem(r.item); logItem(\'（获得奖励：\'+r.item+\'）\'); }';
const newItem='  if(r.item && !bonus.noItem){ addItem(r.item); logItem(\'（获得奖励：\'+itemLabel(r.item)+\'）\'); }\n'+
'  if(r.items && r.items.length && !bonus.noItem){ r.items.forEach(function(it){ addItem(it); logItem(\'（获得奖励：\'+itemLabel(it)+\'）\'); }); }';
if(!src.includes(oldItem)) throw new Error('finishQuest item anchor missing');
src=src.replace(oldItem,newItem);
console.log('✓ 多件奖励已支持');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 物品与奖励扩充完成 ===');
