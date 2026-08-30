// ============ 宗门身份体系 + 拜师引导 + 宗门介绍优化 ============
const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const nl = f.includes('\r\n') ? '\r\n' : '\n';
let fixes = [];

// 1) joinSect 改为身份制：入门即外门弟子，功法需逐级解锁
const oldJoin = "  player.sect=sect;\n  logSuccess('你拜入 '+sect+'，成为其门下弟子！');\n  s.skills.forEach(sk=>{ if(learnSkill(sk)) logSkill('习得【'+sk+'】！'); });";
const newJoin = "  player.sect=sect;\n  player.sectRank=0; // 外门弟子\n  logSuccess('你拜入 '+sect+'，成为外门弟子！');\n  logInfo('（入门先学门中基本功——想在门中出人头地，还需多做贡献、多立功劳。）');\n  // 外门弟子只传第一门基本功\n  if(s.skills[0] && learnSkill(s.skills[0])) logSkill('入门传功：【'+s.skills[0]+'】！');";
if (f.includes(oldJoin)) { f = f.replace(oldJoin, newJoin); fixes.push('joinSect身份制'); }

// 2) 身份定义 + 升级函数（插在 joinSect 之后）
const rankAnchor = "function openSectSkills(sect){";
const rankBlock = [
  "// —— 宗门身份五级：外门→内门→真传→核心→长老候选（凭贡奉+等级晋升）——",
  "const SECT_RANKS=[",
  "  {name:'外门弟子', favor:0,  lv:0},",
  "  {name:'内门弟子', favor:50, lv:5},",
  "  {name:'真传弟子', favor:150, lv:10},",
  "  {name:'核心弟子', favor:300, lv:15},",
  "  {name:'长老候选', favor:500, lv:20}",
  "];",
  "function sectRankName(){ const r=player.sectRank||0; return SECT_RANKS[r]?SECT_RANKS[r].name:'外门弟子'; }",
  "function canUpgradeRank(){",
  "  const r=player.sectRank||0;",
  "  if(r>=SECT_RANKS.length-1) return false;",
  "  const next=SECT_RANKS[r+1];",
  "  return sectFavorNow()>=next.favor && player.level>=next.lv;",
  "}",
  "function upgradeSectRank(){",
  "  const r=player.sectRank||0;",
  "  if(r>=SECT_RANKS.length-1){ log('（你已是门中顶梁——身份无可再升）','sys'); return; }",
  "  const next=SECT_RANKS[r+1];",
  "  if(sectFavorNow()<next.favor){ log('（贡奉不足 '+next.favor+'——多为宗门效力）','sys'); return; }",
  "  if(player.level<next.lv){ log('（修为至少第 '+next.lv+' 层才够格）','sys'); return; }",
  "  player.sectRank=r+1;",
  "  logTitle('—— 身份晋升：'+sectRankName()+' ——');",
  "  logSuccess('（你在门中的地位提升了！往后门中资源、功法传授，都会更倾斜于你。）');",
  "  updateSidebar(); openSectHall();",
  "}"
].join(nl);
f = f.replace(rankAnchor, rankBlock + nl + rankAnchor);
fixes.push('身份五级+晋升函数');

// 3) openSectHall 增强：显示身份+升级按钮+宗门介绍
const oldHallHead = "  const head=document.createElement('div'); head.style.cssText='text-align:center;margin-bottom:8px;';";
const newHallHead = "  const head=document.createElement('div'); head.style.cssText='text-align:center;margin-bottom:8px;';\n  // 宗门显学+身份\n  const sInfo=document.createElement('div'); sInfo.style.cssText='color:#e8d8a0;font-size:.74em;margin-top:4px;line-height:1.7;';\n  sInfo.innerHTML='<b>'+s.type+'显学</b> · '+sectRankName()+'<br><span style=\"color:#b8b8c0;font-size:.92em;\">'+s.desc+'</span>';\n  head.appendChild(sInfo);";
if (f.includes(oldHallHead)) { f = f.replace(oldHallHead, newHallHead); fixes.push('宗门介绍'); }

