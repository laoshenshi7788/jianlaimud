$ErrorActionPreference = 'Stop'
$content = [System.IO.File]::ReadAllText("E:\1\mud\2\JianLai mud\index.html", [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder
$i = $content.IndexOf('const DRAMA=')
$j = $content.IndexOf('// —— 网文桥段', $i)
if($j -lt 0){ $j = $i + 40000 }
$seg = $content.Substring($i, [Math]::Min($j - $i, 60000))
$names = @{}
foreach($m in [regex]::Matches($seg, "(?m)^  '([^']{2,8})':\{")){
  $names[$m.Groups[1].Value] = 1
}
[void]$out.AppendLine('DRAMA NPC 数: ' + $names.Count)
[void]$out.AppendLine((($names.Keys | Sort-Object) -join '、'))
# codexNpc 定义
$k = $content.IndexOf('function codexNpc')
if($k -ge 0){
  $lineNo = ($content.Substring(0,$k) -split "`n").Count
  [void]$out.AppendLine('codexNpc at line ' + $lineNo)
  [void]$out.AppendLine($content.Substring($k, 700))
}
# ambientFlavor 定义
$k2 = $content.IndexOf('function ambientFlavor')
if($k2 -ge 0){
  $lineNo2 = ($content.Substring(0,$k2) -split "`n").Count
  [void]$out.AppendLine('=== ambientFlavor at line ' + $lineNo2 + ' ===')
  [void]$out.AppendLine($content.Substring($k2, 900))
}
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\audit1.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output 'done'
