/* ================================================================
   综合诊断：
   A. 逐图视觉/逻辑一致性（直连却隔格 >2 / 假邻贴却无路）
   B. 任务奖励分布（按类别统计 exp/gold/potential，揪极端值）
   C. 换皮任务检测（按 target 签名 + acceptLines 首句 + desc 聚类）
   D. 对话量统计（CHAT_POOL 每风格每话题行数 / genLine talk 池）
   ================================================================ */
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
const L = src.split(/\r?\n/);
const out = [];

// —— 解析 ROOMS（字面量 + 生成块）——
const ROOMS = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
L.forEach(l => {
  const m = l.match(re); if (!m) return;
  const exM = m[4].match(/exits\s*:\s*\{([^}]*)\}/);
  const exits = {};
  if (exM) exM[1].replace(/"([nsew]{1,2})"\s*:\s*"([^"]+)"/g, (_, d, t) => { exits[d] = t; return ''; });
  ROOMS[m[1]] = { area: m[2], zone: m[3], exits };
});
['ROOMS_MUNI', 'ROOMS_CLINIC'].forEach(name => {
  const i0 = src.indexOf('const ' + name + '=');
  if (i0 < 0) return;
  const end = src.indexOf(');', i0);
  try {
    const obj = JSON.parse(src.slice(src.indexOf('{', i0), src.lastIndexOf('}', end) + 1));
    Object.keys(obj).forEach(rn => { const r = obj[rn]; ROOMS[rn] = { area: r.area, zone: r.zone, exits: r.exits || {} }; });
  } catch (e) {}
});
// 讲武堂运行时 IIFE 里建的房——静态补识别
if (/大骊讲武堂/.test(src) && !ROOMS['大骊讲武堂']) ROOMS['大骊讲武堂'] = { area: 'cheng_jingcheng', zone: '大骊', exits: {} };

// 城市 id ↔ 名字
const CITY = {};
{
  const i0 = src.indexOf('const CHENG_CFG');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = mre.exec(body))) CITY[m[1]] = m[3];
}

// —— A. 逐图视觉/逻辑一致性（对每城跑一遍布局：需在页面执行，这里用静态近似——
//    静态无法跑 computeGridLayout（依赖运行时），改为：连边(逻辑)数 vs 烘焙坐标格距
out.push('=== A. 烘焙坐标格距（直连却隔格）===');
{
  const BAKED = {};
  const i0 = src.indexOf('const BAKED_MAP_POS');
  if (i0 > -1) {
    const seg = src.slice(i0, src.indexOf(';\n', i0) + 2);
    const mre = /"cheng\|([a-z_]+)":\{([\s\S]*?)\},?/g;
    let m;
    while ((m = mre.exec(seg))) {
      const area = m[1];
      const o = {};
      const rre = /"([^"]+)":\[(\d+),(\d+)\]/g;
      let r;
      while ((r = rre.exec(m[2]))) o[r[1]] = [Number(r[2]), Number(r[3])];
      BAKED[area] = o;
    }
    Object.keys(BAKED).forEach(area => {
      const pos = BAKED[area];
      const bad = [];
      Object.keys(pos).forEach(rn => {
        const r = ROOMS[rn]; if (!r) return;
        Object.keys(r.exits).forEach(d => {
          const t = r.exits[d];
          const p = pos[t]; if (!p) return;
          const gap = Math.abs(p[0] - pos[rn][0]) + Math.abs(p[1] - pos[rn][1]);
          if (gap > 2) bad.push(rn + ' → ' + t + ' (' + gap + ' 格)');
        });
      });
      if (bad.length) { out.push((CITY[area] || area) + ': ' + bad.slice(0, 12).join('；') + (bad.length > 12 ? ' …共' + bad.length : '')); }
    });
  } else out.push('BAKED_MAP_POS 未找到');
}

// —— 花括号配对抽取（正确处理嵌套对象）——
function extractObj(text, from) {
  const i = text.indexOf('{', from);
  if (i < 0) return null;
  let depth = 0, inS = null, esc = false;
  for (let j = i; j < text.length; j++) {
    const c = text[j];
    if (inS) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inS) inS = null; continue; }
    if (c === '"' || c === "'") { inS = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { body: text.slice(i + 1, j), end: j }; }
  }
  return null;
}

