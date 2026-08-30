/* ================================================================
   任务工厂 v3（干净版）：主线21/支线96/宗门50/日常96/限时18 = 281 条
   织入 index.html（哨兵幂等）
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const BEGIN = '//<<QHUB-BEGIN>>';
const END = '//<<QHUB-END>>';

// 解析
const ROOMS = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re); if (!m) return;
  const r = m[4];
  const npcM = r.match(/npcs\s*:\s*\[([^\]]*)\]/);
  const npcs = npcM ? (npcM[1].match(/"([^"]+)"/g) || []).map(x => x.replace(/"/g, '')) : [];
  const enM = r.match(/enemies\s*:\s*\[([^\]]*)\]/);
  const en = enM ? (enM[1].match(/"([^"]+)"/g) || []).map(x => x.replace(/"/g, '')) : [];
  ROOMS[m[1]] = { area: m[2], zone: m[3], npcs, en };
});
const CHENG = {};
{
  const i0 = src.indexOf('const CHENG_CFG');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = mre.exec(body))) CHENG[m[1]] = { id: m[1], name: m[3], entry: (m[2].match(/entry\s*:\s*'([^']+)'/) || [])[1] || null };
}
const SECTS = [];
{
  const i0 = src.indexOf('const SECTS = {');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'([^']+)':\{([\s\S]*?)master\s*:\s*'([^']+)'/g;
  let m;
  while ((m = mre.exec(body))) SECTS.push(m[1]);
}
const ZONE_ENEMY = {};
Object.keys(ROOMS).forEach(rn => ROOMS[rn].en.forEach(en => (ZONE_ENEMY[ROOMS[rn].zone] = ZONE_ENEMY[ROOMS[rn].zone] || []).push(en)));
const enemyPool = z => (ZONE_ENEMY[z] || ['妖狼']);

const seed = 7;
const pick = (arr, i) => arr[Math.abs(i * 31 + seed) % arr.length];
const GIVER_ROLE = /掌柜|县丞|师爷|司仪|马倌|塾师|知客|总旗|班头|船老大|说书人|镇民|伙计|店小二|大夫|郎中|镖师|铁匠|药王|茶博士|先生|女侠|剑客|拳师|捕头|武官/;
function giverFor(cid, i) {
  const cand = [];
  Object.keys(ROOMS).forEach(rn => {
    if (ROOMS[rn].area !== cid) return;
    ROOMS[rn].npcs.forEach(n => cand.push(n));
  });
  const ok = cand.filter(n => /^[\u4e00-\u9fa5]+$/.test(n) && n.indexOf('·') === -1);
  if (!ok.length) return CHENG[cid] ? CHENG[cid].name + '·街坊' : '店小二';
  const pref = ok.filter(n => GIVER_ROLE.test(n));
  return pick(pref.length ? pref : ok, i);
}
function roomFor(cid, rex, i) {
  const list = Object.keys(ROOMS).filter(rn => ROOMS[rn].area === cid && rex.test(rn));
  if (list.length) return pick(list, i);
  return (CHENG[cid] && CHENG[cid].entry) || Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid) || cid;
}
const ZONE_OF = cid => { const r = Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid); return r ? ROOMS[r].zone : '大骊'; };
function findAreaForSect(sect) {
  for (const cid of Object.keys(CHENG)) {
    const hit = Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid && rn.indexOf(sect) > -1);
    if (hit) return cid;
  }
  return 'cheng_lizhu';
}
const ITEM_POOL = ['草药', '干粮', '兽皮', '剑胚矿石', '朱砂', '符纸', '桃木', '灵木', '寒髓', '紫金砂', '雷击木', '玄铁', '脂粉', '五彩绳', '蛇胆石', '山神香', '陈年女儿红'];
const GOOD_ITEMS = ['疗伤丹', '聚气丹', '剑穗', '银环剑穗', '洞天玉简', '仙家雪莲', '夜明珠', '悟道茶叶', '灵泉仙酿'];
const FAMOUS = ['宁姚', '陈平安', '刘羡阳', '温轻眉', '崔瀺', '齐静春', '阮邛', '北俱剑隐', '白也', '曹慈', '大骊皇帝', '澄观长老', '巡城武官', '福地游商', '杨老头', '泥瓶拳师', '顾见山', '阎沉舟', '魏晋', '陈清都', '慧明方丈', '张天师', '骊珠货郎', '驯兽老妪'];
const CIDS = Object.keys(CHENG);

// 生成器
const Q = [];
function quest(id, def, unlockExpr) {
  const d = Object.assign({}, def);
  if (d.desc && !d._flavored && d.cat && d.cat!=='主线' && d.cat!=='限时') { d.desc += DESC_FLAVOR[Math.abs((d.title||'').length + (d.giver||'').length) % DESC_FLAVOR.length]; d._flavored=true; }
  if (!d.desc) {
    const t = d.target || {};
    let _h = 0; const _key = (d.giver || '') + (d.title || '');
    for (let _k = 0; _k < _key.length; _k++) _h = (_h * 31 + _key.charCodeAt(_k)) % 997;
    const KILL_OPEN = ['城外又有{what}伤人', '{what}接连作乱', '夜里的{what}搅得人睡不安稳', '官道上{what}劫了三拨客商', '乡里被{what}闹得鸡犬不宁', '猎户来报：{what}又下了山'];
    const COLL_OPEN = ['药铺的{what}断了顿', '门中急缺{what}', '坊市上{what}紧俏', '家里就差{what}这一味', '老主顾点名要{what}', '库房的{what}见了底'];
    const REACH_OPEN = ['有句要紧话得带到', '有桩事须亲自走一趟', '那边的人只认当面', '有一封信要送到', '得去那边看一眼实情'];
    const TALK_OPEN = ['有桩旧事想向他求证', '想向他讨个主意', '有一句话务必带到', '他的见识值得一问', '有笔旧账要当面问清'];
    const _fill = (arr) => arr[_h % arr.length].replace(/{what}/g, t.what || '凶物');
    if (t.type === 'collect') d.desc = _fill(COLL_OPEN) + '——寻来' + (t.what || '所需之物') + '×' + (t.need || 1) + '。';
    else if (t.type === 'kill') d.desc = _fill(KILL_OPEN) + '——除掉' + (t.what || '凶物') + '×' + (t.need || 1) + '。';
    else if (t.type === 'reach') d.desc = _fill(REACH_OPEN) + '——去一趟「' + (t.what || '某地') + '」。';
    else if (t.type === 'talk') d.desc = _fill(TALK_OPEN) + '——寻' + (t.what || '一位故人') + '一叙，回报' + (d.giver || '委托人') + '。';
    else d.desc = (d.giver || '委托人') + '托付的一桩事。';
  }
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
const HOOK_A=[function(g,h,t){return '（'+g+'拉你到檐下，压低声音）'+h;},function(g,h,t){return '（'+g+'把茶碗往前一推，正色道）'+h;},function(g,h,t){return '（'+g+'抬头看你一眼，语气沉了沉）'+h;},function(g,h,t){return '（'+g+'朝你拱了拱手，叹了口气）'+h;}];
const HOOK_B=[function(g,h,t){return '（他望着你）'+t+'——这事，非你不可。';},function(g,h,t){return '（他叮嘱道）'+t+'。路上仔细些。';},function(g,h,t){return '（他压着声音补了句）'+t+'——事成之后，亏待不了你。';},function(g,h,t){return '（他说得干脆）'+t+'。就这一桩，交给你了。';}];
const TURN_A=[function(g,p){return '（'+g+'将你上下打量一番，重重一点头）'+p;},function(g,p){return '（'+g+'听完，绷着的肩松了下来）'+p;},function(g,p){return '（'+g+'接过东西，眼神一热）'+p;},function(g,p){return '（'+g+'来回走了两步，这才点头）'+p;}];
const TURN_B=[function(g,l){return '（临走，他忽然补了一句）'+l;},function(g,l){return '（末了，他像是想起什么，说道）'+l;},function(g,l){return '（他目送你，低声说）'+l;},function(g,l){return '（话到嘴边，他顿了一下，还是说了）'+l;}];
const DESC_FLAVOR=['——街坊们都盼着这一遭。','——这事拖不得。','——办成了，你在这一带就立住了。','——路不远，但得走稳。','——动静别闹太大。','——天亮前回来。','——当心野物。','——有劳了。','——记你一功。','——茶给你留着，回来再续。'];
function A(g,h,t,i){if(i==null){let z=0;for(let k=0;k<g.length;k++)z=(z+g.charCodeAt(k)*31)%4;i=z;}const a=HOOK_A[i%HOOK_A.length],b=HOOK_B[i%HOOK_B.length];return [a(g,h,t),b(g,h,t)];}
function T(g,p,l,i){if(i==null){let z=0;for(let k=0;k<g.length;k++)z=(z+g.charCodeAt(k)*17)%4;i=z;}const a=TURN_A[i%TURN_A.length],b=TURN_B[i%TURN_B.length];return [a(g,p),b(g,l)];}
function rw(exp, gold, opts) { const r = { exp: exp, gold: gold }; if (opts) Object.assign(r, opts); return r; }

// ===== 主线 21 =====
const MAIN = [
  ['m11', '除狼之约', '齐静春', { type: 'kill', what: '妖狼', need: 3 }, rw(180, 150, { potential: 60, fame: 2 }), '荒郊野岭的妖狼夜袭村舍，叼走了巷尾的羊——再不管，下一个就是人。', 'game.chapter>=1',
    ['（齐静春立在巷口，衣袂不染尘）荒郊那三头妖狼，伤了人。', '（他望着你）除狼，是第一步——江湖上第一个被人记住的名字，多半是从一桩凶事里挣出来的。'],
    ['（三头妖狼伏诛，齐静春抚须颔首）好。', '（他轻声道）泥瓶巷的人，从不欠账——这一桩，你做得干净。']],
  ['m12', '街坊的托付', '杨老头', { type: 'collect', what: '草药', need: 3 }, rw(160, 120, { potential: 40 }), '李家娘子难产，药铺就差一味止血的草药——可那味药，只有镇外山坡上才采得着。', 'game.chapter>=1',
    ['（杨老头烟杆子在柜台上一磕）李家娘子的事，等不得。', '（他眯眼）去镇外山坡采三株止血的草药来——路不太平，你自己当心。'],
    ['（草药入柜，杨老头难得地笑了笑）救人一命，胜造七级浮屠。', '（他忽然说）这世上有些账，药铺记着，阎王也记着。']],
  ['m13', '出门看江湖', '泥瓶拳师', { type: 'reach', what: '骊珠小镇·镇心广场', need: 1 }, rw(140, 100, { fame: 1 }), '拳师说，巷子再深，关不住少年人的腿——出去走走，去镇心广场听听风声。', 'game.chapter>=1',
    ['（泥瓶拳师拍拍你的肩）泥瓶巷的功夫，练得再足，也要见见世面。', '（他朝镇心广场的方向努努嘴）去那儿转转——说书人的嘴，比江湖还大。'],
    ['（你带着满耳朵的闲话回来，拳师听得直乐）好，见过人的孩子，才算入了江湖。', '（他说）往后听见的名儿越多，越要记住——名字这东西，走得远才值钱。']],
  ['m21', '驿路风云', '巡城武官', { type: 'kill', what: '蛮荒小妖', need: 4 }, rw(240, 200, { potential: 90, fame: 3 }), '蛮荒小妖顺着商路摸进了大骊境内——驿道上的客商，已经折了三拨。', 'game.chapter>=2',
    ['（巡城武官把一卷告示拍在案上）驿道出事了。', '（他盯着你）蛮荒小妖截道，四头——你去料理了，这桩功劳记你名下。'],
    ['（四头小妖尽除，武官难得地拍了拍你肩）有胆有识，是条汉子。', '（他说）大骊的驿道上，从此念你一声好。']],
  ['m22', '渡口的书信', '崔瀺', { type: 'reach', what: '宝瓶洲渡口', need: 1 }, rw(260, 220, { potential: 80 }), '崔瀺要你往宝瓶洲渡口走一趟——那边有一桩大事，正要人搭把手。', 'game.chapter>=2',
    ['（崔瀺把玩着茶盏）渡口的风，你还没吹过吧。', '（他笑）去那边看看——有些棋，要在风口上才下得动。'],
    ['（你带着渡口的风回来，崔瀺听完，沉吟半晌）好。', '（他低声）绣虎记下你这个脚力——日后的棋局，有你一步。']],
  ['m23', '炉边论剑', '阮邛', { type: 'talk', what: '阮邛', need: 1 }, rw(200, 160, { potential: 50 }), '铁匠铺的阮邛说，好剑要有人懂——你去跟他论一论剑，顺便领教领教他的道理。', 'game.chapter>=2',
    ['（阮邛眯着眼看炉火）小子，懂剑么？', '（他掂了掂锤子）来，跟老夫论一论——论明白了，炉子里的火都肯听你的。'],
    ['（阮邛听完你的话，难得地点了点头）有见地。', '（他笑道）剑炉的火，认的是诚心——你这诚心，老夫收下了。']],
  ['m31', '妖祸之始', '大骊皇帝', { type: 'reach', what: '蛮荒沙海', need: 1 }, rw(320, 280, { fame: 5 }), '蛮荒妖族在沙海一带集结——陛下要你亲自去探一探，看看妖祸大到什么地步。', 'game.chapter>=3',
    ['（大骊皇帝的目光落下来）蛮荒要动了。', '（他沉声）你替朕去沙海看一遭——带回来的消息，比刀剑还重。'],
    ['（你带回的情报摆在案头，皇帝看了许久）果然。', '（他说）这天下，怕是要不太平了——你且留心。']],
  ['m32', '血战妖寨', '大骊皇帝', { type: 'kill', what: '搬山猿', need: 1 }, rw(480, 420, { potential: 180, fame: 8 }), '妖寨的搬山猿吞了两支斥候队——不除此獠，沙海的门户就守不住。', 'game.chapter>=3',
    ['（皇帝按剑而起）搬山猿！', '（他望着你）朕准你带兵符去，斩了它——妖祸里出的第一只大妖，该有人去斩。'],
    ['（搬山猿伏诛，捷报传回，满朝振奋）', '（皇帝亲手给你斟了杯酒）这一杯，替沙海边上的人谢你。']],
  ['m33', '救人如救火', '澄观长老', { type: 'collect', what: '疗伤丹', need: 2 }, rw(260, 220, { potential: 70, fame: 3 }), '妖祸之下伤兵如潮——佛光寺的药，正缺最救急的疗伤丹。', 'game.chapter>=3',
    ['（澄观长老合十）战事一起，伤兵如山。', '（他恳切道）施主若能寻来两枚疗伤丹，功德无量——寺里记你一笔。'],
    ['（丹药送到，长老低诵佛号）善哉。', '（他说）医一人，即医一城——这份功德，香火会替你记着。']],
  ['m41', '北上长城', '宁姚', { type: 'reach', what: '剑气长城城头', need: 1 }, rw(360, 320, { fame: 5, potential: 100 }), '剑气长城告急——宁姚要你北上，去城头亲眼看一看什么叫一夫当关。', 'game.chapter>=4',
    ['（宁姚斗笠下眸光清冷）长城在等援手。', '（她说）你去城头看看——看完了，你就知道这江湖，到底扛在谁肩上。'],
    ['（城头的罡风刮过你面颊，宁姚在旁）看明白了？', '（她轻声）看明白就好——有些地方，去了才懂。']],
  ['m42', '城头的风', '曹慈', { type: 'kill', what: '妖狼', need: 5 }, rw(340, 300, { potential: 90 }), '妖潮一波波撞上长城——曹慈说，先替守军清几头扑上城头的妖狼。', 'game.chapter>=4',
    ['（曹慈立在城头看云海，没回头）来了就搭把手。', '（他说）城头的风不接软拳——斩五头妖狼，算你站稳脚跟。'],
    ['（五头妖狼滚落城下，曹慈这才看了你一眼）还成。', '（他说）拳要一拳拳练，城要一夜夜守——你站得住。']],
  ['m43', '剑与雪', '北俱剑隐', { type: 'collect', what: '寒髓', need: 2 }, rw(380, 340, { potential: 120, fame: 4 }), '北俱剑隐要铸一柄新剑——可这剑，得用北俱寒潭底最纯的两块寒髓。', 'game.chapter>=4',
    ['（北俱剑隐负手立于雪中）剑要铸，缺一味料。', '（他在雪地上写了两个字：寒髓）去取两块来。'],
    ['（寒髓入炉，剑隐眼中剑光一闪）好料。', '（他说）剑成之日，你也来观——此剑，记你一份。']],
  ['m51', '霜天之约', '北俱剑隐', { type: 'reach', what: '雪域之巅', need: 1 }, rw(420, 380, { fame: 6, potential: 140 }), '北俱霜天深处藏着一桩旧恨——剑隐要你登雪域之巅，替他看一眼。', 'game.chapter>=5',
    ['（剑隐望着北方的雪线）霜天深处，有我一桩旧事。', '（他说）替我登一趟雪域之巅——看见了什么，回来一字不落说与我。'],
    ['（你把峰顶所见尽数道来，剑隐沉默了很久）如此……便好。', '（他说）北俱的雪认得你——这份旧恨，可算有交代了。']],
  ['m52', '旧梦一段', '陈平安', { type: 'talk', what: '陈平安', need: 1 }, rw(400, 360, { potential: 130, fame: 5 }), '陈平安说，大战之前，有些话想对你说——你去落魄山听他讲完这段旧梦。', 'game.chapter>=5',
    ['（陈平安在院里劈柴）来，坐。', '（他说）仗要打了，有些话，说给你听——听完了，你替我记着。'],
    ['（他把一段往事说尽，末了轻笑）记着就好。', '（他说）等这仗打完，落魄山的柴，我劈给你看。']],
  ['m53', '大战之前', '阮邛', { type: 'collect', what: '玄铁', need: 3 }, rw(440, 400, { potential: 150, fame: 6 }), '大战在即，兵刃要快——阮邛要你备三块玄铁，给守军打一炉好家伙。', 'game.chapter>=5',
    ['（阮邛的炉子彻夜不熄）大战要打，刀剑先得吃饱。', '（他朝你伸手）三块玄铁——炉火不等人。'],
    ['（玄铁入炉，阮邛抡起锤子，当当当一阵疾风骤雨）好料。', '（他说）兵刃喂饱了，人心才不慌——这一炉，替你记功。']],
  ['m61', '问鼎之路', '齐静春', { type: 'kill', what: '托月山大祖', need: 1 }, rw(800, 600, { potential: 300, fame: 20, item: '谷雨钱' }), '托月山大祖亲率妖军压境——浩然天下的存亡，系于这一战。', 'game.chapter>=6',
    ['（齐静春负手立于城墙，风卷长衫）最后一战了。', '（他望着你）去斩了大祖——浩然这一路的因果，由你亲手了结。'],
    ['（大祖伏诛，妖军溃散，万里山河复归朗朗）', '（齐静春轻轻一揖）这一剑，开天门，也开了人心。']],
  ['m62', '天下太平', '齐静春', { type: 'talk', what: '齐静春', need: 1 }, rw(500, 500, { potential: 200, fame: 10 }), '妖祸既平，齐静春说，该喝一杯庆功酒了——也听听他这一路的感慨。', 'game.chapter>=6',
    ['（齐静春难得地摆了酒）坐。', '（他说）从泥瓶巷到托月山，这一路，够写半部江湖——今日，敬你。'],
    ['（酒过三巡，齐静春望着月色）天下太平，这四个字，最重。', '（他说）往后走江湖，别忘了今日这杯酒的味道。']]
];
MAIN.forEach(function (m) {
  // 行结构：[id,title,giver,target,reward,desc,unlock,accept,turn]
  quest(m[0], { title: m[1], giver: m[2], cat: '主线', target: m[3], reward: m[4], desc: m[5], auto: true, turnin: m[2], acceptLines: m[7], turnLines: m[8] }, m[6]);
});

// ===== 支线 96 =====
CIDS.forEach(function (cid, ci) {
  const cname = CHENG[cid].name, zone = ZONE_OF(cid);
  const pool = enemyPool(zone), item = pick(ITEM_POOL, ci), room = roomFor(cid, /大街|广场|市集|码头|擂台|城门|山门|祠堂|书院|医馆|茶馆|衙署|镇署/, ci);
  const g = function (i) { return giverFor(cid, i); };
  quest('s' + cid + '_1', { title: '替街坊采药', giver: g(0), cat: '支线', target: { type: 'collect', what: item, need: 2 }, reward: rw(130 + (ci % 4) * 30, 90 + (ci % 5) * 20, (ci % 3 === 0) ? { item: pick(GOOD_ITEMS, ci) } : null), turnin: g(0), auto: true,
    acceptLines: A(g(0), '街坊的药材又断顿了——药铺催得急，可这味药偏要出城去采。', '替我去寻两株' + item + '来，路不远，就在城外山野。'),
    turnLines: T(g(0), '你寻回的两份' + item + '，正解了街坊的燃眉之急。', (ci % 2 === 0) ? '他低声：近来外乡人渐多，采药也得多留个心眼。' : '他叹道：这世道，连山里的草药都紧俏了。') }, 'game.chapter>=0 && player.visited.length>=3');
  quest('s' + cid + '_2', { title: '斩除凶顽', giver: g(1), cat: '支线', target: { type: 'kill', what: pick(pool, ci), need: 3 }, reward: rw(160 + (ci % 4) * 30, 110 + (ci % 5) * 20, (ci % 2 === 0) ? { potential: 50, fame: 2 } : null), turnin: g(1), auto: true,
    acceptLines: A(g(1), '附近有' + pick(pool, ci) + '出没伤人——再任它横行，就要出人命了。', '替大家伙儿除三头' + pick(pool, ci) + '，为民除害。'),
    turnLines: T(g(1), '凶物除尽，四邻总算能睡个安稳觉了。', '他念叨：平安二字，是刀口舔回来的。') }, 'game.chapter>=1');
  quest('s' + cid + '_3', { title: '传个口信', giver: g(2), cat: '支线', target: { type: 'reach', what: room, need: 1 }, reward: rw(140 + (ci % 4) * 25, 100 + (ci % 5) * 18, (ci % 3 === 1) ? { item: pick(GOOD_ITEMS, ci) } : null), turnin: g(2), auto: true,
    acceptLines: A(g(2), '有句要紧话，得捎到' + room + '那边的人手里。', '替我走一趟' + room + '——话带到了，就算成了。'),
    turnLines: T(g(2), '口信带到，那边的人连连道谢。', '他笑道：一句口信，也能牵动半条街的人情。') }, 'game.chapter>=0 && player.visited.length>=5');
  quest('s' + cid + '_4', { title: '打听故人', giver: g(3), cat: '支线', target: { type: 'talk', what: pick(FAMOUS, ci + 3), need: 1 }, reward: rw(180 + (ci % 4) * 30, 120 + (ci % 5) * 20, (ci % 3 === 2) ? { potential: 60, fame: 2 } : null), turnin: g(3), auto: true,
    acceptLines: A(g(3), '想跟' + pick(FAMOUS, ci + 3) + '打听一桩旧事，可一直没寻着机会。', '你若能遇到' + pick(FAMOUS, ci + 3) + '，替我问候一句——也替我探探口风。'),
    turnLines: T(g(3), '你把话带到，也带回了那人的回应。', '他叹道：江湖故人，能通个音讯，就算没白活一遭。') }, 'game.chapter>=1');
});

// ===== 宗门 50 =====
SECTS.forEach(function (sect, si) {
  const scid = findAreaForSect(sect);
  const sg = function (i) { return giverFor(scid, i + si); };
  const door = roomFor(scid, /山门|演武场|广场|大殿|峰顶/, si);
  const lib = roomFor(scid, /藏经|藏书|经阁/, si);
  quest('g' + si + '_1', { title: '巡山护门', giver: sg(0), cat: '宗门', target: { type: 'reach', what: door, need: 1 }, reward: rw(120, 70, { favor: 8 }), turnin: sg(0), auto: true,
    acceptLines: A(sg(0), '门中弟子，各有职守。', '替门中巡一趟' + door + '要地——走一圈，报个平安。'),
    turnLines: T(sg(0), '你巡罢回报，山门清静。', '他说：山门清静，就是最好的消息。') }, 'player.sect===\'' + sect + '\'');
  quest('g' + si + '_2', { title: '门中斩妖', giver: sg(1), cat: '宗门', target: { type: 'kill', what: '妖狼', need: 3 }, reward: rw(150, 80, { favor: 10, potential: 40 }), turnin: sg(1), auto: true,
    acceptLines: A(sg(1), '山门外有妖物出没，惊扰了香客。', '替门中除了这三头妖狼，也算你的本分。'),
    turnLines: T(sg(1), '妖物伏诛，门中上下称快。', '他说：护道之事，功过都在门中账上记着。') }, 'player.sect===\'' + sect + '\'');
  quest('g' + si + '_3', { title: '采办门资', giver: sg(2), cat: '宗门', target: { type: 'collect', what: pick(ITEM_POOL, si), need: 2 }, reward: rw(130, 75, { favor: 9 }), turnin: sg(2), auto: true,
    acceptLines: A(sg(2), '门中用度紧，账上快见底了。', '替我采两份' + pick(ITEM_POOL, si) + '来——门中上下，都记着你的情。'),
    turnLines: T(sg(2), '物资入库，账目齐整。', '他说：门中的一砖一瓦，都是这么攒起来的。') }, 'player.sect===\'' + sect + '\'');
  quest('g' + si + '_4', { title: '整理经卷', giver: sg(3), cat: '宗门', target: { type: 'reach', what: lib, need: 1 }, reward: rw(110, 60, { favor: 8, potential: 30 }), turnin: sg(3), auto: true,
    acceptLines: A(sg(3), '藏经阁的卷宗，该理一理了。', '去' + lib + '走一趟——清点清楚，回来报我。'),
    turnLines: T(sg(3), '经卷归位，井井有条。', '他说：学问与功夫，都怕一个"乱"字。') }, 'player.sect===\'' + sect + '\'');
  quest('g' + si + '_5', { title: '传讯故交', giver: sg(4), cat: '宗门', target: { type: 'talk', what: '陈平安', need: 1 }, reward: rw(140, 70, { favor: 10, fame: 2 }), turnin: sg(4), auto: true,
    acceptLines: A(sg(4), '有桩门中消息，要捎给山下的故交。', '你若遇上陈平安，替门中递个话——两家的交情，走动起来才热。'),
    turnLines: T(sg(4), '消息带到，故交回了话。', '他说：宗门之间，人情走动，也是香火。') }, 'player.sect===\'' + sect + '\'');
});

// ===== 日常 96 =====
CIDS.forEach(function (cid, ci) {
  const zone = ZONE_OF(cid), pool = enemyPool(zone), item = pick(ITEM_POOL, ci + 2), room = roomFor(cid, /大街|广场|市集|码头|擂台|医馆|茶馆/, ci + 1);
  const g = function (i) { return giverFor(cid, i + 2); };
  const unlock = 'game.visited.indexOf(\'' + (CHENG[cid].entry || cid) + '\')>-1 || game.visited.indexOf(\'' + cid + '\')>-1';
  quest('d' + cid + '_1', { title: '日常·采买', giver: g(0), cat: '日常', daily: true, target: { type: 'collect', what: item, need: 2 }, reward: rw(55, 40), turnin: g(0), auto: true,
    acceptLines: ['（' + g(0) + '递来一张单子）今儿缺' + item + '，劳驾跑一趟。', '（他说）街坊们等着用，快去快回。'],
    turnLines: ['（东西送齐，' + g(0) + '笑道）妥了。', '（他说）明日要是得空，还来搭把手。'] }, unlock);
  quest('d' + cid + '_2', { title: '日常·巡夜', giver: g(1), cat: '日常', daily: true, target: { type: 'kill', what: pick(pool, ci + 1), need: 2 }, reward: rw(60, 45), turnin: g(1), auto: true,
    acceptLines: ['（' + g(1) + '打着哈欠）夜里不太平。', '（他说）替街坊巡一圈，撞见' + pick(pool, ci + 1) + '就料理了——图个安生。'],
    turnLines: ['（夜巡无恙，' + g(1) + '谢道）辛苦。', '（他说）太平日子，是守出来的。'] }, unlock);
  quest('d' + cid + '_3', { title: '日常·跑腿', giver: g(2), cat: '日常', daily: true, target: { type: 'reach', what: room, need: 1 }, reward: rw(50, 35), turnin: g(2), auto: true,
    acceptLines: ['（' + g(2) + '递来一句话）劳驾捎到' + room + '。', '（他说）话不多，一句就够了。'],
    turnLines: ['（话已带到，' + g(2) + '连连拱手）', '（他说）这城里的日子，就靠这些往来撑起来。'] }, unlock);
  quest('d' + cid + '_4', { title: '日常·传话', giver: g(3), cat: '日常', daily: true, target: { type: 'talk', what: pick(FAMOUS, ci + 5), need: 1 }, reward: rw(58, 40, { potential: 20 }), turnin: g(3), auto: true,
    acceptLines: ['（' + g(3) + '悄声道）有句话，想托你带个人。', '（他说）遇上' + pick(FAMOUS, ci + 5) + '，替我问声好。'],
    turnLines: ['（话已带到，' + g(3) + '笑道）有心了。', '（他说）江湖上的一句话，有时比一柄剑还沉。'] }, unlock);
});

// ===== 限时 18 =====
const LIMITED = [
  ['t1', '妖汛将至', 'kill', '妖狼', 5, 40, 240, 200, '蛮荒妖汛将至——斥候发现妖狼结群东进，须抢在汛前剪其羽翼。', 'game.chapter>=1', '齐静春'],
  ['t2', '护镖急行', 'reach', '骊珠小镇·镇心广场', 1, 30, 220, 180, '一车救命的药材要赶在疫病蔓延前送到邻城——镖路凶险，须得有人押送。', 'game.chapter>=1', '阮邛'],
  ['t3', '悬赏通缉', 'kill', '蛮荒小妖', 6, 36, 260, 220, '衙门挂了重赏：六头蛮荒小妖劫道，缉之者酬银从厚。', 'game.chapter>=2', '巡城武官'],
  ['t4', '雪中送炭', 'collect', '疗伤丹', 3, 24, 200, 160, '边关伤兵无药可医——三枚疗伤丹，是救命的炭。', 'game.chapter>=2', '澄观长老'],
  ['t5', '城门失火', 'kill', '妖狼', 8, 48, 340, 300, '妖潮撞城，守军告急——八头妖狼扑上城头，须立刻清剿。', 'game.chapter>=4', '曹慈'],
  ['t6', '北俱急信', 'reach', '北俱雪城·暖炉酒馆', 1, 30, 300, 260, '一封加急军情，须赶在雪封山前送到北俱雪城。', 'game.chapter>=4', '大骊皇帝'],
  ['t7', '寒潭寻髓', 'collect', '寒髓', 3, 36, 320, 280, '北俱剑隐的炉火正等着寒髓——剑成之日，不等人。', 'game.chapter>=5', '北俱剑隐'],
  ['t8', '妖寨再犯', 'kill', '搬山猿', 1, 40, 400, 360, '搬山猿余孽卷土重来——此獠不除，沙海不安。', 'game.chapter>=3', '大骊皇帝'],
  ['t9', '疫起芦花', 'collect', '草药', 4, 24, 180, 150, '芦花荡起了时疫——四份草药，是药铺眼下的全部指望。', 'game.chapter>=0', '福地游商'],
  ['t10', '暗夜传书', 'reach', '山崖书院', 1, 26, 210, 180, '一封密信要在天亮前送进山崖书院——迟了，便误了大事。', 'game.chapter>=1', '崔瀺'],
  ['t11', '春汛抢险', 'kill', '沼泽巨蟒', 2, 34, 280, 240, '春汛冲垮了河堤，水退后沼泽巨蟒顺着水路进了村——须赶在伤人前除了它。', 'game.chapter>=2', '福地游商'],
  ['t12', '香火将断', 'collect', '山神香', 2, 30, 230, 190, '村口的山神庙断了香火——再不去添，香火续不上，山神也要生气。', 'game.chapter>=0', '澄观长老'],
  ['t13', '马惊了', 'collect', '兽皮', 3, 22, 200, 170, '镖行的马惊了，要换鞍——三张好兽皮，赶在交货前凑齐。', 'game.chapter>=0', '福地游商'],
  ['t14', '雪夜急援', 'reach', '剑气长城之巅', 1, 30, 360, 320, '长城之巅的烽火要人接力——一封求援信，雪夜里须送到。', 'game.chapter>=4', '曹慈'],
  ['t15', '炼剑急材', 'collect', '剑胚矿石', 4, 34, 300, 260, '剑炉正等着剑胚矿石下料——迟了，这一炉剑胚就废了。', 'game.chapter>=3', '阮邛'],
  ['t16', '断桥遗信', 'reach', '宝瓶洲渡口', 1, 26, 240, 200, '断桥那边的遗信要转交渡口船老大——风声紧，路上别耽搁。', 'game.chapter>=2', '崔瀺'],
  ['t17', '疫药告急', 'collect', '草药', 5, 24, 220, 180, '疫病蔓延比预想快——五份草药，药铺眼下就差这一口气。', 'game.chapter>=0', '福地游商'],
  ['t18', '霜天飞羽', 'reach', '北俱雪山', 1, 28, 320, 280, '北俱雪山下的飞羽信，要赶在大雪封路前送到。', 'game.chapter>=5', '北俱剑隐']
];
LIMITED.forEach(function (t, i) {
  quest(t[0], { title: t[1], giver: t[10], cat: '限时', target: { type: t[2], what: t[3], need: t[4] }, reward: rw(t[6], t[7], { potential: 60 + i * 10, fame: 3 }), turnin: t[10], ttl: t[5], auto: true,
    acceptLines: ['（' + t[10] + '急急而来）此事刻不容缓！', '（他说）' + t[8] + '——时限一到，便来不及了。'],
    turnLines: ['（你赶在时限内办妥，' + t[10] + '长舒一口气）好险！', '（他说）这份急难之助，定当厚报。'] }, t[9]);
});

// ===== 织入 =====
const body = [
  '//<<QHUB-BEGIN>>',
  '/* ================================================================',
  '   任务工厂产物（build_questhub3.js 生成 · 幂等）：主线/支线/宗门/日常/限时 281 条',
  '   ================================================================ */',
  'const QUESTS_HUB={'
];
Q.forEach(function (q) { body.push(q); });
body.push('};');
body.push('Object.keys(QUESTS_HUB).forEach(function(k){ if(!QUESTS[k]) QUESTS[k]=QUESTS_HUB[k]; });');
body.push('//<<QHUB-END>>');

const anchor = 'function finishQuest_ext(r){';
const ai = src.indexOf(anchor);
if (ai < 0) { console.log('anchor not found'); process.exit(1); }
const block = '\n' + body.join('\n') + '\n';
if (src.indexOf(BEGIN) > -1) {
  const re2 = new RegExp(BEGIN + '[\\s\\S]*?' + END);
  src = src.replace(re2, block.trim());
} else {
  src = src.slice(0, ai) + block + src.slice(ai);
}
fs.writeFileSync('index.html', src);
console.log('spliced ' + Q.length + ' quests (主线' + MAIN.length + ' + 支线' + CIDS.length * 4 + ' + 宗门' + SECTS.length * 5 + ' + 日常' + CIDS.length * 4 + ' + 限时' + LIMITED.length + ')');
