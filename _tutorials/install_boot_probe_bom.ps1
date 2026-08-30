$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 临时错误捕获器：插到 <head> 后第一个位置，抓启动期全部报错
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
# 若已装过先移除（幂等）
$old=$html.IndexOf('window.__bootErrs=[]')
if($old -ge 0){ throw 'probe already installed' }
$html=$html.Insert($idx+$marker.Length,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'BOOT PROBE INSTALLED'
