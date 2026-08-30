// 门派名贴正典：桐叶书院→桐叶宗；大骊武英殿→大骊讲武堂；武英殿教头→讲武堂教头
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const pairs = [
  ['桐叶书院', '桐叶宗'],
  ['大骊武英殿', '大骊讲武堂'],
  ['武英殿教头', '讲武堂教头']
];
pairs.forEach(([a, b]) => {
  const n = (f.match(new RegExp(a, 'g')) || []).length;
  if (n) { f = f.split(a).join(b); console.log(a + ' → ' + b + '（' + n + ' 处）'); }
});
fs.writeFileSync(file, f, 'utf8');
console.log('OK');
