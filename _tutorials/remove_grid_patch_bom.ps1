$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) 删 gridRoadNet 网格生成器补丁（从块注释起到「字体 / 标题色」常量注释止，保留后者）
$m1='/* ===== 街巷路网 v2：ASCII 网格声明式生成'
$s1=$html.IndexOf($m1)
$m2='/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */'
$e1=$html.IndexOf($m2)
if($s1 -lt 0 -or $e1 -lt 0 -or $e1 -le $s1){ throw ('grid block not found s='+$s1+' e='+$e1) }
$html=$html.Remove($s1,$e1-$s1)
Write-Host ('removed grid block: '+($e1-$s1)+' chars')
# 2) 恢复 startFight 的开场段（battleLog 之前删掉的那两行不需要——战斗层已整体移除，只验证无残留即可）
if($html.IndexOf('battle-overlay') -ge 0){ throw 'battle-overlay still referenced!' }
if($html.IndexOf('mini-svg') -ge 0){ throw 'mini-svg still referenced!' }
if($html.IndexOf('map-overlay') -ge 0){ throw 'map-overlay still referenced!' }
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'GRID PATCH REMOVED'
