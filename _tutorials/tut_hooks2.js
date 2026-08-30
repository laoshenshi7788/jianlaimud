const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
const raw = fs.readFileSync(file, 'utf8');
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
let lines = raw.split(/\r?\n/);
const targets = [
  ['function sizeUpRoom(rn){', 'look'],
  ['function talkTo(npcName){', 'talk'],
  ['function startFight(name){', 'fight'],
  ['function breathe(){', 'cult']
];
let n = 0;
for (const [head, flag] of targets) {
  const i = lines.findIndex(l => l.trim() === head);
  if (i < 0) { console.log('!! 未找到: ' + head); continue; }
  if (lines[i + 1].includes('tutFlags.' + flag)) { continue; }
  lines.splice(i + 1, 0, '  if(game.tutFlags) game.tutFlags.' + flag + '=1;');
  n++;
}
fs.writeFileSync(file, lines.join(nl), 'utf8');
console.log('按行插入钩子 ' + n + ' 处');
