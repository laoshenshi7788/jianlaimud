$ErrorActionPreference = 'Stop'
$content = [System.IO.File]::ReadAllText("E:\1\mud\2\JianLai mud\index.html", [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder
$ms = [regex]::Matches($content, [regex]::Escape('蛮城'))
foreach($m in $ms){
  $s = [Math]::Max(0, $m.Index - 60)
  $len = [Math]::Min(140, $content.Length - $s)
  $lineNo = ($content.Substring(0, $m.Index) -split "`n").Count
  [void]$out.AppendLine("line $lineNo : …" + ($content.Substring($s, $len) -replace "\s+", ' ') + '…')
}
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\leftover.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done"
