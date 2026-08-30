const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const out = [];
const i = L.findIndex(l => l.indexOf('function gridNodesEdges') > -1);
if (i > -1) for (let j = i; j < i + 55 && j < L.length; j++) out.push((j + 1) + ': ' + L[j].slice(0, 120));
else out.push('gridNodesEdges not found');
// 还要看 computeGridLayout 尾部的坐标缩放
const k = L.findIndex(l => l.indexOf('function computeGridLayout') > -1);
const tail = [];
for (let j = k + 80; j < k + 150 && j < L.length; j++) tail.push((j + 1) + ': ' + L[j].slice(0, 118));
require('fs').writeFileSync('_tutorials/_gne.txt', out.join('\n') + '\n=== computeGridLayout 尾部 ===\n' + tail.join('\n'));
console.log('ok');
