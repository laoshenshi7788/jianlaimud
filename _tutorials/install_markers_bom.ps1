$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 标记1：gridRoadNet+野区 IIFE 之后
$old1='/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */'
if(-not $html.Contains($old1)){ throw 'm1 anchor missing' }
$html=$html.Replace($old1,"`nwindow.__M1=1;`n"+$old1)
# 标记2：初始化绑定块之前（绑定 btn-attrs 那行往上找一段唯一锚）
$old2="document.getElementById('btn-attrs').addEventListener('click',openAttrs);"
if(-not $html.Contains($old2)){ throw 'm2 anchor missing' }
$html=$html.Replace($old2,"`nwindow.__M2=1;`n"+$old2)
# 标记3：脚本最尾
$tail=$html.LastIndexOf('</script>')
if($tail -lt 0){ throw 'tail missing' }
$html=$html.Insert($tail,"`nwindow.__M3=1;")
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'MARKERS INSTALLED (M1=野区后, M2=绑定块前, M3=脚本尾)'
