/*
 * JL2 新手引导（guides2.js）
 * 8 个出身地 × 17 个真实出身（id / spot / intro 抄自 index.html 的 BACKGROUNDS）
 * 12 步骨架见方案 §9.2；差异点见 §9.3；stage 复用 §4.3 的 14 种类型判定思路。
 * 铁律：新全局一律 jl2_ 前缀（JL2_GUIDES 为契约指定的数据全局）；
 *       不 import/export/require，不重定义现有全局，出错写 window.__bootErrs。
 */

/* ── 数据：8 地模板 + 17 出身种子 ───────────────────────── */
var JL2_GUIDES = (function(){
  'use strict';

  var SPOT = {
    mud:      { name:'泥瓶巷',   room:'泥瓶巷',   mat:'止血草', gear:'麻布衣', enemy:'巷口泼皮', gift:'干粮' },
    jing:     { name:'大骊京城', room:'大骊京城', mat:'旧箭簇', gear:'腰牌',   enemy:'校场恶仆', gift:'伤药' },
    longhu:   { name:'龙虎山',   room:'龙虎山',   mat:'黄精',   gear:'桃木剑', enemy:'山门野猿', gift:'符纸' },
    qinglian: { name:'青莲洞天', room:'青莲洞天', mat:'莲子',   gear:'素衣',   enemy:'荷塘水鬼', gift:'莲蓬' },
    snow:     { name:'北俱雪山', room:'北俱雪山', mat:'狼毫',   gear:'皮裘',   enemy:'雪原妖狼', gift:'干肉' },
    desert:   { name:'蛮荒沙海', room:'蛮荒沙海', mat:'沙枣',   gear:'短刀',   enemy:'沙盗',     gift:'水囊' },
    lotus:    { name:'藕花福地', room:'藕花福地', mat:'莲藕',   gear:'蓑衣',   enemy:'湖匪',     gift:'鱼干' },
    inn:      { name:'云来客栈', room:'云来客栈', mat:'碎银',   gear:'短棍',   enemy:'醉汉',     gift:'劣酒' }
  };

  // id / spot / name / intro 均与 BACKGROUNDS 对齐；首 NPC、首个任务、首个奖励、哇时刻按出身各写差异。
  var SEEDS = [
    { id:'pauper', spot:'mud', name:'泥瓶巷贫户', home:'泥瓶巷',
      npc:'杨老头', quest:'药铺的三味药', reward:'金疮药 ×2 + 麻布衣', wow:'巷口死人手里的半张药方',
      intro:'（你生在泥瓶巷最破的那间屋里。爹娘早出晚归，日子清得像井水——可泥里长出来的孩子，腿脚最扎实。）' },
    { id:'orphan', spot:'mud', name:'孤儿乞儿', home:'泥瓶巷',
      npc:'泥瓶拳师', quest:'城隍庙的失物', reward:'金疮药 ×2 + 破旧短褂', wow:'城隍庙神像底座压着的半张药方',
      intro:'（你在城隍庙的稻草堆里长大。冬天最难熬，春天最饿——可活下来的乞儿，比谁都懂“命硬”二字。）' },
    { id:'merchant', spot:'mud', name:'商贾之家', home:'泥瓶巷',
      npc:'店小二', quest:'绸缎摊的账目', reward:'金疮药 ×1 + 算盘袋', wow:'账本夹层里翻出的半张药方',
      intro:'（你爹在骊珠洞天支了个绸缎摊。一杆秤、两把算盘，教出你一身察言观色的本事——银钱是俗，俗人能活。）' },

    { id:'general', spot:'jing', name:'将门之后', home:'大骊京城',
      npc:'巡城武官', quest:'校场点卯', reward:'旧枪 + 腰牌', wow:'校场上一枪挑落教头头盔',
      intro:'（你祖上替大骊守过边关。祠堂影壁上刻着家训：男儿当提三尺剑——你打小就摸那柄旧枪。）' },
    { id:'scholar', spot:'jing', name:'书香门第', home:'大骊京城',
      npc:'书院先生', quest:'贡院抄书', reward:'旧书 + 腰牌', wow:'策论末尾那行墨迹未干的剑意',
      intro:'（你家里书比米多。启蒙先生说你“读书读出剑气来”——文人的骨，也要见血才硬。）' },

    { id:'daotong', spot:'longhu', name:'道门童子', home:'龙虎山',
      npc:'张天师', quest:'山门洒扫', reward:'符纸 ×5 + 桃木剑', wow:'第一次画符，符纸自燃',
      intro:'（你在龙虎山的道观里长大。师父教你画符、辨药、打坐——山上的一草一木，都认得你。）' },
    { id:'herbalist', spot:'longhu', name:'采药童子', home:'龙虎山',
      npc:'药王', quest:'崖缝采芝', reward:'符纸 ×3 + 药篓', wow:'崖缝灵芝下压着一张自燃符纸',
      intro:'（你打小跟着采药人满山跑。哪座崖缝里有灵芝，哪片谷底长着雪莲，你比谁都清楚。）' },

    { id:'daoist', spot:'qinglian', name:'隐世道脉', home:'青莲洞天',
      npc:'阮秀', quest:'荷塘采莲', reward:'莲种 + 素衣', wow:'莲池底下浮起一具古棺',
      intro:'（你一出生便跟着师父住在山里。晨钟暮鼓，青灯黄卷——山下的事，你知道得不多，山上的灵气，你沾得不少。）' },
    { id:'lianpu', spot:'qinglian', name:'莲池旧仆', home:'青莲洞天',
      npc:'阮秀', quest:'莲舟拾遗', reward:'莲种 + 藕荷裙', wow:'荷舟底翻出一具古棺的残片',
      intro:'（你在这片莲池边长大，替主人家看管莲塘、收拾荷舟。红衣姑娘偶尔会跟你说话，一开口，就是千年。）' },

    { id:'hunter', spot:'snow', name:'猎户之子', home:'北俱雪山',
      npc:'老猎户', quest:'雪原寻踪', reward:'猎弓 + 皮裘', wow:'雪崩里救出一匹幼狼（可养成坐骑）',
      intro:'（你爹是北俱雪山下的老猎户。你学会走路的第二年，就学会了拉弓——雪原上的野兽，见你都得绕着走。）' },
    { id:'snow_orphan', spot:'snow', name:'雪山孤儿', home:'北俱雪山',
      npc:'剑灵老妪', quest:'雪原寻剑', reward:'猎弓 + 旧剑鞘', wow:'雪里刨出半截剑，剑鞘仍在震',
      intro:'（那场大雪掩了你家。是北俱剑宫的人把你从雪里刨出来的——自此，你便与这片雪山结下了不解之缘。）' },

    { id:'caravan', spot:'desert', name:'商队小子', home:'蛮荒沙海',
      npc:'商队首领', quest:'护商队过沙口', reward:'水囊 + 短刀', wow:'沙暴里看见半埋的古城',
      intro:'（你跟着商队打小跑沙海。盐、铁、药材、刀剑——什么好卖你门儿清，什么道儿好走你更门儿清。）' },
    { id:'desert_orphan', spot:'desert', name:'沙海遗孤', home:'蛮荒沙海',
      npc:'福地游商', quest:'沙口寻水', reward:'水囊 + 缺刃短刀', wow:'沙暴尽头，古城门为你开了一线',
      intro:'（你爹娘死在了一场沙暴里。商队的人把你捎到了绿洲——自此，你一个人，一把刀，在沙海里挣命。）' },

    { id:'lotus_farmer', spot:'lotus', name:'藕农之子', home:'藕花福地',
      npc:'赊月', quest:'夜捞月影', reward:'渔网 + 蓑衣', wow:'水面下的月亮是另一个世界',
      intro:'（你家在藕花福地种藕为生。春种夏收，秋藕冬藏——日子清苦，可泥水里的日子，最养人。）' },
    { id:'fisher', spot:'lotus', name:'渔家儿女', home:'藕花福地',
      npc:'渔家翁', quest:'晨网试水', reward:'渔网 + 斗笠', wow:'起网时，捞到一轮碎在水里的月亮',
      intro:'（你爹摇橹，你娘补网，你在船头看了一辈子水鸟。渔家的孩子，天生会看风向、听水声。）' },

    { id:'wanderer', spot:'inn', name:'江湖浪子', home:'云来客栈',
      npc:'老掌柜', quest:'客栈打烊', reward:'铜钱串 + 短棍', wow:'深夜客人留下的一柄断剑',
      intro:'（你记不得家在哪儿，只记得风往哪边吹。今天歇这家屋檐，明天睡那座破庙——江湖，就是你的家。）' },
    { id:'waiter', spot:'inn', name:'跑堂小二', home:'云来客栈',
      npc:'店小二', quest:'客栈打烊', reward:'铜钱串 + 榆木棍', wow:'柜台暗格里那柄断剑还在嗡鸣',
      intro:'（你打小在云来客栈跑堂。南来北往的人都在你面前卸下行囊——他们说过的闲话，够你说三年。）' }
  ];

  function affOne(name, value){
    var a = {}; a[name] = value; return a;
  }

  // 通用 12 步骨架（§9.2），以出身差异点填充每项的目标 / 操作提示 / 奖励 / 完成反馈。
  function buildSteps(o, sp){
    return [
      { id:'g1', goal:'看一眼四周', hint:'点「观察」，先认清脚下的'+sp.name,
        stage:{type:'look'}, reward:{exp:5},
        done:'你记住了'+sp.name+'的模样。' },
      { id:'g2', goal:'走到隔壁房间', hint:'点地图上的相邻房间，迈出第一步',
        stage:{type:'reach', any:true}, reward:{exp:5},
        done:'脚步一动，世界便宽了一寸。' },
      { id:'g3', goal:'和'+o.npc+'说句话', hint:'找到'+o.npc+'，点「交谈」',
        stage:{type:'talk', npc:o.npc, any:true}, reward:{exp:10},
        done:o.npc+'记住了你的名字。' },
      { id:'g4', goal:'接下第一桩活：'+o.quest, hint:'在告示板或'+o.npc+'处接「'+o.quest+'」',
        stage:{type:'quest', id:o.quest, action:'accept'}, reward:{gold:20},
        done:'你把「'+o.quest+'」记进了任务册。' },
      { id:'g5', goal:'打一场', hint:'寻一只妖兽或恶人动手（也可下毒、引兽相斗、买通绕行）',
        stage:{type:'kill', enemy:sp.enemy, need:1, alt:'poison|lure|bribe|detour'}, reward:{exp:30},
        done:'刀剑出鞘，你才算真正入了江湖。' },
      { id:'g6', goal:'捡一样东西', hint:'战斗后「拾取」，或去商铺买一件',
        stage:{type:'collect', item:sp.mat, need:1, any:true}, reward:{items:[{name:sp.mat, n:2}]},
        done:'背包里第一次有了自己的东西。' },
      { id:'g7', goal:'穿上它', hint:'打开「背包」，点「装备」',
        stage:{type:'equip', slot:'any', any:true}, reward:{exp:20},
        done:'身上有了一件像样的行头。' },
      { id:'g8', goal:'交掉「'+o.quest+'」', hint:'回到交付人那里，点「交付」',
        stage:{type:'quest', id:o.quest, action:'turnin'}, reward:{items:[{name:sp.gear, n:1}]},
        done:'任务成了——'+o.wow+'。', wow:o.wow },
      { id:'g9', goal:'加一点属性', hint:'打开「修炼」面板，往根骨上投一点潜力',
        stage:{type:'choice', id:'jl2_attr', any:true}, reward:{potential:10},
        done:'你摸到了成长的门道。' },
      { id:'g10', goal:'送一份礼给'+o.npc, hint:'背包里点「赠送」，选'+o.npc,
        stage:{type:'gift', npc:o.npc, item:sp.gift, any:true}, reward:{aff:affOne(o.npc, 6)},
        done:o.npc+'对你多了几分亲近。' },
      { id:'g11', goal:'买一样或卖一样', hint:'去商铺「买」或「卖」一次',
        stage:{type:'use', name:'交易', any:true}, reward:{gold:30},
        done:'你学会了银钱怎么流转。' },
      { id:'g12', goal:'睡一觉，明日再说', hint:'在客栈或住处点「休息」',
        stage:{type:'rest'}, reward:{exp:50},
        done:'第一日过去，江湖在窗外等你。', end:true }
    ];
  }

  var out = {};
  for(var i=0; i<SEEDS.length; i++){
    var s = SEEDS[i], sp = SPOT[s.spot];
    out[s.id] = {
      id:s.id, spot:s.spot, name:s.name, home:s.home,
      firstNpc:s.npc, firstQuest:s.quest, firstReward:s.reward, wow:s.wow,
      monologue:s.intro, intro:s.intro,
      steps:buildSteps(s, sp)
    };
  }
  return out;
})();

