$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old=@'
  } else if(it.type==='accessory'){
    if(player.equipment.accessory) addItem(player.equipment.accessory);
    player.equipment.accessory=name; removeItem(name); logSuccess('佩戴「'+itemLabel(name)+'」。');
  } else if(it.type==='garb'){
'@
$new=@'
  } else if(it.type==='head'||it.type==='hands'||it.type==='waist'||it.type==='feet'){
    if(player.equipment[it.type]) addItem(player.equipment[it.type]);
    player.equipment[it.type]=name; removeItem(name); logSuccess('装备「'+itemLabel(name)+'」。');
  } else if(it.type==='offhand'){
    if(player.equipment.offhand) addItem(player.equipment.offhand);
    player.equipment.offhand=name; removeItem(name); logSuccess('「'+itemLabel(name)+'」入手副位——双持在身，进退有据。');
  } else if(it.type==='garb'){
'@
if(-not $html.Contains($old)){ throw 'accessory anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'useItem branches extended'
