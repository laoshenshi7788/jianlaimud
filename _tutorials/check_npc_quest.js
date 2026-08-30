// 检查哪些 NPC 有 quest 字段（即已挂任务），哪些是空闲可挂新任务的
const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
// 找 NPCS 中所有有 home 且 canKill 的人物
const npcSection = f.slice(f.indexOf('const NPCS = {'), f.indexOf('const NPC_DEEP=') > 0 ? f.indexOf('const NPC_DEEP=') : f.length);
const re = /'([^']+)':\{\s*title:'([^']*)'/g;
let m, npcs = [];
while ((m = re.exec(npcSection)) !== null) { npcs.push({ name: m[1], title: m[2] }); }
// 查每个 NPC 是否有 quest 字段
const hasQuest = npcs.map(n => {
  const idx = npcSection.indexOf("'" + n.name + "':{");
  if (idx < 0) return null;
  const chunk = npcSection.slice(idx, idx + 500);
  const q = chunk.match(/quest:'([^']+)'/);
  return { name: n.name, title: n.title, quest: q ? q[1] : null };
}).filter(x => x !== null);
// 分组显示
console.log('有任务的 NPC:');
hasQuest.filter(x => x.quest).forEach(x => console.log('  ' + x.name + ' → ' + x.quest));
console.log('\n无任务的 NPC（可挂新任务）:');
hasQuest.filter(x => !x.quest).forEach(x => console.log('  ' + x.name + ' (' + x.title + ')'));
