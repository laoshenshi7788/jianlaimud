$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 1) 基础规则：去掉高度限制与滚动条（按钮自然铺开，折叠按钮管空间）
$html=$html.Replace(
  '#npc-bar,#event-bar{display:flex;flex-wrap:wrap;gap:6px;flex:0 0 auto;max-height:4.6em;overflow-y:auto;}',
  '#npc-bar,#event-bar{display:flex;flex-wrap:wrap;gap:6px;flex:0 0 auto;}')
# 2) 窄屏补充块：整条删除
$html=$html.Replace('#npc-bar,#event-bar{max-height:7.5em;overflow-y:auto;flex:0 0 auto;}`n','')
$html=$html.Replace('#npc-bar,#event-bar{max-height:7.5em;overflow-y:auto;flex:0 0 auto;}','')
# 3) 移动端块：整条删除
$html=$html.Replace('#npc-bar,#event-bar{max-height:4.6em;overflow-y:auto;flex:0 0 auto;}`n','')
$html=$html.Replace('#npc-bar,#event-bar{max-height:4.6em;overflow-y:auto;flex:0 0 auto;}','')
# 4) 折叠态保留收起能力（确认仍有 folded 规则，不动）
# 5) 修日志底部被裁：interact 约束在剩余空间内，log 内部滚动
$old5='#interact{'
$new5='#interact{min-height:0;overflow:hidden;'
$idx=$html.IndexOf($old5)
if($idx -lt 0){ throw 'interact anchor missing' }
# 只替换第一处（主样式），避免波及媒体查询里的同名选择器
$html=$html.Substring(0,$idx)+'#interact{min-height:0;overflow:hidden;'+$html.Substring($idx+$old5.Length)
# 6) 桌面 #main 补 min-height:0（纵向收缩链完整）
$old6='#main{flex:1;display:flex;gap:10px;min-width:0;}'
if($html.Contains($old6)){
  $html=$html.Replace($old6,'#main{flex:1;display:flex;gap:10px;min-width:0;min-height:0;}')
} else {
  $html=$html.Replace('#main{flex:1;display:flex;gap:10px;min-width:0;','#main{flex:1;display:flex;gap:10px;min-width:0;min-height:0;')
}
# 7) 桌面 #left 补 min-height:0
$old7='#left{flex:1;display:flex;flex-direction:column;gap:10px;min-width:0;}'
if($html.Contains($old7)){
  $html=$html.Replace($old7,'#left{flex:1;display:flex;flex-direction:column;gap:10px;min-width:0;min-height:0;}')
}
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'BAR SCROLLBARS REMOVED + LOG CLIP FIXED'
