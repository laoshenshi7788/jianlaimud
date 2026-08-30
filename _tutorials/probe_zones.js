const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
// 1) 任务奖励结算代码
L.forEach((l, i) => {
  if (/rw\.gold|reward\.gold|q\.reward\b/.test(l) && i > 7800 && i < 9300) console.log('RW ' + (i + 1) + ': ' + l.trim().slice(0, 130));
});
console.log('---zones---');
['cheng_fudi','cheng_daoxuan','cheng_changcheng','cheng_shahai','cheng_xueshan','cheng_dongsheng','cheng_dukou','cheng_luhua','cheng_huanggong','cheng_luopo','cheng_foguang','cheng_longhu','cheng_tianmu','cheng_yaowang','cheng_shenzhou','cheng_tongye','cheng_lizhu','cheng_yunku','cheng_tiefu','cheng_jingcheng'].forEach(a => {
  const idx = L.findIndex(l => l.indexOf("area:'" + a + "'") > -1);
  const z = idx > -1 ? (L[idx].match(/zone:'([^']*)'/) || [])[1] : '?';
  console.log(a + ' zone=' + z + '  (room: ' + (idx > -1 ? L[idx].trim().slice(0, 30) : '?') + ')');
});
