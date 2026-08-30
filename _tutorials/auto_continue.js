#!/usr/bin/env node
/* ================================================================
   auto_continue.js —— 「系统繁忙」自动重试器（最多 N 次，成功即停）
   ---------------------------------------------------------------
   两种用法：
   A. 调用聊天补全 API（OpenAI 兼容格式），繁忙/超时自动重发指令：
      node auto_continue.js --send "继续" --max 200
      配置见同目录 auto_continue.config.json（或环境变量 AC_URL/AC_KEY/AC_MODEL）
      加 --loop 可在成功后继续循环发送（多轮长任务）
   B. 包装任意命令，非零退出（或输出含「繁忙」）即自动重跑：
      node auto_continue.js --cmd "python bot.py" --max 200
      成功即停（不会重复执行成功的命令）；加 --loop 才会循环
   ---------------------------------------------------------------
   重试节奏：1.5s 起步，每次 ×1.35，封顶 30s，加 ±20% 抖动；
   繁忙判定：HTTP 429/5xx、网络错误、响应体含「系统繁忙/繁忙/overloaded」。
   依赖：Node.js 18+（内置 fetch）。
   ================================================================ */
'use strict';
const fs=require('fs');
const path=require('path');

const CFG_PATH=path.join(__dirname,'auto_continue.config.json');
const DEFAULTS={
  url:'https://api.z.ai/api/paas/v4/chat/completions',
  apiKey:process.env.AC_KEY||'',
  model:process.env.AC_MODEL||'glm-4-flash',
  prompt:'继续',
  maxRetries:200,
  backoffMs:1500,
  backoffMax:30000,
  timeoutMs:120000,
  history:[]
};
function loadCfg(){
  let cfg=Object.assign({},DEFAULTS);
  try{ const j=JSON.parse(fs.readFileSync(CFG_PATH,'utf8')); cfg=Object.assign(cfg,j); }catch(e){}
  for(const k of ['url','apiKey','model']){ const env={url:'AC_URL',apiKey:'AC_KEY',model:'AC_MODEL'}[k]; if(process.env[env]) cfg[k]=process.env[env]; }
  return cfg;
}
function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--send') out.send=argv[++i];
    else if(argv[i]==='--cmd') out.cmd=argv[++i];
    else if(argv[i]==='--max') out.max=parseInt(argv[++i],10);
    else if(argv[i]==='--loop') out.loop=true;
  }
  return out;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function backoff(cfg,attempt){
  const base=Math.min(cfg.backoffMax, cfg.backoffMs*Math.pow(1.35,attempt-1));
  const jit=base*(0.8+Math.random()*0.4);
  return Math.round(jit);
}
function isBusyText(s){ return /系统繁忙|服务繁忙|繁忙|overloaded|rate.?limit|too many requests/i.test(s||''); }
function log(tag,msg){ const t=new Date().toLocaleTimeString(); console.log('['+t+']['+tag+'] '+msg); }

async function callApiOnce(cfg,prompt){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),cfg.timeoutMs);
  try{
    const res=await fetch(cfg.url,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},
      body:JSON.stringify({model:cfg.model,messages:[...(cfg.history||[]),{role:'user',content:prompt}]}),
      signal:ctrl.signal
    });
    const text=await res.text();
    if(res.status===429||res.status>=500){ const e=new Error('HTTP '+res.status); e.busy=true; e.body=text.slice(0,300); throw e; }
    if(!res.ok){ const e=new Error('HTTP '+res.status+' '+text.slice(0,200)); e.fatal=true; throw e; }
    if(isBusyText(text)){ const e=new Error('繁忙字样'); e.busy=true; throw e; }
    let content='';
    try{ const j=JSON.parse(text); content=(j.choices&&j.choices[0]&&(j.choices[0].message||{}).content)||''; }catch(e){}
    return content||text;
  }catch(err){
    if(err.name==='AbortError'){ err.message='请求超时'; err.busy=true; }
    if(err.cause&&['ECONNRESET','ETIMEDOUT','ENOTFOUND'].includes(err.cause.code)) err.busy=true;
    throw err;
  }finally{ clearTimeout(timer); }
}
// 命令包装：非零退出码或输出含繁忙字样 → 可重试；否则原样返回
function runCmdOnce(cmd){
  const {exec}=require('child_process');
  return new Promise((resolve,reject)=>{
    exec(cmd,{cwd:process.cwd(),maxBuffer:16*1024*1024},(err,stdout,stderr)=>{
      if(err){
        const e=new Error('退出码 '+err.code);
        e.busy=isBusyText(stdout)||isBusyText(stderr);
        e.out=(stdout||'')+(stderr||'');
        reject(e); return;
      }
      resolve(stdout);
    });
  });
}

(async function main(){
  const args=parseArgs(process.argv.slice(2));
  const cfg=loadCfg();
  const max=args.max||cfg.maxRetries;
  const prompt=args.send||cfg.prompt;
  log('启动','模式='+(args.cmd?('命令包装: '+args.cmd):('API: '+cfg.url+' model='+cfg.model))+' 上限='+max+' 次'+(args.loop?' [循环模式]':''));
  let ok=false;
  for(let i=1;i<=max;i++){
    try{
      const out=args.cmd?(await runCmdOnce(args.cmd)):(await callApiOnce(cfg,prompt));
      log('成功','第 '+i+' 次尝试通过。');
      if(args.cmd){ console.log(String(out).slice(0,4000)); }
      else{
        console.log('────────── 回复 ──────────');
        console.log(String(out).slice(0,8000));
        cfg.history.push({role:'user',content:prompt},{role:'assistant',content:String(out).slice(0,4000)});
        if(cfg.history.length>20) cfg.history=cfg.history.slice(-20);
      }
      ok=true;
      if(!args.loop) break; // 成功即停（--loop 才继续）
      await sleep(1000);
    }catch(err){
      if(err.fatal){ log('致命','不可重试错误：'+err.message); process.exit(3); }
      const wait=backoff(cfg,i);
      log(err.busy?'繁忙':'错误','第 '+i+'/'+max+' 次失败：'+err.message+(err.body?(' | '+String(err.body).slice(0,120)):'')+' → '+wait+'ms 后自动重发');
      if(i===max){ log('放弃','已达 '+max+' 次上限。'); process.exit(2); }
      await sleep(wait);
    }
  }
  if(ok && !args.cmd){ try{ fs.writeFileSync(CFG_PATH,JSON.stringify(cfg,null,2)); }catch(e){} }
  process.exit(0);
})();
