$content = Get-Content "index.html" -Raw
$patterns = @("area:'cheng_shenzhou'", "area:'cheng_tongye'", "area:'cheng_dongsheng'", "area:'cheng_nanzhan'", "area:'cheng_xueshan'", "area:'cheng_longhu'", "area:'cheng_fudi'")
foreach($p in $patterns){
  $idx = 0
  $count = 0
  Write-Output "=== $p ==="
  while(($idx = $content.IndexOf($p, $idx)) -ge 0 -and $count -lt 12){
    $lineStart = $content.LastIndexOf("`n", $idx) + 1
    $lineEnd = $content.IndexOf("`n", $idx)
    if($lineEnd -lt 0){ $lineEnd = $content.Length }
    $line = $content.Substring($lineStart, [Math]::Min(150, $lineEnd - $lineStart)).Trim()
    $lineNo = ($content.Substring(0, $lineStart) -split "`n").Count
    Write-Output "${lineNo}: $line"
    $idx += $p.Length
    $count++
  }
}
