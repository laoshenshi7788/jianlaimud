$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
function Rep([string]$old,[string]$new,[string]$tag){
  if(-not $script:html.Contains($old)){ Write-Host ('SKIP(未找到): '+$tag); return }
  $script:html=$script:html.Replace($old,$new)
  Write-Host ('OK '+$tag)
}
# 1) 丢弃二次确认
Rep @'
      const d=document.createElement('button');
      d.className='btn small'; d.textContent='丢弃';
      d.title='丢掉一件（丢掉即消失，请三思）';
      d.addEventListener('click',function(){
        if(countItem(name)<1) return;
        removeItem(name);
        log('（你丢弃了一件「'+itemLabel(name)+'」。）','sys');
        updateSidebar();
        openBackpack();
      });
'@ @'
      const d=document.createElement('button');
      d.className='btn small'; d.textContent='丢弃';
      d.title='丢掉一件（丢掉即消失，需二次确认）';
      d.addEventListener('click',function(){
        if(countItem(name)<1) return;
        if(d.textContent==='丢弃'){
          d.textContent='确认丢弃？';
          d.classList.add('danger');
          setTimeout(function(){ if(d&&d.isConnected){ d.textContent='丢弃'; d.classList.remove('danger'); } },3000);
          return;
        }
        removeItem(name);
        log('（你丢弃了一件「'+itemLabel(name)+'」。）','sys');
        updateSidebar();
        openBackpack();
      });
'@ '丢弃二次确认'
# 2) 按钮改调息（用子串替换避免整行锚点失配）
Rep '>将养</button>' '>调 息</button>' '按钮文本改调息'
Rep 'title="疗伤 / 调养——点开选择调理方式">调 息</button>' 'title="疗伤 / 歇息 / 用药——点开选择调理方式">调 息</button>' '按钮title改'
# 3) 面板题改调息
Rep "  openModal('将养 · 调理身躯', ()=>h);" "  openModal('调 息 · 调理身躯', ()=>h);" '面板题改调息'
# 4) 捏合前插排队器
Rep @'
  svg.addEventListener('pointermove',function(e){
    if(pts.has(e.pointerId)) pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch && pts.size>=2){
'@ @'
  let _panQueued=false;
  function queuePan(dx,dy){
    mapPanTo(dx,dy);
    if(!_panQueued && typeof requestAnimationFrame==='function'){
      _panQueued=true;
      requestAnimationFrame(function(){ _panQueued=false; applyMapView(); });
    }
  }
  svg.addEventListener('pointermove',function(e){
    if(pts.has(e.pointerId)) pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch && pts.size>=2){
'@ '捏合前插排队器'
# 5) 平移走排队器
Rep @'
    mapPanTo(dx, dy);
    mapZoom.lx=e.clientX; mapZoom.ly=e.clientY;
'@ @'
    queuePan(dx, dy);
    mapZoom.lx=e.clientX; mapZoom.ly=e.clientY;
'@ '平移走排队器'
# 6) 顺手修恢复版残留的双 useStrict（若有）
$html=$html.Replace("'use strict';'use strict';","'use strict';")
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host '=== QUICK FIXES DONE ==='
