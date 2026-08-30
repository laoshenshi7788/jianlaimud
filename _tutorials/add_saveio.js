// 存档导出/导入 + 武功适配显示
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const nl = f.includes('\r\n') ? '\r\n' : '\n';
let fixes = [];

// 1) 武功选择器显示兵器适配
const oldOpt = "o.textContent=s+'　伤害+'+sd.damage+' 耗内'+sd.mpCost+el;";
const newOpt = "let fit='';\n    if(sd.wpn){ const mw=wclassOf(player.equipment.weapon); fit= mw===sd.wpn?'（人兵相得×1.25）':(mw?('（错配·'+mw+'×0.8）'):'（空手×0.85）'); }\n    o.textContent=s+'　'+(sd.wpn?('【'+sd.wpn+'系】'):'')+'伤害+'+sd.damage+' 耗内'+sd.mpCost+fit+el;";
if (f.includes(oldOpt)) { f = f.replace(oldOpt, newOpt); fixes.push('武功适配显示'); }
else console.log('!! 武功选择器未匹配');

// 2) 设置面板：存档导出/导入（插在 openSettings 的 openModal 之前）
const setStart = f.indexOf('function openSettings(){');
const modalPos = f.indexOf('openModal(', setStart);
if (setStart < 0 || modalPos < 0) { console.log('!! openSettings 锚未找到'); }
else {
  const saveio = [
    '  // —— 存档导出/导入：单文件游戏的江湖转移术 ——',
    '  const svRow=document.createElement(\'div\'); svRow.className=\'list-row\';',
    '  svRow.innerHTML=\'<span class="lname">存档迁移</span><span class="lmeta">导出存档码——换设备、备份两不误</span>\';',
    '  const sv=document.createElement(\'button\'); sv.className=\'btn small\'; sv.textContent=\'导出存档码\';',
    '  sv.addEventListener(\'click\',function(){ document.getElementById(\'overlay\').classList.remove(\'show\'); exportSave(); });',
    '  const iv=document.createElement(\'button\'); iv.className=\'btn small\'; iv.textContent=\'导入存档码\';',
    '  iv.addEventListener(\'click\',function(){ document.getElementById(\'overlay\').classList.remove(\'show\'); importSaveUI(); });',
    '  svRow.appendChild(sv); svRow.appendChild(iv);',
    '  h.appendChild(svRow);'
  ].join(nl);
  f = f.slice(0, modalPos) + saveio + nl + f.slice(modalPos);
  fixes.push('设置面板导出/导入');
}
fs.writeFileSync(file, f, 'utf8');
console.log('OK: ' + fixes.join(' / '));
