const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const fixes = [
  ["profile:'武英殿的老教头", "profile:'讲武堂的老教头"],
  ["talk:'讲武堂吃得是皇粮", "talk:'讲武堂吃得是皇粮"],
  ["talk:'武英殿吃得是皇粮", "talk:'讲武堂吃得是皇粮"]
];
fixes.forEach(([a, b]) => {
  if (f.includes(a)) { f = f.split(a).join(b); console.log('OK: ' + a.slice(0, 24)); }
  else if (a !== b) console.log('跳过（无此串）: ' + a.slice(0, 24));
});
fs.writeFileSync(file, f, 'utf8');
const left = (f.match(/桐叶书院|武英殿/g) || []).length;
console.log('最终残留: ' + left);
