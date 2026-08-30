$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old="{ key:'白雁滩涂', area:'cheng_dukou', hook:'宝瓶洲渡口·泊船坞', dir:'s',"
$new="{ key:'白雁滩涂', area:'cheng_dukou', hook:'泊船坞', dir:'e',"
if(-not $html.Contains($old)){ throw 'baitan core not found' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'BAITAN HOOK FIXED'
