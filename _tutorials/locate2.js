const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8').split(/\r?\n/);
f.forEach((l, i) => {
  if (/function (saveGame|loadGame|doSave|saveTo|exportSave|importSave)\(/.test(l)) console.log((i + 1) + '\t' + l.trim().slice(0, 90));
  if (/localStorage\.setItem\('jl_save|localStorage\.setItem\("jl_save|setItem\(/.test(l) && /save|存档/.test(l)) console.log((i + 1) + '\t' + l.trim().slice(0, 90));
});
const s = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
const keys = s.match(/localStorage\.setItem\([^)]+/g) || [];
console.log('--- setItem 调用 ---');
keys.slice(0, 10).forEach(k => console.log(k.slice(0, 100)));
