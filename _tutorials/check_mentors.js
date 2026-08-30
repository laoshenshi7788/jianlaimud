// 验证8个出生地的引路人搜索
const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
// 模拟数据提取——从 NPCS 定义中提取所有 NPC 的 home 和 special
const npcSection = f.slice(f.indexOf('const NPCS = {'), f.indexOf('const NPC_DEEP=') > 0 ? f.indexOf('const NPC_DEEP=') : f.length);
const births = ['泥瓶巷','大骊京城','龙虎山','青莲洞天','北俱雪山','蛮荒沙海','藕花福地','云来客栈'];
// 检查每个出生地有没有 special NPC
births.forEach(function(h){
  const re = new RegExp("'([^']+)'\\:\\{[^}]*special:true[^}]*home:'" + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'");
  const m = npcSection.match(re);
  console.log(h + ': ' + (m ? m[1] : '(无 special NPC)'));
});
// 也检查有没有非 special 但 home 在出生地的 NPC
births.forEach(function(h){
  const re2 = new RegExp("'([^']+)'\\:\\{[^}]*home:'" + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'");
  const m2 = npcSection.match(re2);
  if (m2) console.log('  非 special 但在此地: ' + m2[1]);
});
