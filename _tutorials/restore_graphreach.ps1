$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$anchor='  // 节点（方框）'
if(-not $html.Contains($anchor)){ throw '节点锚未找到' }
if($html.Contains('const _graphReach=')){ throw '_graphReach 已存在' }
$block=@'
  // 全图通路 BFS（房间 exits 即天下路网）——给迷雾/小径一句明白话：能不能到、几程、朝哪边走
  const _graphReach={};
  (function(){
    const prev={}; prev[player.room]=null;
    const qq=[player.room];
    while(qq.length){
      const c=qq.shift(); const rc=ROOMS[c]; if(!rc) continue;
      for(const d in rc.exits){
        const nx=rc.exits[d];
        if(nx && ROOMS[nx] && !(nx in prev)){ prev[nx]=c; qq.push(nx); }
      }
    }
    for(const k in prev){
      if(k===player.room) continue;
      const pth=[]; let c=k; let guard=0;
      while(c && guard++<99){ pth.unshift(c); c=prev[c]; }
      _graphReach[k]={ d:pth.length-1, via:(pth[1]===player.room?pth[2]:pth[1])||pth[1]||null };
    }
  })();
'@
$html=$html.Replace($anchor, $block+"`n"+$anchor)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host '_graphReach block restored'
