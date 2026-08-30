$ErrorActionPreference = 'Stop'
$path = "E:\1\mud\2\JianLai mud\index.html"
$bak  = "E:\1\mud\2\JianLai mud\_tutorials\index.backup-before-rename.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($bak, $content, (New-Object System.Text.UTF8Encoding($false)))

# 长词优先
$pairs = @(
  @('东胜神洲','扶摇洲'),
  @('东胜仙港','桂花岛'),
  @('仙港码头','桂花岛渡头'),
  @('南赡部洲','金甲洲'),
  @('南赡蛮城','金甲废墟'),
  @('蛮城寨门','古墟寨门'),
  @('蛮城街','古墟街道'),
  @('中土神京','文庙'),
  @('神京','文庙'),
  @('桐叶城门口','桐叶宗山门'),
  @('桐叶城','桐叶宗')
)
$log = New-Object System.Text.StringBuilder
foreach($p in $pairs){
  $before = [regex]::Matches($content, [regex]::Escape($p[0])).Count
  $content = $content.Replace($p[0], $p[1])
  [void]$log.AppendLine($p[0] + ' -> ' + $p[1] + ' : ' + $before)
}
[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))

# 复查残留
$content2 = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
foreach($t in @('中土神京','桐叶城','东胜','南赡','蛮城','神京')){
  $n = [regex]::Matches($content2, [regex]::Escape($t)).Count
  [void]$log.AppendLine('残留 ' + $t + ' : ' + $n)
}
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\rename_log.txt", $log.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "rename done"
