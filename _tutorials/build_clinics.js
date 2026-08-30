/* ================================================================
   回春医庐补建：为缺失医馆的区域补一间（死亡"就近医馆救治"链覆盖）
   房名匹配 /医馆|医庐|药堂|回春堂/（救治系统正则）；哨兵幂等。
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const BEGIN = '//<<CLINIC-BEGIN>>';
const END = '//<<CLINIC-END>>';
if (src.indexOf(BEGIN) > -1) { console.log('already spliced — skip'); process.exit(0); }

// 解析区域与城市
const AREA_ROOMS = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re); if (!m) return;
  (AREA_ROOMS[m[2]] = AREA_ROOMS[m[2]] || []).push({ name: m[1], zone: m[3], rest: m[4] });
});
const CITY = {};
{
  const i0 = src.indexOf('const CHENG_CFG');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = mre.exec(body))) CITY[m[1]] = m[3];
}
// 各区医庐房名（已核：这些区域无 /医馆|医庐|药堂|回春堂/ 房）
const PLAN = [
  ['cheng_longhu', '龙虎山·回春堂', '龙虎山'],
  ['cheng_shahai', '蛮荒沙海·药堂', '蛮荒沙海'],
  ['cheng_shuyuan', '山崖书院·回春庐', '山崖书院'],
  ['cheng_tongye', '桐叶宗·回春庐', '桐叶街'],
  ['cheng_luopo', '落魄山·回春庐', '落魄山'],
  ['cheng_tianmu', '天姥山·回春庐', '天姥山道'],
  ['cheng_daoxuan', '倒悬山·回春庐', '倒悬山门'],
  ['cheng_dongsheng', '桂花岛·回春庐', '仙港大街'],
  ['cheng_changcheng', '剑气长城·回春帐', '城道'],
  ['cheng_shenzhou', '文庙·太医庐', '文庙广场'],
  ['cheng_huanggong', '大骊皇宫·太医庐', '大骊皇宫'],
  ['cheng_luhua', '芦花荡·回春堂', '芦花市集']
];
const SURN = ['温','杜','沈','苏','白','程','柳','纪','邱','游','柴','盛'];
const GIVN = ['春和','杏林','悬壶','青囊','仁心','济世','回春','扶伤','把脉','药香'];
let ni = 0;
function mkDoc(area, roomName, zone) {
  const nm = SURN[ni % SURN.length] + GIVN[(ni * 5 + 1) % GIVN.length] + '坐堂郎中'; ni++;
  return [nm, { title: '坐堂郎中', gender: ni % 3 === 0 ? '女' : '男', aff: 24, home: roomName, zone: zone,
    style: '温婉', path: '凡俗', canKill: true, hp: 26, atk: 4, def: 1, loot: ['草药'], likes: ['草药'],
    greet: '（' + nm + '放下脉枕，抬眼一笑）脸色不太好——坐，伸手，我给你看看。',
    talk: '（' + nm + '收着药戥子）伤筋动骨一百天，忌怒忌躁——药我给你配，命你自己养。', genState: '无恙' }];
}
const rooms = {}; const npcs = {}; const wires = [];
PLAN.forEach(function (p) {
  const area = p[0], rn = p[1], anchor = p[2];
  const list = AREA_ROOMS[area] || [];
  if (!list.length) return;
  if (list.some(r => /医馆|医庐|药堂|回春堂/.test(r.name))) return; // 已有医馆
  if (rooms[rn]) return;
  const zone = list[0].zone;
  const pair = mkDoc(area, rn, zone);
  rooms[rn] = { area: area, zone: zone, bld: true,
    desc: '门楣悬着药葫芦，药香从门缝里渗出来——伤兵病患，都认这块牌子。',
    npcs: [pair[0]], exits: {} };
  npcs[pair[0]] = pair[1];
  wires.push({ anchor: anchor, room: rn });
});

// 生成代码
const code = [
  BEGIN,
  '// —— 回春医庐补建：各区域医馆覆盖（死亡就近救治链）——',
  'const ROOMS_CLINIC=' + JSON.stringify(rooms) + ';',
  'Object.assign(ROOMS, ROOMS_CLINIC);',
  'const NPCS_CLINIC=' + JSON.stringify(npcs) + ';',
  'Object.assign(NPCS, NPCS_CLINIC);',
  '(function wireClinic(){',
  '  const OPP={n:"s",s:"n",e:"w",w:"e",nw:"se",se:"nw",ne:"sw",sw:"ne"};',
  '  const DIRS=["s","n","e","w","nw","ne","sw","se"];',
  '  ' + JSON.stringify(wires) + '.forEach(function(w){',
  '    const a=ROOMS[w.anchor], r=ROOMS[w.room]; if(!a||!r) return;',
  '    const dir=DIRS.find(function(d){ return !a.exits||!a.exits[d]; })||"s";',
  '    if(!a.exits) a.exits={}; a.exits[dir]=w.room; r.exits=r.exits||{}; r.exits[OPP[dir]]=w.anchor;',
  '  });',
  '})();',
  END
].join('\n');
// 织入：放 MUNI 块之后
if (src.indexOf(BEGIN) > -1) { src = src.replace(new RegExp(BEGIN + '[\\s\\S]*?' + END), code); }
else {
  const anchor = '//<<MUNI-END>>';
  const ai = src.indexOf(anchor);
  if (ai < 0) { console.log('anchor not found'); process.exit(1); }
  const ins = src.indexOf('\n', ai) + 1;
  src = src.slice(0, ins) + code + '\n' + src.slice(ins);
}
fs.writeFileSync('index.html', src);
console.log('clinics added: ' + Object.keys(rooms).length);