/* ── 内部工具（一律 jl2_ 前缀）───────────────────────── */
function jl2_guideErr(msg){
  try{ window.__bootErrs.push('guides2: '+(msg||'?')); }catch(e){}
}
function jl2_guideLog(text, cls){
  try{
    if(typeof log === 'function'){ log(text, cls||'sys'); return; }
  }catch(e){}
  try{
    var box = document.getElementById('log');
    if(box){ var d = document.createElement('div'); d.textContent = text; box.appendChild(d); }
  }catch(e){ jl2_guideErr('log fallback: '+e.message); }
}
function jl2_guideState(selfHeal){
  try{
    if(!game) return null;
    if(!game.guide || typeof game.guide !== 'object') game.guide = {};
    var g = game.guide;
    if(g.step == null || typeof g.step !== 'number') g.step = 0;
    if(!g.prog) g.prog = {};
    if(!g.startedAt) g.startedAt = game.turns || 0;
    if(g.skipped == null) g.skipped = false;
    if(g.done == null) g.done = false;
    return g;
  }catch(e){ jl2_guideErr('state: '+e.message); return null; }
}
function jl2_guideInferOrigin(originId){
  if(originId && JL2_GUIDES[originId]) return originId;
  try{
    if(typeof player !== 'undefined' && player){
      if(player.background && JL2_GUIDES[player.background]) return player.background;
      if(player.bgName && typeof BACKGROUNDS !== 'undefined' && BACKGROUNDS){
        for(var i=0; i<BACKGROUNDS.length; i++){
          if(BACKGROUNDS[i].name === player.bgName && JL2_GUIDES[BACKGROUNDS[i].id]) return BACKGROUNDS[i].id;
        }
      }
    }
  }catch(e){ jl2_guideErr('infer player: '+e.message); }
  try{
    if(typeof _startup !== 'undefined' && _startup && _startup.bg && JL2_GUIDES[_startup.bg]) return _startup.bg;
  }catch(e){}
  // 找不到身份：退回出身地默认（该地第一个出身，泥瓶巷贫户为最终兜底）。
  var spot = 'mud';
  try{
    if(typeof player !== 'undefined' && player && player.birthPlace) spot = player.birthPlace;
    else if(typeof _startup !== 'undefined' && _startup && _startup.spot) spot = _startup.spot;
  }catch(e){}
  for(var id in JL2_GUIDES){ if(JL2_GUIDES[id].spot === spot) return id; }
  return 'pauper';
}
function jl2_guideRewardText(n){
  var parts = [];
  if(n.exp) parts.push('经验 +'+n.exp);
  if(n.gold) parts.push('银钱 +'+n.gold);
  if(n.potential) parts.push('潜力 +'+n.potential);
  if(n.fame) parts.push('声望 +'+n.fame);
  if(n.items && n.items.length){
    for(var i=0; i<n.items.length; i++) parts.push(n.items[i].name+' ×'+n.items[i].n);
  }
  if(n.aff){ for(var k in n.aff) parts.push(k+' 好感 +'+n.aff[k]); }
  return parts.length ? parts.join('，') : '一点阅历';
}
function jl2_guideGrant(reward){
  var r = reward || {};
  var norm = {
    exp:r.exp||0, gold:r.gold||0, potential:r.potential||0, fame:r.fame||0,
    items:[], aff:r.aff||{}
  };
  if(r.item) norm.items.push({name:r.item, n:r.n||1});
  if(r.items) norm.items = norm.items.concat(r.items);

  var called = false, text = '';
  if(typeof jl2_reward === 'function'){
    try{ text = jl2_reward(norm, {source:'guide'}) || ''; called = true; }
    catch(e){ jl2_guideErr('reward: '+e.message); }
  }
  if(!called){
    // 兜底：成长模块缺席时只做最小入账，不重复发放（模块在时已由 jl2_reward 统一结算）。
    try{
      if(typeof player !== 'undefined' && player){
        if(norm.exp) player.exp = (player.exp||0) + norm.exp;
        if(norm.gold) player.gold = (player.gold||0) + norm.gold;
        if(norm.potential) player.potential = (player.potential||0) + norm.potential;
      }
      if(typeof game !== 'undefined' && game && norm.fame) game.fame = (game.fame||0) + norm.fame;
      if(typeof jl2_relAdd === 'function'){ for(var n in norm.aff) jl2_relAdd(n, 'aff', norm.aff[n]); }
    }catch(e){ jl2_guideErr('grant fallback: '+e.message); }
    text = jl2_guideRewardText(norm);
  } else if(!text){
    text = jl2_guideRewardText(norm);
  }
  return text;
}

