#!/usr/bin/env node
/* patch_quality_v2.js —— 品质自动推档（接入已有 splitItemName/QUALITY_META 体系） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

const anchor='function itemLabel(n){ const s=splitItemName(n);';
if(!src.includes(anchor)) throw new Error('itemLabel anchor missing');

const helpers=[
'// —— 品质自动推档（无显式品质的物品按综合评分定档） ——',
'function itemQuality(n){',
'  const it=(typeof ITEMS!==\'undefined\')?ITEMS[n]:null;',
'  if(it && it.quality) return it.quality;',
'  const d=(typeof splitItemName===\'function\')?splitItemName(n):null;',
'  if(d && d.qual && QUALITY_META[d.qual]) return d.qual;',
'  const base=it||{};',
"  const score=(base.atkBonus||0)*3+(base.defBonus||0)*2.5+(base.mpBonus||0)*1.5+(base.hpBonus||0)*0.6+Math.log(Math.max(1,base.price||1))*3;",
"  if(score>=110) return '仙品';",
"  if(score>=70) return '绝品';",
"  if(score>=38) return '珍品';",
"  if(score>=16) return '良品';",
"  return '凡品';",
'}',
'',
anchor
].join('\n');
src=src.replace(anchor,helpers);
console.log('✓ itemQuality 已接入');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 品质推档完成 ===');
