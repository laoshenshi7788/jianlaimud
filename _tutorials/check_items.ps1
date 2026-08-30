$ErrorActionPreference = 'Stop'
$content = [System.IO.File]::ReadAllText("E:\1\mud\2\JianLai mud\index.html", [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder
# 1) 悟道茶叶 在 ITEMS 中的定义
$pat = "'悟道茶叶'\s*:\s*\{"
$ms = [regex]::Matches($content, $pat)
[void]$out.AppendLine('悟道茶叶 ITEM 定义: ' + $ms.Count)
foreach($m in $ms){
  $lineNo = ($content.Substring(0, $m.Index) -split "`n").Count
  $s = [Math]::Max(0, $m.Index - 10); $len = [Math]::Min(150, $content.Length - $s)
  [void]$out.AppendLine("  line $lineNo : " + ($content.Substring($s,$len) -replace "\s+",' '))
}
# 2) 悟道茶叶 的获取来源（shop stock / loot / drops）
foreach($ctx in @('shop','loot','drops','stock')){
  $ms2 = [regex]::Matches($content, "(.{0,60})悟道茶叶(.{0,40})")
  [void]$out.AppendLine("悟道茶叶 总提及: " + $ms2.Count)
  break
}
$ms3 = [regex]::Matches($content, "(.{0,70})'悟道茶叶'(.{0,50})")
$shown=0
foreach($m in $ms3){
  if($shown -ge 14){ break }
  $lineNo = ($content.Substring(0, $m.Index) -split "`n").Count
  [void]$out.AppendLine("  ctx line $lineNo : " + (($m.Groups[1].Value + '【悟道茶叶】' + $m.Groups[2].Value) -replace "\s+",' '))
  $shown++
}
# 3) 书院山门 房间
[void]$out.AppendLine('书院山门 ROOM: ' + [regex]::Matches($content, "'书院山门'\s*:\s*\{").Count)
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\item_check.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done"
