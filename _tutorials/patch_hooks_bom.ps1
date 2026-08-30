$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) 白雁滩涂 hook 修正 + 换方向 e（s/n/w 被占）
$old="{ key:'白雁滩涂', hook:'宝瓶洲渡口·泊船坞', dir:'s',"
if(-not $html.Contains($old)){ throw 'baitan missing' }
$html=$html.Replace($old,"{ key:'白雁滩涂', hook:'泊船坞', dir:'e',")
# 2) hook 解析加模糊回退（防再犯：键名带前缀/不带前缀都能找到）
$old2=@'
    const hook=ROOMS[z.hook];
    if(hook){
'@
$new2=@'
    let hook=ROOMS[z.hook];
    if(!hook){
      const alt=Object.keys(ROOMS).find(function(n){
        return n==='骊珠小镇·'+z.hook || n.endsWith('·'+z.hook);
      });
      if(alt) hook=ROOMS[alt];
    }
    if(hook){
'@
if(-not $html.Contains($old2)){ throw 'hook resolve anchor missing' }
$html=$html.Replace($old2,$new2)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'HOOK FIXED (baitan + fuzzy fallback)'
