const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const fixes = [
  ["home:'大骊衙门', canKill:false, special:true, teach:['破军一刀'", "home:'大骊讲武堂', canKill:false, special:true, teach:['破军一刀'"],
  ["与武英殿同门过招", "与讲武堂同门过招"],
  ["desc:'武英殿正堂，悬大骊军旗。", "desc:'讲武堂正堂，悬大骊军旗。"]
];
fixes.forEach(([a, b]) => {
  if (f.includes(a)) { f = f.split(a).join(b); console.log('OK: ' + a.slice(0, 30)); }
  else console.log('!! 未匹配: ' + a.slice(0, 40));
});
fs.writeFileSync(file, f, 'utf8');
