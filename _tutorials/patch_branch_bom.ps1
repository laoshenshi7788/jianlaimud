$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old="      } else if(it.type==='weapon'||it.type==='armor'||it.type==='accessory'){"
$new="      } else if(EQUIP_TYPES.indexOf(it.type)>-1){"
if(-not $html.Contains($old)){ throw 'branch anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'branch extended'
