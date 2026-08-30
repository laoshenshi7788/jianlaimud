#!/usr/bin/env node
/* log_observer.js —— 终极滚底：MutationObserver 监听日志插入即滚底 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const anchor="window.addEventListener('DOMContentLoaded', init);";
if(!src.includes(anchor)) throw new Error('init 绑定锚未找到');
const observer=[
anchor,
"",
"// —— 日志滚底终极保障：任何路径写入日志（含异步/动画场景）都立即滚到最新 ——",
"(function(){",
"  const box=document.getElementById('log');",
"  if(!box || !window.MutationObserver) return;",
"  new MutationObserver(function(){ box.scrollTop=box.scrollHeight; })",
"    .observe(box,{childList:true});",
"})();"
].join('\n');
src=src.replace(anchor,observer);
fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('✓ MutationObserver 滚底已装');
