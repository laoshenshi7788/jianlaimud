$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old="    if(exits.length) log('出口：'+exits.map(d=>(dn[d]||d)+' → '+r.exits[d]).join('　'),'info');"
$new="    if(exits.length) log('出口：'+exits.map(d=>(dn[d]||d)+' → '+roomLabel(r.exits[d])).join('　'),'info');"
if(-not $html.Contains($old)){ throw 'exit line missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'EXIT LABELS FIXED'
