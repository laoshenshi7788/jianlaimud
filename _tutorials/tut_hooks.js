const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
let n = 0;
function hook(fnHead, flag) {
  const re = new RegExp('(' + fnHead + '\\)(\\r?\\n)?\\s*\\{)');
  if (f.includes('game.tutFlags.' + flag + '=1;')) return; // 已有
  if (re.test(f)) {
    f = f.replace(re, '$1\n  if(game.tutFlags) game.tutFlags.' + flag + '=1;');
    n++;
  } else console.log('!! 未匹配函数头: ' + fnHead);
}
hook('function sizeUpRoom\\(rn\\)', 'look');
hook('function talkTo\\(npcName\\)', 'talk');
hook('function startFight\\(name\\)', 'fight');
hook('function breathe\\(\\)', 'cult');
// walkPath 成功抵达（踏上目的地）
const wpAnchor = "logSuccess('（你已踏上「'+dest+'」。）');";
if (f.includes(wpAnchor)) {
  f = f.replace(wpAnchor, "game.tutFlags&&(game.tutFlags.travel=1);\n      " + wpAnchor);
  n++;
}
fs.writeFileSync(file, f, 'utf8');
console.log('引导钩子 ' + n + ' 处已加');
