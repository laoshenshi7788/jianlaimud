/* ================================================================
   草稿纸生成器 v2：mermaid graph TD 版（参考 deepseek_mermaid 格式）
   每城一图：主街链（四门横贯）+ 市政挂街 + 地标/子房竖挂 + 官道接城外
   缺失要素 → 红色虚线【补】节点；城镇用市政九件套，宗门/宫城各有基准
   ================================================================ */
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');

function parseChengCfg(){
  const i0 = src.indexOf('const CHENG_CFG');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const out = {};
  const re = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(body))) out[m[1]] = { id: m[1], name: m[3] };
  return out;
}
function parseRooms(){
  const out = {};
  const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
  for (const l of src.split(/\r?\n/)) {
    const m = l.match(re);
    if (!m) continue;
    const rest = m[4];
    const bldM = rest.match(/bld\s*:\s*'([^']+)'/);
    const exitsM = rest.match(/exits\s*:\s*\{([^}]*)\}/);
    const exits = {};
    if (exitsM) exitsM[1].replace(/"([nsew]{1,2})"\s*:\s*"([^"]+)"/g, (_, d, t) => { exits[d] = t; return ''; });
    out[m[1]] = { name: m[1], area: m[2], zone: m[3], bld: bldM ? bldM[1] : (/\bbld\s*:\s*true/.test(rest) ? true : null), exits };
  }
  return out;
}
const CHENG = parseChengCfg();
const ROOMS = parseRooms();

// ---------- 城市类型与基准件 ----------
// 城镇（市政九件）：骊珠小镇/大骊京城/云窟城/铁符城/芦花荡/宝瓶洲渡口/桂花岛/北俱雪城/藕花福地/倒悬山/蛮荒沙海/剑气长城
// 宫城：大骊皇宫 · 宗门：落魄山/山崖书院/佛光寺/龙虎山/桐叶宗/天姥山/药王谷/文庙 · 野区：蛮荒密林/白骨荒原/金甲废墟
const AREA_TYPE = {
  'cheng_huanggong':'palace',
  'cheng_luopo':'sect','cheng_shuyuan':'sect','cheng_foguang':'sect','cheng_longhu':'sect',
  'cheng_tongye':'sect','cheng_tianmu':'sect','cheng_yaowang':'sect','cheng_shenzhou':'sect',
  'cheng_milin':'wild','cheng_baiguyuan':'wild','cheng_nanzhan':'wild'
};
const TOWN_MUNI = [[/衙门|城署|府衙/,'衙门'],[/监狱|天牢|牢/,'监狱'],[/兵营|军营|卫所|营房|禁军/,'兵营'],[/擂台|校场|演武场/,'擂台'],[/码头|渡头|埠/,'码头'],[/马厩|马市|骡马行|马棚/,'马厩'],[/客店|客栈|宿/,'客店'],[/书院|蒙学|私塾|学堂|太学|贡院/,'书院'],[/祠堂|庙|寺|观/,'祠庙']];
const SECT_MUNI = [[/山门|大门|门厅/,'山门'],[/演武场|校场|擂台/,'演武场'],[/丹房|丹室|丹炉/,'丹房'],[/藏经|藏书/,'藏经阁'],[/客居|客房|贵宾/,'客居'],[/伙房|厨房|膳/,'伙房'],[/长老/,'长老院'],[/弟子/,'弟子院'],[/祠堂|祖师|陵/,'祖师祠']];
const PALACE_MUNI = [[/宫门|宫城门/,'宫门'],[/朝堂|金銮|大殿/,'朝堂'],[/书房|御书房/,'御书房'],[/寝宫|寝殿|慈宁|东宫/,'寝宫'],[/花园|御花园|苑/,'御花园'],[/侍卫|禁军|御林|带刀/,'侍卫营'],[/天牢|监狱|牢/,'天牢'],[/御膳|膳房|茶房/,'御膳房'],[/马厩|御马/,'御马监']];
function muniOf(type){ return type==='sect'?SECT_MUNI : type==='palace'?PALACE_MUNI : TOWN_MUNI; }
function labelOf(type){ return type==='sect'?'山门九件': type==='palace'?'宫城九件':'市政九件'; }

const isStreetName = n => /大街|官道|街道|长街|石街|街$/.test(n);
const isGateName = n => /(东门|西门|南门|北门|城门|宫门|关口|镇口)/.test(n);