// 判定：复用任务引擎 stage 的条件思路，事件类型映射到 stage 类型（§4.3）。
var JL2_GUIDE_EVMAP = {
  enter:'reach', item:'collect', battle_end:'kill', skill:'use',
  attr:'choice', trade:'use', questaccept:'quest', questturnin:'quest'
};
function jl2_guideStageHit(stage, type, p){
  p = p || {};
  if(!stage) return false;
  var mapped = JL2_GUIDE_EVMAP[type] || type;
  if(mapped !== stage.type && type !== stage.type) return false;
  switch(stage.type){
    case 'look':   return type === 'look';
    case 'reach':  return !!(stage.any || p.room === stage.room || p.name === stage.room || p.to === stage.room);
    case 'talk':   return !!(stage.any || !stage.npc || p.npc === stage.npc || p.name === stage.npc || p.target === stage.npc);
    case 'gift':   return !!(stage.any || !stage.npc || p.npc === stage.npc || p.npc === p.target || p.to === stage.npc);
    case 'choice': return !!(stage.any || !stage.id || p.id === stage.id || p.choice === stage.id);
    case 'aff':    return !!(stage.any || !stage.npc || p.npc === stage.npc);
    case 'collect': return !!(stage.any || !stage.item || p.item === stage.item || p.name === stage.item);
    case 'kill':
    case 'equip':
    case 'quest':
    case 'craft':
    case 'use':
    case 'deliver':
    case 'escort':
    case 'rep':
    case 'timed':
    case 'rest':
    default: return true;
  }
}

