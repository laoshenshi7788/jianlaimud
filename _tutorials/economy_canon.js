// 剑来原文经济改造：灵石→雪花钱（1枚=1000两白银）、补小暑钱/谷雨钱/金精铜钱三层神仙钱
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let txt = raw;

// 1) 全局换皮：灵石 → 雪花钱（代码标识符是英文 lingStone，中文替换只动展示文案，安全）
const cnt = (txt.match(/灵石/g) || []).length;
txt = txt.split('灵石').join('雪花钱');
console.log('换皮: 灵石→雪花钱 共 ' + cnt + ' 处');

// 2) 汇率铁账：1 雪花钱 = 1000 两白银（原文：1雪花钱=1000两；1谷雨钱=100雪花钱=100万两）
txt = txt.replace(
  /const STONE_RATE=100; \/\/ 官方平价：一枚雪花钱 ≈ 100 两/,
  'const STONE_RATE=1000; // 剑来原文铁账：1雪花钱=1000两白银；1小暑钱=10雪花钱；1谷雨钱=100雪花钱=100万两'
);
if (!txt.includes('STONE_RATE=1000')) { console.error('汇率替换失败'); process.exit(1); }

// 3) 稀缺度收紧：矿脉产出与逗猫概率下调
txt = txt.replace(/lingChance:0\.10,/, 'lingChance:0.015,');
txt = txt.replace(/if\(Math\.random\(\)<0\.25\)\{ player\.lingStone=\(player\.lingStone\|\|0\)\+1; logSuccess/,
  'if(Math.random()<0.08){ player.lingStone=(player.lingStone||0)+1; logSuccess');

// 4) 新货币字段：开局模板
txt = txt.replace(
  /lingStone:0,      \/\/ 雪花钱（仙家硬通货）/,
  'lingStone:0,      // 雪花钱（神仙钱·流通钱：1枚=1000两白银）\r\n      xiaoshu:0,        // 小暑钱（神仙钱·中阶：1枚=10雪花钱）\r\n      guyu:0,           // 谷雨钱（神仙钱·顶级流通：1枚=100雪花钱）\r\n      jinjing:0,        // 金精铜钱（神道顶流硬通货，有价无市）'
);
if (!txt.includes('jinjing:0')) { console.error('新货币字段插入失败'); process.exit(1); }

// 5) 旧档迁移：在 autoBattle 迁移行旁补三字段
const migAnchor = "if(player.autoBattle===undefined) player.autoBattle=false;";
if (!txt.includes(migAnchor)) { console.error('迁移锚点未找到'); process.exit(1); }
txt = txt.replace(migAnchor, migAnchor + "\n  if(player.xiaoshu===undefined) player.xiaoshu=0;\n  if(player.guyu===undefined) player.guyu=0;\n  if(player.jinjing===undefined) player.jinjing=0;");

// 6) 成就「妖祸尽扫」：奖励中阶神仙钱与金精铜钱（BOSS 专属掉落，替代无来由的灵石）
txt = txt.replace(
  /check:function\(\)\{ const pk=player\.kills; return \(pk\['搬山猿'\]\|\|0\)\+\(pk\['萧初升'\]\|\|0\)\+\(pk\['托月山大祖'\]\|\|0\)>=3 && \(\(pk\['应龙'\]\|\|0\)\+\(pk\['凤凰'\]\|\|0\)\+\(pk\['麒麟'\]\|\|0\)\+\(pk\['朱雀'\]\|\|0\)\+\(pk\['青龙'\]\|\|0\)\+\(pk\['玄武'\]\|\|0\)\+\(pk\['白虎'\]\|\|0\)>=2\); \}, fn:function\(\)\{ game\.fame\+=30; player\.exp\+=300; \}\}/,
  "check:function(){ const pk=player.kills; return (pk['搬山猿']||0)+(pk['萧初升']||0)+(pk['托月山大祖']||0)>=3 && ((pk['应龙']||0)+(pk['凤凰']||0)+(pk['麒麟']||0)+(pk['朱雀']||0)+(pk['青龙']||0)+(pk['玄武']||0)+(pk['白虎']||0)>=2); }, fn:function(){ game.fame+=30; player.exp+=300; player.xiaoshu=(player.xiaoshu||0)+2; player.jinjing=(player.jinjing||0)+1; logItem('（斩妖功成——各洲神道送来谢礼：小暑钱二枚、金精铜钱一枚。）'); }}"
);
if (!txt.includes('小暑钱二枚')) console.log('提示: 成就奖励钩子未匹配（可后补）');

fs.writeFileSync(file, txt, 'utf8');
console.log('OK: 经济贴原文改造完成（雪花钱/小暑钱/谷雨钱/金精铜钱）');
