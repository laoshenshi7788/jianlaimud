$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$orig=$html
function Rep([string]$old,[string]$new){
  if(-not $script:html.Contains($old)){ throw ('NOT FOUND: '+$old.Substring(0,[Math]::Min(70,$old.Length))) }
  $script:html=$script:html.Replace($old,$new)
}
# 1) 战斗大块 JS（演武场演出+立绘+特效+面板版 renderBattleOverlay）→ 经典文字战斗（事件栏按钮）
$s=$html.IndexOf('// —— 演武场演出')
$endMark='function openBattleSkillPick(){'
$e=$html.IndexOf($endMark)
if($s -lt 0 -or $e -lt 0 -or $e -le $s){ throw 'battle js block markers not found' }
$newJs=@'
function pad2(n){ return String(n).padStart(2,'0'); }
// —— 经典 MUD 战斗：文字流走日志，动作按钮挂事件栏 ——
function renderBattleOverlay(){
  if(!battle) return;
  const eb=document.getElementById('event-bar'); if(!eb) return;
  eb.innerHTML='';
  function mk(label, cls, fn){
    const b=document.createElement('button');
    b.className='btn '+(cls||'');
    b.textContent=label;
    b.addEventListener('click',fn);
    eb.appendChild(b);
    return b;
  }
  mk('攻 击','danger',function(){ playerAttack(null); });
  mk('施展武功','blue',function(){ openBattleSkillPick(); });
  mk('守 御','green',function(){ playerDefend(); });
  mk('使用物品','',function(){ openBattleItemPick(); });
  if(battle.verbal<3) mk('嘴 遁（'+(3-battle.verbal)+'）','primary',function(){ openVerbalPicker(); });
  mk('逃 走','',function(){ tryFlee(); });
}
'@
$html=$html.Remove($s,$e-$s).Insert($s,$newJs)
# 2) startFight：不再开战斗层
Rep @'
  const bo=document.getElementById('battle-overlay');
  if(bo&&bo.classList) bo.classList.add('show');
  buildBattleArena();
  battleLog('你向「'+name+'」发起挑战！','combat');
'@ @'
  battleLog('你向「'+name+'」发起挑战！','combat');
'@
# 3) playerAttack 演出
Rep @'
  battleLog(line, cls);
  if(skillName) fxSkill(skillName); // 招式横幅
'@ @'
  battleLog(line, cls);
'@
Rep @'
  // 演出：突进 → 命中 → 飘字（会心则震屏）
  fxLunge('player'); fxHit('enemy');
  fxFloat('enemy','-'+out, isCrit?'crit':'dmg');
  if(isCrit) fxShake();
'@ ''
# 4) 毒伤飘字
Rep @'
    fxFloat('player','毒-'+pdmg,'dmg');
'@ ''
# 5) 嘴遁横幅
Rep @'
  fxSkill('嘴遁 · '+(kind==='taunt'?'激将':(kind==='persuade'?'规劝':'以理服人')));
'@ ''
# 6) 敌方回合演出
Rep @'
  fxLunge('enemy'); // 敌方突进演出
  if(Math.random()<attrDodge()){ // 敏捷：身法如电
    fxFloat('player','闪避','dodge');
    spritePlay('enemy','miss',false,16,function(){ spritePlay('enemy','idle',true,9); }); // 敌招落空
    battleLog('（你身形一晃，'+(battle.name)+'的攻击擦着衣角落了个空！）','skill');
'@ @'
  if(Math.random()<attrDodge()){ // 敏捷：身法如电
    battleLog('（你身形一晃，'+(battle.name)+'的攻击擦着衣角落了个空！）','skill');
'@
Rep @'
    fxHit('player');
    fxFloat('player','-'+edmg, ecrit?'crit':'dmg');
    if(ecrit) fxShake();
'@ ''
# 7) 用药飘字
Rep ' if(battleMode) fxFloat(''player'',''+''+h,''heal'');' ''
Rep ' if(battleMode) fxFloat(''player'',''+''+m,''mp'');' ''
# 8) 符纸打击演出
Rep @'
      fxLunge('player'); fxHit('enemy'); fxFloat('enemy','-'+dmg,'dmg');
'@ ''
# 9) 胜负印章相关（不战而胜/敌倒/玩家倒）
Rep @'
      fxSeal(true); battle._fxHold=true;
      spriteStop('enemy');
      const _ef2=_fxFig('enemy'); if(_ef2) _ef2.classList.add('faint');
'@ ''
Rep @'
  if(battle){
    battle._fxHold=true;
    fxSeal(true);
    spriteStop('enemy');
    const _ef=_fxFig('enemy'); if(_ef) _ef.classList.add('faint');
  }
'@ ''
Rep @'
    fxSeal(false); battle._fxHold=true;
    spriteStop('player');
    const _pf=_fxFig('player'); if(_pf) _pf.classList.add('faint');
'@ ''
Rep @'
    fxSeal(false); battle._fxHold=true;
    spriteStop('player');
    const _pf2=_fxFig('player'); if(_pf2) _pf2.classList.add('faint');
'@ ''
Rep @'
  fxSeal(false); if(battle) battle._fxHold=true;
  spriteStop('player');
  const _pf3=_fxFig('player'); if(_pf3) _pf3.classList.add('faint');
'@ ''
# 10) endBattle 还原为简单收场
Rep @'
function endBattle(){
  const _hold=battle && battle._fxHold; // 胜负印章驻留一拍
  battle=null; battleMode=false;
  const bo=document.getElementById('battle-overlay');
  const _clear=function(){
    if(bo && bo.classList) bo.classList.remove('show');
    document.getElementById('battle-log').innerHTML='';
    document.getElementById('battle-actions').innerHTML='';
  };
  if(_hold){ setTimeout(_clear,1150); } else { _clear(); }
  updateSidebar();
  updateMusic();
}
'@ @'
function endBattle(){
  battle=null; battleMode=false;
  updateSidebar();
  updateMusic();
}
'@
# 11) 删战斗层 HTML（其后紧跟 manifest script 标签，作为结束锚点）
$s2=$html.IndexOf('<!-- 独立战斗场景 · 水墨演武 -->')
$e2=$html.IndexOf('<script src="assets/sprites/heroes/manifest.js">')
if($s2 -lt 0 -or $e2 -lt 0 -or $e2 -le $s2){ throw 'battle html markers not found' }
$html=$html.Remove($s2,$e2-$s2)
# 12) 删战斗 CSS 块（演武场+特效），保留前后注释
$s3=$html.IndexOf('/* ===================== 独立战斗场景 · 水墨演武 ===================== */')
$e3=$html.IndexOf('/* ===================== 右侧状态面板 ===================== */')
if($s3 -lt 0 -or $e3 -lt 0 -or $e3 -le $s3){ throw 'battle css markers not found' }
$html=$html.Remove($s3,$e3-$s3)
# 13) 删像素小人清单脚本
Rep @'
<script src="assets/sprites/heroes/manifest.js"></script>
'@ ''
if($html -eq $orig){ throw 'nothing changed' }
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'BATTLE STAGING REMOVED'
