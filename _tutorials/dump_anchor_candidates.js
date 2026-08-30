const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
const rooms = {};
const re = /^\s*'([^']+)'\s*:\s*\{\s*area\s*:\s*'([^']+)',\s*zone\s*:\s*'([^']*)'(.*)$/;
src.split(/\r?\n/).forEach(l => {
  const m = l.match(re);
  if (!m) return;
  (rooms[m[2]] = rooms[m[2]] || []).push(m[1]);
});
['cheng_dongsheng','cheng_daoxuan','cheng_xueshan','cheng_fudi','cheng_changcheng','cheng_huanggong','cheng_shuyuan','cheng_shenzhou','cheng_yaowang','cheng_tianmu','cheng_tongye','cheng_foguang','cheng_dukou','cheng_luhua','cheng_manlin'].forEach(a => {
  console.log('### ' + a + ' (' + (rooms[a] || []).length + ')');
  console.log((rooms[a] || []).filter(n => !/·(柜台|库房|后院|后厨|客房|大堂|后堂|酒窖|讲堂|斋舍|正堂|偏殿|香火房|堂屋|灶房|内室|诊堂|药房|镖厅|账房|马厩|练武场|兵器房|仓库|工坊|炉房|客房|牢房|刑房|狱卒房|擂台|兵器架|沙场|马棚|草料房|拴马桩|乐厅|排练房|妆房|磅房|守夜间|明伦堂|学舍|藏书楼|御药房|诊厅|佛堂|书房|奏章房)/.test(n)).join('  '));
});
