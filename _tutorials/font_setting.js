#!/usr/bin/env node
/* font_setting.js —— 设置面板加「界面字号」四档（小/标准/大/特大），即时生效+持久化 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const must=(s,t)=>{ if(!src.includes(s)) throw new Error('NOT FOUND: '+t); };

// 1) 设置面板：在「自动存档」行后插入字号行
const anchor1="  mkRow('自动存档','每 45 秒自动保存进度', b1);";
must(anchor1,'设置面板自动存档行');
const fontRow=[
anchor1,
"  // 界面字号（四档，即时生效）",
"  const sizes=[['小',14],['标准',16],['大',18],['特大',20]];",
"  const curIdx=(function(){ const i=sizes.findIndex(function(s){ return s[1]===(SETTINGS.uiFontSize||16); }); return i<0?1:i; })();",
"  const fRow=document.createElement('div'); fRow.className='list-row';",
"  fRow.innerHTML='<span class=\"lname\">界面字号</span><span class=\"lmeta\">当前：'+sizes[curIdx][0]+'（'+sizes[curIdx][1]+'px）</span>';",
"  const fWrap=document.createElement('div'); fWrap.style.cssText='display:flex;gap:4px;';",
"  sizes.forEach(function(s){",
"    const b=document.createElement('button'); b.className='btn small'+(s[1]===(SETTINGS.uiFontSize||16)?' primary':''); b.textContent=s[0];",
"    b.addEventListener('click',function(){ SETTINGS.uiFontSize=s[1]; saveSettings(); applySettings(); openSettings(); });",
"    fWrap.appendChild(b);",
"  });",
"  fRow.appendChild(fWrap);",
"  h.appendChild(fRow);"
].join('\n');
src=src.replace(anchor1,fontRow);
console.log('OK 设置面板字号行');

// 2) applySettings 里应用字号（找 applySettings 函数体开头）
const a2="function applySettings(){";
must(a2,'applySettings');
src=src.replace(a2,
"function applySettings(){\n"+
"  try{ document.documentElement.style.fontSize=(SETTINGS.uiFontSize||16)+'px'; }catch(e){}");

// 3) 默认字号 16（DEFAULTS 如有 SETTINGS 初始对象则不动，直接靠 ||16 兜底）
fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== 字号设置完成 ===');
