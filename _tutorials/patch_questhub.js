// 给 build_questhub3.js 打"换皮修复"补丁：扩谈人池 + 文戏变体池 + desc 风味
const fs = require('fs');
let s = fs.readFileSync('_tutorials/build_questhub3.js', 'utf8');
let n = 0;
// 1) 扩 FAMOUS
const oldF = "const FAMOUS = ['宁姚', '陈平安', '刘羡阳', '温轻眉', '崔瀺', '齐静春', '阮邛', '北俱剑隐', '白也', '曹慈', '大骊皇帝', '澄观长老', '巡城武官', '福地游商'];";
const newF = "const FAMOUS = ['宁姚', '陈平安', '刘羡阳', '温轻眉', '崔瀺', '齐静春', '阮邛', '北俱剑隐', '白也', '曹慈', '大骊皇帝', '澄观长老', '巡城武官', '福地游商', '杨老头', '泥瓶拳师', '顾见山', '阎沉舟', '魏晋', '陈清都', '慧明方丈', '张天师', '骊珠货郎', '驯兽老妪'];";
if (s.indexOf(oldF) > -1) { s = s.replace(oldF, newF); n++; } else console.log('FAMOUS not matched');

// 2) A/T → 变体池 + 下标
const oldAT = "function A(g, h, t) { return ['（' + g + '拉你到檐下，压低声音）' + h, '（他望着你：' + t + '——这事，非你不可。）']; }\nfunction T(g, pay, lore) { return ['（' + g + '将你上下打量一番，重重一点头）' + pay, '（临走，他忽然补了一句）' + lore]; }";
const newAT = [
  "const HOOK_A=[function(g,h,t){return '（'+g+'拉你到檐下，压低声音）'+h;},function(g,h,t){return '（'+g+'把茶碗往前一推，正色道）'+h;},function(g,h,t){return '（'+g+'抬头看你一眼，语气沉了沉）'+h;},function(g,h,t){return '（'+g+'朝你拱了拱手，叹了口气）'+h;}];",
  "const HOOK_B=[function(g,h,t){return '（他望着你）'+t+'——这事，非你不可。';},function(g,h,t){return '（他叮嘱道）'+t+'。路上仔细些。';},function(g,h,t){return '（他压着声音补了句）'+t+'——事成之后，亏待不了你。';},function(g,h,t){return '（他说得干脆）'+t+'。就这一桩，交给你了。';}];",
  "const TURN_A=[function(g,p){return '（'+g+'将你上下打量一番，重重一点头）'+p;},function(g,p){return '（'+g+'听完，绷着的肩松了下来）'+p;},function(g,p){return '（'+g+'接过东西，眼神一热）'+p;},function(g,p){return '（'+g+'来回走了两步，这才点头）'+p;}];",
  "const TURN_B=[function(g,l){return '（临走，他忽然补了一句）'+l;},function(g,l){return '（末了，他像是想起什么，说道）'+l;},function(g,l){return '（他目送你，低声说）'+l;},function(g,l){return '（话到嘴边，他顿了一下，还是说了）'+l;}];",
  "const DESC_FLAVOR=['——街坊们都盼着这一遭。','——这事拖不得。','——办成了，你在这一带就立住了。','——路不远，但得走稳。','——动静别闹太大。','——天亮前回来。','——当心野物。','——有劳了。','——记你一功。','——茶给你留着，回来再续。'];",
  "function A(g,h,t,i){const a=HOOK_A[i%HOOK_A.length],b=HOOK_B[i%HOOK_B.length];return [a(g,h,t),b(g,h,t)];}",
  "function T(g,p,l,i){const a=TURN_A[i%TURN_A.length],b=TURN_B[i%TURN_B.length];return [a(g,p),b(g,l)];}"
].join('\n');
if (s.indexOf(oldAT) > -1) { s = s.replace(oldAT, newAT); n++; } else console.log('A/T not matched');

// 3) quest() 里 desc 自动加风味 + 支线/宗门/日常/限时的 A/T 调用传下标
// 支线 4 条、宗门 5 条、日常 4 条、限时 18 条调用 A/T——统一改为 A(...,qi) / T(...,qi)
// 简单策略：把 builder 内所有 "A(g(0)," / "A(sg(0)," 等改为传 index；但调用形态多样。
// 更稳：把 A/T 的第三、四参可选用——函数签名已有 i，调用不带 i 时 i=undefined→0%4=0 退化为原样。
// 因此在调用点传 i：支线用 ci，宗门 si，日常 ci，限时 i。逐处替换。

// 支线（questhub 支线 forEach 变量 ci）
s = s.replace(/acceptLines: A\(g\(0\), /g, 'acceptLines: A(g(0), '); // 占位不实际改动
// 直接在 A/T 函数内部用调用栈外的确定性随机？不行。改为：A/T 当 i 未提供时按 giver 哈希取变体——
const oldA2 = "function A(g,h,t,i){const a=HOOK_A[i%HOOK_A.length],b=HOOK_B[i%HOOK_B.length];return [a(g,h,t),b(g,h,t)];}";
const newA2 = "function A(g,h,t,i){if(i==null){let z=0;for(let k=0;k<g.length;k++)z=(z+g.charCodeAt(k)*31)%4;i=z;}const a=HOOK_A[i%HOOK_A.length],b=HOOK_B[i%HOOK_B.length];return [a(g,h,t),b(g,h,t)];}";
s = s.replace(oldA2, newA2);
const oldT2 = "function T(g,p,l,i){const a=TURN_A[i%TURN_A.length],b=TURN_B[i%TURN_B.length];return [a(g,p),b(g,l)];}";
const newT2 = "function T(g,p,l,i){if(i==null){let z=0;for(let k=0;k<g.length;k++)z=(z+g.charCodeAt(k)*17)%4;i=z;}const a=TURN_A[i%TURN_A.length],b=TURN_B[i%TURN_B.length];return [a(g,p),b(g,l)];}";
s = s.replace(oldT2, newT2);

// 4) desc 风味：quest() 自动追加
const oldD = "  if (!d.desc) {";
const newD = "  if (d.desc && !d._flavored && d.cat && d.cat!=='主线' && d.cat!=='限时') { d.desc += DESC_FLAVOR[Math.abs((d.title||'').length + (d.giver||'').length) % DESC_FLAVOR.length]; d._flavored=true; }\n  if (!d.desc) {";
if (s.indexOf(oldD) > -1) { s = s.replace(oldD, newD); n++; }

fs.writeFileSync('_tutorials/build_questhub3.js', s);
console.log('patched: ' + n);
