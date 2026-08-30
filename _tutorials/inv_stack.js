#!/usr/bin/env node
/* inv_stack.js —— 背包堆叠 + 丢弃（重写干净版） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

// 定位行囊 forEach 整段
const headMark="  } else {\n    player.inventory.forEach(function(name){\n      const it=itemData(name);\n      if(!it) return;";
if(!src.includes(headMark)) throw new Error('行囊渲染头未找到');
const start=src.indexOf(headMark);
const bodyStart=src.indexOf('{', src.indexOf('forEach', start));
let depth=0, i=bodyStart, end=-1;
for(; i<src.length; i++){
  const c=src[i];
  if(c==='{') depth++;
  else if(c==='}'){ depth--; if(depth===0){ end=i; break; } }
}
if(end<0) throw new Error('forEach 结束未找到');
const callEnd=src.indexOf(');', end);
if(callEnd<0) throw new Error('调用结束未找到');

const L=[];
L.push("  } else {");
L.push("    // —— 同名物品堆叠：Map 统计 name→count ——");
L.push("    const stacks=new Map();");
L.push("    player.inventory.forEach(function(name){ stacks.set(name,(stacks.get(name)||0)+1); });");
L.push("    stacks.forEach(function(cnt,name){");
L.push("      const it=itemData(name);");
L.push("      if(!it) return;");
L.push("      const row=document.createElement('div'); row.className='list-row';");
L.push("      let info=it.desc||'';");
L.push("      if(it.type==='consumable'){");
L.push("        if(it.effect==='heal') info='恢复生命 '+(it.value||0);");
L.push("        else if(it.effect==='mana') info='恢复内力 '+(it.value||0);");
L.push("        else if(it.effect==='exp') info='修为 +'+(it.value||0);");
L.push("        else if(it.effect==='wound') info='舒缓伤势';");
L.push("        else if(it.effect==='looks') info='增益容貌';");
L.push("      } else if(it.type==='weapon'||it.type==='armor'||it.type==='accessory'){");
L.push("        const score=equipScore(it);");
L.push("        if(score>0) info='装备评分 '+score;");
L.push("      }");
L.push("      row.innerHTML='<span class=\"lname\">'+itemLabel(name)+(cnt>1?(' <span class=\"chip\">×'+cnt+'</span>'):'')+'</span><span class=\"lmeta\">'+info+'</span>';");
L.push("      const usable=(it.type==='consumable' || it.type==='weapon' || it.type==='armor' || it.type==='accessory' || it.type==='garb');");
L.push("      if(usable){");
L.push("        const b=document.createElement('button');");
L.push("        b.className='btn small '+(it.type==='consumable'?'green':'blue');");
L.push("        b.textContent=(it.type==='consumable')?'使用':((it.type==='garb')?'换上':'装备');");
L.push("        b.addEventListener('click',function(){");
L.push("          useItem(name);");
L.push("          updateSidebar();");
L.push("          openBackpack();");
L.push("        });");
L.push("        row.appendChild(b);");
L.push("      }");
L.push("      // —— 丢弃：一次丢一件，可连点 ——");
L.push("      const d=document.createElement('button');");
L.push("      d.className='btn small'; d.textContent='丢弃';");
L.push("      d.title='丢掉一件（丢掉即消失，请三思）';");
L.push("      d.addEventListener('click',function(){");
L.push("        if(countItem(name)<1) return;");
L.push("        removeItem(name);");
L.push("        log('（你丢弃了一件「'+itemLabel(name)+'」。）','sys');");
L.push("        updateSidebar();");
L.push("        openBackpack();");
L.push("      });");
L.push("      row.appendChild(d);");
L.push("      h.appendChild(row);");
L.push("    });");
L.push("  }");
const newBlock=L.join('\n');

src=src.slice(0,start)+newBlock+src.slice(callEnd+1);
console.log('✓ 行囊堆叠+丢弃已替换');

// —— 侧栏 s-inv 摘要堆叠 ——
const sumOld="  const consum=player.inventory.filter(i=>{const it=itemData(i);return it&&it.type==='consumable';});\n  const mats=player.inventory.filter(i=>{const it=itemData(i);return it&&(it.type==='material'||it.type==='special'||it.type==='quest');});";
if(!src.includes(sumOld)) throw new Error('侧栏摘要头未找到');
const sumNew=[
"  const cntMap=new Map();",
"  player.inventory.forEach(function(n){ cntMap.set(n,(cntMap.get(n)||0)+1); });",
"  const lab=function(n){ const c=cntMap.get(n)||1; return n+(c>1?('×'+c):''); };",
"  const consum=player.inventory.filter(i=>{const it=itemData(i);return it&&it.type==='consumable';});",
"  const mats=player.inventory.filter(i=>{const it=itemData(i);return it&&(it.type==='material'||it.type==='special'||it.type==='quest');});"
].join('\n');
src=src.replace(sumOld,sumNew);
const c1="(consum.length?consum.map(i=>'<span class=\"chip green\">'+i+'</span>').join(''):'')";
const c1n="(consum.length?[...new Set(consum)].map(i=>'<span class=\"chip green\">'+lab(i)+'</span>').join(''):'')";
if(!src.includes(c1)) throw new Error('consum 渲染未找到');
src=src.replace(c1,c1n);
const c2="(mats.length?'<br>'+mats.map(i=>'<span class=\"chip\">'+i+'</span>').join(''):'')";
const c2n="(mats.length?'<br>'+[...new Set(mats)].map(i=>'<span class=\"chip\">'+lab(i)+'</span>').join(''):'')";
if(!src.includes(c2)) throw new Error('mats 渲染未找到');
src=src.replace(c2,c2n);
console.log('✓ 侧栏摘要堆叠已换');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 堆叠与丢弃完成 ===');
