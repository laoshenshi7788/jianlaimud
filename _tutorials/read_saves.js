const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const seg = (a, b, tag) => {
  const out = [];
  for (let i = a - 1; i < b && i < L.length; i++) out.push((i + 1) + ': ' + L[i].slice(0, 130));
  require('fs').writeFileSync('_tutorials/_save_' + tag + '.txt', out.join('\n'));
};
seg(5005, 5020, 'slots');
seg(19780, 19800, 'saveload');
seg(22415, 22545, 'title');
seg(22528, 22560, 'backtitle');
console.log('done');