function classifyCity(cid){
  const type = AREA_TYPE[cid] || 'town';
  const rooms = Object.values(ROOMS).filter(r => r.area === cid);
  const streets=[], gates=[], blds=[], interiors=[], others=[];
  const muni = {};
  for (const r of rooms) {
    if (r.bld && r.bld !== true) { interiors.push(r); continue; }
    if (isStreetName(r.name)) { streets.push(r); continue; }
    if (isGateName(r.name)) { gates.push(r); continue; }
    let hit=null;
    for (const [re, tag] of muniOf(type)) if (re.test(r.name)) { hit=tag; break; }
    if (hit) { if(!muni[hit]) muni[hit]=r; continue; }
    blds.push(r); others.push(r);
  }
  return { type, rooms, streets, gates, blds, interiors, muni };
}

// ---------- mermaid 组图 ----------
function cityDraft(cid){
  const c = classifyCity(cid);
  const cname = CHENG[cid].name;
  const type = c.type;
  let nid = 0; const idOf = {}; const nodes = []; const edges = []; const adds = [];
  function N(room, cls){
    if (idOf[room.name]) return idOf[room.name];
    const id = 'n' + (++nid);
    idOf[room.name] = id;
    nodes.push({ id, label: room.name, cls: cls || 'b' });
    return id;
  }
  function ADD(label, cls){
    const id = 'a' + (++nid);
    nodes.push({ id, label: '【补·' + label + '】', cls: cls || 'add' });
    return id;
  }
  function E(a, b){ edges.push([a, b]); }

  // 主街链：北门-北大街-西大街-中心-东大街-南门（按现有房名匹配，缺则【补】）
  const pick = (re, pool) => pool.find(x => re.test(x.name));
  const northGate = pick(/北门|北城门|北关|镇口/, c.gates);
  const southGate = pick(/南门|南城门|南关/, c.gates);
  const eastGate  = pick(/东门|东城门/, c.gates);
  const westGate  = pick(/西门|西城门/, c.gates);
  const northSt = pick(/北(大街|长街|街|官道)/, c.streets);
  const southSt = pick(/南(大街|长街|街|官道)/, c.streets);
  const eastSt  = pick(/东(大街|长街|街|官道)/, c.streets);
  const westSt  = pick(/西(大街|长街|街|官道)/, c.streets);
  const center  = c.streets.find(s => !/东|西|南|北/.test(s.name)) || c.streets[0];
  const gd      = pick(/官道|官路/, c.streets);

  const chainSeq = [];
  chainSeq.push(northGate ? [N(northGate,'gate'), northGate.name] : [ADD('北门'), null]);
  chainSeq.push(northSt ? [N(northSt,'street'), northSt.name] : [ADD(type==='sect'?'山道':'北大街'), null]);
  if (westSt) chainSeq.push([N(westSt,'street'), westSt.name]);
  chainSeq.push(center ? [N(center,'street'), center.name] : [ADD(type==='sect'?'主峰广场':'城中心大街'), null]);
  if (eastSt) chainSeq.push([N(eastSt,'street'), eastSt.name]);
  chainSeq.push(southSt ? [N(southSt,'street'), southSt.name] : null);
  chainSeq.push(southGate ? [N(southGate,'gate'), southGate.name] : null);
  const seq = chainSeq.filter(Boolean);
  for (let i=0;i<seq.length-1;i++) E(seq[i][0], seq[i+1][0]);
  // 东西门挂主街两端
  if (eastGate) { const host = eastSt? idOf[eastSt.name] : seq[seq.length-1][0]; E(host, N(eastGate,'gate')); }
  if (westGate) { const host = westSt? idOf[westSt.name] : seq[1][0]; E(host, N(westGate,'gate')); }
  // 官道接城外
  if (gd && idOf[gd.name]===undefined) { const g1=N(gd,'street'); E(seq[seq.length-1][0], g1); }

  // 市政挂主街（已有实挂，缺失的【补】虚挂中心）
  const anchors = seq.map(s => s[0]);
  let ai = 1;
  const muniList = muniOf(type);
  for (const [re, tag] of muniList) {
    const have = c.muni[tag];
    if (have) { E(anchors[ai % anchors.length], N(have,'muni')); ai++; }
    else if (type==='town' || type==='palace') { const a=ADD(tag); E(anchors[ai % anchors.length], a); ai++; }
  }

  // 其余建筑挂主街（轮转），地标优先排前
  const rest = c.blds.filter(b => !Object.values(c.muni).includes(b));
  rest.forEach((b, i) => { E(anchors[(i+1) % anchors.length], N(b,'b')); });

  // 内部房：竖挂主建筑 kid1 --> kid2 ...
  const byParent = {};
  c.interiors.forEach(r => { (byParent[r.bld] = byParent[r.bld] || []).push(r); });
  for (const p in byParent) {
    if (!idOf[p]) continue; // 主建筑不在本城（跨城引用）
    const kids = byParent[p];
    let prev = idOf[p];
    kids.forEach(k => { const id = N(k,'in'); E(prev, id); prev = id; });
  }
  // 孤儿内部房（主建筑不在本图）挂中心
  for (const p in byParent) {
    if (idOf[p]) continue;
    let prev = anchors[0];
    byParent[p].forEach(k => { const id = N(k,'in'); E(prev, id); prev = id; });
  }

  // 输出 mermaid
  const CLS = { gate:'gate', street:'street', muni:'muni', b:'bld', in:'in', add:'add' };
  const lines = ['graph TD'];
  nodes.forEach(n => lines.push('    ' + n.id + '["' + n.label + '"]'));
  edges.forEach(([a,b]) => lines.push('    ' + a + ' --> ' + b));
  const byCls = {};
  nodes.forEach(n => (byCls[n.cls] = byCls[n.cls] || []).push(n.id));
  lines.push('    classDef gate fill:#5a4633,stroke:#d9b36c,color:#ffffff;');
  lines.push('    classDef street fill:#26262e,stroke:#9a9aa2,color:#e8e8d0;');
  lines.push('    classDef muni fill:#2f4a5a,stroke:#6fb3e0,color:#ffffff;');
  lines.push('    classDef bld fill:#33334a,stroke:#c49be0,color:#ffffff;');
  lines.push('    classDef in fill:#1c1c26,stroke:#666,color:#b8b8c0;');
  lines.push('    classDef add fill:#4a2020,stroke:#e06a6a,color:#ffb9a4,stroke-dasharray:5 5;');
  Object.keys(byCls).forEach(k => lines.push('    class ' + byCls[k].join(',') + ' ' + CLS[k]));

  // 摘要
  const haveTags = Object.keys(c.muni);
  const missTags = muniList.map(m => m[1]).filter(t => !c.muni[t]).filter(t => type==='town'||type==='palace'||(type==='sect'&&SECT_MUNI.some(s=>s[1]===t)));
  return { cid, cname, type, mermaid: lines.join('\n'), total: c.rooms.length,
    have: haveTags, miss: missTags,
    nStreet: c.streets.length, nGate: c.gates.length, nBld: c.blds.length, nInt: c.interiors.length };
}

