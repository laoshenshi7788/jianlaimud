$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) 正文字体：微软雅黑（清晰渲染），楷体只留给标题/诗句
$old="  --font-ui:'KaiTi','STKaiti','楷体','Georgia',serif;"
$new="  --font-ui:'Microsoft YaHei','PingFang SC','Segoe UI',sans-serif;`n  --font-kai:'KaiTi','STKaiti','楷体','Georgia',serif;"
if(-not $html.Contains($old)){ throw 'font-ui anchor missing' }
$html=$html.Replace($old,$new)
# 2) 标题/诗词类继续用楷体（风味保留）
$titles=@(
  @('#top h1{','#top h1{font-family:var(--font-kai);'),
  @('#battle-head .bt{','#battle-head .bt{')
)
$html=$html.Replace('#top h1{', '#top h1{font-family:var(--font-kai);')
$html=$html.Replace('#battle-head .bt{', '#battle-head .bt{font-family:var(--font-kai);')
$html=$html.Replace('.duel-plate .dn{', '.duel-plate .dn{font-family:var(--font-kai);')
$html=$html.Replace('#map-svg .room-node .node-label{', '#map-svg .room-node .node-label{font-family:var(--font-kai);')
# 3) 正文字号基础放大一档 + 行高
$old2='body{'
$html=$html.Replace($old2,"`nbody{font-size:15px;")
# 4) 标题屏主标题也用楷体
$html=$html.Replace('#title-screen h1{', '#title-screen h1{font-family:var(--font-kai);')
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'FONT CLARITY FIX APPLIED (雅黑正文+楷体标题+15px基准)'
