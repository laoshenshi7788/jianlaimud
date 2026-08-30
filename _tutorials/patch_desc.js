// 修 build_questhub3：①auto-desc 多样开场白 ②FAMOUS 扩池
const fs = require('fs');
let s = fs.readFileSync('_tutorials/build_questhub3.js', 'utf8');
let n = 0;

// ① auto-desc 多样化（按 giver+title 哈希选句式，杜绝同首句）
const oldD0 = "  if (!d.desc) {\n    const t = d.target || {};";
const newD0 = "  if (!d.desc) {\n    const t = d.target || {};\n    let _h = 0; const _key = (d.giver || '') + (d.title || '');\n    for (let _k = 0; _k < _key.length; _k++) _h = (_h * 31 + _key.charCodeAt(_k)) % 997;\n    const KILL_OPEN = ['城外又有{what}伤人', '{what}接连作乱', '夜里的{what}搅得人睡不安稳', '官道上{what}劫了三拨客商', '乡里被{what}闹得鸡犬不宁', '猎户来报：{what}又下了山'];\n    const COLL_OPEN = ['药铺的{what}断了顿', '门中急缺{what}', '坊市上{what}紧俏', '家里就差{what}这一味', '老主顾点名要{what}', '库房的{what}见了底'];\n    const REACH_OPEN = ['有句要紧话得带到', '有桩事须亲自走一趟', '那边的人只认当面', '有一封信要送到', '得去那边看一眼实情'];\n    const TALK_OPEN = ['有桩旧事想向他求证', '想向他讨个主意', '有一句话务必带到', '他的见识值得一问', '有笔旧账要当面问清'];\n    const _fill = (arr) => arr[_h % arr.length].replace(/\{what\}/g, t.what || '凶物');";
if (s.indexOf(oldD0) > -1) { s = s.replace(oldD0, newD0); n++; } else console.log('D0 not matched');

const oldKill = "    else if (t.type === 'kill') d.desc = '除掉' + (t.what || '凶物') + '×' + (t.need || 1) + '——为民除害。';";
const newKill = "    else if (t.type === 'kill') d.desc = _fill(KILL_OPEN) + '——除掉' + (t.what || '凶物') + '×' + (t.need || 1) + '。';";
if (s.indexOf(oldKill) > -1) { s = s.replace(oldKill, newKill); n++; } else console.log('kill not matched');

const oldColl = "    if (t.type === 'collect') d.desc = '替' + (d.giver || '委托人') + '寻来' + (t.what || '所需之物') + '×' + (t.need || 1) + '。';";
const newColl = "    if (t.type === 'collect') d.desc = _fill(COLL_OPEN) + '——寻来' + (t.what || '所需之物') + '×' + (t.need || 1) + '。';";
if (s.indexOf(oldColl) > -1) { s = s.replace(oldColl, newColl); n++; } else console.log('coll not matched');

const oldReach = "    else if (t.type === 'reach') d.desc = '走一趟「' + (t.what || '某地') + '」，替' + (d.giver || '委托人') + '办成一桩事。';";
const newReach = "    else if (t.type === 'reach') d.desc = _fill(REACH_OPEN) + '——去一趟「' + (t.what || '某地') + '」。';";
if (s.indexOf(oldReach) > -1) { s = s.replace(oldReach, newReach); n++; } else console.log('reach not matched');

const oldTalk = "    else if (t.type === 'talk') d.desc = '寻' + (t.what || '一位故人') + '打听一事，回报' + (d.giver || '委托人') + '。';";
const newTalk = "    else if (t.type === 'talk') d.desc = _fill(TALK_OPEN) + '——寻' + (t.what || '一位故人') + '一叙，回报' + (d.giver || '委托人') + '。';";
if (s.indexOf(oldTalk) > -1) { s = s.replace(oldTalk, newTalk); n++; } else console.log('talk not matched');

// ② FAMOUS 扩池（先探实际行）
const fm = s.match(/const FAMOUS = \[[^\]]*\];/);
if (fm) {
  s = s.replace(fm[0], "const FAMOUS = ['宁姚', '陈平安', '刘羡阳', '温轻眉', '崔瀺', '齐静春', '阮邛', '北俱剑隐', '白也', '曹慈', '大骊皇帝', '澄观长老', '巡城武官', '福地游商', '杨老头', '泥瓶拳师', '顾见山', '阎沉舟', '魏晋', '陈清都', '慧明方丈', '张天师', '骊珠货郎', '驯兽老妪'];");
  n++;
} else console.log('FAMOUS line not found');

fs.writeFileSync('_tutorials/build_questhub3.js', s);
console.log('desc-variety patched: ' + n);