// —— B. 任务奖励分布 ——
out.push('\n=== B. 任务奖励分布 ===');
{
  const QUESTS = {};
  const re2 = /'([a-z0-9_]+)':Object\.assign\(/g;
  let m;
  while ((m = re2.exec(src))) {
    const o = extractObj(src, m.index + m[0].length - 1);
    if (!o) continue;
    try { QUESTS[m[1]] = JSON.parse('{' + o.body + '}'); } catch (e) { QUESTS[m[1]] = { _bad: true }; }
  }
  const q0 = src.indexOf('const QUESTS = {'), q1 = src.indexOf('\n};', q0);
  const body = src.slice(q0, q1);
  const re3 = /'([^']+)':\s*\{\s*title\s*:\s*'([^']*)'/g;
  let mm;
  const origIds = [];
  while ((mm = re3.exec(body))) {
    if (QUESTS[mm[1]]) continue;
    const o = extractObj(src, q0 + mm.index);
    let target = null, reward = null;
    if (o) {
      const txt = o.body.replace(/'([a-z]+)':/g, '"$1":').replace(/'([^']*)'/g, '"$1"');
      try { const d = JSON.parse('{' + txt + '}'); target = d.target; reward = d.reward; } catch (e) {}
    }
    QUESTS[mm[1]] = { title: mm[2], target: target, reward: reward };
    origIds.push(mm[1]);
  }
  const byCat = {};
  Object.keys(QUESTS).forEach(id => {
    const q = QUESTS[id];
    if (!q || q._bad) return;
    const cat = origIds.indexOf(id) > -1 ? '原主线' : (/^c\d_\d+$/.test(id) ? '章节链' : (/^s/.test(id) ? '支线' : (/^g/.test(id) ? '宗门' : (/^d/.test(id) ? '日常' : (/^t\d/.test(id) ? '限时' : '其他')))));
    const r = q.reward || {};
    (byCat[cat] = byCat[cat] || []).push({ exp: r.exp || 0, gold: r.gold || 0, pot: r.potential || 0, it: r.item || '' });
  });
  Object.keys(byCat).forEach(cat => {
    const arr = byCat[cat];
    const avg = k => Math.round(arr.reduce((s, x) => s + (x[k] || 0), 0) / arr.length);
    out.push('【' + cat + '】' + arr.length + ' 条：均经验 ' + avg('exp') + ' / 均银两 ' + avg('gold') + ' / 均潜能 ' + avg('pot') + ' / 带物品 ' + arr.filter(x => x.it).length);
  });
}

// —— C. 换皮检测：按 target 签名 + desc 前 14 字聚类 ——
out.push('\n=== C. 换皮任务检测 ===');
{
  const sigs = {};
  const re2 = /'([a-z0-9_]+)':Object\.assign\(/g;
  let m;
  const byId = {};
  while ((m = re2.exec(src))) {
    const o = extractObj(src, m.index + m[0].length - 1);
    if (!o) continue;
    try { byId[m[1]] = JSON.parse('{' + o.body + '}'); } catch (e) {}
  }
  Object.keys(byId).forEach(id => {
    const q = byId[id];
    if (!q) return;
    const t = q.target || {};
    const sig = (t.type || '') + '|' + (t.what || '') + '|' + (t.need || '') + (t.nodes ? '|nodes' + t.nodes.map(n => n.type + (n.what || '')).join(',') : '');
    (sigs[sig] = sigs[sig] || []).push(id);
  });
  let clusters = 0;
  Object.keys(sigs).forEach(sig => {
    if (sigs[sig].length >= 6) { out.push('同目标[' + sig.slice(0, 50) + '] × ' + sigs[sig].length); clusters++; }
  });
  out.push('同目标簇(≥6) ' + clusters + ' 个');
  // desc 首句换皮：descriptions 相同开头的
  const descG = {};
  Object.keys(byId).forEach(id => {
    const q = byId[id];
    if (!q || !q.desc) return;
    const head = q.desc.slice(0, 14);
    (descG[head] = descG[head] || []).push(id);
  });
  let dc = 0;
  Object.keys(descG).forEach(h => { if (descG[h].length >= 8) { out.push('同首句[' + h + '] × ' + descG[h].length + '：' + descG[h].slice(0, 8).join(',')); dc++; } });
  out.push('同首句簇(≥8) ' + dc + ' 个');
}

// —— D. 对话量 ——
out.push('\n=== D. 对话量统计 ===');
{
  const i0 = src.indexOf('const CHAT_POOL=');
  if (i0 > -1) {
    const seg = src.slice(i0, src.indexOf('function openChatTopics', i0));
    const per = {};
    const mre = /'(\w+)':\{([^}]*)\}/g;
    let m;
    while ((m = mre.exec(seg))) {
      const topic = m[1];
      const lines = (m[2].match(/\[[^\]]*\]/g) || []).reduce((s, a) => s + (a.match(/[，。？！]/g) || []).length, 0);
      per[topic] = lines;
    }
    out.push('CHAT_POOL 话题行数：' + JSON.stringify(per));
  }
  const i1 = src.indexOf('const GEN_LINES');
  if (i1 > -1) { const seg = src.slice(i1, src.indexOf('\n};', i1)); const talk = seg.match(/talk\s*:\s*\[[^\]]*\]/g) || []; out.push('genLine talk 池段落数：' + talk.map(x => (x.match(/，|。/g) || []).length).join(',')); }
}
require('fs').writeFileSync('_tutorials/_audit2.txt', out.join('\n'));
console.log('done');
