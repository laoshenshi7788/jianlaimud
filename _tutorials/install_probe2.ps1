$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
if($html.Contains('__bootErrs')){ Write-Host 'PROBE ALREADY IN DISK FILE'; exit 0 }
$marker='<head>'
$idx=$html.IndexOf($marker)
if($idx -lt 0){ throw 'head not found' }
$probe=@'
<head>
<script>
window.__bootErrs=[];
window.addEventListener('error',function(e){
  window.__bootErrs.push('ERR: '+(e.message||'?')+' @ '+((e.filename||'').split('/').pop())+':'+e.lineno+':'+e.colno);
});
window.addEventListener('unhandledrejection',function(e){ window.__bootErrs.push('REJ: '+e.reason); });
</script>
'@
$html=$html.Insert($idx+$marker.Length,$probe)
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
$check=[System.IO.File]::ReadAllText($f)
if(-not $check.Contains('__bootErrs')){ throw 'WRITE DID NOT PERSIST!' }
Write-Host 'PROBE WRITTEN AND VERIFIED ON DISK'