// 4) 身份晋升按钮（在 openSectHall 的 置办新宅 之后）
const oldUpg = "  if(m.tier<3) mk('置办新宅','（'+(MANOR_TIERS[m.tier+1].cost)+'两）','primary',function(){ buyManorStep(); ensureHomeRooms(); openHome(); });";
const newUpg = "  if(m.tier<3) mk('置办新宅','（'+(MANOR_TIERS[m.tier+1].cost)+'两）','primary',function(){ buyManorStep(); ensureHomeRooms(); openHome(); });\n  if(player.sect && canUpgradeRank()) mk('晋升身份','凭贡奉'+SECT_RANKS[player.sectRank+1].favor+'与修为晋升至【'+SECT_RANKS[player.sectRank+1].name+'】','gold',function(){ upgradeSectRank(); });";
if (f.includes(oldUpg)) { f = f.replace(oldUpg, newUpg); fixes.push('晋升按钮'); }

// 5) 新手引导：第7步后加引导入宗门
const oldTut7 = "  {hint:function(){ return '（身无立锥之地，终究是浮萍——攒够银两，去「家园」置办一处安身的宅子。）'; }, done:function(){ return (player.manor&&player.manor.tier>=1); }, rw:function(){ return '（有了家，江湖才算有了根。）'; }}\n];";
const newTut7 = "  {hint:function(){ return '（身无立锥之地，终究是浮萍——攒够银两，去「家园」置办一处安身的宅子。）'; }, done:function(){ return (player.manor&&player.manor.tier>=1); }, rw:function(){ return '（有了家，江湖才算有了根。）'; }},\n  {hint:function(){ return '（人在江湖，总要有个门派依托——找到心仪宗门的掌门，当面拜师入派。）'; }, done:function(){ return !!player.sect; }, rw:function(){ return '（有了师门，功法、月例、同门——你的江湖有了自己的旗帜。）'; }},\n  {hint:function(){ return '（在门中多做贡献——贡奉够了可以晋升身份，从外门到内门再到真传。）'; }, done:function(){ return (player.sectRank||0)>=1; }, rw:function(){ return '（身份晋升了——往后门中资源与功法都会更倾斜于你。）'; }}\n];";
if (f.includes(oldTut7)) { f = f.replace(oldTut7, newTut7); fixes.push('引导+宗门'); }

// 6) 宗门功法按身份分层：外门只能学第一门，内门解锁第二门，真传解锁第三门
const oldTeach = "  s.skills.forEach(sk=>{\n    const sd=getSkill(sk);\n    if(hasSkill(sk)) return;\n    if(player.level<sd.reqLevel){ log('（【'+sk+'】需 '+sd.reqLevel+' 级）','sys'); return; }\n    if(learnSkill(sk)){ logSkill('掌门授你【'+sk+'】：'+sd.desc);";
const newTeach = "  s.skills.forEach(function(sk,si){\n    if(si > (player.sectRank||0)) return; // 身份不够，此功法不传\n    const sd=getSkill(sk);\n    if(hasSkill(sk)) return;\n    if(player.level<sd.reqLevel){ log('（【'+sk+'】需 '+sd.reqLevel+' 级）','sys'); return; }\n    if(learnSkill(sk)){ logSkill('掌门授你【'+sk+'】：'+sd.desc);";
if (f.includes("s.skills.forEach(sk=>{\n    const sd=getSkill(sk);\n    if(hasSkill(sk)) return;\n    if(player.level<sd.reqLevel){ log('（【'+sk+'】需 '+sd.reqLevel+' 级）','sys'); return; }\n    if(learnSkill(sk)){ logSkill('掌门授你【'+sk+'】：'+sd.desc);")) {
  f = f.replace("s.skills.forEach(sk=>{\n    const sd=getSkill(sk);\n    if(hasSkill(sk)) return;", newTeach.replace("  s.skills.forEach(function(sk,si){\n    if(si > (player.sectRank||0)) return; // 身份不够，此功法不传\n    const sd=getSkill(sk);\n    if(hasSkill(sk)) return;", "s.skills.forEach(function(sk,si){\n    if(si > (player.sectRank||0)) return;"));
  fixes.push('功法分层');
}

// 7) 藏书阁按身份门控
const oldScr = "    if(sk.reqSect!==player.sect||sk.reqMaster) return;";
const newScr = "    if(sk.reqSect!==player.sect) return;\n    if(sk.grade==='仙品'||sk.grade==='造化品'){ if((player.sectRank||0)<2) return; } // 仙品以上须真传弟子";
if (f.includes(oldScr)) { f = f.replace(oldScr, newScr); fixes.push('藏书阁分层'); }

fs.writeFileSync(file, f, 'utf8');
console.log('OK: ' + fixes.join(' / '));
