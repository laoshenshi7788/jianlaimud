/* ================================================================
   章节链式任务工厂：七章各 20 条 × 5 节点 = 140 条 / 700 节点
   节点混搭（kill/collect/reach/talk），钩子前置；每章第 5/10/15/20 条
   奖励跨章回执信物（大额潜能，日后拜会指定人物兑现）。
   织入 index.html（哨兵幂等，替换式）。
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const BEGIN = '//<<CHAIN-BEGIN>>';
const END = '//<<CHAIN-END>>';

// 解析
const ROOMS = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re); if (!m) return;
  const enM = m[4].match(/enemies\s*:\s*\[([^\]]*)\]/);
  const en = enM ? (enM[1].match(/"([^"]+)"/g) || []).map(x => x.replace(/"/g, '')) : [];
  ROOMS[m[1]] = { area: m[2], zone: m[3], en };
});
const CHENG = {};
{
  const i0 = src.indexOf('const CHENG_CFG');
  const body = src.slice(i0, src.indexOf('};', i0) + 2);
  const mre = /'(cheng_[a-z]+)'\s*:\s*\{([\s\S]*?)name\s*:\s*'([^']+)'/g;
  let m;
  while ((m = mre.exec(body))) CHENG[m[1]] = { id: m[1], name: m[3], entry: (m[2].match(/entry\s*:\s*'([^']+)'/) || [])[1] || null };
}
const ZONE_ENEMY = {};
Object.keys(ROOMS).forEach(rn => ROOMS[rn].en.forEach(en => (ZONE_ENEMY[ROOMS[rn].zone] = ZONE_ENEMY[ROOMS[rn].zone] || []).push(en)));
const enemyPool = z => (ZONE_ENEMY[z] || ['妖狼']);
const ZONE_OF = cid => { const r = Object.keys(ROOMS).find(rn => ROOMS[rn].area === cid); return r ? ROOMS[r].zone : '大骊'; };
function roomFor(cid, rex, i) {
  const list = Object.keys(ROOMS).filter(rn => ROOMS[rn].area === cid && rex.test(rn));
  if (list.length) return pick(list, i);
  return (CHENG[cid] && CHENG[cid].entry) || cid;
}
function pick(arr, i) { return arr[Math.abs(i * 17 + 3) % arr.length]; }

const ITEM_POOL = ['草药', '干粮', '兽皮', '剑胚矿石', '朱砂', '符纸', '桃木', '灵木', '寒髓', '紫金砂', '雷击木', '玄铁', '脂粉', '山神香', '陈年女儿红'];
const FAMOUS = ['宁姚', '陈平安', '刘羡阳', '温轻眉', '崔瀺', '齐静春', '阮邛', '北俱剑隐', '白也', '曹慈', '大骊皇帝', '澄观长老', '巡城武官', '福地游商'];
const LANDMARK = /大街|广场|市集|码头|擂台|城门|山门|书院|祠堂|医馆|茶馆|衙署|镇署|酒馆|客栈|武馆|镖局|交易所/;

// 七章主题：[章号, 章名, 城池池, 授托人池, 信物, 节点风味词]
const CHAIN_THEMES = [
  [1, '初试锋芒', ['cheng_lizhu', 'cheng_jingcheng'], ['齐静春', '杨老头', '泥瓶拳师', '巡城武官', '店小二'], '泥瓶巷的铜铃', ['除狼', '采药', '探路', '拜会', '护镖']],
  [2, '名动一洲', ['cheng_dukou', 'cheng_jingcheng', 'cheng_fudi'], ['崔瀺', '顾见山', '温轻眉', '巡城武官', '骊珠货郎'], '渡口的老缆', ['缉凶', '采买', '踏勘', '拜会', '传信']],
  [3, '妖祸横流', ['cheng_shahai', 'cheng_foguang', 'cheng_jingcheng'], ['大骊皇帝', '澄观长老', '福地游商', '驯兽老妪', '衙门捕头'], null, ['御妖', '济伤', '探营', '求佛', '守土']],
  [4, '剑气长城', ['cheng_changcheng'], ['曹慈', '宁姚', '魏晋', '北俱剑隐', '陈清都'], '长城的箭羽', ['守夜', '锻兵', '巡垛', '问剑', '斩妖']],
  [5, '北俱霜天', ['cheng_xueshan', 'cheng_changcheng'], ['北俱剑隐', '曹慈', '宁姚', '大骊皇帝'], '雪山的冰晶', ['踏雪', '寻髓', '巡边', '拜山', '破阵']],
  [6, '问鼎天下', ['cheng_changcheng', 'cheng_jingcheng', 'cheng_luopo'], ['齐静春', '陈平安', '宁姚', '大骊皇帝', '曹慈'], '托月山的灰', ['集结', '祭旗', '破军', '问鼎', '安民']],
  [0, '序章', ['cheng_lizhu'], ['杨老头', '泥瓶拳师', '店小二', '孔研香说书人'], null, ['跑腿', '采买', '认路', '听书', '练手']]
];
const TOKENS = { 1: '泥瓶巷的铜铃', 2: '渡口的老缆', 4: '长城的箭羽', 5: '雪山的冰晶', 6: '托月山的灰' };
const NODE_SEQS = [
  ['kill', 'collect', 'reach', 'talk', 'kill'],
  ['collect', 'reach', 'kill', 'collect', 'talk'],
  ['reach', 'talk', 'kill', 'reach', 'collect'],
  ['talk', 'kill', 'collect', 'reach', 'kill'],
  ['kill', 'reach', 'collect', 'kill', 'talk']
];
const HOOKS = {
  0: ['初来乍到，眼里都是新活儿。', '把这条线走完——走完了，才算在这地方站住了脚。'],
  1: ['在家乡立足，靠的是一件件办妥的事。', '这条线的活办利索了，你的名字，就有人记住了。'],
  2: ['名动一洲，不是喊出来的。', '这条线走完，你的名号，洲上自有人替你传。'],
  3: ['妖祸一起，人人有责。', '这条线牵着多少人的性命——一节一节，走完它。'],
  4: ['长城不问来路，只问守不守得住。', '这条线走完，你就是城墙上的人。'],
  5: ['霜天之下，旧恨未了。', '走完这条线——雪原上的账，算清一桩是一桩。'],
  6: ['最后一战在即，天下都在看。', '这条线走完，托月山下的因果，便了了。']
};

const Q = [];
function quest(id, def, unlockExpr) {
  const d = Object.assign({}, def);
  if (!d.desc) d.desc = '【' + d.chName + '】' + (d.giver || '委托人') + '相托：' + (d.target.nodes || []).map(n => n.label || n.what).join('→') + '——一条线的活，一节一节来。';
  if (d.acceptLines && !d.acceptOptions) d.acceptOptions = [
    { text: '接下这副担子。', aff: 6, exp: 15 },
    { text: '路要一步步走，我尽力。', aff: 3 },
    { text: '事成之后，可别亏待兄弟。', gold: Math.round((d.reward ? d.reward.gold : 80) * 0.2), aff: -2 }
  ];
  if (d.turnLines && !d.turnOptions) d.turnOptions = [
    { text: '收下谢意，就此别过。', bonus: {} },
    { text: '这段因果我记下了。', bonus: { aff: 8, affNpc: d.giver } },
    { text: '事后有话要说。', bonus: { fame: 3, goldMul: 1.15 } }
  ];
  Q.push("  '" + id + "':Object.assign(" + JSON.stringify(d) + ",{unlock:function(){return " + unlockExpr + ";}}),");
}
function A(g, h, t) { return ['（' + g + '沉声开口）' + h, '（他望着你）' + t]; }
function T(g, pay, lore) { return ['（' + g + '听完你的回报，郑重点头）' + pay, '（临别，他补了一句）' + lore]; }
function rw(exp, gold, opts) { const r = { exp: exp, gold: gold }; if (opts) Object.assign(r, opts); return r; }

let total = 0;
CHAIN_THEMES.forEach(function (theme) {
  const ch = theme[0], chName = theme[1], cids = theme[2], givers = theme[3], token = theme[4], words = theme[5];
  for (let qi = 0; qi < 20; qi++) {
    const id = 'c' + ch + '_' + String(qi + 1).padStart(2, '0');
    const cid = pick(cids, qi), zone = ZONE_OF(cid);
    const giver = pick(givers, qi);
    const types = NODE_SEQS[qi % NODE_SEQS.length];
    const nodes = [];
    types.forEach(function (ty, ni) {
      const word = words[(qi + ni) % words.length];
      if (ty === 'kill') nodes.push({ type: 'kill', what: pick(enemyPool(zone), qi * 5 + ni), need: 2 + (ni % 2), label: word });
      else if (ty === 'collect') nodes.push({ type: 'collect', what: pick(ITEM_POOL, qi * 3 + ni), need: 2, label: word });
      else if (ty === 'reach') nodes.push({ type: 'reach', what: roomFor(cid, LANDMARK, qi * 5 + ni + nodes.length), need: 1, label: word });
      else nodes.push({ type: 'talk', what: pick(FAMOUS, qi * 7 + ni), need: 1, label: word });
    });
    const reward = rw(250 + ch * 90 + qi * 12, 180 + ch * 70 + qi * 9, { potential: 90 + ch * 40 + qi * 8, fame: 2 + ch });
    if (token && TOKENS[ch] && (qi + 1) % 5 === 0) reward.item = TOKENS[ch];
    const title = chName + ' · ' + words[qi % words.length] + '线 ' + (qi + 1);
    const hook = HOOKS[String(ch)] || HOOKS[1];
    const labels = nodes.map(n => n.label).join('→');
    quest(id, { title: title, giver: giver, cat: '主线', chName: chName, target: { type: 'chain', nodes: nodes }, reward: reward, auto: true, turnin: giver,
      acceptLines: A(giver, hook[0], hook[1] + '（共五节：' + labels + '。）'),
      turnLines: T(giver, '这条线，你一节一节走完了。', (qi % 2 === 0) ? '他说：下一桩，还找你。' : '他说：江湖记住的，就是把每条线走完的人。') }, 'game.chapter>=' + ch);
    total++;
  }
});

// 织入
const body = [
  '//<<CHAIN-BEGIN>>',
  '/* ================================================================',
  '   章节链式任务（build_chains.js 生成 · 幂等）：七章 140 条 × 5 节点',
  '   ================================================================ */',
  'const QUESTS_CHAIN={'
];
Q.forEach(function (q) { body.push(q); });
body.push('};');
body.push('Object.keys(QUESTS_CHAIN).forEach(function(k){ if(!QUESTS[k]) QUESTS[k]=QUESTS_CHAIN[k]; });');
body.push('//<<CHAIN-END>>');

const block = body.join('\n') + '\n';
if (src.indexOf(BEGIN) > -1) {
  src = src.replace(new RegExp(BEGIN + '[\\s\\S]*?' + END), block.trim());
} else {
  // 插在 QHUB 块之后
  const after = '//<<QHUB-END>>';
  const ai = src.indexOf(after);
  if (ai < 0) { console.log('anchor not found'); process.exit(1); }
  const ins = src.indexOf('\n', ai) + 1;
  src = src.slice(0, ins) + block + src.slice(ins);
}
fs.writeFileSync('index.html', src);
console.log('spliced chain quests: ' + total + ' (x5 nodes = ' + total * 5 + ')');
