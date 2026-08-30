$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# runEvent：选项按钮从日志流迁到事件栏（战斗/偶遇/互动统一交互位）
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
'@
$new=@'
function runEvent(ev){
  logDiv();
  logTitle('◆ 事件 · '+ev.title);
  ev.lines.forEach(l=>log(l,'sys'));
  logInfo('—— 你的选择（见下方按钮）——');
  // 选项按钮统一挂到事件栏（与偶遇/战斗/互动同位，不再塞日志流）
  const eb=document.getElementById('event-bar');
  if(eb){
    eb.innerHTML='';
    ev.options.forEach((opt,i)=>{
      if(opt.cond && !opt.cond()) return;
      const b=document.createElement('button');
      b.className='btn small '+(opt.cls||'');
      b.textContent=(i+1)+'. '+opt.text;
      if(opt.desc) b.title=opt.desc;
      b.addEventListener('click',()=>{
        eb.innerHTML='';
        opt.effect();
        renderMap();
        renderEvents();
      });
      eb.appendChild(b);
    });
  }
'@
if(-not $html.Contains($old)){ throw 'runEvent anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'EVENT OPTIONS MOVED TO EVENT-BAR'
