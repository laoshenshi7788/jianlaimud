$ErrorActionPreference = 'Continue'
$src = "E:\1\mud\2\JianLai mud\剑来.txt"
$content = [System.IO.File]::ReadAllText($src, [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder

$probes = @('扶摇洲','南婆娑洲','雷公庙','大酆都','桂花岛','南苑国','青鸾国','风雪庙','小龙王','庙堂','学宫','太学')
foreach($p in $probes){
  $n = [regex]::Matches($content, [regex]::Escape($p)).Count
  [void]$out.AppendLine("$p : $n")
}
[void]$out.AppendLine('')

function DumpCtx($content, $word, $count, $out){
  [void]$out.AppendLine("== $word 上下文（前$count 处） ==")
  $ms = [regex]::Matches($content, [regex]::Escape($word))
  $shown = 0
  foreach($m in $ms){
    if($shown -ge $count){ break }
    $s = [Math]::Max(0, $m.Index - 30)
    $len = [Math]::Min(90, $content.Length - $s)
    [void]$out.AppendLine('…' + ($content.Substring($s, $len) -replace "\s+", ' ') + '…')
    $shown++
  }
  [void]$out.AppendLine('')
}
DumpCtx $content '扶摇洲' 10 $out
DumpCtx $content '南婆娑洲' 6 $out
DumpCtx $content '雷公庙' 4 $out
DumpCtx $content '大酆都' 4 $out
DumpCtx $content '风雪庙' 3 $out

[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\canon_geo2.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done"
