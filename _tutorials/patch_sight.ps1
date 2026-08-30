$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old=@'
function sightOrigins(){
  const L=computeGridLayout(); const out=[];
  (player.visited||[]).forEach(function(rn){ const p=L.pos[rn]; if(p) out.push({x:p.x,y:p.y}); });
  return out;
}
'@
$new=@'
function sightOrigins(){
  const L=computeGridLayout(); const out=[];
  const push=function(rn){ const p=L.pos[rn]; if(p) out.push({x:p.x,y:p.y}); };
  push(player.room); // 脚下必为眼（防 visited 缺当前格的边界情况）
  (player.visited||[]).forEach(function(rn){ push(rn); });
  return out;
}
'@
if(-not $html.Contains($old)){ throw 'sightOrigins anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'sightOrigins hardened'
