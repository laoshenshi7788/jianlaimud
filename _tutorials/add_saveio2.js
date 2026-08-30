// 导出/导入函数本体（放在 openSettings 之前的顶层）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const nl = f.includes('\r\n') ? '\r\n' : '\n';
const anchor = 'function openSettings(){';
if (f.includes('function exportSave()')) { console.log('已存在，跳过'); process.exit(0); }
const block = [
  '// —— 存档导出/导入：单文件游戏的江湖转移术 ——',
  'function exportSave(){',
  '  try{',
  '    const data=localStorage.getItem(SAVE_KEY)||\'{}\';',
  '    const payload={jl_save:true, saveVer:SAVE_VER, exportedAt:new Date().toISOString(), data:JSON.parse(data)};',
  '    const txt=JSON.stringify(payload);',
  '    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).catch(function(){}); }',
  '    openModal(\'导出存档\', function(){',
  '      const h=document.createElement(\'div\');',
  '      h.style.cssText=\'font-size:.76em;color:#ffffff;\';',
  '      const t=document.createElement(\'textarea\');',
  '      t.style.cssText=\'width:100%;height:180px;background:#141422;color:#ece5d3;border:1px solid #8a7448;border-radius:6px;padding:6px;font-family:monospace;\';',
  '      t.value=txt; t.readOnly=true;',
  '      t.addEventListener(\'focus\',function(){ t.select(); });',
  '      h.appendChild(t);',
  '      const tip=document.createElement(\'div\'); tip.style.cssText=\'color:#b8b8c0;font-size:.7em;margin-top:6px;\';',
  '      tip.textContent=\'（全选复制这段存档码，妥善保存。导入时原样粘贴即可——这串字符里，装着你的整个江湖。）\';',
  '      h.appendChild(tip);',
  '      return h;',
  '    });',
  '  }catch(e){ log(\'（导出失败：\'+e.message+\'）\',\'sys\'); }',
  '}',
  'function importSaveUI(){',
  '  const h=document.createElement(\'div\');',
  '  h.style.cssText=\'font-size:.8em;color:#ffffff;\';',
  '  const t=document.createElement(\'textarea\');',
  '  t.style.cssText=\'width:100%;height:180px;background:#141422;color:#ece5d3;border:1px solid #8a7448;border-radius:6px;padding:6px;font-family:monospace;\';',
  '  t.placeholder=\'粘贴此前导出的存档码……\';',
  '  h.appendChild(t);',
  '  const b=document.createElement(\'button\'); b.className=\'btn primary\'; b.textContent=\'导入并读档\';',
  '  b.addEventListener(\'click\',function(){',
  '    try{',
  '      const obj=JSON.parse(t.value);',
  '      const data=obj.jl_save?obj.data:obj;',
  '      if(!data.player||!data.game) throw new Error(\'存档格式不对\');',
  '      localStorage.setItem(SAVE_KEY, JSON.stringify(data));',
  '      logSuccess(\'（存档导入成功——正在重载江湖。）\');',
  '      setTimeout(function(){ location.reload(); },600);',
  '    }catch(e){ log(\'（导入失败：\'+e.message+\'）\',\'sys\'); }',
  '  });',
  '  h.appendChild(b);',
  '  openModal(\'导入存档\', ()=>h);',
  '}'
].join(nl);
f = f.replace(anchor, block + nl + anchor);
fs.writeFileSync(file, f, 'utf8');
console.log('OK: 导出/导入函数已插入');
