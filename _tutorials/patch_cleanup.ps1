$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 修 <head><head>（探针脚本保留，它无害且还能收集报错）
if($html.Contains("<head>`n<head>")){ $html=$html.Replace("<head>`n<head>","<head>"); Write-Host 'head x2 fixed' }
elseif($html.Contains("<head><head>")){ $html=$html.Replace("<head><head>","<head>"); Write-Host 'head x2 fixed' }
else { Write-Host 'head already single' }
# 双 useStrict 清一
$html=$html.Replace("'use strict';'use strict';","'use strict';")
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'CLEANUP DONE'
