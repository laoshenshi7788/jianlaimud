#!/usr/bin/env node
/* roads_step1b.js —— 删未通小径（精确版：从注释到 for 闭合，逐字符定位） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

const tA="    // 2) 未通小径：正交贴着、图上却不相连的房间对——中点立一块小路牌，说明绕行\n";
const s0=src.indexOf(tA);
if(s0<0){ console.log('未通小径已不在'); process.exit(0); }
// 找该函数块结束：注释后的 function _connected 声明起点
const fnStart=src.indexOf('    function _connected',s0);
if(fnStart<0) throw new Error('_connected 未找到');
// 从 fnStart 找到与之配对的函数结束：逐字符扫花括号
let depth=0, i=fnStart, ended=-1;
for(; i<src.length; i++){
  const c=src[i];
  if(c==='{') depth++;
  else if(c==='}'){ depth--; if(depth===0){ ended=i; break; } }
}
if(ended<0) throw new Error('配对结束未找到');
// 删除 [tA, ended+1)（含函数体），前后各留一个换行
src=src.slice(0,s0)+'\n'+src.slice(ended+1);
console.log('✓ 未通小径块已删（'+(ended+1-s0)+' 字符）');

// 缩放上限 14（幂等：8 或 14 均可）
const zm='mapZoom.s=Math.max(0.5, Math.min(8, s0*factor));';
if(src.includes(zm)){
  src=src.replace(zm,'mapZoom.s=Math.max(0.5, Math.min(14, s0*factor));');
  console.log('✓ 缩放上限 14');
} else if(src.includes('Math.min(14, s0*factor)')){
  console.log('- 缩放已是 14');
} else throw new Error('缩放锚未找到');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== step1b 完成 ===');
