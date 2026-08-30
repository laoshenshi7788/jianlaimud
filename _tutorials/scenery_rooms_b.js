#!/usr/bin/env node
/* scenery_rooms_b.js —— B 删渲染期景物点块（含 trail 残部与景物 IIFE） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

const scStart=src.indexOf('  // 视野光源（同 mapVisibility 的街巷视线模型）：贴身环视 + 顺街远眺');
if(scStart<0){ console.log('渲染期景物块已不在'); }
else{
  const ifeStart=src.lastIndexOf('(function(){', scStart);
  if(ifeStart<0) throw new Error('IIFE 起点未找到');
  // 括号配对找 IIFE 收尾（跳过字符串/注释/转义）
  let depth=0, i=ifeStart, end=-1, inStr=null, esc=false;
  for(; i<src.length; i++){
    const c=src[i];
    if(esc){ esc=false; continue; }
    if(c==='\\'){ esc=true; continue; }
    if(inStr){ if(c===inStr) inStr=null; continue; }
    if(c==='"'||c==="'"||c==='`'){ inStr=c; continue; }
    if(c==='/'&&src[i+1]==='/'){ while(i<src.length&&src[i]!=='\n') i++; continue; }
    if(c==='/'&&src[i+1]==='*'){ i+=2; while(i<src.length&&!(src[i]==='*'&&src[i+1]==='/')){ if(src[i]==='\n') i++; } i++; continue; }
    if(c==='{'||c==='('||c==='[') depth++;
    else if(c==='}'||c===')'||c===']'){ depth--; if(depth===0){ end=i; break; } }
  }
  if(end<0) throw new Error('IIFE 收尾未找到');
  let cutFrom=ifeStart;
  const cmt=src.lastIndexOf('// 视野光源', ifeStart);
  const cmtLine=src.lastIndexOf('\n', cmt);
  if(cmt>-1 && ifeStart-cmt<300) cutFrom=cmtLine+1;
  const removed=src.slice(cutFrom,end+2);
  src=src.slice(0,cutFrom)+src.slice(end+2);
  console.log('OK B1 渲染期景物 IIFE 已删（'+removed.length+' 字符）');
}
fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== B 完成 ===');
