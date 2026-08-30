#!/usr/bin/env node
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const old=[
"  ['weapon','armor','accessory'].forEach(function(slot){",
"    const it=player.equipment[slot]?itemData(player.equipment[slot]):null;",
"    if(!it) return;",
"    if(it.critBonus) b.crit+=it.critBonus;",
"    if(it.critDmgBonus) b.critDmg+=it.critDmgBonus;",
"    if(it.drBonus) b.dr+=it.drBonus;",
"    if(it.dodgeBonus) b.dodge+=it.dodgeBonus;",
"  });"
].join('\n');
if(!src.includes(old)) throw new Error('仍未匹配');
const nw=[
"  ['weapon','offhand','armor','accessory','head','hands','waist','feet'].forEach(function(slot){",
"    const _half=(slot==='offhand')?0.5:1;",
"    const it=player.equipment[slot]?itemData(player.equipment[slot]):null;",
"    if(!it) return;",
"    if(it.critBonus) b.crit+=it.critBonus*_half;",
"    if(it.critDmgBonus) b.critDmg+=it.critDmgBonus*_half;",
"    if(it.drBonus) b.dr+=it.drBonus*_half;",
"    if(it.dodgeBonus) b.dodge+=it.dodgeBonus*_half;",
"  });"
].join('\n');
src=src.replace(old,nw);
fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('✓ equipBonus 聚合块已扩');
