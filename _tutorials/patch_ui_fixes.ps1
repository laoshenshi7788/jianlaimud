$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
function Rep([string]$old,[string]$new){
  if(-not $script:html.Contains($old)){ throw ('NOT FOUND: '+$old.Substring(0,[Math]::Min(60,$old.Length))) }
  $script:html=$script:html.Replace($old,$new)
}
# 1) 删「目力所及」出戏文案（视野节点点击）
Rep @'
    logInfo('（你望向「'+nm+'」——目力所及，点它便沿路前往。）');
'@ ''
# 2) 删地图头部的传送按钮（传送/驿路已由事件栏按地点提供）
Rep @'
      <button class="zbtn" id="map-travel" title="传送/驿路：赴天下大城">⟿</button>
'@ ''
Rep @'
  const zt=document.getElementById('map-travel');
'@ ''
Rep @'
  if(zt) zt.addEventListener('click',function(e){ e.stopPropagation(); openTravel(); });
'@ ''
# 3) 江湖偶遇：不再弹窗，选择按钮直接挂到事件栏
Rep @'
  const h=document.createElement('div');
  h.style.cssText='font-size:.8em;color:#ffffff;';
  t.options.forEach(function(opt){
    if(opt.cond && !opt.cond()) return;
    const row=document.createElement('div'); row.className='list-row';
    row.innerHTML='<span class="lname">'+opt.text+'</span><span class="lmeta">'+(opt.desc||'')+'</span>';
    const b=document.createElement('button'); b.className='btn small '+(opt.cls||''); b.textContent='去做';
    b.addEventListener('click',function(){ document.getElementById('overlay').classList.remove('show'); opt.fn(); updateSidebar(); });
    row.appendChild(b);
    h.appendChild(row);
  });
  openModal(t.title+' · 江湖偶遇', ()=>h);
'@ @'
  // 偶遇选择直接挂到事件栏（不再弹窗打断）
  const eb=document.getElementById('event-bar');
  if(eb){
    eb.innerHTML='';
    t.options.forEach(function(opt){
      if(opt.cond && !opt.cond()) return;
      const b=document.createElement('button'); b.className='btn small '+(opt.cls||''); b.textContent=opt.text; if(opt.desc) b.title=opt.desc;
      b.addEventListener('click',function(){ opt.fn(); updateSidebar(); renderEvents(); });
      eb.appendChild(b);
    });
  }
'@
# 4) 日志永远滚到最新（去掉 smooth 与 nearBottom 门限）
Rep @'
  const nearBottom= box.scrollHeight-box.scrollTop-box.clientHeight<60;
'@ ''
Rep @'
  // 只在接近底部时自动下滚（省却无谓布局，用户上翻日志也不被拽回）
  if(nearBottom) box.scrollTop=box.scrollHeight;
'@ @'
  // 永远滚到最新
  box.style.scrollBehavior='auto';
  box.scrollTop=box.scrollHeight;
'@
Rep @'
  scroll-behavior:smooth;
'@ ''
# 5) 移动端地图聚焦：默认更高倍率居中玩家；放大上限 4→8
Rep @'
  mapZoom.s=(lv==='cheng')?1.4:1;
'@ @'
  mapZoom.s=(window.innerWidth<760)?((lv==='cheng')?2.6:1.8):((lv==='cheng')?1.4:1);
'@
Rep @'
  const defS=(lv==='cheng')?1.4:1;
'@ @'
  const defS=(window.innerWidth<760)?((lv==='cheng')?2.6:1.4):((lv==='cheng')?1.4:1);
'@
Rep @'
  mapZoom.s=Math.max(0.5, Math.min(4, s0*factor));
'@ @'
  mapZoom.s=Math.max(0.5, Math.min(8, s0*factor));
'@
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'UI FIXES APPLIED (travel/trope/scroll/zoom/texts)'
