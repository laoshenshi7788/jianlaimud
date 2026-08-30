$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$old=@'
  acts.push({t:'闲聊', cls:'', fn:()=>{ chatSmall(npcName); } });
  acts.forEach(a=>{
'@
$new=@'
  acts.push({t:'闲聊', cls:'', fn:()=>{ chatSmall(npcName); } });
  if(typeof NPC_DEEP!=='undefined' && NPC_DEEP[npcName]){
    const heardN=(game.deepTalk&&game.deepTalk[npcName])?game.deepTalk[npcName].length:0;
    acts.push({t:'深 谈'+(heardN?('('+heardN+')'):''), cls:'blue', fn:()=>{ openDeepTalk(npcName); } });
  }
  acts.forEach(a=>{
'@
if(-not $html.Contains($old)){ throw 'talkTo acts anchor missing' }
$html=$html.Replace($old,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'DEEP TALK BUTTON WIRED INTO talkTo'
