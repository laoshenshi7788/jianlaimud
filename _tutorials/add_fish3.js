// 补入三条漏网鱼（直接在 ITEMS_EXPANDED 合并后追加）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const nl = f.includes('\r\n') ? '\r\n' : '\n';
// 找 ITEMS_EXPANDED 合并行，在其后插入
const anchor = 'Object.keys(ITEMS_EXPANDED).forEach(function(k){ if(!ITEMS[k]) ITEMS[k]=ITEMS_EXPANDED[k]; });';
const idx = f.indexOf(anchor);
if (idx < 0) { console.error('锚点未找到'); process.exit(1); }
const add = [
  "ITEMS['寒潭雪鱼']={type:'consumable',effect:'heal',value:100,price:110,quality:'珍品',desc:'珍品·寒潭雪鱼。生于冰下，肉白如雪（恢复100生命）。'};",
  "ITEMS['龙王鲟']={type:'consumable',effect:'heal',value:300,price:400,quality:'仙品',desc:'仙品·龙王鲟。传说是龙王的后裔——一鱼抵百菜（恢复300生命）。'};",
  "ITEMS['碧波仙鲤']={type:'consumable',effect:'mana',value:200,price:350,quality:'仙品',desc:'仙品·碧波仙鲤。碧波仙子亲手放生的灵鲤，食之内力翻涌（内力+200）。'};"
].join(nl);
f = f.slice(0, idx + anchor.length) + nl + add + f.slice(idx + anchor.length);
fs.writeFileSync(file, f, 'utf8');
console.log('OK: 3 条鱼已补入');
