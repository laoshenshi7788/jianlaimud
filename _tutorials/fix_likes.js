// 原著微修：凡人 NPC 的喜好谷雨钱 → 换成市井物件（原著谷雨钱是地仙交易法宝的顶级钱）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
// 把 likes 数组里的 '谷雨钱' 换成 '鸡蛋'（只在 likes:[...] 模式内）
f = f.replace(/likes:\[([^\]]*)'谷雨钱'([^\]]*)\]/g, function(m, a, b){
  return "likes:[" + a + (a.trim().length ? ", " : "") + "'鸡蛋'" + (b.trim().length ? ", " + b.trim().replace(/^,/, '').trim() : "") + "]";
});
fs.writeFileSync(file, f, 'utf8');
console.log('剩余 likes 谷雨钱: ' + (f.match(/likes:\[[^\]]*'谷雨钱'/g) || []).length);
