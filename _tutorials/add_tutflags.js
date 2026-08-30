// 引导 flags：practicedOnce(演练)/savedOnce(手动存档)/packOnce(行囊)/giftOnce(赠礼)
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
let n = 0;
// ① 演练
src = src.replace("player.skillExp[skill]=(player.skillExp[skill]||0)+25;", function (m) {
  n++; return m + " game.flags=game.flags||{}; game.flags.practicedOnce=true;";
});
// ② 手动存档（仅「存档」按钮/指令；自动存档走 saveGame 不算）
src = src.replace("registerCmd('save', { label:'存档', desc:'保存游戏进度', fn:function(){ saveGame(); } });", function (m) {
  n++; return "registerCmd('save', { label:'存档', desc:'保存游戏进度', fn:function(){ saveGame(); game.flags=game.flags||{}; game.flags.savedOnce=true; } });";
});
// ③ 行囊
src = src.replace("function openBackpack(){\n  const h=document.createElement('div');", function (m) {
  n++; return "function openBackpack(){\n  game.flags=game.flags||{}; game.flags.packOnce=true; // 新手引导：认过行囊\n  const h=document.createElement('div');";
});
src = src.replace("function openBackpack(){\nconst h=document.createElement('div');", function (m) {
  n++; return "function openBackpack(){\n  game.flags=game.flags||{}; game.flags.packOnce=true; // 新手引导：认过行囊\n  const h=document.createElement('div');";
});
// ④ 赠礼（giveGift 执行处）
src = src.replace(/(function giveGift\([^)]*\)\{)/, function (m) {
  n++; return m + "\n  game.flags=game.flags||{}; game.flags.giftOnce=true; // 新手引导：送过礼";
});
fs.writeFileSync('index.html', src);
console.log('flags patched: ' + n);
