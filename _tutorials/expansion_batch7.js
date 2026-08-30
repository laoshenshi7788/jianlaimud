// 剑来经济正典显示 + 菜谱/鱼/锻造/炼丹/装备大批量扩充
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const nl = f.includes('\r\n') ? '\r\n' : '\n';
let fixes = [];

// 1) fmtMoney 改为剑来货币显示（内部仍是银两数值，显示时分层）
if (f.includes('function fmtMoney(n){')) {
  // 找到现有 fmtMoney 并替换
  const re = /function fmtMoney\(n\)\{[^}]+\}/;
  const newFmt = `function fmtMoney(n){
  if(n>=10000) return (n/10000).toFixed(1).replace(/\\.0$/,'')+'两黄金';
  if(n>=100) return (n/100).toFixed(1).replace(/\\.0$/,'')+'两白银';
  return Math.round(n)+'文铜钱';
}`;
  f = f.replace(re, newFmt);
  fixes.push('fmtMoney三档显示');
}

// 2) 新菜谱（10道，需对应材料）
const newRecipes = `
  '莲藕排骨汤':{in:{莲藕:1,猪肉:1}, days:2, heal:0.45, lv:1, mods:{hp:20}, desc:'藕香四溢，滋补强身（气血上限+20，两日）。'},
  '清蒸鲈鱼':{in:{小鱼虾:2}, days:1, heal:0.35, lv:0, mods:{}, desc:'鲜嫩清甜，家常好味。'},
  '酱爆河虾':{in:{河虾:2}, days:1, heal:0.3, lv:0, mods:{atkPct:0.02}, desc:'爆炒河虾，微辣鲜香（攻伐+2%，一日）。'},
  '白灼带鱼':{in:{带鱼:1}, days:1, heal:0.25, lv:0, mods:{}, desc:'白灼带鱼，原汁原味。'},
  '金枪刺身':{in:{金枪鱼:1}, days:1, heal:0.4, lv:1, mods:{crit:0.03}, desc:'刀工刺身，会心+3%（一日）。'},
  '灵菌炖鸡':{in:{灵木:1,鸡蛋:2}, days:2, heal:0.5, lv:2, mods:{defPct:0.03}, desc:'灵木香菇炖土鸡，守御+3%（两日）。'},
  '鹿茸酒':{in:{鹿茸:1,陈年女儿红:1}, days:3, mods:{atkPct:0.06,defPct:0.04}, desc:'灵鹿嫩茸泡酒，大补气血（攻伐+6%、减伤+4%，三日）。'},
  '龙涎鱼生':{in:{龙涎鱼:1}, days:3, mods:{atkPct:0.05,crit:0.04}, desc:'深海灵鱼刺身——食之念力涌动（攻伐+5%、会心+4%，三日）。'},
  '火鸦蛋炒饭':{in:{火鸦羽:1,米粮:1}, days:2, heal:0.4, lv:3, mods:{atkPct:0.03,crit:0.02}, desc:'火鸦蛋炒出来的饭，微辣鲜香（攻伐+3%、会心+2%，两日）。'},
  '狐火暖锅':{in:{狐火珠:1,猪肉:2}, days:3, heal:0.7, lv:4, mods:{dr:0.05,atkPct:0.04}, desc:'灵狐之火温着锅底，暖入骨髓（减伤+5%、攻伐+4%，三日）。'}
`;
// 把新菜谱合并到 COOK_RECIPES
const crAnchor = f.indexOf('const COOK_RECIPES={');
if (crAnchor > -1) {
  const crEnd = f.indexOf('};', crAnchor);
  f = f.slice(0, crEnd) + newRecipes + nl + f.slice(crEnd);
  fixes.push('菜谱+10');
}

// 3) 新鱼种（6种新鱼 + 稀有度提升）
const newFish = [
  ['银龙鱼', "ITEMS['银龙鱼']={type:'consumable',effect:'heal',value:80,price:120,quality:'珍品',desc:'珍品·银龙鱼。银鳞如甲，跃出水面的瞬间龙影隐现（恢复80生命）。'};"],
  ['碧眼灵鱼', "ITEMS['碧眼灵鱼']={type:'consumable',effect:'mana',value:100,price:150,quality:'绝品',desc:'绝品·碧眼灵鱼。双目碧翠，食之神清气爽（内力+100）。'};"],
  ['金鳞鲤', "ITEMS['金鳞鲤']={type:'consumable',effect:'heal',value:120,price:180,quality:'绝品',desc:'绝品·金鳞鲤。通体金鳞，鲤跃龙门之兆（恢复120生命）。'};"],
  ['寒潭雪鱼', "ITEMS['寒潭雪鱼']={type:'consumable',effect:'heal',value:100,price:110,quality:'珍品',desc:'珍品·寒潭雪鱼。生于冰下，肉白如雪（恢复100生命）。'};"],
  ['龙王鲟', "ITEMS['龙王鲟']={type:'consumable',effect:'heal',value:300,price:400,quality:'仙品',desc:'仙品·龙王鲟。传说是龙王的后裔——一鱼抵百菜（恢复300生命）。'};"],
  ['碧波仙鲤', "ITEMS['碧波仙鲤']={type:'consumable',effect:'mana',value:200,price:350,quality:'仙品',desc:'仙品·碧波仙鲤。碧波仙子亲手放生的灵鲤，食之内力翻涌（内力+200）。'};"]
];
newFish.forEach(([nm, def]) => {
  if (!f.includes("'" + nm + "':")) { f = f.replace('// —— 家园门户 ——', def + nl + '// —— 家园门户 ——'); fixes.push('鱼:' + nm); }
});

