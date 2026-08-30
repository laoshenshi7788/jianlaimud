/* ================================================================
   草稿纸生成器：按「苏州参考图」结构，为全部 24 城绘制 markdown 草稿图
   参考：四门+大街链 / 市政（衙门·监狱·兵营·擂台·码头·马厩·客店）
        / 地标带子房（园林·寺庙·府邸） / 官道接城外
   内部房间（bld 指向主建筑的子房）挂在主建筑下，不占主图横排。
   ================================================================ */
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');

// ---------- 1) 解析 CHENG_CFG ----------
function parseChengCfg(){
  const i0 = src.indexOf('const CHENG_CFG');
  if (i0 < 0) throw new Error('CHENG_CFG not found');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const out = {};
  const re = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(body))) out[m[1]] = { id: m[1], name: m[3] };
  return out;
}
// ---------- 2) 解析 ROOMS（行级 '房名': { area:'xx', ... exits:{...} }） ----------
function parseRooms(){
  const out = {};
  const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
  const lines = src.split(/\r?\n/);
  for (const l of lines) {
    const m = l.match(re);
    if (!m) continue;
    const name = m[1], area = m[2], zone = m[3], rest = m[4];
    const bldM = rest.match(/bld\s*:\s*'([^']+)'/);
    const bldTrue = /\bbld\s*:\s*true/.test(rest);
    const exitsM = rest.match(/exits\s*:\s*\{([^}]*)\}/);
    const exits = {};
    if (exitsM) {
      exitsM[1].replace(/"([nsew]{1,2})"\s*:\s*"([^"]+)"/g, (_, d, t) => { exits[d] = t; return ''; });
    }
    const npcM = rest.match(/npcs\s*:\s*\[([^\]]*)\]/);
    const npcs = npcM ? (npcM[1].match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, '')) : [];
    out[name] = { name, area, zone, bld: bldM ? bldM[1] : (bldTrue ? true : null), exits, npcs };
  }
  return out;
}

const CHENG = parseChengCfg();
const ROOMS = parseRooms();
console.log('cities: ' + Object.keys(CHENG).length + ', rooms parsed: ' + Object.keys(ROOMS).length);

// ---------- 3) 分类 ----------
const isStreet = n => /大街|官道|街道|长街|石街/.test(n) && !ROOMS[n].bld;
const isGate   = n => /(东门|西门|南门|北门|城门|关口|镇口|渡口)/.test(n) && !ROOMS[n].bld;
const MUNI = [
  [/衙门|城署|府衙/, '衙门'], [/监狱|牢/, '监狱'], [/兵营|军营|卫所|营房/, '兵营'],
  [/擂台|校场|演武场/, '擂台'], [/码头|渡头|埠/, '码头'], [/马厩|马市|骡马行/, '马厩'],
  [/客店|客栈|宿/, '客店'], [/书院|蒙学|私塾|学堂/, '书院'], [/祠堂|庙|寺|观/, '祠庙'],
];
function classify(name, r) {
  if (r.bld && r.bld !== true) return 'interior';
  if (isStreet(name)) return 'street';
  if (isGate(name)) return 'gate';
  for (const [re, tag] of MUNI) if (re.test(name)) return 'muni:' + tag;
  return 'bld';
}

