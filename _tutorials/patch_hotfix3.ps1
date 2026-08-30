$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
function Rep([string]$old,[string]$new){
  if(-not $script:html.Contains($old)){ throw ('NOT FOUND: '+$old.Substring(0,[Math]::Min(60,$old.Length))) }
  $script:html=$script:html.Replace($old,$new)
}
# 1) 补回捏合补丁中丢失的变量声明
Rep @'
  const pts=new Map();
  let pinch=null; // {d:当前指距}
'@ @'
  const pts=new Map();
  let pinch=null; // {d:当前指距}
  let panStartX=0, panStartY=0, panMoved=false;
'@
# 2) 赶路到达后清空确认条（walkPath 完成分支）
Rep @'
    if(i>=path.length){
      game._walking=false;
      resetMapTip();
'@ @'
    if(i>=path.length){
      game._walking=false;
      resetMapTip();
      const tb0=document.getElementById('travel-bar'); if(tb0) tb0.innerHTML='';
'@
# 3) 相邻步行 moveTo 后也清确认条（防止残留）
Rep @'
function moveTo(rn, silent){
  if(game._walking){ logInfo('（你正在赶路，一步一个脚印——稍安勿躁。）'); return; }
'@ @'
function moveTo(rn, silent){
  const tb0=document.getElementById('travel-bar'); if(tb0) tb0.innerHTML='';
  if(game._walking){ logInfo('（你正在赶路，一步一个脚印——稍安勿躁。）'); return; }
'@
# 4) 创角「下一步」校验失败：在创角页内醒目提示（不再只写日志）
Rep @'
    if(!_startup.bg){ log('（总要有个来处——先择出生之地与出身）','sys'); renderStartupPage(); return; }
'@ @'
    if(!_startup.bg){
      const warn=document.getElementById('ss-warn');
      if(warn){ warn.textContent='※ 出身尚未择定——出生之地既已选好，请在下方「二 · 出身」一栏择一。'; warn.style.display='block'; }
      renderStartupPage();
      return;
    }
'@
# 5) 创角页加常驻警告条（默认隐藏）
Rep @'
  h.appendChild(head);
'@ @'
  h.appendChild(head);
  const warn=document.createElement('div'); warn.id='ss-warn';
  warn.style.cssText='display:none;color:#ffb9a4;background:rgba(176,58,46,.18);border:1px solid rgba(217,79,61,.5);border-radius:6px;padding:6px 10px;font-size:.74em;margin:6px 0;';
  h.appendChild(warn);
'@
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'FIXED: panStartX decl + travel-bar clear + creation warn'
