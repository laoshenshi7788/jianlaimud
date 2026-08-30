#!/usr/bin/env node
/* backup.js —— 每次大改前运行：滚动备份 index.html（保留最近 10 份） */
'use strict';
const fs=require('fs');
const path=require('path');
const SRC=path.join(__dirname,'..','index.html');
const DIR=path.join(__dirname,'backups');
if(!fs.existsSync(DIR)) fs.mkdirSync(DIR,{recursive:true});
const stamp=new Date().toISOString().replace(/[:T]/g,'-').slice(0,19);
const dst=path.join(DIR,'index_'+stamp+'.html');
fs.copyFileSync(SRC,dst);
// 只留最近 10 份
const files=fs.readdirSync(DIR).filter(f=>f.startsWith('index_')).sort();
while(files.length>10){ fs.unlinkSync(path.join(DIR,files.shift())); }
console.log('已备份 → '+dst+'（保留最近10份）');
