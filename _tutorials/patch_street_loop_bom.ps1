$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")

# 1) 调试标记清理（幂等）
while($html.Contains("window.__M1=1;`n")){ $html=$html.Replace("window.__M1=1;`n","") }
if($html.Contains("window.__M1=1;")){ $html=$html.Replace("window.__M1=1;","") }
Write-Host 'OK M1 清理'

# 2) 字体注释去重（连续重复合并为一个）
$cm='/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */'
while($html.Contains($cm+$cm)){ $html=$html.Replace($cm+$cm,$cm) }
while($html.Contains($cm+"`n"+$cm)){ $html=$html.Replace($cm+"`n"+$cm,$cm) }
Write-Host 'OK 字体注释去重'

# 3) 环口归位：景物 IIFE 尾（})();）与字体注释之间插商街环修正
$tailMarker='  }
})();'
if(-not $html.Contains($tailMarker)){ throw '景物 IIFE 尾未找到' }
$firstTail=$html.IndexOf($tailMarker)
$fixLine="
  // —— 商街环口归位：断开「顺风船行—渡口货栈」，主链（客栈→听潮→…→商会）成为唯一直线动线 ——
  (function fixStreetLoop(){
    const S=ROOMS['宝瓶洲渡口·顺风船行'], G=ROOMS['宝瓶洲渡口·渡口货栈'];
    if(S&&S.exits){ delete S.exits.e; }
    if(G&&G.exits){ delete G.exits.w; }
  })();"
$html=$html.Insert($firstTail+$tailMarker.Length, $fixLine)
Write-Host 'OK 商街环口归位'

$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host '=== DONE ==='
