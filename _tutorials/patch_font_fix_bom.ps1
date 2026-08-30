$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old='  /* 移动端：与桌面一致——说明可读、人物/事件栏可点字折叠、节点不再额外放大（防框体粘连） */'
$new='  /* 移动端：正文字号加大（楷体小字在低分屏发虚），全局抗锯齿 */'+"`n"+'  body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;}'+"`n"+'  #log{font-size:1em;}'+"`n"+'  #place-desc{font-size:.95em;}'
if(-not $html.Contains($old)){ throw 'anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'FONT FIXES APPLIED'