/* ── 公共 API ─────────────────────────────────────────── */
function jl2_guideEnsureObserver(){
  try{
    if(JL2_GUIDE_OBS) return true;
    if(typeof MutationObserver !== 'function' || typeof document === 'undefined') return false;
    var target = document.getElementById('s-quest');
    if(!target) return false;
    JL2_GUIDE_OBS = new MutationObserver(function(){
      if(JL2_GUIDE_BAR_WRITING) return;
      var st = jl2_guideState(false);
      if(st && !st.done && !st.skipped) jl2_guideBar();
      else if(st) jl2_guideReleaseBar();
    });
    JL2_GUIDE_OBS.observe(target, {childList:true, subtree:true, characterData:true});
    return true;
  }catch(e){ jl2_guideErr('ensureObserver: '+e.message); return false; }
}

function jl2_guideStart(originId){
  try{
    var id = jl2_guideInferOrigin(originId);
    var g = JL2_GUIDES[id];
    if(!g) return null;
    var st = jl2_guideState(true);
    if(!st) return null;
    st.origin = id;
    st.spot = g.spot;
    st.step = 0;
    st.prog = {};
    st.skipped = false;
    st.done = false;
    st.startedAt = (typeof game !== 'undefined' && game && game.turns) || 0;
    st.lastSig = '';
    jl2_guideEnsureObserver(); // 二次开局时观察器可能已被 release 断开
    jl2_guideLog(g.monologue, 'sys');
    jl2_guideBar();
    return st;
  }catch(e){ jl2_guideErr('start: '+e.message); return null; }
}

