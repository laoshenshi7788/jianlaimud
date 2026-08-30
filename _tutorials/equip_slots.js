#!/usr/bin/env node
/* equip_slots.js —— 装备部位扩展：头/手/腰/足 + 副手（双武器）
   1 equipBonus 聚合纳入新槽位
   2 副手：offhand 槽（可装武器/盾类，属性减半生效）
   3 openBackpack：新槽位显示/卸下/装备（武器→主手优先，已占则提示副手）
   4 详情行：写明部位类型 + 全属性清单
   5 新槽位物品数据（各梯度 2-4 件） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const must=(s,t)=>{ if(!src.includes(s)) throw new Error('NOT FOUND: '+t); };

// —— 1) equipBonus：槽位表扩容 + 副手半效 ——
must("['weapon','armor','accessory'].forEach(function(slot){",'equipBonus槽位表');
src=src.replace("['weapon','armor','accessory'].forEach(function(slot){",
"['weapon','offhand','armor','accessory','head','hands','waist','feet'].forEach(function(slot){\n"+
"    const _half=(slot==='offhand')?0.5:1;");

// 副手属性减半：把聚合里的各 += 换成带系数版本
src=src.replace("      if(it.critBonus) b.crit+=it.critBonus;","      if(it.critBonus) b.crit+=it.critBonus*_half;");
src=src.replace("      if(it.critDmgBonus) b.critDmg+=it.critDmgBonus;","      if(it.critDmgBonus) b.critDmg+=it.critDmgBonus*_half;");
src=src.replace("      if(it.drBonus) b.dr+=it.drBonus;","      if(it.drBonus) b.dr+=it.drBonus*_half;");
src=src.replace("      if(it.dodgeBonus) b.dodgeBonus!==undefined?0:0;",""); // 无此行则跳过
src=src.replace("      if(it.dodgeBonus) b.dodge+=it.dodgeBonus;","      if(it.dodgeBonus) b.dodge+=it.dodgeBonus*_half;");

// calcAtk/calcDef 的槽位遍历扩展
must("  ['weapon','accessory','armor'].forEach(function(slot){","calcAtk槽位遍历");
src=src.replace("  ['weapon','accessory','armor'].forEach(function(slot){",
"  ['weapon','offhand','accessory','armor','head','hands','waist','feet'].forEach(function(slot){");
must("  ['armor','accessory','weapon'].forEach(function(slot){","calcDef槽位遍历");
src=src.replace("  ['armor','accessory','weapon'].forEach(function(slot){",
"  ['armor','offhand','accessory','weapon','head','hands','waist','feet'].forEach(function(slot){");
must("['accessory','weapon','armor'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.mpBonus) m+=it.mpBonus; });","effMaxMp槽位");
src=src.replace("['accessory','weapon','armor'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.mpBonus) m+=it.mpBonus; });",
"['accessory','weapon','offhand','armor','head','hands','waist','feet'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.mpBonus) m+=it.mpBonus; });");
must("['accessory','weapon','armor'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.hpBonus) m+=it.hpBonus; });","effMaxHp槽位");
src=src.replace("['accessory','weapon','armor'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.hpBonus) m+=it.hpBonus; });",
"['accessory','weapon','offhand','armor','head','hands','waist','feet'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.hpBonus) m+=it.hpBonus; });");

// —— 2) openBackpack 槽位显示：加 offhand/head/hands/waist/feet ——
must("const slotNames=[['weapon','武器'],['armor','防具'],['accessory','饰品'],['garb','衣装']];","槽位名表");
src=src.replace("const slotNames=[['weapon','武器'],['armor','防具'],['accessory','饰品'],['garb','衣装']];",
"const slotNames=[['weapon','武器'],['offhand','副手'],['armor','防具'],['accessory','饰品'],['garb','衣装'],['head','头部'],['hands','手部'],['waist','腰部'],['feet','足部']];");

// 装备按钮逻辑：武器/副手/新槽位类型可装
must("const usable=(it.type==='consumable' || it.type==='weapon' || it.type==='armor' || it.type==='accessory' || it.type==='garb');","usable判定");
src=src.replace("const usable=(it.type==='consumable' || it.type==='weapon' || it.type==='armor' || it.type==='accessory' || it.type==='garb');",
"const EQUIP_TYPES=['weapon','offhand','armor','accessory','garb','head','hands','waist','feet'];\n      const usable=(it.type==='consumable' || EQUIP_TYPES.indexOf(it.type)>-1);");

// 详情行：部位类型 + 全属性清单（替换 info 组装段尾部）
must("        const score=equipScore(it);\n        if(score>0) info='装备评分 '+score;","详情评分行");
src=src.replace("        const score=equipScore(it);\n        if(score>0) info='装备评分 '+score;",
"        const TYPE_CN={weapon:'武器',offhand:'副手',armor:'防具',accessory:'饰品',garb:'衣装',head:'头部',hands:'手部',waist:'腰部',feet:'足部',material:'材料',special:'道具',consumable:'消耗品'};\n"+
"        const parts=[];\n"+
"        if(it.atkBonus) parts.push('攻 +'+it.atkBonus);\n"+
"        if(it.defBonus) parts.push('防 +'+it.defBonus);\n"+
"        if(it.hpBonus) parts.push('气血 +'+it.hpBonus);\n"+
"        if(it.mpBonus) parts.push('内力 +'+it.mpBonus);\n"+
"        if(it.critBonus) parts.push('会心 +'+it.critBonus+'%');\n"+
"        if(it.drBonus) parts.push('减伤 +'+it.drBonus+'%');\n"+
"        if(it.dodgeBonus) parts.push('闪避 +'+it.dodgeBonus+'%');\n"+
"        if(it.critDmgBonus) parts.push('暴伤 +'+it.critDmgBonus+'%');\n"+
"        if(it.looksBonus) parts.push('容貌 +'+it.looksBonus);\n"+
"        const score=equipScore(it);\n"+
"        info='【'+(TYPE_CN[it.type]||it.type)+'】'+(parts.length?(parts.join(' · ')+' · '):'')+'评分 '+score;");

// —— 3) 新槽位物品数据（追加在物品扩充块后） ——
const extraItems=`
// —— 装备部位扩展物品（头/手/腰/足/副手） ——
Object.assign(ITEMS,{
  '皮帽':{type:'head',defBonus:2,price:30,quality:'凡品',desc:'鞣制的皮帽，遮风挡雨兼防流矢。'},
  '藤编斗笠':{type:'head',defBonus:4,price:80,quality:'良品',desc:'山里人手编的斗笠，笠沿宽大，藤条韧性极好。'},
  '边军铁盔':{type:'head',defBonus:7,price:320,quality:'珍品',desc:'大骊边军的制式铁盔，盔沿带护颈。'},
  '玄铁面甲':{type:'head',defBonus:11,price:980,quality:'绝品',desc:'玄铁冷锻的面甲，只露双目，气势慑人。'},
  '布手套':{type:'hands',defBonus:1,price:12,quality:'凡品',desc:'粗布手套，搬砖练拳两相宜。'},
  '皮护腕':{type:'hands',defBonus:3,price:60,quality:'良品',desc:'双层牛皮的护腕，腕骨稳当出拳才稳。'},
  '虎皮护腕':{type:'hands',defBonus:5,critBonus:2,price:280,quality:'珍品',desc:'虎皮为面、虎筋为里，戴上便有三分虎气。'},
  '玄铁手甲':{type:'hands',defBonus:8,price:760,quality:'绝品',desc:'玄铁手甲覆至指尖，握剑更稳，挥拳更沉。'},
  '粗布腰带':{type:'waist',defBonus:1,price:10,quality:'凡品',desc:'一条粗布腰带，束紧了好干活。'},
  '兽皮带':{type:'waist',defBonus:3,price:70,quality:'良品',desc:'兽皮带扣的宽腰封，能挂刀能悬壶。'},
  '金精腰带':{type:'waist',defBonus:6,hpBonus:30,price:520,quality:'珍品',desc:'金精铜扣的腰封，束上便觉腰马合一。'},
  '龙筋束腰':{type:'waist',defBonus:9,hpBonus:60,price:1400,quality:'绝品',desc:'以蛟筋混编的束腰，束之则气血鼓荡不散。'},
  '草编履':{type:'feet',defBonus:1,dodgeBonus:1,price:8,quality:'凡品',desc:'草编的履，轻便，走远路不磨脚。'},
  '麻鞋':{type:'feet',defBonus:2,dodgeBonus:2,price:35,quality:'凡品',desc:'麻线纳底，走山路稳当。'},
  '踏云靴':{type:'feet',defBonus:5,dodgeBonus:4,price:520,quality:'珍品',desc:'靴底绣云纹，起步生风，纵跃更高。'},
  '追风乌靴':{type:'feet',defBonus:8,dodgeBonus:6,price:1300,quality:'绝品',desc:'乌皮短靴，靴帮嵌铁叶——追风逐电不过如此。'},
  '木盾':{type:'offhand',defBonus:4,price:60,quality:'凡品',desc:'包铁皮的木盾，架得住寻常刀劈。'},
  '铁壁圆盾':{type:'offhand',defBonus:9,price:420,quality:'珍品',desc:'玄铁圆盾，盾墙之称，架住便不退。'},
  '备用长剑':{type:'offhand',atkBonus:6,price:260,quality:'良品',desc:'一柄备用的长剑——主剑脱手时，它就是你的道理。'},
  '双刀·鸳鸯':{type:'offhand',atkBonus:10,critBonus:3,price:900,quality:'珍品',desc:'鸳鸯成对的副刀，主刀既出，副刀补位。'}
});
`;
const anchor='/* —— 装备部位扩展物品';
if(!src.includes(anchor)){
  const itemsAnchor='// —— 物品大扩充（剑来设定 · 五梯度：凡品/良品/珍品/绝品/仙品） ——';
  if(!src.includes(itemsAnchor)) throw new Error('物品扩充块未找到');
  // 插到物品扩充块之后（找它的 Object.assign 结束——即其后第一个独立 “});”+空行之后的 “// —— 物品大扩充” 尾）
  const insAt=src.indexOf('/* —— 奖励系统增强', src.indexOf(itemsAnchor));
  if(insAt<0) throw new Error('奖励块锚未找到');
  src=src.slice(0,insAt)+extraItems+'\n'+src.slice(insAt);
  console.log('✓ 新槽位物品已加（20 件）');
}

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 装备部位扩展完成 ===');
