const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // 兑出：1小暑钱 → 900 雪花钱
  if (l.includes('player.xiaoshu--;') && l.includes('+9;')) {
    lines[i] = l.replace('+9;', '+900;').replace('兑得九枚雪花钱——神仙钱层层有差，坊市还要抽一成', '兑得九百枚雪花钱——原著铁账一比一千，坊市抽一成');
    fixed++;
  }
  // 兑入：10 枚 → 1000 枚雪花钱换 1 小暑钱
  if (l.includes("(player.lingStone||0)<10") && l.includes('小暑钱')) {
    lines[i] = l.replace('(player.lingStone||0)<10', '(player.lingStone||0)<1000').replace(/雪花钱不足十枚/, '小暑钱贵重——须一千枚雪花钱方兑一枚');
    fixed++;
  }
  if (l.includes('player.lingStone-=10; player.xiaoshu=')) {
    lines[i] = l.replace('lingStone-=10;', 'lingStone-=1000;');
    fixed++;
  }
  // 按钮描述里的「10枚雪花钱兑1枚小暑钱」
  if (l.includes("'雪花钱换小暑钱','10枚雪花钱兑1枚小暑钱'")) {
    lines[i] = l.replace("'雪花钱换小暑钱','10枚雪花钱兑1枚小暑钱'", "'雪花钱换小暑钱','1000枚雪花钱兑1枚小暑钱'");
    fixed++;
  }
}
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('兑换比例修正 ' + fixed + ' 处');