// 跳过引导：不额外发奖励，仅收尾（老玩家用）。
function jl2_guideSkip(){
  try{
    var st = jl2_guideState(true);
    if(!st) return false;
    if(st.skipped || st.done) return false;
    st.skipped = true;
    jl2_guideLog('（新手引导已跳过——江湖路熟，便自己去闯。）', 'sys');
    jl2_guideBar();
    return true;
  }catch(e){ jl2_guideErr('skip: '+e.message); return false; }
}

function jl2_guideOnEvent(type, p){
  try{
    var st = jl2_guideState(true);
    if(!st || st.done || st.skipped || !st.origin) return false;
    var g = JL2_GUIDES[st.origin];
    if(!g || !g.steps || st.step >= g.steps.length) return false;
    p = p || {};
    var tv = (p.turns != null) ? p.turns
           : ((typeof game !== 'undefined' && game && game.turns != null) ? game.turns : '');
    var sig = String(type)+'|'+tv+'|'+String(p.npc||p.item||p.id||p.room||p.name||'');
    if(st.lastSig === sig) return false;

    var step = g.steps[st.step];
    if(!jl2_guideStageHit(step.stage, type, p)) return false;
    st.lastSig = sig;

    var need = (step.stage && step.stage.need) || 1;
    var got = (st.prog[step.id] || 0) + 1;
    if(got < need){ st.prog[step.id] = got; return false; }

    var rewardText = jl2_guideGrant(step.reward);
    jl2_guideLog('（引导 '+step.id+'：'+step.done+'　'+rewardText+'）', 'sys');
    st.step++;
    st.prog[step.id] = got;
    if(st.step >= g.steps.length){
      st.done = true;
      jl2_guideLog('（新手引导走完了——'+g.wow+'。往后，路要自己走了。）', 'sys');
    }
    jl2_guideBar();
    return true;
  }catch(e){ jl2_guideErr('onEvent: '+e.message); return false; }
}

