/* ================================================================
   任务工厂 v2：Node 端解析 ROOMS/NPCS/SECTS/CHENG_CFG，
   生成 281 条静态任务（主线21/支线96/宗门50/日常96/限时18），
   织入 index.html（幂等哨兵）。奖励走银两体系+叙事奖励；潜能独立。
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const BEGIN = '//<<QHUB-BEGIN>>';
const END = '//<<QHUB-END>>';
if (src.indexOf(BEGIN) > -1) { console.log('already spliced — skip'); process.exit(0); }

// ---------- 解析现有数据 ----------
const ROOMS = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re);
  if (!m) return;
  const rest = m[4];
  const npcM = rest.match(/npcs\s*:\s*\[([^\]]*)\]/);
  const npcs = npcM ? (npcM[1].match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, '')) : [];
  const enM = rest.match(/enemies\s*:\s*\[([^\]]*)\]/);
  const en = enM ? (enM[1].match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, '')) : [];
  ROOMS[m[1]] = { area: m[2], zone: m[3], npcs, en };
});
// 城市
const CHENG = {};
{
  const i0 = src.indexOf('const CHENG_CFG');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = mre.exec(body))) {
    const entry = (m[2].match(/entry\s*:\s*'([^']+)'/) || [])[1] || null;
    CHENG[m[1]] = { id: m[1], name: m[3], entry };
  }
}
// 门派
const SECTS = [];
{
  const i0 = src.indexOf('const SECTS = {');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'([^']+)':\{([^}]*?)(?:master\s*:\s*'([^']+)')?/g;
  let m;
  while ((m = mre.exec(body))) if (m[1] && /master/.test(m[0])) SECTS.push(m[1]);
}
// 各区敌人池
const ZONE_ENEMY = {};
Object.keys(ROOMS).forEach(rn => {
  ROOMS[rn].en.forEach(en => { (ZONE_ENEMY[ROOMS[rn].zone] = ZONE_ENEMY[ROOMS[rn].zone] || []) .push(en); });
});
const enemyPool = zone => { const p = (ZONE_ENEMY[zone] || ['妖狼']); return p.length ? p : ['妖狼']; };

// ---------- 确定性选择 ----------
const seed = 7;
function pick(arr, i) { return arr[Math.abs(i * 31 + seed) % arr.length]; }
const GIVER_ROLE = /掌柜|县丞|师爷|司仪|马倌|塾师|知客|总旗|班头|船老大|说书人|镇民|掌柜|伙计|店小二|大夫|郎中|镖师|铁匠|药王|茶博士|先生|女侠|剑客|拳师/;
function giverFor(cid, i) {
  const cand = [];
  Object.keys(ROOMS).forEach(rn => {
    if (ROOMS[rn].area !== cid) return;
    ROOMS[rn].npcs.forEach(n => { cand.push(n); });
  });
  const ok = cand.filter(n => /^[\u4e00-\u9fa5]+$/.test(n) && !n.includes('·'));
  if (!ok.length) return CHENG[cid] ? (CHENG[cid].name + '·街坊') : '店小二';
  const pref = ok.filter(n => GIVER_ROLE.test(n));
  return pick(pref.length ? pref : ok, i);
}
function roomFor(cid, re, i) {
  const list = Object.keys(ROOMS).filter(rn => ROOMS[rn].area === cid && re.test(rn));
  if (list.length) return pick(list, i);
  const entry = CHENG[cid] && CHENG[cid].entry;
  return entry || Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid) || cid;
}
const ZONE_OF = cid => {
  const r = Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid);
  return r ? ROOMS[r].zone : '大骊';
};

// ---------- 物品池（已核实存在的 ITEMS） ----------
const ITEM_POOL = ['草药', '干粮', '兽皮', '剑胚矿石', '朱砂', '符纸', '桃木', '灵木', '寒髓', '紫金砂', '雷击木', '玄铁', '脂粉', '五彩绳', '蛇胆石', '山神香', '陈年女儿红'];
const GOOD_ITEMS = ['疗伤丹', '聚气丹', '剑穗', '银环剑穗', '洞天玉简', '仙家雪莲', '夜明珠', '悟道茶叶', '灵泉仙酿'];
const FAMOUS = ['宁姚', '陈平安', '刘羡阳', '温轻眉', '崔瀺', '齐静春', '阮邛', '北俱剑隐', '白也', '曹慈'];

// ---------- 生成任务条目（纯数据 + unlock 函数文本；自动补接取/交付选项，防 playScene 空选项软锁） ----------
const Q = [];
function quest(id, def, unlockExpr) {
  const d = Object.assign({}, def);
  if (d.acceptLines && !d.acceptOptions) d.acceptOptions = [
    { text: '此事我应下了。', aff: 6, exp: 10 },
    { text: '我尽力而为，成不成另说。', aff: 2 },
    { text: '可有酬劳？——江湖不空跑。', gold: Math.round((d.reward ? d.reward.gold : 60) * 0.25), aff: -2 }
  ];
  if (d.turnLines && !d.turnOptions) d.turnOptions = [
    { text: '收下谢意，就此别过。', bonus: {} },
    { text: '这情分我记下了——往后有事尽管开口。', bonus: { aff: 6, affNpc: d.giver } },
    { text: '此事办得值不值，日后自见分晓。', bonus: { fame: 2, goldMul: 1.1 } }
  ];
  Q.push("  '" + id + "':Object.assign(" + JSON.stringify(d) + ",{unlock:function(){return " + unlockExpr + ";}}),");
}
// —— 文戏模板 ——
function accLines(giver, hook, task) {
  return ['（' + giver + '拉你到檐下，压低声音）' + hook, '（他望着你：' + task + '——这事，非你不可。）'];
}
function turnLines(giver, pay, lore) {
  return ['（' + giver + '将你上下打量一番，重重一点头）' + pay, '（临走，他忽然补了一句）' + lore];
}
// —— 奖励随难度 ——
function rwd(exp, gold, opts) { const r = { exp: exp, gold: gold }; if (opts) Object.assign(r, opts); return r; }

const CIDS = Object.keys(CHENG);

// ===== 1) 主线 21（七章各 3，unlock=章节；giver 用原著人物） =====
const MAIN = [
  // ch1
  ['m11', { title: '除狼之约', giver: '齐静春', cat: '主线', target: { type: 'kill', what: '妖狼', need: 3 }, reward: rwd(180, 150, { potential: 60, fame: 2 }), turnin: '齐静春',
    desc: '荒郊野岭的妖狼夜袭村舍，叼走了巷尾的羊——再不管，下一个就是人。', ttl: 0, auto: true,
    acceptLines: ['（齐静春立在巷口，衣袂不染尘：荒郊那三头妖狼，伤了人。',, '（他望着你：除狼，是第一步——江湖上第一个被人记住的名字，多半是从一桩凶事里挣出来的。）'],
    turnLines: ['（三头妖狼伏诛，齐静春抚须颔首：好。',, '（他轻声道：泥瓶巷的人，从不欠账——这一桩，你做得干净。）'] }, 'game.chapter>=1'],
  ['m12', { title: '街坊的托付', giver: '杨老头', cat: '主线', target: { type: 'collect', what: '草药', need: 3 }, reward: rwd(160, 120, { potential: 40 }), turnin: '杨老头',
    desc: '李家娘子难产，药铺就差一味止血的草药——可那味药，只有镇外山坡上才采得着。', auto: true,
    acceptLines: ['（杨老头烟杆子在柜台上一磕：李家娘子的事，等不得。',, '（他眯眼：去镇外山坡采三株止血的草药来——路不太平，你自己当心。）'],
    turnLines: ['（草药入柜，杨老头难得地笑了笑：救人一命，胜造七级浮屠。',, '（他忽然说：这世上有些账，药铺记着，阎王也记着。）'] }, 'game.chapter>=1'],
  ['m13', { title: '出门看江湖', giver: '泥瓶拳师', cat: '主线', target: { type: 'reach', what: '骊珠小镇·镇心广场', need: 1 }, reward: rwd(140, 100, { fame: 1 }), turnin: '泥瓶拳师',
    desc: '拳师说，巷子再深，关不住少年人的腿——出去走走，去镇心广场听听风声。', auto: true,
    acceptLines: ['（泥瓶拳师拍拍你的肩：泥瓶巷的功夫，练得再足，也要见见世面。',, '（他朝镇心广场的方向努努嘴：去那儿转转——说书人的嘴，比江湖还大。）'],
    turnLines: ['（你带着满耳朵的闲话回来，拳师听得直乐：好，见过人的孩子，才算入了江湖。',, '（他说：往后听见的名儿越多，越要记住——名字这东西，走得远才值钱。）'] }, 'game.chapter>=1'],
  // ch2
  ['m21', { title: '驿路风云', giver: '巡城武官', cat: '主线', target: { type: 'kill', what: '蛮荒小妖', need: 4 }, reward: rwd(240, 200, { potential: 90, fame: 3 }), turnin: '巡城武官',
    desc: '蛮荒小妖顺着商路摸进了大骊境内——驿道上的客商，已经折了三拨。', auto: true,
    acceptLines: ['（巡城武官把一卷告示拍在案上：驿道出事了。',, '（他盯着你：蛮荒小妖截道，四头——你去料理了，这桩功劳记你名下。）'],
    turnLines: ['（四头小妖尽除，武官难得地拍了拍你肩：有胆有识，是条汉子。',, '（他说：大骊的驿道上，从此念你一声好。）'] }, 'game.chapter>=2'],
  ['m22', { title: '渡口的书信', giver: '崔瀺', cat: '主线', target: { type: 'reach', what: '宝瓶洲渡口', need: 1 }, reward: rwd(260, 220, { potential: 80 }), turnin: '崔瀺',
    desc: '崔瀺要你往宝瓶洲渡口走一趟——那边有一桩大事，正要人搭把手。', auto: true,
    acceptLines: ['（崔瀺把玩着茶盏：渡口的风，你还没吹过吧。',, '（他笑：去那边看看——有些棋，要在风口上才下得动。）'],
    turnLines: ['（你带着渡口的风回来，崔瀺听完，沉吟半晌：好。',, '（他低声：绣虎记下你这个脚力——日后的棋局，有你一步。）'] }, 'game.chapter>=2'],
  ['m23', { title: '炉边论剑', giver: '阮邛', cat: '主线', target: { type: 'talk', what: '阮邛', need: 1 }, reward: rwd(200, 160, { potential: 50 }), turnin: '阮邛',
    desc: '铁匠铺的阮邛说，好剑要有人懂——你去跟他论一论剑，顺便领教领教他的道理。', auto: true,
    acceptLines: ['（阮邛眯着眼看炉火：小子，懂剑么？',, '（他掂了掂锤子：来，跟老夫论一论——论明白了，炉子里的火都肯听你的。）'],
    turnLines: ['（阮邛听完你的话，难得地点了点头：有见地。',, '（他笑道：剑炉的火，认的是诚心——你这诚心，老夫收下了。）'] }, 'game.chapter>=2'],
  // ch3
  ['m31', { title: '妖祸之始', giver: '大骊皇帝', cat: '主线', target: { type: 'reach', what: '蛮荒沙海', need: 1 }, reward: rwd(320, 280, { fame: 5 }), turnin: '大骊皇帝',
    desc: '蛮荒妖族在沙海一带集结——陛下要你亲自去探一探，看看妖祸大到什么地步。', auto: true,
    acceptLines: ['（大骊皇帝的目光落下来：蛮荒要动了。',, '（他沉声：你替朕去沙海看一遭——带回来的消息，比刀剑还重。）'],
    turnLines: ['（你带回的情报摆在案头，皇帝看了许久：果然。',, '（他说：这天下，怕是要不太平了——你且留心。）'] }, 'game.chapter>=3'],
  ['m32', { title: '血战妖寨', giver: '大骊皇帝', cat: '主线', target: { type: 'kill', what: '搬山猿', need: 1 }, reward: rwd(480, 420, { potential: 180, fame: 8 }), turnin: '大骊皇帝',
    desc: '妖寨的搬山猿吞了两支斥候队——不除此獠，沙海的门户就守不住。', auto: true,
    acceptLines: ['（皇帝按剑而起：搬山猿！',, '（他望着你：朕准你带兵符去，斩了它——妖祸里出的第一只大妖，该有人去斩。）'],
    turnLines: ['（搬山猿伏诛，捷报传回，满朝振奋。',, '（皇帝亲手给你斟了杯酒：这一杯，替沙海边上的人谢你。）'] }, 'game.chapter>=3'],
  ['m33', { title: '救人如救火', giver: '澄观长老', cat: '主线', target: { type: 'collect', what: '疗伤丹', need: 2 }, reward: rwd(260, 220, { potential: 70, fame: 3 }), turnin: '澄观长老',
    desc: '妖祸之下伤兵如潮——佛光寺的药，正缺最救急的疗伤丹。', auto: true,
    acceptLines: ['（澄观长老合十：战事一起，伤兵如山。',, '（他恳切道：施主若能寻来两枚疗伤丹，功德无量——寺里记你一笔。）'],
    turnLines: ['（丹药送到，长老低诵佛号：善哉。',, '（他说：医一人，即医一城——这份功德，香火会替你记着。）'] }, 'game.chapter>=3'],
  // ch4
  ['m41', { title: '北上长城', giver: '宁姚', cat: '主线', target: { type: 'reach', what: '剑气长城城头', need: 1 }, reward: rwd(360, 320, { fame: 5, potential: 100 }), turnin: '宁姚',
    desc: '剑气长城告急——宁姚要你北上，去城头亲眼看一看什么叫一夫当关。', auto: true,
    acceptLines: ['（宁姚斗笠下眸光清冷：长城在等援手。',, '（她说：你去城头看看——看完了，你就知道这江湖，到底扛在谁肩上。）'],
    turnLines: ['（城头的罡风刮过你面颊，宁姚在旁：看明白了？',, '（她轻声：看明白就好——有些地方，去了才懂。）'] }, 'game.chapter>=4'],
  ['m42', { title: '城头的风', giver: '曹慈', cat: '主线', target: { type: 'kill', what: '妖狼', need: 5 }, reward: rwd(340, 300, { potential: 90 }), turnin: '曹慈',
    desc: '妖潮一波波撞上长城——曹慈说，先替守军清几头扑上城头的妖狼。', auto: true,
    acceptLines: ['（曹慈立在城头看云海，没回头：来了就搭把手。',, '（他说：城头的风不接软拳——斩五头妖狼，算你站稳脚跟。）'],
    turnLines: ['（五头妖狼滚落城下，曹慈这才看了你一眼：还成。',, '（他说：拳要一拳拳练，城要一夜夜守——你站得住。）'] }, 'game.chapter>=4'],
  ['m43', { title: '剑与雪', giver: '北俱剑隐', cat: '主线', target: { type: 'collect', what: '寒髓', need: 2 }, reward: rwd(380, 340, { potential: 120, fame: 4 }), turnin: '北俱剑隐',
    desc: '北俱剑隐要铸一柄新剑——可这剑，得用北俱寒潭底最纯的两块寒髓。', auto: true,
    acceptLines: ['（北俱剑隐负手立于雪中：剑要铸，缺一味料。',, '（他在雪地上写了两个字：寒髓——去取两块来。）'],
    turnLines: ['（寒髓入炉，剑隐眼中剑光一闪：好料。',, '（他说：剑成之日，你也来观——此剑，记你一份。）'] }, 'game.chapter>=4'],
  // ch5
  ['m51', { title: '霜天之约', giver: '北俱剑隐', cat: '主线', target: { type: 'reach', what: '雪域之巅', need: 1 }, reward: rwd(420, 380, { fame: 6, potential: 140 }), turnin: '北俱剑隐',
    desc: '北俱霜天深处藏着一桩旧恨——剑隐要你登雪域之巅，替他看一眼。', auto: true,
    acceptLines: ['（剑隐望着北方的雪线：霜天深处，有我一桩旧事。',, '（他说：替我登一趟雪域之巅——看见了什么，回来一字不落说与我。）'],
    turnLines: ['（你把峰顶所见尽数道来，剑隐沉默了很久：如此……便好。',, '（他说：北俱的雪认得你——这份旧恨，可算有交代了。）'] }, 'game.chapter>=5'],
  ['m52', { title: '旧梦一段', giver: '陈平安', cat: '主线', target: { type: 'talk', what: '陈平安', need: 1 }, reward: rwd(400, 360, { potential: 130, fame: 5 }), turnin: '陈平安',
    desc: '陈平安说，大战之前，有些话想对你说——你去落魄山听他讲完这段旧梦。', auto: true,
    acceptLines: ['（陈平安在院里劈柴：来，坐。',, '（他说：仗要打了，有些话，说给你听——听完了，你替我记着。）'],
    turnLines: ['（他把一段往事说尽，末了轻笑：记着就好。',, '（他说：等这仗打完，落魄山的柴，我劈给你看。）'] }, 'game.chapter>=5'],
  ['m53', { title: '大战之前', giver: '阮邛', cat: '主线', target: { type: 'collect', what: '玄铁', need: 3 }, reward: rwd(440, 400, { potential: 150, fame: 6 }), turnin: '阮邛',
    desc: '大战在即，兵刃要快——阮邛要你备三块玄铁，给守军打一炉好家伙。', auto: true,
    acceptLines: ['（阮邛的炉子彻夜不熄：大战要打，刀剑先得吃饱。',, '（他朝你伸手：三块玄铁——炉火不等人。）'],
    turnLines: ['（玄铁入炉，阮邛抡起锤子，当当当一阵疾风骤雨：好料。',, '（他说：兵刃喂饱了，人心才不慌——这一炉，替你记功。）'] }, 'game.chapter>=5'],
  // ch6 终章
  ['m61', { title: '问鼎之路', giver: '齐静春', cat: '主线', target: { type: 'kill', what: '托月山大祖', need: 1 }, reward: rwd(800, 600, { potential: 300, fame: 20, item: '谷雨钱' }), turnin: '齐静春',
    desc: '托月山大祖亲率妖军压境——浩然天下的存亡，系于这一战。', auto: true,
    acceptLines: ['（齐静春负手立于城墙，风卷长衫：最后一战了。',, '（他望着你：去斩了大祖——浩然这一路的因果，由你亲手了结。）'],
    turnLines: ['（大祖伏诛，妖军溃散，万里山河复归朗朗。',, '（齐静春轻轻一揖：这一剑，开天门，也开了人心。）'] }, 'game.chapter>=6'],
  ['m62', { title: '天下太平', giver: '齐静春', cat: '主线', target: { type: 'talk', what: '齐静春', need: 1 }, reward: rwd(500, 500, { potential: 200, fame: 10 }), turnin: '齐静春',
    desc: '妖祸既平，齐静春说，该喝一杯庆功酒了——也听听他这一路的感慨。', auto: true,
    acceptLines: ['（齐静春难得地摆了酒：坐。',, '（他说：从泥瓶巷到托月山，这一路，够写半部江湖——今日，敬你。）'],
    turnLines: ['（酒过三巡，齐静春望着月色：天下太平，这四个字，最重。',, '（他说：往后走江湖，别忘了今日这杯酒的味道。）'] }, 'game.chapter>=6']
];
MAIN.forEach(function (m) { quest(m[0], m[1], m[2]); });

// ===== 2) 支线 96（24城×4：collect/kill/reach/talk 轮转） =====
CIDS.forEach(function (cid, ci) {
  const cname = CHENG[cid].name, zone = ZONE_OF(cid);
  const pool = enemyPool(zone);
  const item = pick(ITEM_POOL, ci);
  const room = roomFor(cid, /大街|广场|市集|码头|擂台|城门|山门|祠堂|书院|医馆|茶馆|衙署|镇署/, ci);
  const g = function (i) { return giverFor(cid, i); };
  quest('s' + cid + '_1', { title: '替街坊采药', giver: g(0), cat: '支线', target: { type: 'collect', what: item, need: 2 }, reward: rwd(130 + (ci % 4) * 30, 90 + (ci % 5) * 20, { item: (ci % 3 === 0) ? pick(GOOD_ITEMS, ci) : null }), turnin: g(0), auto: true,
    acceptLines: accLines(g(0), '街坊的药材又断顿了——药铺催得急，可这味药偏要出城去采。', '替我去寻两株' + item + '来，路不远，就在城外山野。',,
    turnLines: turnLines(g(0), '你寻回的两份' + item + '，正解了街坊的燃眉之急。', (ci % 2 === 0) ? '他低声：近来外乡人渐多，采药也得多留个心眼。' : '他叹道：这世道，连山里的草药都紧俏了。', }, 'game.chapter>=0 && player.visited.length>=3']);
  quest('s' + cid + '_2', { title: '斩除凶顽', giver: g(1), cat: '支线', target: { type: 'kill', what: pick(pool, ci), need: 3 }, reward: rwd(160 + (ci % 4) * 30, 110 + (ci % 5) * 20, { potential: (ci % 2 === 0) ? 50 : null, fame: 2 }), turnin: g(1), auto: true,
    acceptLines: accLines(g(1), '附近有' + pick(pool, ci) + '出没伤人——再任它横行，就要出人命了。', '替大家伙儿除三头' + pick(pool, ci) + '，为民除害。',,
    turnLines: turnLines(g(1), '凶物除尽，四邻总算能睡个安稳觉了。', '他念叨：平安二字，是刀口舔回来的。', }, 'game.chapter>=1']);
  quest('s' + cid + '_3', { title: '传个口信', giver: g(2), cat: '支线', target: { type: 'reach', what: room, need: 1 }, reward: rwd(140 + (ci % 4) * 25, 100 + (ci % 5) * 18, { item: (ci % 3 === 1) ? pick(GOOD_ITEMS, ci) : null }), turnin: g(2), auto: true,
    acceptLines: accLines(g(2), '有句要紧话，得捎到' + room + '那边的人手里。', '替我走一趟' + room + '——话带到了，就算成了。',,
    turnLines: turnLines(g(2), '口信带到，那边的人连连道谢。', '他笑道：一句口信，也能牵动半条街的人情。', }, 'game.chapter>=0 && player.visited.length>=5']);
  quest('s' + cid + '_4', { title: '打听故人', giver: g(3), cat: '支线', target: { type: 'talk', what: pick(FAMOUS, ci + 3), need: 1 }, reward: rwd(180 + (ci % 4) * 30, 120 + (ci % 5) * 20, { potential: (ci % 3 === 2) ? 60 : null, fame: 2 }), turnin: g(3), auto: true,
    acceptLines: accLines(g(3), '想跟' + pick(FAMOUS, ci + 3) + '打听一桩旧事，可一直没寻着机会。', '你若能遇到' + pick(FAMOUS, ci + 3) + '，替我问候一句——也替我探探口风。',,
    turnLines: turnLines(g(3), '你把话带到，也带回了那人的回应。', '他叹道：江湖故人，能通个音讯，就算没白活一遭。', }, 'game.chapter>=1']);
});

// ===== 3) 宗门 50（10派×5，委托人取本门真实 NPC） =====
SECTS.forEach(function (sect, si) {
  const scid = findAreaForSect(sect);
  const sg = function (i) { return giverFor(scid, i + si); };
  quest('g' + si + '_1', { title: '巡山护门', giver: sg(0), cat: '宗门', target: { type: 'reach', what: roomFor(scid, /山门|演武场|广场|大殿|峰顶/, si), need: 1 }, reward: rwd(120, 70, { favor: 8 }), turnin: sg(0), auto: true,
    acceptLines: ['（' + sg(0) + '整了整衣襟：门中弟子，各有职守。',, '（他说：替门中巡一趟山门要地——走一圈，报个平安。）'],
    turnLines: ['（你巡罢回报，' + sg(0) + '点头：辛苦了。',, '（他说：山门清静，就是最好的消息。）'] }, 'player.sect===\'' + sect + '\'']);
  quest('g' + si + '_2', { title: '门中斩妖', giver: sg(1), cat: '宗门', target: { type: 'kill', what: '妖狼', need: 3 }, reward: rwd(150, 80, { favor: 10, potential: 40 }), turnin: sg(1), auto: true,
    acceptLines: ['（' + sg(1) + '沉声道：山门外有妖物出没，惊扰了香客。',, '（他说：替门中除了这三头' + '妖狼' + '，也算你的本分。）'],
    turnLines: ['（妖物伏诛，' + sg(1) + '拍了拍你肩：不错。',, '（他说：护道之事，功过都在门中账上记着。）'] }, 'player.sect===\'' + sect + '\'']);
  quest('g' + si + '_3', { title: '采办门资', giver: sg(2), cat: '宗门', target: { type: 'collect', what: pick(ITEM_POOL, si), need: 2 }, reward: rwd(130, 75, { favor: 9 }), turnin: sg(2), auto: true,
    acceptLines: ['（' + sg(2) + '拨着算盘：门中用度紧。',, '（他说：替我采两份' + pick(ITEM_POOL, si) + '来——门中上下，都记着你的情。）'],
    turnLines: ['（物资入库，' + sg(2) + '点头：齐了。',, '（他说：门中的一砖一瓦，都是这么攒起来的。）'] }, 'player.sect===\'' + sect + '\'']);
  quest('g' + si + '_4', { title: '整理经卷', giver: sg(3), cat: '宗门', target: { type: 'reach', what: roomFor(scid, /藏经|藏书|经阁/, si), need: 1 }, reward: rwd(110, 60, { favor: 8, potential: 30 }), turnin: sg(3), auto: true,
    acceptLines: ['（' + sg(3) + '道：藏经阁的卷宗，该理一理了。',, '（他说：去' + roomFor(scid, /藏经|藏书|经阁/, si) + '走一趟——清点清楚，回来报我。）'],
    turnLines: ['（经卷归位，' + sg(3) + '颔首：有条理。',, '（他说：学问与功夫，都怕一个"乱"字。）'] }, 'player.sect===\'' + sect + '\'']);
  quest('g' + si + '_5', { title: '传讯故交', giver: sg(4), cat: '宗门', target: { type: 'talk', what: '陈平安', need: 1 }, reward: rwd(140, 70, { favor: 10, fame: 2 }), turnin: sg(4), auto: true,
    acceptLines: ['（' + sg(4) + '说：有桩门中消息，要捎给山下的故交。',, '（他说：你若遇上' + '陈平安' + '，替门中递个话——两家的交情，走动起来才热。）'],
    turnLines: ['（消息带到，' + sg(4) + '连声道谢。',, '（他说：宗门之间，人情走动，也是香火。）'] }, 'player.sect===\'' + sect + '\'']);
});
function findAreaForSect(sect) {
  for (const cid of CIDS) {
    const r = Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid && ROOMS[rn].npcs && ROOMS[rn].npcs.length);
    // sect master room: match by 宗门名 in room name
    const hit = Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid && rn.indexOf(sect) > -1);
    if (hit) return cid;
  }
  return 'cheng_lizhu';
}

// ===== 4) 日常 96（24城×4，daily） =====
CIDS.forEach(function (cid, ci) {
  const zone = ZONE_OF(cid), pool = enemyPool(zone);
  const item = pick(ITEM_POOL, ci + 2);
  const room = roomFor(cid, /大街|广场|市集|码头|擂台|医馆|茶馆/, ci + 1);
  const g = function (i) { return giverFor(cid, i + 2); };
  const unlock = 'game.visited.indexOf(\'' + (CHENG[cid].entry || cid) + '\')>-1 || game.visited.indexOf(\'' + cid + '\')>-1';
  quest('d' + cid + '_1', { title: '日常·采买', giver: g(0), cat: '日常', daily: true, target: { type: 'collect', what: item, need: 2 }, reward: rwd(55, 40), turnin: g(0), auto: true,
    acceptLines: ['（' + g(0) + '递来一张单子：今儿缺' + item + '，劳驾跑一趟。',, '（他说：街坊们等着用，快去快回。）'],
    turnLines: ['（东西送齐，' + g(0) + '笑道：妥了。',, '（他说：明日要是得空，还来搭把手。）'] }, unlock);
  quest('d' + cid + '_2', { title: '日常·巡夜', giver: g(1), cat: '日常', daily: true, target: { type: 'kill', what: pick(pool, ci + 1), need: 2 }, reward: rwd(60, 45), turnin: g(1), auto: true,
    acceptLines: ['（' + g(1) + '打着哈欠：夜里不太平。',, '（他说：替街坊巡一圈，撞见' + pick(pool, ci + 1) + '就料理了——图个安生。）'],
    turnLines: ['（夜巡无恙，' + g(1) + '谢道：辛苦。',, '（他说：太平日子，是守出来的。）'] }, unlock);
  quest('d' + cid + '_3', { title: '日常·跑腿', giver: g(2), cat: '日常', daily: true, target: { type: 'reach', what: room, need: 1 }, reward: rwd(50, 35), turnin: g(2), auto: true,
    acceptLines: ['（' + g(2) + '递来一句话：劳驾捎到' + room + '。',, '（他说：话不多，一句就够了。）'],
    turnLines: ['（话已带到，' + g(2) + '连连拱手。',, '（他说：这城里的日子，就靠这些往来撑起来。）'] }, unlock);
  quest('d' + cid + '_4', { title: '日常·传话', giver: g(3), cat: '日常', daily: true, target: { type: 'talk', what: pick(FAMOUS, ci + 5), need: 1 }, reward: rwd(58, 40, { potential: 20 }), turnin: g(3), auto: true,
    acceptLines: ['（' + g(3) + '悄声道：有句话，想托你带个人。',, '（他说：遇上' + pick(FAMOUS, ci + 5) + '，替我问声好。）'],
    turnLines: ['（话已带到，' + g(3) + '笑道：有心了。',, '（他说：江湖上的一句话，有时比一柄剑还沉。）'] }, unlock);
});

// ===== 5) 限时 18 =====
const LIMITED = [
  ['t1', '妖汛将至', 'kill', 5, 40, 240, 200, '蛮荒妖汛将至——斥候发现妖狼结群东进，须抢在汛前剪其羽翼。', 'game.chapter>=1', '妖狼', '齐静春'],
  ['t2', '护镖急行', 'reach', 1, 30, 220, 180, '一车救命的药材要赶在疫病蔓延前送到邻城——镖路凶险，须得有人押送。', 'game.chapter>=1', '骊珠小镇·镇心广场', '阮邛'],
  ['t3', '悬赏通缉', 'kill', 6, 36, 260, 220, '衙门挂了重赏：六头蛮荒小妖劫道，缉之者酬银从厚。', 'game.chapter>=2', '蛮荒小妖', '巡城武官'],
  ['t4', '雪中送炭', 'collect', 3, 24, 200, 160, '边关伤兵无药可医——三枚疗伤丹，是救命的炭。', 'game.chapter>=2', '疗伤丹', '澄观长老'],
  ['t5', '城门失火', 'kill', 8, 48, 340, 300, '妖潮撞城，守军告急——八头妖狼扑上城头，须立刻清剿。', 'game.chapter>=4', '妖狼', '曹慈'],
  ['t6', '北俱急信', 'reach', 1, 30, 300, 260, '一封加急军情，须赶在雪封山前送到北俱雪城。', 'game.chapter>=4', '北俱雪城·暖炉酒馆', '大骊皇帝'],
  ['t7', '寒潭寻髓', 'collect', 3, 36, 320, 280, '北俱剑隐的炉火正等着寒髓——剑成之日，不等人。', 'game.chapter>=5', '寒髓', '北俱剑隐'],
  ['t8', '妖寨再犯', 'kill', 1, 40, 400, 360, '搬山猿余孽卷土重来——此獠不除，沙海不安。', 'game.chapter>=3', '搬山猿', '大骊皇帝'],
  ['t9', '疫起芦花', 'collect', 4, 24, 180, 150, '芦花荡起了时疫——四份草药，是药铺眼下的全部指望。', 'game.chapter>=0', '草药', '福地游商']
];
LIMITED.forEach(function (t, i) {
  const id = t[0], title = t[1], type = t[2], need = t[3], ttl = t[4], exp = t[5], gold = t[6], desc = t[7], unlock = t[8], targetWhat = t[9], giver = t[10];
  quest(id, { title: title, giver: giver, cat: '限时', target: { type: type, what: targetWhat, need: need }, reward: rwd(exp, gold, { potential: 60 + i * 10, fame: 3 }), turnin: giver, ttl: ttl, auto: true,
    acceptLines: ['（' + giver + '急急而来：此事刻不容缓！',, '（他说：' + desc + '——时限一到，便来不及了。）'],
    turnLines: ['（你赶在时限内办妥，' + giver + '长舒一口气：好险！',, '（他说：这份急难之助，定当厚报。）'] }, unlock);
});

// ---------- 织入 ----------
const body = [
  '//<<QHUB-BEGIN>>',
  '/* ================================================================',
  '   任务工厂产物（build_questhub2.js 生成 · 幂等）：主线/支线/宗门/日常/限时 281 条',
  '   ================================================================ */',
  'const QUESTS_HUB={'
];
Q.forEach(function (q) { body.push(q); });
body.push('};');
body.push('Object.keys(QUESTS_HUB).forEach(function(k){ if(!QUESTS[k]) QUESTS[k]=QUESTS_HUB[k]; });');
body.push('//<<QHUB-END>>');

const anchor = 'function finishQuest_ext(r){';
const ai = src.indexOf(anchor);
if (ai < 0) { console.log('anchor not found!'); process.exit(1); }
const before = src.slice(0, ai);
// 在 finishQuest_ext 所在块结束后插入：找该函数后的首个 '}\n' 后插。简单起见插在 anchor 前（finishQuest_ext 之前即可，QUESTS 已定义于前）
const block = '\n' + body.join('\n') + '\n';
src = before + block + src.slice(ai);
fs.writeFileSync('index.html', src);
console.log('spliced quests: ' + Q.length + ' (主线' + MAIN.length + ' + 支线96 + 宗门' + SECTS.length * 5 + ' + 日常96 + 限时9)');
