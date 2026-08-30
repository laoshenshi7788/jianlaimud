// 读 MASTER.C 潜能相关行（latin1 读入，行号输出）
const fs = require('fs');
const s = fs.readFileSync('E:/1/mud/2/mhsj-main/mhsj-main/d/WUDANG/NPC/MASTER.C', 'latin1');
const L = s.split(/\r?\n/);
const out = [];
L.forEach((l, i) => {
  if (/potential|improve|query_skill|learn/i.test(l)) out.push((i + 1) + ': ' + l.trim().slice(0, 120));
});
require('fs').writeFileSync('_tutorials/_mhsj_master.txt', out.join('\n'));
console.log('wrote ' + out.length + ' lines');
// faq 里的 潜能/进度 段（GBK 转 utf8 不做，直接 latin1 显示上下文，供辨认结构）
const faq = fs.readFileSync('E:/1/mud/2/mhsj-main/mhsj-main/doc/help/faq', 'latin1');
const lines = faq.split(/\r?\n/);
const hits = [];
lines.forEach((l, i) => { if (/潜能|进度|潜能|经验/.test(l) || /potential|exp/i.test(l)) hits.push(i); });
const seg = [];
const seen = {};
hits.forEach(h => {
  const key = Math.floor(h / 6);
  if (seen[key]) return; seen[key] = 1;
  for (let i = Math.max(0, h - 2); i < Math.min(lines.length, h + 4); i++) seg.push((i + 1) + ': ' + lines[i].slice(0, 100));
  seg.push('---');
});
require('fs').writeFileSync('_tutorials/_mhsj_faq.txt', seg.join('\n'));
console.log('faq seg written');
