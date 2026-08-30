#!/usr/bin/env node
/* ================================================================
   fix_brackets.js —— 修复文案中「（」未闭合问题
   模式A: log('（……。','npc',…)   → log('（……。）','npc',…)
   模式B: talk:'（……。'          → talk:'（……。）'
   已含「）」的字符串不动；只在确认缺失时补。
   ================================================================ */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8');

let fixedA=0, fixedB=0;
// A1: log('（……','npc' —— 逗号紧贴
src=src.replace(/log\('（([^']*)','npc'/g, function(m,inner){
  if(inner.includes('）')) return m;
  fixedA++;
  return "log('（"+inner+"）','npc'";
});
// A2: log('（……', 'npc' —— 逗号带空格
src=src.replace(/log\('（([^']*)',\s*'npc'/g, function(m,inner){
  if(inner.includes('）')) return m;
  fixedA++;
  return "log('（"+inner+"）', 'npc'";
});
// B: talk:'（……'
src=src.replace(/talk:'（([^']*)'/g, function(m,inner){
  if(inner.includes('）')) return m;
  fixedB++;
  return "talk:'（"+inner+"）'";
});
// 特例：logSuccess('（井下掘得：…+拼接 漏了闭括号 → 补在拼接尾
const spOld="logSuccess('（井下掘得：'+got.join('、')+'。'+(extra||'铁匠手艺 +1。'));";
const spNew="logSuccess('（井下掘得：'+got.join('、')+'。'+(extra||'铁匠手艺 +1。')+'）');";
if(src.includes(spOld)){ src=src.replace(spOld,spNew); fixedA++; }

fs.writeFileSync(FILE,src,{encoding:'utf8'});
console.log('修复完成: 模式A(log台词) '+fixedA+' 处, 模式B(talk字段) '+fixedB+' 处');
