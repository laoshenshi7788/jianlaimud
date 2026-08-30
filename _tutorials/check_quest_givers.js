const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const names = ['讲武堂教头', '福地游商', '阮邛', '药王', '顾棂檐', '甄补网'];
for (const n of names) {
  const re = new RegExp("'" + n + "':\\{[^}]*", 's');
  const m = f.match(re);
  if (m) {
    const q = (m[0].match(/quest:[^,}]*/) || ['无'])[0];
    const hasHome = /home:'([^']+)'/.exec(m[0]);
    console.log(n + ' | ' + q + ' | home=' + (hasHome ? hasHome[1] : '无'));
  } else console.log(n + ' | NPCS 中未找到');
}
