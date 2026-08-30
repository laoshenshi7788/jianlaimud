#!/usr/bin/env node
/* font_all.js —— 全字体放大 + 设置档扩充 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');

// 1) 根字号默认 17px（比 16 更明显）
src=src.replace('html,\nbody{font-size:16px;height:100%;}','html,\nbody{font-size:17px;height:100%;}');
src=src.replace('body{font-size:15px;','body{font-size:17px;');

// 2) 设置字号档扩充：小14/标准16/大18/特大20/超大22
const oldSizes="  const sizes=[['小',14],['标准',16],['大',18],['特大',20]];";
if(!src.includes(oldSizes)) throw new Error('sizes anchor missing');
src=src.replace(oldSizes,"  const sizes=[['极小',12],['小',14],['标准',16],['大',18],['特大',20],['超大',22]];");

// 3) 突发事件幂等已由 patch_runevent.ps1 完成，此处不再重复

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== font_all 完成 ===');
