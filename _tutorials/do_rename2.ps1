$ErrorActionPreference = 'Stop'
$path = "E:\1\mud\2\JianLai mud\index.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$pairs = @(
  @('蛮城祭场','古墟祭场'),
  @('蛮城的祭场','金甲废墟深处的祭场'),
  @('蛮城的街道','金甲废墟的街道')
)
$log = New-Object System.Text.StringBuilder
foreach($p in $pairs){
  $before = [regex]::Matches($content, [regex]::Escape($p[0])).Count
  $content = $content.Replace($p[0], $p[1])
  [void]$log.AppendLine($p[0] + ' -> ' + $p[1] + ' : ' + $before)
}
[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
$content2 = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
[void]$log.AppendLine('残留 蛮城 : ' + [regex]::Matches($content2, [regex]::Escape('蛮城')).Count)
[void]$log.AppendLine('残留 神京 : ' + [regex]::Matches($content2, [regex]::Escape('神京')).Count)
[void]$log.AppendLine('残留 桐叶城 : ' + [regex]::Matches($content2, [regex]::Escape('桐叶城')).Count)
[void]$log.AppendLine('残留 东胜 : ' + [regex]::Matches($content2, [regex]::Escape('东胜')).Count)
[void]$log.AppendLine('残留 南赡 : ' + [regex]::Matches($content2, [regex]::Escape('南赡')).Count)
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\rename_log2.txt", $log.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done"
