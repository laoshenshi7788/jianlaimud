$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$src = "E:\1\mud\2\JianLai mud\剑来.txt"
$content = [System.IO.File]::ReadAllText($src, [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder

# 1) 九洲与大天下候选词频
$candidates = @('中土神洲','桐叶洲','宝瓶洲','北俱芦洲','南婆娑洲','皑皑洲','金甲洲','俱卢洲','流霞洲','蛮荒天下','青冥天下','莲花天下','浩然天下','第五座天下','扶摇洲','团竹洲' )
[void]$out.AppendLine('== 洲名词频 ==')
foreach($c in $candidates){
  $n = [regex]::Matches($content, [regex]::Escape($c)).Count
  [void]$out.AppendLine("$c : $n")
}

# 2) 城池/地名词频（候选，验证原著是否有）
$cities = @('中土神京','神京','桐叶城','飞鹰堡','老龙城','青鸾国','大隋','大骊','宝镜庄','文庙','穗山','大酆都','雷公庙','白帝城','倒悬山','狮子峰','藕花福地','云窟福地','白纸福地','五老峰','小陌山','披云山','南苑国','大藻国','屿国','湖君','江山渡','螃蟹坊','飞升台','披麻宗','玉圭宗','龙泉剑宗','云岩宗','白玉京','大玄都观')
[void]$out.AppendLine('== 城池/势力词频 ==')
foreach($c in $cities){
  $n = [regex]::Matches($content, [regex]::Escape($c)).Count
  [void]$out.AppendLine("$c : $n")
}

# 3) 抓取"中土神洲"上下文片段（前后30字），看中土有哪些地名
[void]$out.AppendLine('== 中土神洲 上下文（前12处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('中土神洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 12){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[void]$out.AppendLine('== 桐叶洲 上下文（前10处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('桐叶洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 10){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[void]$out.AppendLine('== 流霞洲 上下文（前6处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('流霞洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 6){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[void]$out.AppendLine('== 皑皑洲 上下文（前6处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('皑皑洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 6){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[void]$out.AppendLine('== 南婆娑洲 上下文（前6处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('南婆娑洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 6){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[void]$out.AppendLine('== 俱卢洲 上下文（前6处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('俱卢洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 6){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[void]$out.AppendLine('== 金甲洲 上下文（前4处） ==')
$ms = [regex]::Matches($content, [regex]::Escape('金甲洲'))
$shown = 0
foreach($m in $ms){
  if($shown -ge 4){ break }
  $s = [Math]::Max(0, $m.Index - 30)
  $len = [Math]::Min(80, $content.Length - $s)
  [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "`n",' ') + '…')
  $shown++
}

[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\canon_geo.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done"
