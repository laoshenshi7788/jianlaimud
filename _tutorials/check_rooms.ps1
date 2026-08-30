$ErrorActionPreference = 'Stop'
$content = [System.IO.File]::ReadAllText("E:\1\mud\2\JianLai mud\index.html", [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder
$rooms = @('文庙广场','文庙御街','文庙朱雀门','桐叶宗山门','桐叶宗·镇中广场','桐叶宗·镇心广场','街尾民居','泥瓶巷','剑气长城城头','剑气长城入口','落魄山','龙虎山','藕花福地','佛光寺','蛮荒密林','云窟城','云窟城门')
foreach($r in $rooms){
  $pat = "'" + $r + "'\s*:\s*\{"
  $n = [regex]::Matches($content, $pat).Count
  [void]$out.AppendLine("$r : ROOM定义 $n 处")
}
# 列出桐叶宗下所有房间 key
[void]$out.AppendLine('')
[void]$out.AppendLine('== 桐叶宗房间 ==')
$ms = [regex]::Matches($content, "'(桐叶宗[^']*)'\s*:\s*\{")
$seen = @{}
foreach($m in $ms){ if(-not $seen.ContainsKey($m.Groups[1].Value)){ $seen[$m.Groups[1].Value]=1; [void]$out.AppendLine($m.Groups[1].Value) } }
[void]$out.AppendLine('')
[void]$out.AppendLine('== 文庙房间 ==')
$ms = [regex]::Matches($content, "'(文庙[^']*)'\s*:\s*\{")
$seen = @{}
foreach($m in $ms){ if(-not $seen.ContainsKey($m.Groups[1].Value)){ $seen[$m.Groups[1].Value]=1; [void]$out.AppendLine($m.Groups[1].Value) } }
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\room_check.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done"
