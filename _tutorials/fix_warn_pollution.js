#!/usr/bin/env node
/* 清理 49 处误插的 ss-warn 块，只在 renderStartupPage 正确插入一处，并修 handler 顺序 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8');

// 1) 删除全部误插的三行 warn 块
const blockRe=/\r?\n  const warn=document\.createElement\('div'\); warn\.id='ss-warn';\r?\n  warn\.style\.cssText='[^']*';\r?\n  h\.appendChild\(warn\);/g;
const before=(src.match(blockRe)||[]).length;
src=src.replace(blockRe,'');
console.log('清理误插 warn 块: '+before+' 处');

// 2) 在 renderStartupPage 的 head 后正确插入（锚点：创角页说明文案之后的 h.appendChild(head);）
const anchorTxt='拣好了，点「下一步」就此入世。）';
const ai=src.indexOf(anchorTxt);
if(ai<0){ throw new Error('创角页说明锚点未找到'); }
const appendAt=src.indexOf('h.appendChild(head);', ai);
if(appendAt<0){ throw new Error('appendChild(head) 未找到'); }
const insertPos=appendAt+'h.appendChild(head);'.length;
const warnBlock="\r\n  const warn=document.createElement('div'); warn.id='ss-warn';\r\n  warn.style.cssText='display:none;color:#ffb9a4;background:rgba(176,58,46,.18);border:1px solid rgba(217,79,61,.5);border-radius:6px;padding:6px 10px;font-size:.74em;margin:6px 0;';\r\n  h.appendChild(warn);";
src=src.slice(0,insertPos)+warnBlock+src.slice(insertPos);
console.log('renderStartupPage 已插入 warn 条');

// 3) 修 handler 顺序：先重渲染，再显示警告（否则提示被重建清掉）
const oldHandler="      const warn=document.getElementById('ss-warn');\r\n      if(warn){ warn.textContent='※ 出身尚未择定——出生之地既已选好，请在下方「二 · 出身」一栏择一。'; warn.style.display='block'; }\r\n      renderStartupPage();\r\n      return;";
let fixedOrder=false;
if(src.includes(oldHandler)){
  src=src.replace(oldHandler,"      renderStartupPage();\r\n      const warn=document.getElementById('ss-warn');\r\n      if(warn){ warn.textContent='※ 出身尚未择定——出生之地既已选好，请在下方「二 · 出身」一栏择一。'; warn.style.display='block'; }\r\n      return;");
  fixedOrder=true;
} else {
  // LF 变体
  const oldLF=oldHandler.replace(/\r\n/g,'\n');
  if(src.includes(oldLF)){
    src=src.replace(oldLF,"      renderStartupPage();\n      const warn=document.getElementById('ss-warn');\n      if(warn){ warn.textContent='※ 出身尚未择定——出生之地既已选好，请在下方「二 · 出身」一栏择一。'; warn.style.display='block'; }\n      return;");
    fixedOrder=true;
  }
}
console.log('handler 顺序修正: '+(fixedOrder?'完成':'未找到(需手查)'));

fs.writeFileSync(FILE,src,{encoding:'utf8'});
const remain=(fs.readFileSync(FILE,'utf8').match(/warn\.id='ss-warn'/g)||[]).length;
console.log('剩余 ss-warn 创建处: '+remain+'（应为 1）');
