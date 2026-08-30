$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")

# 1) look() 开头：强制按所在房间校正地图层级（坏档自愈）
$old1=@'
function look(){
  const r=getRoom(player.room);
'@
$new1=@'
function look(){
  try{ setLevelForRoom(player.room); }catch(e){} // 依所在房间校正地图层级（坏档自愈）
  const r=getRoom(player.room);
'@
if(-not $html.Contains($old1)){ throw 'look anchor missing' }
$html=$html.Replace($old1,$new1)

# 2) 脚本最顶部：localStorage 兼容垫片（Edge 的 file:// 下禁存储时改用内存兜底，脚本不再中断）
$old2=@'
'use strict';
'@
$new2=@'
'use strict';
/* 存储兼容垫片：双击 index.html（file://）时，部分浏览器禁用 localStorage，
   这里探测失败就换成内存兜底——游戏照常可玩，只是存档在关页后不保留。 */
(function(){
  try{
    localStorage.setItem('__jl_probe','1');
    localStorage.removeItem('__jl_probe');
    return;
  }catch(e){}
  const mem={};
  const shim={
    getItem:function(k){ return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null; },
    setItem:function(k,v){ mem[k]=String(v); },
    removeItem:function(k){ delete mem[k]; },
    clear:function(){ for(const k in mem){ delete mem[k]; } },
    key:function(i){ const ks=Object.keys(mem); return i<ks.length?ks[i]:null; },
    get length(){ return Object.keys(mem).length; }
  };
  try{ Object.defineProperty(window,'localStorage',{value:shim,configurable:true,writable:true}); return; }catch(e){}
  try{ window.localStorage=shim; return; }catch(e){}
})();
'@
$idx=$html.IndexOf($old2)
if($idx -lt 0){ throw 'use strict anchor missing' }
$html=$html.Insert($idx+$old2.Length,$new2)

$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'PATCHED: level self-heal + storage shim'
