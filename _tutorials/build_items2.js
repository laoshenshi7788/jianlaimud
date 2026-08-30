/* ================================================================
   物品扩充 v2：每品级 × 每部位 ≥30 件
   部位：六兵（剑刀枪锤弓匕）+ 六甲（头/身/手/腰/足/副手）+ 饰品 + 法宝 + 材料 = 15 部位
   6 品级 × 15 部位 × 30 = 2700 件；名字 = 词根池组合 + 品级后缀（凡品素面）
   哨兵幂等；属性沿用 ITEM_GEN 品阶数值表
   ================================================================ */
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const BEGIN = '//<<ITEMS2-BEGIN>>';
const END = '//<<ITEMS2-END>>';
if (src.indexOf(BEGIN) > -1) { console.log('already spliced — skip'); process.exit(0); }

const QUAL = [
  { q: '凡品', lv: 1, atk: 3, def: 2, price: 30 },
  { q: '良品', lv: 4, atk: 7, def: 5, price: 80 },
  { q: '珍品', lv: 8, atk: 13, def: 9, price: 180 },
  { q: '绝品', lv: 13, atk: 21, def: 15, price: 420 },
  { q: '仙品', lv: 19, atk: 32, def: 24, price: 900 },
  { q: '造化品', lv: 26, atk: 47, def: 36, price: 2000 }
];
const PER = 30;

// 词根池：前缀 × 后缀 组合出 30 个名
const PRE = ['青霜', '秋水', '流云', '惊鸿', '洗尘', '断水', '听雨', '孤鸿', '霜天', '赤霄', '问月', '穿云', '碧血', '藏锋', '白虹', '松风', '照夜', '断雁', '平澜', '扫叶', '寒江', '落霞', '飞星', '沉璧', '鸣泉', '饮霜', '裁云', '逐日', '衔烛', '凌霄'];
const MAT_PRE = ['玄铁', '精钢', '寒铁', '乌金', '赤铜', '银纹', '陨铁', '紫金', '蛟筋', '龙鳞', '雪蚕', '冰蚕', '火浣', '天蚕', '星纹'];
const ART_PRE = ['镇岳', '伏魔', '摄魂', '清心', '聚灵', '破障', '御风', '定水', '焚天', '辟尘', '通幽', '照胆', '缚龙', '分光', '涵虚'];
const MAT_KIND = ['灵草', '矿石', '兽产', '灵物'];

// 六兵后缀与攻击系数
const WPN = [['剑', 1.0], ['刀', 1.15], ['枪', 1.05], ['锤', 1.35], ['弓', 0.9], ['匕首', 0.7]];
// 六甲：槽位名 / 防御系数 / 描述词
const ARM = [['头', 0.8, '盔'], ['身', 1.4, '甲'], ['手', 0.7, '护手'], ['腰', 0.6, '束带'], ['足', 0.7, '靴'], ['副手', 1.0, '盾']];

function combo(pres, sufs, n) {
  const out = [];
  for (const p of pres) for (const s of sufs) { out.push(p + s); if (out.length >= n) return out; }
  return out;
}

const items = {};
function add(name, def) { if (!items[name] && !new RegExp("'" + name + "'").test(src.slice(0, src.indexOf('const QUESTS')))) items[name] = def; }

const WDESC = ['君子之兵，攻守平衡。', '大开大合，攻伐锐盛。', '一寸长一寸强，可透重甲。', '势大力沉，一击破甲。', '百步之外先声夺人。', '快准狠，出手取要害。'];
const ADESC = ['护住要害，百邪难侵。', '护住身躯，刀枪不惧。', '护住双手，握兵更稳。', '束紧腰身，气血顺畅。', '踏遍山河，足下生风。', '格挡招架，稳如磐石。'];

