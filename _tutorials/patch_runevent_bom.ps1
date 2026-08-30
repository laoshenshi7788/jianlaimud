$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old=@'
function runEvent(ev){
  logDiv();
  logTitle('◆ 事件 · '+ev.title);
  ev.lines.forEach(l=>log(l,'sys'));
  // 提供选项
  const choices=document.createElement('div');
  choices.className='msg';
  choices.innerHTML='<span class="line choice">—— 你的选择 ——</span>';
  document.getElementById('log').appendChild(choices);
  ev.options.forEach((opt,i)=>{
    if(opt.cond && !opt.cond()) return;
    const b=document.createElement('button');
    b.className='btn small';
    b.textContent=(i+1)+'. '+opt.text;
    b.addEventListener('click',()=>{ opt.effect(); renderMap(); renderEvents(); });
    choices.appendChild(b);
  });
  // 标记该事件已触发（一次性事件防重复；周期事件记冷却，到期重置）
  if(ev.repeat){
    if(!game.evCd) game.evCd={};
    game.evCd[player.room+'|'+ev.title]=game.turns+ev.repeat;
  } else {
    ev._done=true;
  }
  document.getElementById('log').scrollTop=document.getElementById('log').scrollHeight;
}
'@
$new=@'
function runEvent(ev){
  logDiv();
  logTitle('◆ 事件 · '+ev.title);
  ev.lines.forEach(l=>log(l,'sys'));
  logInfo('—— 你的选择（见下方事件栏）——');
  // 选项按钮统一挂事件栏（醒目、可点），用过即弃（幂等，杜绝重复刷奖）
  const eb=document.getElementById('event-bar');
  if(eb){
    eb.innerHTML='';
    ev.options.forEach((opt,i)=>{
      if(opt.cond && !opt.cond()) return;
      const b=document.createElement('button');
      b.className='btn small '+(opt.cls||'');
      b.textContent=(i+1)+'. '+opt.text;
      if(opt.desc) b.title=opt.desc;
      b.addEventListener('click',function(){
        b.remove(); // 用过即弃
        opt.effect();
        renderMap();
        if(!eb.querySelector('button')) renderEvents();
      });
      eb.appendChild(b);
    });
  }
  // 标记该事件已触发（一次性事件防重复；周期事件记冷却，到期重置）
  if(ev.repeat){
    if(!game.evCd) game.evCd={};
    game.evCd[player.room+'|'+ev.title]=game.turns+ev.repeat;
  } else {
    ev._done=true;
  }
}
'@
if(-not $html.Contains($old)){ throw 'runEvent old anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'runEvent rewritten (event-bar + idempotent)'