// ---------- 4) 每城草稿 ----------
const report = [];
const drafts = [];
for (const cid in CHENG) {
  const cname = CHENG[cid].name;
  const rooms = Object.values(ROOMS).filter(r => r.area === cid);
  if (!rooms.length) continue;
  const streets = rooms.filter(r => classify(r.name, r) === 'street');
  const gates = rooms.filter(r => classify(r.name, r) === 'gate');
  const muni = {}; // tag -> room
  rooms.forEach(r => { const c = classify(r.name, r); if (c.startsWith('muni:')) { const t = c.slice(5); if (!muni[t]) muni[t] = r; } });
  const blds = rooms.filter(r => classify(r.name, r) === 'bld');
  const interiors = rooms.filter(r => classify(r.name, r) === 'interior');
  const byParent = {};
  interiors.forEach(r => { (byParent[r.bld] = byParent[r.bld] || []).push(r); });

  // --- 主街链：大街 → 大门 → 官道（横排骨干） ---
  const chain = [];
  const northGate = gates.find(g => /北/.test(g.name));
  const southGate = gates.find(g => /南/.test(g.name));
  const eastGate = gates.find(g => /东/.test(g.name));
  const westGate = gates.find(g => /西/.test(g.name));
  const bigStreets = streets.filter(s => /大街|长街/.test(s.name));
  const guanDao = streets.filter(s => /官道/.test(s.name));
  // 骨干：[北门] - 北大街 - (西大街) - 中央(大街或首街) - (东大街) - [东门]
  const northStreet = bigStreets.find(s => /北/.test(s.name));
  const southStreet = bigStreets.find(s => /南/.test(s.name));
  const eastStreet = bigStreets.find(s => /东/.test(s.name));
  const westStreet = bigStreets.find(s => /西/.test(s.name));
  const center = bigStreets.find(s => !/东|西|南|北/.test(s.name)) || bigStreets[0] || streets[0];
  const link = n => n ? n.name : null;
  chain.push({ node: northGate, side: 'L0' }, { node: northStreet, side: 'L1' });
  if (westStreet) chain.push({ node: westStreet, side: 'L2' });
  if (center) chain.push({ node: center, side: 'C' });
  if (eastStreet) chain.push({ node: eastStreet, side: 'R2' });
  chain.push({ node: southStreet, side: 'R1' }, { node: southGate, side: 'R0' });

  // 上排：地标建筑（祠庙/书院优先，然后普通建筑）挂北街/中央
  // 下排：市政九件套 + 官道，挂主街
  const muniOrder = ['衙门', '监狱', '兵营', '擂台', '码头', '马厩', '客店', '书院', '祠庙'];
  const lower = muniOrder.map(t => muni[t]).filter(Boolean);
  const upper = blds.filter(b => !lower.includes(b));
  // 官道（接城外）
  const gd = guanDao[0];

  // --- 画图 ---
  const L = ['','','','']; // 4 行：上排建筑 / 挂线 / 主街 / 下排
  const seg = n => n ? n.name : '（补·大街）';
  const mid = chain.filter(c => c.node).map(c => seg(c.node)).join('──');
  // 上排：最多 6 个
  const upN = Math.min(upper.length, 6);
  const upItems = upper.slice(0, upN);
  // 上排子房：只显示每建筑第一个子房
  const upRow = upItems.map(b => {
    const kids = byParent[b.name];
    return kids ? b.name + '·' + kids[0].name.replace(b.name + '·', '') : b.name;
  });
  const upLine = upRow.join('   ');
  const upTicks = upRow.map(s => '│'.padStart(Math.floor((s.length) / 2) + (s.match(/[^\x00-\xff]/g) || []).length, ' ')).join('');
  // 简化：挂线行直接用全角空格对齐比较麻烦——用简化两行式
  const lowN = Math.min(lower.length, 7);
  const lowItems = lower.slice(0, lowN);
  const lowRow = lowItems.map(b => {
    const kids = byParent[b.name];
    return kids ? b.name + '·' + kids[0].name.replace(b.name + '·', '') : b.name;
  });
  const lowLine = lowRow.join(' · ');
  const gdLine = gd ? (gd.name + (gates.length ? '' : '')) : null;

  // 缺口
  const missing = muniOrder.filter(t => !muni[t]);
  const needStreet = bigStreets.length < 2;

  drafts.push({ cid, cname, total: rooms.length, streets: streets.length, gates: gates.length,
    blds: blds.length, interiors: interiors.length, muni: Object.keys(muni),
    missing, needStreet, upLine, mid, lowLine, gdLine,
    roomList: rooms.map(r => r.name) });
}

// ---------- 5) 输出草稿纸 ----------
const out = [];
out.push('# 草稿纸 · 二十四城总图（按「苏州参考图」结构绘制）');
out.push('');
out.push('> 参考结构：**四门+大街链**（北门─北大街─西大街─中央─东大街─南门）');
out.push('> **市政九件套**：衙门/监狱/兵营/擂台/码头/马厩/客店/书院/祠庙');
out.push('> **地标带子房**：园林/寺庙/府邸等，子房（内部房间）竖挂主建筑之下，不占主图横排。');
out.push('> 官道接城外。标【补】的是该城尚缺的要素——下一轮照单补建。');
out.push('');
drafts.forEach(d => {
  out.push('## ' + d.cname + '（' + d.cid + '）');
  out.push('');
  out.push('```');
  if (d.upLine) {
    out.push('  ' + d.upLine);
    out.push('  ' + d.upLine.split('   ').map(() => '│').join('   '));
  }
  out.push('  ' + d.mid);
  if (d.lowLine) {
    out.push('  ' + d.lowLine.split(' · ').map(() => '│').join('  '));
    out.push('  ' + d.lowLine);
  }
  if (d.gdLine) out.push('  （城外）' + d.gdLine);
  out.push('```');
  out.push('');
  out.push('- 规模：共 ' + d.total + ' 房（大街 ' + d.streets + ' · 门 ' + d.gates + ' · 建筑 ' + d.blds + ' · 内部房 ' + d.interiors + '）');
  out.push('- 市政已有：' + (d.muni.length ? d.muni.join('、') : '（无）'));
  if (d.missing.length) out.push('- **【补】缺市政**：' + d.missing.join('、'));
  if (d.needStreet) out.push('- **【补】大街链不足**（大街+门 < 2），需按参考图拉出「北门─北大街─中央─南门」骨干');
  out.push('');
  out.push('全部房间：' + d.roomList.join('、'));
  out.push('');
  out.push('---');
  out.push('');
});
fs.writeFileSync('草稿纸-二十四城总图.md', out.join('\n'), 'utf8');
console.log('draft written: 草稿纸-二十四城总图.md (' + Math.round(fs.statSync('草稿纸-二十四城总图.md').size / 1024) + ' KB)');

// 摘要
console.log('\n=== 城市规模摘要 ===');
drafts.forEach(d => console.log(
  d.cname.padEnd(8, '　') + ' 房' + String(d.total).padStart(3) +
  '  街' + String(d.streets).padStart(2) + ' 门' + String(d.gates).padStart(2) +
  ' 建筑' + String(d.blds).padStart(3) + ' 内房' + String(d.interiors).padStart(3) +
  '  市政' + String(d.muni.length) + '/9' + (d.missing.length ? '  缺:' + d.missing.join('/') : '')
));
