/* ================================================================
   市政九件补建生成器 v2：解析现有 ROOMS → 生成 ROOMS_MUNI/NPCS_MUNI/接线
   → 哨兵块写入 index.html（幂等）。照《草稿纸-二十四城总图》缺口清单。
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');

// ---- 解析现有房间（拿 area/zone/出口） ----
const EXIST = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re);
  if (!m) return;
  const exitsM = m[4].match(/exits\s*:\s*\{([^}]*)\}/);
  const exits = {};
  if (exitsM) exitsM[1].replace(/"([nsew]{1,2})"\s*:\s*"([^"]+)"/g, (_, d, t) => { exits[d] = t; return ''; });
  EXIST[m[1]] = { area: m[2], zone: m[3], exits };
});

// ---- 命名池 ----
const SURN = ['沈','文','顾','柴','桂','聂','鞠','燕','卞','蔚','厉','靳','詹','芮','邸','荀','劳','都','钦','阚','宿','戚','简','郦','岑','邝','亢','隗','权','雒','祖','溥','逄','尚','越','边','闵','竺','糜','井'];
const GIVN = ['停云','疏影','拂霜','听澜','扶摇','含章','既白','枕流','漱石','闻笛','踏歌','眠鸥','试灯','折芦','抱瓮','扫雪','候馆','拂衣','挂剑','灌园','鸣珂','担雪','照夜','耕烟','钓雪','唤渡','守拙','抱朴','观澜','望舒','既明','怀瑾','其琛','维桢','令仪','嘉树','南乔','北岸','知非','慎行'];
const PTH = ['凡俗','剑修','练气士','武夫'];
const STY = ['温婉','沧桑','豪迈','诙谐','冷峻'];
let ni = 0;
function mkName(role) {
  const s = SURN[ni % SURN.length], g = GIVN[(ni * 7 + 3) % GIVN.length]; ni++;
  return s + g + role;
}
function mkNpc(room, zone, role, greet, talk, gender) {
  const nm = mkName(role);
  npcs[nm] = {
    title: role, gender: gender || (ni % 3 === 0 ? '女' : '男'), aff: 18 + (ni % 13),
    home: room, zone: zone, style: STY[ni % STY.length], path: PTH[ni % PTH.length],
    canKill: true, hp: 24 + (ni % 5) * 3, atk: 4 + (ni % 4), def: 1 + (ni % 3),
    loot: ['干粮'], likes: ['干粮'], greet: greet, talk: talk, genState: '无恙'
  };
  return nm;
}

// ---- 市政类型模板（主房描述 + 子房 + 角色话术） ----
const T = {
  yamen: { tag: '衙门', d: '公堂之上悬着"明镜高悬"的旧匾，案上朱笔官墨，两侧水火棍森然立着——百姓的冤屈与江湖的官司，都从这里过。', roles: ['县丞', '师爷'],
    greet: '（堂上县丞放下朱笔，抬眼打量你）民有冤，击鼓；客有事，直说。', talk: '（县丞呷了口茶）这方水土太平了多年——太平日子里的官司，多半是为银钱田宅。' },
  barracks: { tag: '兵营', d: '营中枪戟如林，兵士晨起操练的呼喝声隔着老远就能听见，沙地上脚印叠了一层又一层。', roles: ['总旗'],
    greet: '（总旗按刀而立，上下打量你）军营重地——闲人莫入，访友的，先登记。', talk: '（总旗掂了掂手里的枪杆）太平是操练出来的，不是天上掉下来的。' },
  lei: { tag: '擂台', d: '一座青石高台，台上刀痕剑印层层叠叠——江湖人到这里，先动手，后说话；台下看客的铜板，是司仪的进项。', roles: ['擂台司仪'],
    greet: '（司仪摇着折扇迎上来）客官面善——上台论拳，还是台下押彩？', talk: '（司仪嘿嘿一笑）台上无父子，台下无君子——这句老话，你品品。' },
  matou: { tag: '码头', d: '舟楫泊了一岸，号子声此起彼伏，水汽里混着鱼腥与桐油味——远行的人从这里上船，归乡的人从这里落地。', roles: ['船老大'],
    greet: '（船老大甩了甩湿漉漉的缆绳）搭船？等下一水——先说好，风浪天不加钱也不开船。', talk: '（船老大望着水面）跑了半辈子船，就懂一个理：水能载舟，也能不讲道理。' },
  majiu: { tag: '马厩', d: '槽头拴着十几匹好马，膘肥毛亮，草料香混着马汗味——赶远路的人，都爱在这儿换脚力。', roles: ['老马倌'],
    greet: '（老马倌拍拍马脖子，回头看你还礼）换马？我这儿的马，认路不认人——你只管骑。', talk: '（老马倌抓了把草料）马是好马，就是认生——你多喂两把料，它就认你了。' },
  kedian: { tag: '客店', d: '一盏"安寓客商"的灯笼挑在门首，店内被褥干净，热水常备——江湖人到这儿，权当半个家。', roles: ['掌柜'],
    greet: '（掌柜拨着算盘抬头）客官打尖还是住店？热水现成，房里刚换过褥子。', talk: '（掌柜压低声音）夜里早些歇——近来镇上外乡人多，门户关严实些总没错。' },
  shuyuan: { tag: '书院', d: '窗口透出朗朗读书声，稚子摇头晃脑，先生捻须踱步——墨香混着院里的桂花香，一进门心就静了。', roles: ['塾师'],
    greet: '（塾师搁下书卷，含笑还礼）客官是来送子入学的，还是来听一段书？', talk: '（塾师望着窗外的学童）读圣贤书，所学何事——这问题，老朽答了三十年，还没答完。' },
  simiao: { tag: '祠庙', d: '香火不绝，钟声悠远——往来江湖人，到此都要添一炷香：求平安的、还愿的、问路的，香炉从不满过。', roles: ['知客'],
    greet: '（知客合十还礼）施主添香？随喜随喜——求签在左，功德箱在右。', talk: '（知客望着香炉轻声）佛争一炷香，人争一口气——可香烧完了，气也该顺了。' },
  jail: { tag: '监狱', d: '厚木门上包着铁皮，门口挂着"闲人免进"的木牌，里头隐隐传来铁链拖地的声响。', roles: ['班头'],
    greet: '（班头横你一眼）探监？带路引。提审？有文书。都不是——那就请回吧。', talk: '（班头磕了磕烟杆）里头关的什么人？关的都是"当年觉得自己不会进来"的人。' },
  keju: { tag: '客居', d: '专为往来客人备下的清净居所——一壶热茶，一张素榻，窗外竹影扫阶，江湖人到此权当到家。', roles: ['知客'] },
  shanmen: { tag: '山门', d: '一座古朴门楼立于山道正中，门额上三字历经风雨——过此门，尘心当洗；回头看，来路已在云下。', roles: ['守门人'] }
};

// ---- 各城补建清单（区域id 由锚点反查） ----
const PLAN = [
  ['骊珠小镇', ['yamen|镇署', 'lei|镇东擂台', 'majiu|官马厩', 'barracks|镇丁营'], '骊珠小镇·镇心广场'],
  ['大骊京城', ['lei|天字擂台', 'matou|漕运码头', 'simiao|护国寺'], '大骊京城·京城广场'],
  ['云窟城', ['yamen|城署', 'lei|云窟擂台', 'majiu|官马厩', 'barracks|戍卒营'], '云窟城·镇心广场'],
  ['铁符城', ['yamen|军署', 'lei|点将台', 'majiu|军马厩', 'barracks|戍卒营'], '铁符城·镇心广场'],
  ['芦花荡', ['yamen|水乡衙署', 'barracks|水勇营', 'lei|赛船擂台', 'shuyuan|蒙馆', 'kedian|宿客店'], '芦花市集'],
  ['宝瓶洲渡口', ['yamen|渡口衙署', 'barracks|渡口汛营', 'lei|渡口擂台', 'majiu|渡口骡马行', 'shuyuan|渡口书院', 'simiao|河神庙'], '渡口街市'],
  ['桂花岛', ['yamen|岛署', 'barracks|岛丁营', 'lei|桂花擂台', 'shuyuan|岛学塾', 'simiao|桂花神祠'], '仙港市集'],
  ['北俱雪城', ['yamen|官署', 'lei|雪城擂台', 'shuyuan|雪城学塾', 'simiao|雪城神祠', 'matou|雪橇埠'], '北俱雪城·暖炉酒馆'],
  ['藕花福地', ['yamen|荷乡公所', 'barracks|渔勇棚', 'lei|戏莲擂台', 'matou|莲舟埠', 'majiu|骡马栏', 'kedian|宿客棚', 'shuyuan|莲溪学塾'], '藕花福地·灵药市集'],
  ['倒悬山', ['yamen|山城官署', 'barracks|悬军营', 'lei|崖擂台', 'matou|天梯埠', 'majiu|栈马栏', 'kedian|云宿客店', 'shuyuan|崖学塾'], '倒悬山门'],
  ['剑气长城', ['yamen|军令署', 'lei|问剑擂台', 'kedian|歇剑客栈', 'shuyuan|蒙剑学塾', 'simiao|忠烈祠'], '城道'],
  ['蛮荒沙海', ['yamen|商团公署', 'barracks|沙勇营', 'lei|青石擂台', 'matou|驼埠', 'shuyuan|蒙馆', 'simiao|沙神祠'], '蛮荒沙海'],
  ['大骊皇宫', ['jail|诏狱', 'kedian|御膳房', 'majiu|御马监'], '大骊皇宫'],
  ['落魄山', ['keju|迎客居'], '落魄山'],
  ['山崖书院', ['keju|学子寓'], '山崖书院'],
  ['佛光寺', ['shanmen|山门', 'keju|挂单寮'], '佛光寺'],
  ['龙虎山', ['shanmen|山门', 'keju|云水堂'], '龙虎山'],
  ['药王谷', ['shanmen|谷口山门', 'keju|药庐客房'], '药王谷'],
  ['天姥山', ['shanmen|山门', 'keju|听瀑居'], '天姥山道'],
  ['文庙', ['shanmen|棂星门'], '文庙广场'],
  ['桐叶宗', ['keju|迎客堂'], '桐叶宗山门']
];
// 子房规则
const SUBS = { yamen: [['班房', 'jail']], barracks: [['器械房', null]], matou: [['货栈', null]], majiu: [['草料房', null]] };

// ---- 生成 ----
const rooms = {}, npcs = {}, wires = [];
const DIRS = ['s', 'n', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
const OPP = { n: 's', s: 'n', e: 'w', w: 'e', nw: 'se', se: 'nw', ne: 'sw', sw: 'ne' };

PLAN.forEach(function (p) {
  const cname = p[0], items = p[1], anchor = p[2];
  const aex = EXIST[anchor];
  if (!aex) { console.log('!! anchor missing: ' + anchor); return; }
  const area = aex.area, zone = aex.zone;
  items.forEach(function (spec) {
    const kv = spec.split('|'), key = kv[0], suffix = kv[1];
    const t = T[key];
    const rn = cname + '·' + suffix;
    if (EXIST[rn] || rooms[rn]) return; // 已存在则跳过
    const roles = t.roles || ['知客'];
    // 主房
    const room = { area: area, zone: zone, desc: t.d };
    // 子房
    const subList = SUBS[key] || [];
    if (subList.length) room.bld = true;
    if (key === 'lei' || key === 'shanmen' || key === 'keju') room.bld = true;
    const npcsArr = [];
    roles.forEach(function (r) { npcsArr.push(mkNpc(rn, zone, r, t.greet, t.talk)); });
    room.npcs = npcsArr;
    // 出口：主房↔子房
    const roomExits = {};
    subList.forEach(function (sb, i) {
      const sn = rn + '·' + sb[0];
      roomExits[i === 0 ? 'n' : 'e'] = sn;
      const subDesc = t.d + '（' + sb[0] + '）';
      const subRoom = { area: area, zone: zone, desc: subDesc, bld: rn, npcs: [mkNpc(sn, zone, sb[2] || sb[0] + '看守', '（看守抬起头，又低下去）公事房重地——无事莫久留。', '（看守摆摆手）这屋里的东西，样样有账——跟人一样，都得守规矩。'), mkNpc(sn, zone, '当值差役', '（差役正打盹，闻声惊醒）啊——客官？哦，没事转转就行，别碰案卷。', '（差役揉揉眼睛）当值最熬人——一夜到天亮，就盼着换班那口热粥。')] };
      if (sb[1] === 'jail') subRoom.tag = '监狱';
      rooms[sn] = subRoom;
      const back = i === 0 ? 's' : 'w';
      rooms[sn].exits = {}; rooms[sn].exits[back] = rn;
      if (i > 0) { rooms[rn + '·' + subList[i - 1][0]].exits.e = sn; rooms[sn].exits.w = rn + '·' + subList[i - 1][0]; }
    });
    room.exits = roomExits;
    rooms[rn] = room;
    wires.push({ anchor: anchor, room: rn });
  });
});

// ---- 生成 JS 代码块 ----
function lit(v) { return JSON.stringify(v); }
let code = [];
code.push('// ===== 市政九件补建（照《草稿纸-二十四城总图》缺口清单；幂等哨兵块） =====');
code.push('const ROOMS_MUNI=' + JSON.stringify(rooms).replace(/"exits":\{\}/g, '"exits":{}') + ';');
code.push('Object.assign(ROOMS, ROOMS_MUNI);');
code.push('const NPCS_MUNI=' + JSON.stringify(npcs) + ';');
code.push('Object.assign(NPCS, NPCS_MUNI);');
code.push('(function wireMuni(){');
code.push('  const OPP={n:"s",s:"n",e:"w",w:"e",nw:"se",se:"nw",ne:"sw",sw:"ne"};');
code.push('  const DIRS=["s","n","e","w","nw","ne","sw","se"];');
code.push('  ' + JSON.stringify(wires) + '.forEach(function(w){');
code.push('    const a=ROOMS[w.anchor], r=ROOMS[w.room]; if(!a||!r) return;');
code.push('    const dir=DIRS.find(function(d){ return !a.exits||!a.exits[d]; })||"s";');
code.push('    if(!a.exits) a.exits={};');
code.push('    a.exits[dir]=w.room; r.exits=r.exits||{}; r.exits[OPP[dir]]=w.anchor;');
code.push('  });');
code.push('})();');

// ---- 哨兵块替换/插入 ----
const BEGIN = '//<<MUNI-BEGIN>>';
const END = '//<<MUNI-END>>';
const block = BEGIN + '\n' + code.join('\n') + '\n' + END;
const anchorLine = "Object.assign(NPCS, NPCS_EXT);";
if (src.indexOf(BEGIN) > -1) {
  const re2 = new RegExp(BEGIN + '[\\s\\S]*?' + END);
  src = src.replace(re2, block);
} else {
  src = src.replace(anchorLine, anchorLine + '\n' + block);
}
fs.writeFileSync('index.html', src);
console.log('rooms added: ' + Object.keys(rooms).length + ', npcs added: ' + Object.keys(npcs).length + ', wires: ' + wires.length);
