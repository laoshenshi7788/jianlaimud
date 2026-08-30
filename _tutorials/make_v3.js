const fs = require('fs');
let s = fs.readFileSync('E:/1/mud/2/JianLai mud/_tutorials/gen_music2.js', 'utf8');
// v3：全部宫调（去 minor）、去雨声
s = s.replace(/minor:true/g, 'minor:false');
s = s.replace(/,rainLevel:[0-9.]+/g, '');
// 险地：去掉鼓，只留规整拨弦（drumGain 标记为 0 即无声）
s = s.replace(/drumPat:\[1,0,0,0\.5,0,0,0\.6,0\]/g, 'drumPat:[1,0,0,0.5,0,0,0.6,0],drumGain:0');
s = s.replace(/drumPat:\[1,0,0\.5,0,1,0,0\.6,0\.6\]/g, 'drumPat:[1,0,0.5,0,1,0,0.6,0.6],drumGain:0');
s = s.replace(/drumPat:\[1,0,0,0,0\.6,0,0\.5,0\]/g, 'drumPat:[1,0,0,0,0.6,0,0.5,0],drumGain:0');
s = s.replace(/drumPat:\[1,0,0\.6,0,0,0\.5,0,0\]/g, 'drumPat:[1,0,0.6,0,0,0.5,0,0],drumGain:0');
s = s.replace(/drumPat:\[1,0,0,0\.6,1,0,0\.5,0\]/g, 'drumPat:[1,0,0,0.6,1,0,0.5,0],drumGain:0');
s = s.replace(/drumPat:\[1,0,0,0,1,0,0,0\]/g, 'drumPat:[1,0,0,0,1,0,0,0],drumGain:0');
// 战斗：保鼓但柔化
s = s.replace(/drumPat:\[1,0,0\.6,0\.5,1,0,0\.6,0\]/g, 'drumPat:[1,0,0.6,0.5,1,0,0.6,0],drumGain:0.16');
s = s.replace(/drumPat:\[1,0\.5,0,0\.6,1,0,0\.6,0\.6\]/g, 'drumPat:[1,0.5,0,0.6,1,0,0.6,0.6],drumGain:0.16');
s = s.replace(/drumPat:\[1,0,0,0\.5,0,0\.6,1,0\]/g, 'drumPat:[1,0,0,0.5,0,0.6,1,0],drumGain:0.16');
s = s.replace(/drumPat:\[1,0,0\.6,0,1,0\.5,0,0\]/g, 'drumPat:[1,0,0.6,0,1,0.5,0,0],drumGain:0.16');
s = s.replace(/drumPat:\[1,0\.5,0\.6,0\.5,1,0,0\.6,0\.5\]/g, 'drumPat:[1,0.5,0.6,0.5,1,0,0.6,0.5],drumGain:0.16');
s = s.replace(/drumPat:\[1,0,0\.6,0,1,0,0\.6,0\.5\]/g, 'drumPat:[1,0,0.6,0,1,0,0.6,0.5],drumGain:0.16');
// 鼓音量走 opts.drumGain
s = s.replace(/gain: v >= 1 \? 0\.24 : 0\.13/g, 'gain: (opts.drumGain != null ? opts.drumGain : 0.2) * (v >= 1 ? 1 : 0.55)');
// 输出文件名
s = s.replace("const OUT = path.join(__dirname, '..', 'assets', 'music');", "const OUT = path.join(__dirname, '..', 'assets', 'music');");
fs.writeFileSync('E:/1/mud/2/JianLai mud/_tutorials/gen_music3.js', s, 'utf8');
console.log('v3 written, minor left:', (s.match(/minor:true/g) || []).length, '| rain left:', (s.match(/rainLevel/g) || []).length, '| drumGain:', (s.match(/drumGain/g) || []).length);
