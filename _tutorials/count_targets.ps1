$ErrorActionPreference = 'Continue'
$path = "E:\1\mud\2\JianLai mud\index.html"
$bytes = [System.IO.File]::ReadAllBytes($path)
$hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$out = New-Object System.Text.StringBuilder
[void]$out.AppendLine("BOM: $hasBom")
$targets = @('中土神京','神京','桐叶城','东胜神洲','东胜仙港','仙港码头','南赡部洲','南赡蛮城','蛮城祭坛','蛮城寨门','蛮城街','蛮城','桐叶洲','中土神洲','北俱芦洲','皑皑洲','金甲洲','流霞洲','扶摇洲','南婆娑洲')
foreach($t in $targets){
  $n = [regex]::Matches($content, [regex]::Escape($t)).Count
  [void]$out.AppendLine("$t : $n")
}
[System.IO.File]::WriteAllText("E:\1\mud\2\JianLai mud\_tutorials\rename_counts.txt", $out.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "done bom=$hasBom"
