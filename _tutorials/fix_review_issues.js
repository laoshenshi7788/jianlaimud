#!/usr/bin/env node
/* ================================================================
   fix_review_issues.js —— 按用户核查报告修复 5 项问题
   1 <head> 重复  2 调试标记残留  3 李槐话题前导空格
   4 buildWildZones 重复  5 野区房间缺 area
   ================================================================ */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8');
const rep=(oldS,newS,tag)=>{
  if(!src.includes(oldS)){ throw new Error('NOT FOUND: '+tag); }
  src=src.split(oldS).join(newS);
  console.log('✓ '+tag);
};

// —— 1) 删除探针造成的 <head><head> 重复与探针脚本本体 ——
const probeHead=/<head>\s*<head>\s*<script>\s*window\.__bootErrs=\[\];[\s\S]*?<\/script>/;
if(probeHead.test(src)){
  src=src.replace(probeHead,'<head>');
  console.log('✓ 探针与重复<head>已移除');
} else if(/<head>\s*<head>/.test(src)){
  src=src.replace(/<head>\s*<head>/,'<head>');
  console.log('✓ 重复<head>已移除（探针块已不在）');
} else {
  console.log('- 无重复<head>（跳过）');
}

// —— 2) 删除三处调试标记 ——
src=src.split('\nwindow.__M1=1;').join('');
src=src.split('\nwindow.__M2=1;').join('');
src=src.split('\nwindow.__M3=1;').join('');
console.log('✓ 调试标记 __M1/M2/M3 已清除');

// —— 3) 李槐话题前导空格 ——
src=src.split("' visualization'.replace('visualization','一身煞气')").join("'一身煞气'");
console.log('✓ 李槐话题空格已修');

// —— 4) buildWildZones 去重：保留最后一份，删除先前所有重复块 ——
const MARK='(function buildWildZones(){';
let idxs=[];
let i=src.indexOf(MARK);
while(i>-1){ idxs.push(i); i=src.indexOf(MARK,i+1); }
if(idxs.length>1){
  // 从后往前删，保留最后一份
  for(let k=idxs.length-2;k>=0;k--){
    const start=idxs[k];
    // 块结束：其后第一个「})();」
    const end=src.indexOf('})();',start);
    if(end<0) throw new Error('野区块未闭合');
    src=src.slice(0,start)+src.slice(end+'})();'.length);
  }
  console.log('✓ buildWildZones 去重：删除 '+(idxs.length-1)+' 份');
} else {
  console.log('- buildWildZones 无重复（'+idxs.length+' 份）');
}

// —— 5) 野区补 area：按挂载点归属城池 ——
const areaMap={
  '老桃山密林':'cheng_lizhu','野猪林':'cheng_lizhu','披云山山道':'cheng_lizhu',
  '古沙场':'cheng_lizhu','倒马河谷':'cheng_lizhu','落枫谷':'cheng_lizhu','荒废窑址':'cheng_lizhu',
  '黑松峡':'cheng_dukou','白雁滩涂':'cheng_dukou','乱葬岗':'cheng_dukou'
};
let areaFix=0;
for(const key in areaMap){
  // 在 { key:'X', 后面若无 area 则补
  const pat=new RegExp("(\\{ key:'"+key+"',)(?![^}]*area:)");
  if(pat.test(src)){ src=src.replace(pat,"$1 area:'"+areaMap[key]+"',"); areaFix++; }
}
console.log('✓ 野区 area 补全: '+areaFix+' 处');

fs.writeFileSync(FILE,src,{encoding:'utf8'});
console.log('=== 全部修复完成 ===');
