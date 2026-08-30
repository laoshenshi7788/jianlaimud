$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) pos → posMap（6928 报错修复）
$old="          const pp=pos[player.room]; const here=pos[rn];"
$new="          const pp=posMap[player.room]; const here=posMap[rn];"
if(-not $html.Contains($old)){ throw 'pos bug anchor missing' }
$html=$html.Replace($old,$new)
Write-Host 'OK pos bug fixed'
# 2) 删旧胶囊路牌渲染段（「—— 道路节点：隔一格的直路中点…」整段；真路房间已取代它）
$s=$html.IndexOf('  // —— 道路节点：隔一格的直路中点、拐角空位，铺一段有名字的「路」')
if($s -ge 0){
  $e=$html.IndexOf('  // 节点（方框）', $s)
  if($e -lt 0 -or $e -le $s){ throw 'road segment end not found' }
  $len=$e-$s
  $html=$html.Remove($s,$len)
  Write-Host ('OK 旧胶囊渲染段已删: '+$len+' 字符')
}else{
  Write-Host 'SKIP 旧胶囊段已不在'
}
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host '=== DONE ==='