// ---------- 全城输出 ----------
const out = ['# 草稿纸 · 二十四城总图（mermaid 版，参考苏州图骨架）','',
  '> 图例：金框=门 · 灰街=大街/官道 · 蓝框=市政/基准件 · 紫框=建筑 · 暗格=内部房（子房竖挂主建筑） · **红虚线=【补】缺失要素**','',
  '> 城镇按「四门+大街链+市政九件」补齐；宫城/宗门按各自九件；野区只排现状。',''];
const allMmd = [];
const summary = [];
for (const cid in CHENG) {
  const d = cityDraft(cid);
  const typeName = d.type==='town'?'城镇':d.type==='sect'?'宗门':d.type==='palace'?'宫城':'野区';
  out.push('## ' + d.cname + '（' + typeName + ' · ' + d.total + ' 房）');
  out.push('');
  out.push('```mermaid');
  out.push(d.mermaid);
  out.push('```');
  out.push('');
  out.push('- 基准件已有：' + (d.have.length ? d.have.join('、') : '（无）'));
  out.push(d.miss.length ? '- **【补】缺失**：' + d.miss.join('、') : '- 基准件齐备 ✓');
  out.push('- 规模：大街 ' + d.nStreet + ' · 门 ' + d.nGate + ' · 建筑 ' + d.nBld + ' · 内部房 ' + d.nInt);
  out.push('');
  out.push('---');
  out.push('');
  allMmd.push('%% ====== ' + d.cname + ' ======\n' + d.mermaid);
  summary.push({ name: d.cname, type: typeName, total: d.total, have: d.have.length, miss: d.miss });
}
fs.writeFileSync('草稿纸-二十四城总图.md', out.join('\n'), 'utf8');
fs.writeFileSync('草稿纸-二十四城.mermaid', allMmd.join('\n\n'), 'utf8');
console.log('written: 草稿纸-二十四城总图.md / 草稿纸-二十四城.mermaid');
console.log('');
summary.forEach(s => console.log(
  s.name.padEnd(8,'　') + ' ' + s.type.padEnd(3,'　') + ' 房' + String(s.total).padStart(3) +
  '  基准件 ' + s.have + '/9' + (s.miss.length ? '  缺:' + s.miss.join('/') : '  ✓')
));
