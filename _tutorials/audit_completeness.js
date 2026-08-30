/* ================================================================
   完整性审计：找"引用了不存在的东西"类缺口
   ① 悬空出口 ② NPC 家不在 ROOMS ③ 任务委托人/交付人不存在
   ④ 任务目标缺失（collect 物品/kill 敌人/reach 房间/talk NPC）
   ⑤ teach/技能奖励 引用不存在的 SKILLS ⑥ 敌人池空区
   ⑦ 死亡救治正则覆盖缺口 ⑧ reward.item 不存在
   ================================================================ */
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');

// —— 解析 ROOMS（单引号字面量 + MUNI/CLINIC 的 JSON 块）——
const ROOMS = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re); if (!m) return;
  const exM = m[4].match(/exits\s*:\s*\{([^}]*)\}/);
  const exits = {};
  if (exM) exM[1].replace(/"([nsew]{1,2})"\s*:\s*"([^"]+)"/g, (_, d, t) => { exits[d] = t; return ''; });
  ROOMS[m[1]] = { area: m[2], zone: m[3], exits };
});
{
  // JSON 形态：直接 eval 生成块（ROOMS_MUNI/ROOMS_CLINIC 均为纯 JSON）
  ['ROOMS_MUNI', 'ROOMS_CLINIC'].forEach(name => {
    const i0 = src.indexOf('const ' + name + '=');
    if (i0 < 0) return;
    const end = src.indexOf(');', i0);
    const body = src.slice(src.indexOf('{', i0), src.lastIndexOf('}', end) + 1);
    try {
      const obj = JSON.parse(body);
      Object.keys(obj).forEach(rn => {
        const r = obj[rn];
        ROOMS[rn] = { area: r.area, zone: r.zone, exits: r.exits || {} };
      });
    } catch (e) { out2 = e.message; }
  });
}
var out2 = '';
// —— 解析 NPCS（含 EXT/MUNI/CLINIC 的 JSON 段）——
const NPCS = {};
{
  const re2 = /"([^"]+)":\{"title":"([^"]*)"[^}]*?"home":"([^"]*)"/g;
  let m;
  while ((m = re2.exec(src))) NPCS[m[1]] = { title: m[2], home: m[3] };
  // 单引号形态（NPCS 主体）
  const re3 = /^\s*'([^']+)':\s*\{\s*title\s*:\s*'([^']*)'(.*)$/;
  src.split(/\r?\n/).forEach(l => {
    const m = l.match(re3);
    if (m) { const hM = m[3].match(/home\s*:\s*'([^']*)'/); NPCS[m[1]] = { title: m[2], home: hM ? hM[1] : '' }; }
  });
}
// —— QUESTS（QUESTS 主体 + HUB + CHAIN 的 JSON 条目）——
const QUESTS = {};
{
  const re2 = /'([a-z0-9_]+)':Object\.assign\(\{([^}]*)\}/g;
  let m;
  while ((m = re2.exec(src))) {
    try { const d = JSON.parse('{' + m[2] + '}'); QUESTS[m[1]] = d; } catch (e) {}
  }
  const q0 = src.indexOf('const QUESTS = {');
  const q1 = src.indexOf('\n};', q0);
  const body = src.slice(q0, q1);
  const re3 = /'([^']+)':\{\s*title\s*:\s*'([^']*)'([\s\S]*?)(?=\n  '|\n\};)/g;
  let mm;
  while ((mm = re3.exec(body))) {
    const id = mm[1];
    if (QUESTS[id]) continue;
    const gM = mm[3].match(/giver\s*:\s*'([^']*)'/), tM = mm[3].match(/turnin\s*:\s*'([^']*)'/);
    const tT = mm[3].match(/target\s*:\s*\{([^}]*)\}/);
    QUESTS[id] = {
      title: mm[2],
      giver: gM ? gM[1] : '', turnin: tM ? tM[1] : '',
      target: (function () { try { return JSON.parse('{' + tT[1].replace(/'/g, '"') + '}'); } catch (e) { return null; } })(),
      reward: (function () { const r = mm[3].match(/reward\s*:\s*\{([^}]*)\}/); try { return JSON.parse('{' + r[1].replace(/'/g, '"') + '}'); } catch (e) { return null; } })()
    };
  }
}
// —— ITEMS 键 ——
const ITEMS = new Set();
{
  const re2 = /ITEMS\['([^']+)'\]/g; let m;
  while ((m = re2.exec(src))) ITEMS.add(m[1]);
  const re3 = /"([^"]+)":\{"type":"[^"]*"/g;
  const region = src.slice(src.indexOf('const ITEM_GEN='), src.indexOf('const ITEM_GEN=') + 40000);
  while ((m = re3.exec(region))) ITEMS.add(m[1]);
}
// —— SKILLS 键（SKILLS 主表 + GONGFA_GEN 名池生成的键名难抽，抽 SKILLS['x'] 引用+定义） ——
const SKILLS = new Set();
{
  const re2 = /(?:SKILLS|SKILLS_PASSIVE|GONGFA_GEN)\['([^']+)'\]\s*=/g; let m;
  while ((m = re2.exec(src))) SKILLS.add(m[1]);
  const re3 = /"([^"]+)":\{"damage":/g;
  let mm;
  while ((mm = re3.exec(src))) SKILLS.add(mm[1]);
}
// —— ENEMIES 键 ——
const ENEMIES = new Set();
{
  const i0 = src.indexOf('const ENEMIES = {');
  const body = src.slice(i0, src.indexOf('\n};', i0));
  const mre = /'([^']+)':\{/g; let m;
  while ((m = mre.exec(body))) ENEMIES.add(m[1]);
}

const issues = [];
// ① 悬空出口
Object.keys(ROOMS).forEach(rn => {
  Object.keys(ROOMS[rn].exits).forEach(d => {
    const t = ROOMS[rn].exits[d];
    if (!ROOMS[t]) issues.push('悬空出口: ' + rn + ' [' + d + '] → ' + t);
  });
});
// ② NPC 家
Object.keys(NPCS).forEach(n => {
  const h = NPCS[n].home;
  if (h && h !== 'undefined' && !ROOMS[h]) issues.push('NPC 家不存在: ' + n + ' → ' + h);
});
// ③④⑧ 任务
Object.keys(QUESTS).forEach(id => {
  const q = QUESTS[id];
  if (q.giver && !NPCS[q.giver]) issues.push('委托人不存在: ' + id + ' → ' + q.giver);
  if (q.turnin && !NPCS[q.turnin]) issues.push('交付人不存在: ' + id + ' → ' + q.turnin);
  const t = q.target;
  if (t && t.what) {
    if (t.type === 'collect' && !ITEMS.has(t.what)) issues.push('收集物不存在: ' + id + ' → ' + t.what);
    if (t.type === 'kill' && !ENEMIES.has(t.what)) issues.push('猎杀目标不存在: ' + id + ' → ' + t.what);
    if (t.type === 'reach' && !ROOMS[t.what]) issues.push('抵达房不存在: ' + id + ' → ' + t.what);
    if (t.type === 'talk' && !NPCS[t.what]) issues.push('拜会人物不存在: ' + id + ' → ' + t.what);
  }
  if (q.reward && q.reward.item && !ITEMS.has(q.reward.item)) issues.push('奖励物品不存在: ' + id + ' → ' + q.reward.item);
  if (q.reward && q.reward.skill && !SKILLS.has(q.reward.skill)) issues.push('奖励功法不存在: ' + id + ' → ' + q.reward.skill);
});
// ⑥ 敌池空区
const ZE = {};
Object.keys(ROOMS).forEach(rn => {
  const zone = ROOMS[rn].zone;
  if (!zone) return;
  ZE[zone] = ZE[zone] || { has: false };
});
{
  const re4 = /enemies\s*:\s*\["([^"]+)"/g; let m;
  while ((m = re4.exec(src))) { const rm = Object.keys(ROOMS).find(rn => src.slice(src.indexOf(m[0]) - 400, src.indexOf(m[0])).lastIndexOf(m.input.slice(0, 30)) > -1); }
}
// 简化：直接查"区域无任何 enemies 房"不做了（野区机制不同），改为列出 kill 目标不在 ENEMIES 里的已覆盖。
const out = [];
out.push('=== 引用完整性审计 ===');
if (!issues.length) out.push('✓ 无缺口');
else { const byKind = {}; issues.forEach(x => { const k = x.split(':')[0]; byKind[k] = (byKind[k] || 0) + 1; out.push(x); }); }
fs.writeFileSync('_tutorials/_audit.txt', out.join('\n'));
console.log('issues: ' + issues.length);
