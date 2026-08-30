// 原著核查修正批次：18 汇率链 / 19 筑庐境 / 20 三洲归属 / 17+8 称谓
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let txt = fs.readFileSync(file, 'utf8');
const fixes = [];
function rep(from, to, tag) {
  if (txt.includes(from)) { txt = txt.split(from).join(to); fixes.push(tag); }
  else console.log('!! 未匹配: ' + tag);
}
// 18a 汇率行整体重写
rep('const STONE_RATE=1000; // 剑来原文铁账：1雪花钱=1000两白银；1小暑钱=10雪花钱；1谷雨钱=100雪花钱=100万两',
    'const STONE_RATE=100; // 原著数据点：1雪花钱≈100两白银（三十多张烧煞符，每张约三两）；1小暑钱=1000雪花钱；1谷雨钱=100小暑钱', '18a汇率');
// 18b 夹板
rep('return Math.max(900, Math.min(1200, Math.round(STONE_RATE*wave)));',
    'return Math.max(90, Math.min(120, Math.round(STONE_RATE*wave)));', '18b夹板');
// 18c 财货说明
rep('（神仙钱以灵气定价值：1小暑钱=10雪花钱=1万两；1谷雨钱=100雪花钱=100万两；金精铜钱有价无市——神道以气运铸之，非财可购。行市随世道浮动：妖祸价昂、祥瑞百物贱。）',
    '（神仙钱以灵气定价值——原著铁账：1小暑钱=1000雪花钱，1谷雨钱=100小暑钱；雪花钱行情约百两一枚。行市随世道浮动：妖祸价昂、祥瑞百物贱。）', '18c说明');
// 18d 兑换比例：1小暑钱=1000雪花钱
rep("if((player.xiaoshu||0)<1){ log('（你手头没有小暑钱）','sys'); return; }\n    player.xiaoshu--; player.lingStone=(player.lingStone||0)+9;\n    logItem('（一枚小暑钱在坊市兑得九枚雪花钱——神仙钱层层有差，坊市还要抽一成。）');",
    "if((player.xiaoshu||0)<1){ log('（你手头没有小暑钱）','sys'); return; }\n    player.xiaoshu--; player.lingStone=(player.lingStone||0)+900;\n    logItem('（一枚小暑钱在坊市兑得九百枚雪花钱——原著铁账一比一千，坊市抽一成。）');", '18d兑出');
rep("if((player.lingStone||0)<10){ log('（雪花钱不足十枚）','sys'); return; }\n    player.lingStone-=10; player.xiaoshu=(player.xiaoshu||0)+1;\n    logItem('（十枚雪花钱熔铸换得一枚小暑钱——钱越贵，越像一枚小小的法器。）');",
    "if((player.lingStone||0)<1000){ log('（小暑钱贵重——须一千枚雪花钱方兑一枚）','sys'); return; }\n    player.lingStone-=1000; player.xiaoshu=(player.xiaoshu||0)+1;\n    logItem('（一千枚雪花钱熔铸换得一枚小暑钱——钱越贵，越像一枚小小的法器。）');", '18e兑入');
// 19 铸炉境 → 筑庐境
rep('铸炉境', '筑庐境', '19筑庐');
// 20 三洲归属
rep("'cheng_changcheng': { name:'剑气长城', zhou:'宝瓶洲'", "'cheng_changcheng': { name:'剑气长城', zhou:'蛮荒'", '20a长城');
rep("'cheng_longhu': { name:'龙虎山', zhou:'宝瓶洲'", "'cheng_longhu': { name:'龙虎山', zhou:'中土神洲'", '20b龙虎');
rep("'cheng_foguang': { name:'佛光寺', zhou:'宝瓶洲'", "'cheng_foguang': { name:'佛光寺', zhou:'北俱芦洲'", '20c佛光');
// 17 郑大风头衔
rep("title:'杨家二徒·银甲将'", "title:'杨家二徒·看门人'", '17郑大风');
// 8 齐静春守夜人 → 坐镇圣人
rep('也是这座小镇的守夜人。', '更是坐镇小镇的当代圣人。', '8齐静春');
fs.writeFileSync(file, txt, 'utf8');
console.log('修正完成: ' + fixes.join(' / '));
