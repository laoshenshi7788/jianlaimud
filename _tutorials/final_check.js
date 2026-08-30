const fs = require('fs');
const html = fs.readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const js = m[1];
const checks = [
  ['DRAMA 文圣场景', /'文圣':\{\s*\r?\n\s*'dadao'/.test(js)],
  ['DRAMA 在事件数组之前', js.indexOf("'文圣':{") < js.indexOf('const EVENT_TEMPLATES')],
  ['天气 WEATHERS', js.includes('const WEATHERS={')],
  ['curWeather', js.includes('function curWeather()')],
  ['addBuff', js.includes('function addBuff(')],
  ['buffMods 接入攻击公式', /buffMods\(\)\.atkPct/.test(js)],
  ['战斗记录 recordEnemy', js.includes('function recordEnemy(')],
  ['图鉴显示战绩', js.includes('enemyRecordText(nm)')],
  ['任务委托人位置', js.includes('function questGiverLoc(')],
  ['敌人软缩放', js.includes('世道与修为相称')],
  ['就地行事', js.includes('function openPlaceActions(')],
  ['5 幕新文戏齐全', ['曹慈', '陆沉', '裴杯', '姜尚真'].every(n => js.includes("  '" + n + "':{\r\n    '"))]
];
let fail = 0;
for (const [k, ok] of checks) { if (!ok) { console.log('FAIL', k); fail++; } }
console.log(fail === 0 ? 'ALL_CHECKS_PASS(' + checks.length + ')' : 'FAILURES: ' + fail);
