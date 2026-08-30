const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const fixes = [];
function rep(a, b, tag) {
  if (f.includes(a)) { f = f.split(a).join(b); fixes.push(tag); }
  else console.log('!! 未匹配: ' + tag);
}
// 1) 库满即停：产业累积上限=三日产出
rep("    let inc=def.income*(1+0.5*(e.level-1))*(1+boostFor(e.type));\n    e.acc=(e.acc||0)+Math.max(1,Math.round(inc));",
    "    let inc=def.income*(1+0.5*(e.level-1))*(1+boostFor(e.type));\n    inc=Math.max(1,Math.round(inc));\n    const cap=inc*3; // 库满即停：三日产出不收，催你回家\n    e.acc=(e.acc||0)+inc;\n    if(e.acc>cap) e.acc=cap;", '1库满');
// 2) 锻造品质滚动：五成凡品、三成精铸、一成半珍品、半成绝品
rep("      if(Math.random()<chance){\n        addItem(nm);\n        logSuccess('（锤声三响，火星四溅——「'+nm+'」成器！铁砧上寒光凛凛。）');\n        gainCraft('铁匠',2);\n      } else {",
    "      if(Math.random()<chance){\n        gainCraft('铁匠',2);\n        // 品质滚动：技艺越高，好货越多\n        const q=Math.random()*100;\n        const base=ITEMS[nm]||{};\n        let outN=nm, tag='';\n        const mul= q<50?1 : q<80?1.3 : q<95?1.6 : 2;\n        if(mul!==1){ tag= q<80?'精铸': q<95?'珍品':'绝品'; outN=tag+'·'+nm;\n          ITEMS[outN]=Object.assign({}, base, {atkBonus:Math.round((base.atkBonus||0)*mul),defBonus:Math.round((base.defBonus||0)*mul),price:Math.round((base.price||50)*mul),quality:tag,desc:(base.desc||'')+'（'+tag+'出炉）'});\n        }\n        addItem(outN);\n        logSuccess('（锤声三响，火星四溅——「'+outN+'」成器！铁砧上寒光凛凛。）');\n      } else {", '2品质');
// 3) 高阶配方炸炉
rep("        log('（火候差了一线，铁料裂了纹——废了半炉……）','sys');\n        gainCraft('铁匠',1);",
    "        if(rp.lv>=6 && player.gold>=100){ player.gold-=100; log('（火候差了一线，铁料裂了纹——废了半炉，还搭上一百两修炉钱……）','sys'); }\n        else { log('（火候差了一线，铁料裂了纹——废了半炉……）','sys'); }\n        gainCraft('铁匠',1);", '3炸炉');
// 4) 十四境注
rep("（'+realmName()+'——再无可破之境。）", "（'+realmName()+'——再无可破之境。至于传说里的十四境合道，那是另一个故事了。）", '4十四境');
fs.writeFileSync(file, f, 'utf8');
console.log('OK: ' + fixes.join(' / '));
