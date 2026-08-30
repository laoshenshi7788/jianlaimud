$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) 删体内的声明行
$decl="`n      const EQUIP_TYPES=['weapon','offhand','armor','accessory','garb','head','hands','waist','feet'];"
if(-not $html.Contains($decl)){ throw '体内声明未找到' }
$html=$html.Replace($decl,'')
# 2) 提升到 openBackpack 之前
$fn='function openBackpack(){'
if(-not $html.Contains($fn)){ throw 'openBackpack 未找到' }
$pre="const EQUIP_TYPES=['weapon','offhand','armor','accessory','garb','head','hands','waist','feet'];`n"
$html=$html.Replace($fn,$pre+$fn)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'EQUIP_TYPES hoisted'
