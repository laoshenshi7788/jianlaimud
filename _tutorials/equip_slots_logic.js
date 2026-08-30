#!/usr/bin/env node
/* equip_slots_logic.js v2 —— 槽位逻辑（4 空格缩进修正版） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const rep=(oldS,newS,tag)=>{
  if(!src.includes(oldS)){ console.log('SKIP '+tag+'（已改或不存在）'); return; }
  src=src.replace(oldS,newS); console.log('OK '+tag);
};

rep("    ['weapon','armor','accessory'].forEach(function(slot){\n      const it=player.equipment[slot]?itemData(player.equipment[slot]):null;\n      if(!it) return;\n      if(it.critBonus) b.crit+=it.critBonus;\n      if(it.critDmgBonus) b.critDmg+=it.critDmgBonus;\n      if(it.drBonus) b.dr+=it.drBonus;\n      if(it.dodgeBonus) b.dodge+=it.dodgeBonus;\n    });",
"    ['weapon','offhand','armor','accessory','head','hands','waist','feet'].forEach(function(slot){\n      const _half=(slot==='offhand')?0.5:1;\n      const it=player.equipment[slot]?itemData(player.equipment[slot]):null;\n      if(!it) return;\n      if(it.critBonus) b.crit+=it.critBonus*_half;\n      if(it.critDmgBonus) b.critDmg+=it.critDmgBonus*_half;\n      if(it.drBonus) b.dr+=it.drBonus*_half;\n      if(it.dodgeBonus) b.dodge+=it.dodgeBonus*_half;\n    });","equipBonus聚合块");

rep("  ['weapon','accessory','armor'].forEach(function(slot){",
"  ['weapon','offhand','accessory','armor','head','hands','waist','feet'].forEach(function(slot){","calcAtk遍历");
rep("  ['armor','accessory','weapon'].forEach(function(slot){",
"  ['armor','offhand','accessory','weapon','head','hands','waist','feet'].forEach(function(slot){","calcDef遍历");
rep("['accessory','weapon','armor'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.mpBonus) m+=it.mpBonus; });",
"['accessory','weapon','offhand','armor','head','hands','waist','feet'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.mpBonus) m+=it.mpBonus; });","effMaxMp遍历");
rep("['accessory','weapon','armor'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.hpBonus) m+=it.hpBonus; });",
"['accessory','weapon','offhand','armor','head','hands','waist','feet'].forEach(function(slot){ const it=player.equipment[slot]?itemData(player.equipment[slot]):null; if(it&&it.hpBonus) m+=it.hpBonus; });","effMaxHp遍历");
rep("  ['weapon','armor','accessory','garb'].forEach(function(slot){",
"  ['weapon','offhand','armor','accessory','garb','head','hands','waist','feet'].forEach(function(slot){","套装遍历");
rep("const slotNames=[['weapon','武器'],['armor','防具'],['accessory','饰品'],['garb','衣装']];",
"const slotNames=[['weapon','武器'],['offhand','副手'],['armor','防具'],['accessory','饰品'],['garb','衣装'],['head','头部'],['hands','手部'],['waist','腰部'],['feet','足部']];","槽位名表");
rep("const usable=(it.type==='consumable' || it.type==='weapon' || it.type==='armor' || it.type==='accessory' || it.type==='garb');",
"const EQUIP_TYPES=['weapon','offhand','armor','accessory','garb','head','hands','waist','feet'];\n      const usable=(it.type==='consumable' || EQUIP_TYPES.indexOf(it.type)>-1);","usable判定");
rep("        const score=equipScore(it);\n        if(score>0) info='装备评分 '+score;",
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
"        info='【'+(TYPE_CN[it.type]||it.type)+'】'+(parts.length?(parts.join(' · ')+' · '):'')+'评分 '+score;","详情行");

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 槽位逻辑 v2 完成 ===');
