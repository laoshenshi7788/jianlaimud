// 补齐六类功法名池的仙品/造化品两行（每类凑满 24 门）
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let txt = fs.readFileSync(file, 'utf8');
const nl = txt.includes('\r\n') ? '\r\n' : '\n';
const ADD = {
  '剑': ["\n    ['剑荡八荒','星河剑气','湛卢出匣','太上忘情剑'],", "\n    ['剑化万象','一笑断江','剑心通明诀','无我无剑'],"],
  '刀': ["\n    ['泰山压顶刀','燃血刀法','九幽裂魂刀','枯荣一刀'],", "\n    ['刀意通神','断念刀','万古长空斩','刀开天地'],"],
  '枪': ["\n    ['北斗七星枪','横断山河','蛟龙三探','九子连环枪'],", "\n    ['枪出如龙','一寸长空','碎星裂阵枪','枪定山河'],"],
  '锤': ["\n    ['碎虚空锤','轰天震地','重锤裂阵','怒狮狂锤'],", "\n    ['一锤万古','山崩锤意','金刚不坏锤','锤震天下'],"],
  '弓': ["\n    ['三矢定乱','落日弓诀','穿石贯云','箭啸九天'],", "\n    ['箭雨流星','百步封喉','满天星斗','弓定乾坤'],"],
  '匕首': ["\n    ['影中杀','绕指柔匕','点穴断脉','无形无声'],", "\n    ['匕心暗合','残月三分','贴身十八翻','匕定生死'],"]
};
let n = 0;
for (const cls in ADD) {
  // 找到该类名池的第三行（绝品行）之后插入两行
  const row3 = ADD[cls] ? null : null;
  const marker = "'" + (txt.match(new RegExp("'([^']+)'\\]\\],\\r?\\n    \\['([^']+)'\\],\\['([^']+)'\\],\\['([^']+)'\\],\\['([^']+)'\\],\\['([^']+)'\\],\\['([^']+)'\\]")) ? '' : '');
}
// 简化：直接按类逐个定位池的最后一行并插入
for (const cls in ADD) {
  const re = new RegExp("('" + ADD[cls][0].trim().slice(5, 12).replace(/'/g, '') + "[^']*)'", '');
  void re;
}
// 逐类在池数组末行后插入
for (const cls in ADD) {
  const startIdx = txt.indexOf("'" + cls + "':[['");
  if (startIdx < 0) { console.log('池未找到: ' + cls); continue; }
  const endIdx = txt.indexOf(']],', startIdx); // 该类池的收尾 "]],"
  if (endIdx < 0) { console.log('池尾未找到: ' + cls); continue; }
  const ins = ADD[cls].join('').replace(/^\n/, '') ;
  txt = txt.slice(0, endIdx) + ',' + nl + '   ' + ins + nl + '  ' + txt.slice(endIdx);
  n++;
}
fs.writeFileSync(file, txt, 'utf8');
console.log('池补齐 ' + n + ' 类');
