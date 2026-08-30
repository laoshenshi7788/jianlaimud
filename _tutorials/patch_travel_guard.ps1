$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old=@'
  if(steps===0){ look(); return; }
  // 相邻（1 程）抬脚便到；2 程及以上选个走法（疾行/逐格）。
'@
$new=@'
  if(steps>=99){ logInfo('（「'+roomLabel(rn)+'」远在千里之外——需先抵达它的城池地界，再作计较。）'); return; }
  // 相邻（1 程）抬脚便到；2 程及以上选个走法（疾行/逐格）。
'@
if(-not $html.Contains($old)){ throw 'anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'PATCHED cross-level guard'