var JL2_GUIDE_BAR_WRITING = false;
var JL2_GUIDE_OBS = null;
var JL2_GUIDE_RELEASING = false;
function jl2_guideReleaseBar(){
  if(JL2_GUIDE_RELEASING) return;
  JL2_GUIDE_RELEASING = true;
  try{
    if(JL2_GUIDE_OBS){ JL2_GUIDE_OBS.disconnect(); JL2_GUIDE_OBS = null; }
    if(typeof updateQuestTracker === 'function') updateQuestTracker();
  }catch(e){ jl2_guideErr('release: '+e.message); }
  finally{ JL2_GUIDE_RELEASING = false; }
}
function jl2_guideBar(){
  try{
    var st = jl2_guideState(true);
    var el = document.getElementById('s-quest');
    var usingLog = false;
    if(!el){ el = document.getElementById('log'); usingLog = true; if(!el) return; }

    // 尚未启动：有身份时懒启动，否则不抢目标条。
    if(!st || !st.origin){
      if(typeof player !== 'undefined' && player && (player.background || player.bgName)){
        st = jl2_guideStart();
        if(!st) return;
      } else return;
    }
    var g = JL2_GUIDES[st.origin];
    if(!g) return;

    var html, plain;
    if(st.skipped){
      plain = '新手引导已跳过';
      html = '<div class="q-main">◈ 新手引导</div><div class="q-sub">'+plain+'</div>';
    } else if(st.done){
      plain = '新手引导完成 · '+g.name;
      html = '<div class="q-main">◈ 新手引导 · '+g.name+'</div><div class="q-sub">'+plain+'</div>';
    } else {
      var step = g.steps[st.step] || g.steps[g.steps.length-1];
      var n = step.reward || {};
      var preview = jl2_guideRewardText({
        exp:n.exp, gold:n.gold, potential:n.potential, fame:n.fame,
        items:n.items||(n.item?[{name:n.item,n:n.n||1}]:[]), aff:n.aff||{}
      });
      plain = '当前目标：'+step.goal+'｜下一步：'+step.hint+'｜奖励：'+preview;
      html = '<div class="q-main">◈ 新手引导 · '+g.name+'（'+(st.step+1)+'/'+g.steps.length+'）</div>'
           + '<div class="q-sub">当前目标：'+step.goal+'</div>'
           + '<div class="q-side">下一步：'+step.hint+'</div>'
           + '<div class="q-side">奖励预览：'+preview
           + '　<span id="jl2-guide-skip" style="color:#a5d9ad;cursor:pointer;">［跳过引导］</span></div>';
    }

    // 引导结束后把目标条还给任务系统，别让「引导完成」长期占着追踪栏。
    if((st.done || st.skipped) && !usingLog){ jl2_guideReleaseBar(); return; }

    // 同一内容不重写：MutationObserver 盯着这个元素，重复写入会自旋把页面卡死。
    // 但 updateQuestTracker 会把 innerHTML 覆盖回去（属性还在、内容已变），
    // 所以必须同时比对真实 DOM，否则引导会被旧任务条永久遮住。
    if(!usingLog && el.getAttribute('data-jl2-guide') === plain && el.innerHTML === (el.getAttribute('data-jl2-guide-html') || '')) return;
    JL2_GUIDE_BAR_WRITING = true;
    try{
      if(usingLog){
        var last = el.getAttribute('data-jl2-guide-last') || '';
        if(last === plain) return;
        el.setAttribute('data-jl2-guide-last', plain);
        var d = document.createElement('div');
        d.textContent = plain;
        el.appendChild(d);
      } else {
        el.setAttribute('data-jl2-guide', plain);
        el.setAttribute('data-jl2-guide-html', html);
        el.innerHTML = html;
        var skip = document.getElementById('jl2-guide-skip');
        if(skip) skip.addEventListener('click', function(){ jl2_guideSkip(); });
      }
    } finally { JL2_GUIDE_BAR_WRITING = false; }
  }catch(e){ jl2_guideErr('bar: '+e.message); }
}

function jl2_guideInit(){
  try{
    if(typeof jl2_on === 'function'){
      jl2_on('boot', function(){ jl2_guideStart(); });
      jl2_on('*', function(type, p){ jl2_guideOnEvent(type, p); });
    }
    // updateQuestTracker 会覆写 #s-quest；引导期间用观察器把目标条贴回去。
    jl2_guideEnsureObserver();
  }catch(e){ jl2_guideErr('init: '+e.message); }
}
