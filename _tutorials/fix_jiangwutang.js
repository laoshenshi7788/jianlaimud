// 审计修复：讲武堂教头的家缺失 → 补大骊讲武堂房间并接线（幂等）
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const MARK = '讲武堂教头_IIFE';
if (src.indexOf(MARK) > -1) { console.log('already fixed'); process.exit(0); }
const anchor = '//<<CLINIC-END>>';
const ai = src.indexOf(anchor);
if (ai < 0) { console.log('anchor not found'); process.exit(1); }
const ins = src.indexOf('\n', ai) + 1;
const block = [
  '(function fixJiangwutang(){',
  '  if(ROOMS[\'大骊讲武堂\']) return;',
  '  ROOMS[\'大骊讲武堂\']={area:\'cheng_jingcheng\', zone:\'大骊\', desc:\'讲武堂的院子里立着兵器架，木桩被打得坑坑洼洼——京营的把式都在这儿喂招。\', bld:true, npcs:[\'讲武堂教头\'], exits:{}};',
  '  const host=ROOMS[\'大骊京城·京城广场\']?\'大骊京城·京城广场\':(Object.keys(ROOMS).find(function(rn){ return ROOMS[rn].area===\'cheng_jingcheng\'&&ROOMS[rn].exits&&Object.keys(ROOMS[rn].exits).length; }));',
  '  if(!host) return;',
  '  const OPP={n:\'s\',s:\'n\',e:\'w\',w:\'e\'};',
  '  const dir=[\'s\',\'n\',\'e\',\'w\'].find(function(d){ return !ROOMS[host].exits[d]; })||\'s\';',
  '  ROOMS[host].exits[dir]=\'大骊讲武堂\';',
  '  ROOMS[\'大骊讲武堂\'].exits[OPP[dir]]=host;',
  '})(); //' + MARK,
  ''
].join('\n');
src = src.slice(0, ins) + block + src.slice(ins);
fs.writeFileSync('index.html', src);
console.log('讲武堂 fix spliced');