QUAL.forEach(function (Q, qi) {
  const suff = qi === 0 ? '' : '·' + Q.q;
  // 六兵
  WPN.forEach(function (w, wi) {
    const cls = w[0], mul = w[1];
    const sufs = [cls, cls === '匕首' ? '刺' : cls === '枪' ? '锋' : '刃'];
    combo(PRE, sufs, PER).forEach(function (nm, i) {
      const full = nm + (qi === 0 ? '' : '·' + Q.q);
      add(full, { type: 'weapon', wclass: cls, atkBonus: Math.round(Q.atk * mul * (1 + (i % 3) * 0.06)), price: Math.round(Q.price * (1 + (i % 5) * 0.12)), quality: Q.q, reqLevel: Q.lv, desc: '【' + cls + '·' + Q.q + '】' + WDESC[wi] });
    });
  });
  // 六甲
  ARM.forEach(function (a, ai) {
    const slot = a[0] === '头' ? 'head' : a[0] === '身' ? 'armor' : a[0] === '手' ? 'hands' : a[0] === '腰' ? 'waist' : a[0] === '足' ? 'feet' : 'offhand';
    const sufs = [a[2], a[0] === '身' ? '衣' : a[2]];
    combo(MAT_PRE, sufs, PER).forEach(function (nm, i) {
      const full = nm + (qi === 0 ? '' : '·' + Q.q);
      add(full, { type: slot === 'offhand' ? 'offhand' : slot, defBonus: Math.round(Q.def * a[1] * (1 + (i % 3) * 0.06)), price: Math.round(Q.price * (1 + (i % 5) * 0.1)), quality: Q.q, reqLevel: Q.lv, desc: '【' + a[0] + '部·' + Q.q + '】' + ADESC[ai] });
    });
  });
  // 饰品
  combo(PRE.slice(0, 15), ['佩', '环', '坠'], PER).forEach(function (nm, i) {
    const full = nm + (qi === 0 ? '' : '·' + Q.q);
    const crit = (i % 3) * (1 + qi), dodge = ((i + 1) % 3) * (1 + qi);
    add(full, { type: 'accessory', critBonus: crit, dodgeBonus: dodge, price: Math.round(Q.price * 1.3), quality: Q.q, reqLevel: Q.lv, desc: '【饰品·' + Q.q + '】' + (crit >= dodge ? '会心 +'+crit+'%' : '闪避 +'+dodge+'%') + '——佩之忘忧。' });
  });
  // 法宝
  combo(ART_PRE, ['镜', '铃', '印', '珠', '幡', '符'], PER).forEach(function (nm, i) {
    const full = nm + (qi === 0 ? '' : '·' + Q.q);
    const mp = 6 + qi * 5 + (i % 3) * 2;
    add(full, { type: 'artifact', mpBonus: mp, price: Math.round(Q.price * 2), quality: Q.q, reqLevel: Q.lv, desc: '【法宝·' + Q.q + '】内力 +' + mp + '——灵光内蕴，温养有灵。' });
  });
  // 材料
  MAT_KIND.forEach(function (kind, ki) {
    const sufs = kind === '灵草' ? ['草', '花', '芝'] : kind === '矿石' ? ['铁', '石', '砂'] : kind === '兽产' ? ['筋', '骨', '皮'] : ['露', '髓', '晶'];
    const pool = kind === '灵草' ? PRE.slice(0, 10) : kind === '矿石' ? MAT_PRE.slice(0, 10) : kind === '兽产' ? PRE.slice(10, 20) : ART_PRE.slice(0, 10);
    combo(pool, sufs, PER).forEach(function (nm, i) {
      const full = nm + (qi === 0 ? '' : '·' + Q.q);
      add(full, { type: 'material', price: Math.round(Q.price * (0.5 + ki * 0.15)), quality: Q.q, desc: '【' + kind + '·' + Q.q + '】炼丹炼器的' + (ki % 2 ? '辅材' : '主材') + '。' });
    });
  });
});

const code = [
  BEGIN,
  '// —— 物品扩充 v2（build_items2.js 生成 · 幂等）：6品级×15部位×30 = 2700 件 ——',
  'const ITEMS_V2=' + JSON.stringify(items) + ';',
  'Object.assign(ITEMS, ITEMS_V2);',
  END
].join('\n');
const anchor = '//<<CHAIN-BEGIN>>';
const ai = src.indexOf(anchor);
if (ai < 0) { console.log('anchor not found'); process.exit(1); }
src = src.slice(0, ai) + code + '\n' + src.slice(ai);
fs.writeFileSync('index.html', src);
console.log('items added: ' + Object.keys(items).length);