// 4) 新锻造配方（6个）
const newSmith = [
  ['碧水剑', "{in:{寒玉髓:2,龙骨:1}, fee:380, lv:6}"],
  ['碎玉匕', "{in:{寒玉髓:1,金精铜:2}, fee:300, lv:5}"],
  ['碎星锤', "{in:{星纹砂:2,玄铁:2}, fee:520, lv:7}"],
  ['穿云弩', "{in:{蛟筋:1,雷击木:2}, fee:450, lv:6}"],
  ['龙鳞甲':{in:{龙骨:2,玄铁:2}, fee:600, lv:7}],
  ['破魔弓':{in:{蛟筋:2,雷击木:1,妖禽羽:3}, fee:550, lv:7}]
];
const smAnchor = f.indexOf('const SMITH_RECIPES={');
if (smAnchor > -1) {
  const smEnd = f.indexOf('};', smAnchor);
  const addSmith = newSmith.map(([nm, def]) => `  '${nm}':${def},`).join('\n');
  f = f.slice(0, smEnd) + nl + addSmith + f.slice(smEnd);
  fixes.push('锻造+6');
}

// 5) 新炼丹配方（4个）
const newPills = [
  ['归元丹', "{in:{莲藕:2,牛乳:1,草药:2}, fee:120, lv:4}"],
  ['金疮药', "{in:{草药:3,兽皮:1}, fee:45, lv:2}"],
  ['活血丹', "{in:{龙骨:1,鹿茸:1}, fee:320, lv:7}"],
  ['灵犀丹', "{in:{悟道茶叶:1,妖血:1,紫金砂:1}, fee:250, lv:6}"]
];
const alAnchor = f.indexOf('const ALCHEMY_RECIPES={');
if (alAnchor > -1) {
  const alEnd = f.indexOf('};', alAnchor);
  const addAlchemy = newPills.map(([nm, def]) => `  '${nm}':${def},`).join('\n');
  f = f.slice(0, alEnd) + nl + addAlchemy + f.slice(alEnd);
  fixes.push('炼丹+4');
}

// 6) 新物品定义（新鱼/新丹/新锻造产出）
const newItems = [
  "ITEMS['归元丹']={type:'consumable',effect:'mana',value:80,price:70,quality:'良品',desc:'归元固本之丹，内力 +80。'};",
  "ITEMS['金疮药']={type:'consumable',effect:'heal',value:80,price:40,quality:'良品',desc:'金疮即愈的好药（恢复80生命）。'};",
  "ITEMS['活血丹']={type:'consumable',effect:'heal',value:220,price:280,quality:'绝品',desc:'活血化瘀，通经活络——大补之丹（恢复220生命）。'};",
  "ITEMS['灵犀丹']={type:'consumable',effect:'exp',value:200,price:220,quality:'绝品',desc:'灵犀一点通——悟性大增（修为+200）。'};",
  "ITEMS['银龙鱼']={type:'consumable',effect:'heal',value:80,price:120,quality:'珍品',desc:'珍品·银龙鱼。银鳞如甲（恢复80生命）。'};",
  "ITEMS['碧眼灵鱼']={type:'consumable',effect:'mana',value:100,price:150,quality:'绝品',desc:'绝品·碧眼灵鱼。食之神清气爽（内力+100）。'};",
  "ITEMS['金鳞鲤']={type:'consumable',effect:'heal',value:120,price:180,quality:'绝品',desc:'绝品·金鳞鲤。鲤跃龙门之兆（恢复120生命）。'};",
  "ITEMS['寒潭雪鱼']={type:'consumable',effect:'heal',value:100,price:110,quality:'珍品',desc:'珍品·寒潭雪鱼。生于冰下（恢复100生命）。'};",
  "ITEMS['龙王鲟']={type:'consumable',effect:'heal',value:300,price:400,quality:'仙品',desc:'仙品·龙王鲟。龙王后裔（恢复300生命）。'};",
  "ITEMS['碧波仙鲤']={type:'consumable',effect:'mana',value:200,price:350,quality:'仙品',desc:'仙品·碧波仙鲤。碧波仙子放生灵鲤（内力+200）。'};"
];
newItems.forEach(def => {
  const nm = def.match(/ITEMS\[&apos;([^&]+)&apos;\]|ITEMS\['([^']+)'\]/);
  if (nm) { const key = nm[1] || nm[2]; if (!f.includes("ITEMS['" + key + "']")) { f = f.replace('// —— 家园门户 ——', def + nl + '// —— 家园门户 ——'); fixes.push('物品:' + key); } }
});

fs.writeFileSync(file, f, 'utf8');
console.log('OK: ' + fixes.join(' / '));
