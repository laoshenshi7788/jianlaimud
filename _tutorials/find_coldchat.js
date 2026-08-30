const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/不想与你|懒得|懒得理|没工夫|别烦|走开|无可奉告|冷冷|不耐烦|爱答|低好感|冷谈/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 130));
  }
});
