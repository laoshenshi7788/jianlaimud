// 查找地图房间格的渲染与点击绑定方式
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
let inRender = false;
lines.forEach((l, i) => {
  if (/data-room|room-cell|askMove\(|\.room\b.*addEventListener|addEventListener\('click'.*askMove/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 140));
  }
});
