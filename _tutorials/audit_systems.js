const f = require('fs').readFileSync('E:/1/mud/2/JianLai mud/index.html', 'utf8');
// REALMS
let i = f.indexOf('const REALMS=');
let d = 0, e = -1;
for (let j = i; j < f.length; j++) { for (const c of f[j]) { if (c==='{') d++; else if (c==='}') d--; } if (d===0 && j>i) { e = j; break; } }
const realms = f.slice(i, e+1);
const names = [...realms.matchAll(/name:'([^']+)'/g)].map(m=>m[1]);
console.log('REALMS:', names.join(' → '));
// 现有牲畜
const lm = f.match(/const LIVESTOCK_DEFS=\{([^}]+)\}/);
if (lm) {
  const animals = [...lm[1].matchAll(/'([^']+)':\{/g)].map(m=>m[1]);
  console.log('现有牲畜:', animals.join(', '));
}
// 现有鱼（从 FISH_SPOTS 里提取）
const fs2 = f.indexOf('const FISH_SPOTS=');
if (fs2 > -1) {
  const fishes = [...f.slice(fs2, fs2+3000).matchAll(/\['([^']+)',\s*\d+\]/g)].map(m=>m[1]);
  console.log('现有鱼:', fishes.join(', '));
}
// 现有菜谱
const ck = f.indexOf('const COOK_RECIPES=');
if (ck > -1) {
  const recipes = [...f.slice(ck, ck+800).matchAll(/'([^']+)':\{/g)].map(m=>m[1]);
  console.log('现有菜谱:', recipes.join(', '));
}
// 现有锻造
const sk = f.indexOf('const SMITH_RECIPES=');
if (sk > -1) {
  const smiths = [...f.slice(sk, sk+800).matchAll(/'([^']+)':\{/g)].map(m=>m[1]);
  console.log('现有锻造:', smiths.join(', '));
}
// 现有炼丹
const ak = f.indexOf('const ALCHEMY_RECIPES=');
if (ak > -1) {
  const pills = [...f.slice(ak, ak+900).matchAll(/'([^']+)':\{/g)].map(m=>m[1]);
  console.log('现有炼丹:', pills.join(', '));
}
