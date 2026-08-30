$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) fadeIn 动画去掉 translateY（位移会让新行在动画期内「半裁」观感）
$old1='@keyframes fadeIn{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:none;}}'
$new1='@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}'
if(-not $html.Contains($old1)){ throw 'fadeIn anchor missing' }
$html=$html.Replace($old1,$new1)
# 2) #log 禁用滚动锚定 + logLine 三重滚底
$old2='#log{
  flex:1 1 auto;min-height:110px;max-height:none;overflow-y:auto;'
$new2='#log{
  flex:1 1 auto;min-height:110px;max-height:none;overflow-y:auto;overflow-anchor:none;'
if(-not $html.Contains($old2)){ throw 'log css anchor missing' }
$html=$html.Replace($old2,$new2)
# 3) logLine：同步滚 + rAF 滚 + 60ms 补滚（覆盖动画/字体重排导致的 late 高度）
$old3="  // 永远滚到最新
  box.style.scrollBehavior='auto';
  box.scrollTop=box.scrollHeight;"
$new3="  // 永远滚到最新（三重保险：同步/rAF/动画完成后补滚）
  box.style.scrollBehavior='auto';
  box.scrollTop=box.scrollHeight;
  if(typeof requestAnimationFrame==='function'){ requestAnimationFrame(function(){ box.scrollTop=box.scrollHeight; }); }
  setTimeout(function(){ box.scrollTop=box.scrollHeight; },60);"
if(-not $html.Contains($old3)){ throw 'logLine scroll anchor missing' }
$html=$html.Replace($old3,$new3)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'SCROLL FIX DONE (3 layers)'
