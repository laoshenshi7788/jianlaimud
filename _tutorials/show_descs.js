const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const out = [];
['scheng_lizhu_3', 'scheng_luopo_3', 'scheng_foguang_3', 'scheng_dukou_3', 'dcheng_lizhu_3'].forEach(id => {
  const i = s.indexOf("'" + id + "':Object.assign");
  if (i < 0) { out.push(id + ': (not found)'); return; }
  const seg = s.slice(i, i + 800);
  const d = seg.match(/"desc":"([^"]*)"/);
  out.push(id + ': ' + (d ? d[1].slice(0, 70) : '(no desc)'));
});
fs.writeFileSync('_tutorials/_descs.txt', out.join('\n'));
console.log('ok');
