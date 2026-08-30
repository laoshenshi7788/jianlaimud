// 探查出生点数据与开局流程
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const pats = [
  [/出生地|BIRTH|birthplace|出身/, 'BIRTH'],
  [/泥瓶巷/, 'NIPING'],
  [/青莲洞天/, 'QINGLIAN'],
  [/startGame|newGame|createChar|开局|开始游戏/, 'START'],
  [/visited\s*[=:]|visited\.push/, 'VISITED'],
];
const hits = {};
lines.forEach((l, i) => {
  pats.forEach(([re, tag]) => {
    if (re.test(l)) { (hits[tag] = hits[tag] || []).push(i + 1); }
  });
});
Object.keys(hits).forEach(k => {
  const v = hits[k];
  console.log(k + '  ' + v.length + ' hits: ' + v.slice(0, 14).join(',') + (v.length > 14 ? ' ...' : ''));
});
