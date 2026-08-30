$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old="  function _hash(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*33+s.charCodeAt(i))>>>0; return h; }\n  );\n"
if(-not $html.Contains($old)){ throw 'orphan anchor missing' }
$html=$html.Replace($old,"  function _hash(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*33+s.charCodeAt(i))>>>0; return h; }\n")
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'orphan removed'
