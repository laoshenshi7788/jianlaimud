/* ================================================================
   市政九件补建生成器：照《草稿纸-二十四城总图》缺口清单，
   为 21 个区域补建市政房/宗门客居/山门，配具名 NPC 与双向出口。
   幂等：带哨兵标记，重复运行只替换哨兵块。
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');

// ---------- 命名池 ----------
const SURN = ['沈','文','顾','柴','桂','聂','鞠','燕','卞','蔚','厉','靳','詹','芮','邸','荀','劳','都','钦','阚','宿','戚','简','郦','岑','邝','亢','隗','权','雒'];
const GIVN = ['停云','疏影','拂霜','听澜','扶摇','含章','既白','枕流','漱石','闻笛','踏歌','眠鸥','试灯','折芦','抱瓮','扫雪','候馆','拂衣','挂剑','灌园','鸣珂','担雪','照夜','耕烟','钓雪','唤渡','divider','守拙','抱朴','观澜'];
const PATHS = ['凡俗','剑修','练气士','武夫'];
const STYLES = ['温婉','沧桑','豪迈','诙谐','冷峻'];
let nameIdx = 0;
function mkName(role) {
  const s = SURN[nameIdx % SURN.length];
  const g = GIVN[(nameIdx * 7 + 3) % GIVN.length];
  nameIdx++;
  if (g === 'divider') return s + '阿' + role.slice(0, 1);
  return s + g + role;
}

// ---------- 市政类型模板 ----------
const TPL = {
  yamen: { role: '县丞', sub: [{ s: '班房', d: '（班房）', r: '班头' }], d: '公堂之上悬着"明镜高悬"的旧匾，案上朱笔官墨，两侧水火棍森然。', tag: '衙门' },
  jail: null,
  barracks: { role: '总旗', sub: [{ s: '器械房', d: '（器械房）', r: '军械匠' }], d: '营中枪戟如林，兵士晨起操练的呼喝声隔着老远就能听见。', tag: '兵营' },
  lei: { role: '擂台司仪', d: '一座青石高台，台上刀痕剑印层层叠叠——江湖人到这里，先动手，后说话。', tag: '擂台' },
  matou: { role: '船老大', sub: [{ s: '货栈', d: '（货栈）', r: '栈主' }], d: '舟楫泊了一岸，号子声此起彼伏，水汽里混着鱼腥与桐油味。', tag: '码头' },
  majiu: { role: '老马倌', sub: [{ s: '草料房', d: '（草料房）', r: '草料夫' }], d: '槽头拴着十几匹好马，膘肥毛亮——赶远路的人，都爱在这儿换脚力。', tag: '马厩' },
  kedian: { role: '掌柜', sub: [{ s: '客房', d: '（客房）', r: '店小二' }], d: '一盏"安寓客商"的灯笼挑在门首，店内被褥干净，热水常备。', tag: '客店' },
  shuyuan: { role: '塾师', d: '窗口透出朗朗读书声，稚子摇头晃脑，先生捻须踱步。', tag: '书院' },
  simiao: { role: '知客僧', sub: [{ s: '正殿', d: '（正殿）', r: '殿主' }], d: '香火不绝，钟声悠远——往来江湖人，到此都要添一炷香。', tag: '祠庙' }
};

// ---------- 各城补建配置 ----------
// c=城名 z=zone a=锚点房 g=greet 前缀人物称谓; 项: [键, 房名后缀, 模板键, 方向偏好]
const CITY = [
  { c: '骊珠小镇', z: '大骊', a: '骊珠小镇·镇心广场', items: [
    ['yamen', '镇署'], ['lei', '镇东擂台'], ['majiu', '官马厩'], ['barracks', '镇丁营']] },
  { c: '大骊京城', z: '大骊', a: '大骊京城·京城广场', items: [
    ['lei', '天字擂台'], ['matou', '漕运码头'], ['simiao', '护国寺']] },
  { c: '云窟城', z: '大骊', a: '云窟城·镇心广场', items: [
    ['yamen', '城署'], ['lei', '云窟擂台'], ['majiu', '官马厩'], ['barracks', '戍卒营']] },
  { c: '铁符城', z: '大骊', a: '铁符城·镇心广场', items: [
    ['yamen', '军署'], ['lei', '点将台'], ['majiu', '军马厩'], ['barracks', '戍卒营']] },
  { c: '芦花荡', z: '大骊', a: '芦花市集', items: [
    ['yamen', '水乡衙署'], ['barracks', '水勇营'], ['lei', '赛船擂台'], ['shuyuan', '蒙馆'], ['kedian', '宿客店']] },
  { c: '宝瓶洲渡口', z: '名门', a: '渡口街市', items: [
    ['yamen', '渡口衙署'], ['barracks', '渡口汛营'], ['lei', '渡口擂台'], ['majiu', '渡口骡马行'], ['shuyuan', '渡口书院'], ['simiao', '河神庙']] },
  { c: '桂花岛', z: '大骊', a: '仙港市集', items: [
    ['yamen', '岛署'], ['barracks', '岛丁营'], ['lei', '桂花擂台'], ['shuyuan', '岛学塾'], ['simiao', '桂花神祠']] },
  { c: '北俱雪城', z: '险地', a: '北俱雪城·暖炉酒馆', items: [
    ['yamen', '官署'], ['lei', '雪城擂台'], ['shuyuan', '雪城学塾'], ['simiao', '雪城神祠'], ['matou', '雪橇埠']] },
  { c: '藕花福地', z: '隐地', a: '藕花福地·灵药市集', items: [
    ['yamen', '荷乡公所'], ['barracks', '渔勇棚'], ['lei', '戏莲擂台'], ['matou', '莲舟埠'], ['majiu', '骡马栏'], ['kedian', '宿客棚'], ['shuyuan', '莲溪学塾']] },
  { c: '倒悬山', z: '名门', a: '倒悬山门', items: [
    ['yamen', '山城官署'], ['barracks', '悬军营'], ['lei', '崖擂台'], ['matou', '天梯埠'], ['majiu', '栈马栏'], ['kedian', '云宿客店'], ['shuyuan', '崖学塾']] },
  { c: '剑气长城', z: '险地', a: '城道', items: [
    ['yamen', '军令署'], ['lei', '问剑擂台'], ['kedian', '歇剑客栈'], ['shuyuan', '蒙剑学塾'], ['simiao', '忠烈祠']] },
  { c: '蛮荒沙海', z: '险地', a: '蛮荒沙海', items: [
    ['yamen', '商团公署'], ['barracks', '沙勇营'], ['lei', '青石擂台'], ['matou', '驼埠'], ['shuyuan', '蒙馆'], ['simiao', '沙神祠']] },
  { c: '大骊皇宫', z: '大骊', a: '大骊皇宫', items: [
    ['jailSpecial', '诏狱'], ['shanShan', '御膳房'], ['majiu', '御马监']] }
];
const SECTS_ADD = [
  { c: '落魄山', z: '名门', a: '落魄山', items: [['keju', '迎客居']] },
  { c: '山崖书院', z: '名门', a: '山崖书院', items: [['keju', '学子寓']] },
  { c: '佛光寺', z: '名门', a: '佛光寺', items: [['shanmen', '山门'], ['keju', '挂单寮']] },
  { c: '龙虎山', z: '隐地', a: '龙虎山', items: [['shanmen', '山门'], ['keju', '云水堂']] },
  { c: '药王谷', z: '隐地', a: '药王谷', items: [['shanmen', '谷口山门'], ['keju', '药庐客房']] },
  { c: '天姥山', z: '隐地', a: '天姥山道', items: [['shanmen', '山门'], ['keju', '听瀑居']] },
  { c: '文庙', z: '大骊', a: '文庙广场', items: [['shanmen', '棂星门']] },
  { c: '桐叶宗', z: '大骊', a: '桐叶宗山门', items: [['keju', '迎客堂']] }
];

// ---------- 生成房间/NPC/接线 ----------
const rooms = {}; const npcs = {}; const wires = [];
let dirPrefs = ['s', 'n', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
const OPP = { n: 's', s: 'n', e: 'w', w: 'e', nw: 'se', se: 'nw', ne: 'sw', sw: 'ne' };

function npcOf(room, role, gender) {
  const nm = mkName(role);
  npcs[nm] = { title: role, gender: gender || (nameIdx % 3 === 0 ? '女' : '男'), aff: 18 + (nameIdx % 13), home: room, zone: '',
    style: STYLES[nameIdx % STYLES.length], path: PATHS[nameIdx % PATHS.length], canKill: true,
    hp: 24 + (nameIdx % 5) * 3, atk: 4 + (nameIdx % 4), def: 1 + (nameIdx % 3), loot: ['干粮'],
    likes: ['干粮'], greet: '（' + nm + '抬眼打量你一番，拱手还礼）客官面生——来办正事，还是来歇脚？',
    talk: '（' + nm + '压低声音）这方水土，治安还算太平——只是近来外乡人多，行事还是小心为上。', genState: '无恙' };
  return nm;
}
function addRoom(name, zone, desc, opts) {
  rooms[name] = Object.assign({ area: opts.area, zone: zone, desc: desc }, opts.extra || {});
}
function npcSet(room, roles, zone) {
  const arr = [];
  roles.forEach(r => { const nm = npcOf(room, r); npcs[nm].zone = zone; arr.push(nm); });
  return arr;
}

CITY.concat(SECTS_ADD).forEach(function (city) {
  const cname = city.c, zone = city.z, anchor = city.a;
  city.items.forEach(function (it) {
    const key = it[0], suffix = it[1];
    let tpl, roomName, desc;
    if (key === 'keju') { roomName = cname + '·' + suffix; desc = '专为往来客人备下的清净居所——一壶热茶，一张素榻，江湖人到此权当到家。'; }
    else if (key === 'shanmen') { roomName = cname + '·' + suffix; desc = '一座古朴门楼立于山道正中，"清净地"三字历经风雨——过此门，尘心当洗。'; }
    else { tpl = TPL[key === 'jailSpecial' ? 'yamen' : key]; roomName = cname + '·' + suffix; desc = tpl.d; }
    // 主房
    if (key === 'keju' || key === 'shanmen') {
      addRoom(roomName, zone, desc, { area: city._area, extra: { bld: true } });
      // zone/area 由调用处补
    }
    wires.push({ anchor: anchor, room: roomName });
  });
});
console.log('config stage ok (placeholder)');
