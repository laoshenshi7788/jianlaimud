/*
 * social2.js —— JL2 社交关系系统
 * 三维关系(aff/respect/debt) + 五档解锁 + 送礼回报 + 关系事件链 + 关系面板。
 * 只读取现有全局 game / player / NPCS / ITEMS 与现有函数
 * hasItem / removeItem / addItem / learnSkill / logLove / logInfo / getNpc / getItem / itemData / openModal。
 * 绝不覆盖旧 giveGift / affTier / gainAff / giftTierLabel / logLove。
 * 所有新全局函数一律 jl2_ 前缀；字符串用 ASCII 直引号，中文叙述用中文引号。
 *
 * 同步约定（集成方）：player.aff 是 aff 的权威源。旧 gainAff 改好 player.aff 后调
 * jl2_relAdd(npc,'aff',增量) 同步三维；jl2_relAdd 的 aff 轴只读 player.aff、不回写、不 emit('aff')，
 * 以免递归。需要改 aff 数值时先写 player.aff，再 jl2_relAdd(npc,'aff',0) 或 jl2_relSync(npc)。
 * 回合字段统一用 game.turns。
 */

/* ── 五档解锁表：每档都有实利 ───────────────────────────────── */
var JL2_REL_UNLOCK = [
  { id:'ask_road', title:'萍水相逢',
    perks:['ask_road'],
    perkText:'问路：告诉你本地三处去处',
    next:'打听传闻、商铺九五折' },
  { id:'rumor', title:'初识之谊',
    perks:['ask_road','rumor','discount95'],
    perkText:'打听一条传闻或任务线索；商铺九五折',
    next:'深谈、问喜好与忌讳、商铺九折、人物志第二环' },
  { id:'deep_talk', title:'相见恨晚',
    perks:['ask_road','rumor','discount95','deep_talk','discount90','bio2'],
    perkText:'可问喜好与忌讳；商铺九折；解锁人物志第二环',
    next:'传功、随行助战、每日危急出手一次、可借银五十两' },
  { id:'escort', title:'肝胆相照',
    perks:['ask_road','rumor','discount95','deep_talk','discount90','bio2','teach_skill','escort','loan50'],
    perkText:'赠一门功法或信物；危急时出手一次；可借银五十两',
    next:'传本命神通、托孤遗物、替你挡一次死' },
  { id:'entrust', title:'生死之交',
    perks:['ask_road','rumor','discount95','deep_talk','discount90','bio2',
           'teach_skill','escort','loan50','legacy','shield_death'],
    perkText:'传本命神通；托孤遗物；可请其替你挡一次死',
    next:'已至顶档，再无更高交情' }
];

/* ── 关系事件链：通用三段 + 重点 NPC 专属 ───────────────────── */
var JL2_REL_EVENTS_DEFAULT = [
  { id:'初识', when:{aff:15},
    line:'（几番来往，{npc}待你已不同于生人。）', reward:{aff:5, knowledge:true} },
  { id:'交心', when:{aff:45, respect:20},
    line:'（{npc}终于把你当自己人，说起了旧话。）', reward:{item:'旧书', respect:3} },
  { id:'托付', when:{aff:70, respect:40},
    line:'（{npc}把一件珍藏托付于你——这是把你当成了生死之交。）',
    reward:{item:'信物', title:'知己'} }
];

var JL2_REL_EVENTS = {
  '齐静春':[
    { id:'qi_1', when:{aff:15, quest:'m1_03'}, scene:'d_qi_1',
      line:'（那三株止血草，救了两条命。{npc}记住了。）',
      reward:{aff:5, knowledge:'书院旧事'} },
    { id:'qi_2', when:{aff:45, respect:20}, scene:'d_qi_2',
      line:'（{npc}说起那个死在信念上的学生。）',
      reward:{item:'旧书', skill:'浩然气'} },
    { id:'qi_3', when:{aff:70, respect:40, flag:'ch3_done'}, scene:'d_qi_3',
      line:'（{npc}替你铺好了入书院的路。）',
      reward:{title:'文脉', flag:'ending_literati'} }
  ],
  '阮秀':[
    { id:'rx_1', when:{aff:15},
      line:'（荷塘边，{npc}开始与你搭话。）', reward:{aff:4} },
    { id:'rx_2', when:{aff:45, flag:'ruanxi_mother'},
      line:'（{npc}说起母亲那株枯掉的莲。）', reward:{item:'旧银镯'} },
    { id:'rx_3', when:{aff:70, respect:40},
      line:'（{npc}把荷塘托付给了你。）', reward:{item:'莲种', title:'荷塘知己'} }
  ],
  '杨老头':[
    { id:'yang_1', when:{aff:15},
      line:'（{npc}递给你一包金疮药。）', reward:{item:'金疮药'} },
    { id:'yang_2', when:{aff:45, respect:20},
      line:'（{npc}把一张旧药方塞进你手里。）',
      reward:{item:'药方', flag:'yang_recipe'} },
    { id:'yang_3', when:{aff:70, respect:40},
      line:'（{npc}将压箱底的丹方传给了你。）',
      reward:{item:'丹方残页', title:'药道传人'} }
  ]
};

/* ── 内部小工具（同样 jl2_ 前缀，非对外 API） ──────────────── */
function jl2_num(v, d){ return (typeof v === 'number' && isFinite(v)) ? v : d; }
function jl2_clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

/* 从 player.aff 读取权威值；缺失时回退 f */
function jl2_paff(name, f){
  if(typeof player !== 'undefined' && player &&
     typeof player.aff[name] === 'number' && isFinite(player.aff[name])){
    return player.aff[name];
  }
  return f;
}

/* 把增量写进权威源 player.aff（clamp 后返回） */
function jl2_socBumpAff(name, delta){
  var base = jl2_paff(name, 0);
  var nv = jl2_clamp(base + jl2_num(delta, 0), 0, 100);
  if(typeof player !== 'undefined' && player) player.aff[name] = nv;
  return nv;
}

function jl2_socErr(where, e){
  try{
    if(typeof window !== 'undefined' && window.__bootErrs){
      window.__bootErrs.push('social2.' + where + ': ' + ((e && e.message) || e));
    }
  }catch(e2){}
}

/* 自愈兜底：所有新 game / player 字段都在这里补全，不覆盖已有值 */
function jl2_socSelfHeal(){
  try{
    if(typeof game === 'undefined' || !game) return false;
    game.rel = game.rel || {};
    game.flags = game.flags || {};
    game.world = game.world || {};
    game.world.rumors = game.world.rumors || [];
    game.giftFollow = game.giftFollow || [];
    game.knownLikes = game.knownLikes || {};
    if(typeof player !== 'undefined' && player) player.aff = player.aff || {};
    return true;
  }catch(e){ jl2_socErr('selfHeal', e); return false; }
}

/* 取原始记录（不触发同步 / 事件），保证结构存在 */
function jl2_socRaw(name){
  jl2_socSelfHeal();
  if(!game.rel[name]){
    game.rel[name] = { aff:0, respect:0, debt:0, tier:0, events:{} };
  }
  var r = game.rel[name];
  r.events = r.events || {};
  r.giftMemory = r.giftMemory || {};
  r.likedGifts = r.likedGifts || [];
  r.hatedGifts = r.hatedGifts || [];
  return r;
}

/* 刷新档位与解锁 id 列表 */
function jl2_socRefreshUnlocks(name){
  try{
    var r = jl2_socRaw(name);
    var t = jl2_relTier(name);
    r.tier = t;
    var out = [];
    for(var i = 0; i <= t && i < JL2_REL_UNLOCK.length; i++){
      out = out.concat(JL2_REL_UNLOCK[i].perks);
    }
    r.unlocks = out;
    return out;
  }catch(e){ jl2_socErr('refreshUnlocks', e); return []; }
}

/* 取物品价格：兼容 itemData / getItem / ITEMS */
function jl2_itemPrice(name){
  try{
    var d = (typeof itemData === 'function') ? itemData(name) : null;
    if(d && typeof d.price === 'number' && isFinite(d.price)) return d.price;
    if(typeof getItem === 'function'){
      var g = getItem(name);
      if(g && typeof g.price === 'number' && isFinite(g.price)) return g.price;
    }
    if(typeof ITEMS !== 'undefined' && ITEMS && ITEMS[name] &&
       typeof ITEMS[name].price === 'number' && isFinite(ITEMS[name].price)){
      return ITEMS[name].price;
    }
  }catch(e){ jl2_socErr('itemPrice', e); }
  return 20;
}

/* 是否清高之人（当众赠重礼会掉敬重） */
function jl2_isAloof(n){
  if(!n) return false;
  if(n.aloof || n.qinggao) return true;
  var p = n.persona || {};
  var s = String(p.rank || '') + String(p.speech || '') + String(n.title || '') + String(n.camp || '');
  return /书院|文庙|清高|隐士|道门|剑仙|君子|高士/.test(s);
}

function jl2_mkLine(parent, text, color){
  var d = document.createElement('div');
  d.style.cssText = 'margin:3px 0;font-size:.78em;line-height:1.5;' + (color ? 'color:' + color + ';' : '');
  d.textContent = text;
  parent.appendChild(d);
  return d;
}

/* ── 对外 API ───────────────────────────────────────────────── */

/* 档位：aff 主导、respect 校正；读 player.aff（旧代码的最新值） */
function jl2_relTier(name){
  jl2_socSelfHeal();
  var r = game.rel[name];
  var a = r ? jl2_num(r.aff, 0) : 0;
  if(typeof player !== 'undefined' && player &&
     typeof player.aff[name] === 'number' && isFinite(player.aff[name])){
    a = player.aff[name];
  }
  var resp = r ? jl2_num(r.respect, 0) : 0;
  var score = a * 0.6 + resp * 0.4;
  return score < 15 ? 0 : score < 40 ? 1 : score < 60 ? 2 : score < 80 ? 3 : 4;
}

/*
 * 三维关系读取：player.aff 是 aff 的权威源。
 * 读取时以 player.aff 为准回填 game.rel.aff；若只有 game.rel.aff 则补 player.aff（自愈）。
 * 任何写入都经 clamp，绝不变 NaN。
 */
function jl2_relGet(name){
  try{
    jl2_socSelfHeal();
    var r = jl2_socRaw(name);
    var pa = jl2_paff(name, null);
    if(pa !== null){
      r.aff = jl2_clamp(pa, 0, 100);          // 权威源为准
    } else {
      r.aff = jl2_clamp(jl2_num(r.aff, 0), 0, 100);
      if(typeof player !== 'undefined' && player) player.aff[name] = r.aff; // 缺失时自愈回填
    }
    r.respect = jl2_clamp(jl2_num(r.respect, 0), 0, 100);
    r.debt = jl2_clamp(jl2_num(r.debt, 0), -9999, 9999);
    r.tier = jl2_relTier(name);
    var ev = {};
    for(var k in r.events){ if(Object.prototype.hasOwnProperty.call(r.events, k)) ev[k] = r.events[k]; }
    return { aff:r.aff, respect:r.respect, debt:r.debt, tier:r.tier, events:ev };
  }catch(e){ jl2_socErr('relGet', e); return { aff:0, respect:0, debt:0, tier:0, events:{} }; }
}

/*
 * 关系维度变更入口。约定（集成方）：
 * - aff 轴只做 player.aff -> game.rel.aff 的单向同步：不回写 player.aff、不 emit('aff')。
 *   旧 gainAff 已改好 player.aff，末尾调本函数同步，避免递归与重复计数。
 * - respect / debt 在本模块内维护，可累加 delta。
 * 需要增加 aff 数值时先写 player.aff，再调 jl2_relAdd(npc,'aff',0) 或 jl2_relSync(npc)。
 */
function jl2_relAdd(name, axis, delta){
  try{
    jl2_socSelfHeal();
    delta = jl2_num(delta, 0);
    var oldTier = jl2_relTier(name);
    var r = jl2_socRaw(name);
    if(axis === 'aff'){
      r.aff = jl2_clamp(jl2_paff(name, jl2_num(r.aff, 0)), 0, 100); // 只读权威源
    } else if(axis === 'respect'){
      r.respect = jl2_clamp(jl2_num(r.respect, 0) + delta, 0, 100);
    } else if(axis === 'debt'){
      r.debt = jl2_clamp(jl2_num(r.debt, 0) + delta, -9999, 9999);
    } else {
      return oldTier;
    }
    var newTier = jl2_relTier(name);
    r.tier = newTier;
    jl2_socRefreshUnlocks(name);
    if(newTier > oldTier && JL2_REL_UNLOCK[newTier] && typeof logLove === 'function'){
      logLove('（你与' + name + '的交情进了一层——已至「' + JL2_REL_UNLOCK[newTier].title + '」。）');
    }
    jl2_relCheckEvents(name);
    return newTier;                            // 不 emit('aff')
  }catch(e){ jl2_socErr('relAdd', e); return jl2_relTier(name); }
}

/* 读档 / gainAff hook 后调用：把 player.aff[npc] 同步进三维关系（不存在则创建），不 emit、不回写 */
function jl2_relSync(npc){
  try{
    jl2_socSelfHeal();
    var a = jl2_paff(npc, 0);
    var r = jl2_socRaw(npc);
    r.aff = jl2_clamp(a, 0, 100);
    r.tier = jl2_relTier(npc);
    jl2_socRefreshUnlocks(npc);
    return r.aff;
  }catch(e){ jl2_socErr('relSync', e); return 0; }
}

/* 当前档位及以下的全部实利 id */
function jl2_relPerks(name){
  jl2_socSelfHeal();
  var t = jl2_relTier(name);
  var out = [];
  for(var i = 0; i <= t && i < JL2_REL_UNLOCK.length; i++) out = out.concat(JL2_REL_UNLOCK[i].perks);
  return out;
}

/* 面板用：下一档解锁文案 */
function jl2_relNextUnlock(name){
  var t = jl2_relTier(name);
  if(t >= 4) return '已至生死之交，再无更高档位。';
  var nx = JL2_REL_UNLOCK[t + 1];
  return '下一档解锁：' + nx.title + '——' + nx.next;
}

/* 商铺折扣：档位越高折扣越低（返回 0~1 的乘数） */
function jl2_shopDiscount(name){
  var t = jl2_relTier(name);
  return t >= 2 ? 0.9 : t >= 1 ? 0.95 : 1;
}

/* 问路实利：说出本地三处去处 */
function jl2_relAskRoad(name){
  try{
    if(jl2_relPerks(name).indexOf('ask_road') < 0){
      if(typeof logInfo === 'function') logInfo('（' + name + '与你还不熟，未必肯指路。）');
      return false;
    }
    var spots = [];
    if(typeof ROOMS !== 'undefined' && ROOMS){
      for(var k in ROOMS){ if(Object.prototype.hasOwnProperty.call(ROOMS, k)){ spots.push(k); if(spots.length >= 3) break; } }
    }
    if(!spots.length) spots = ['本地集市', '城中酒肆', '城外山道'];
    if(typeof logLove === 'function') logLove('（' + name + '替你指了路：' + spots.join('、') + '。）');
    return true;
  }catch(e){ jl2_socErr('relAskRoad', e); return false; }
}

/* 关系事件奖励结算 */
function jl2_socFireEvent(name, ev){
  try{
    var line = String(ev.line || '（你与' + name + '的交情更深了。）').split('{npc}').join(name);
    if(ev.scene && typeof jl2_playDialogue === 'function'){
      try{ jl2_playDialogue(ev.scene, { npc:name }); }
      catch(e2){ if(typeof logLove === 'function') logLove(line); }
    } else if(typeof logLove === 'function'){
      logLove(line);
    }
    var rw = ev.reward || {};
    if(rw.aff){
      jl2_socBumpAff(name, rw.aff);            // 增量落到权威源 player.aff
      jl2_relAdd(name, 'aff', 0);              // 仅同步三维（档位 + 事件链），不 emit
    }
    if(rw.respect) jl2_relAdd(name, 'respect', rw.respect);
    if(rw.item && typeof addItem === 'function') addItem(rw.item);
    if(rw.skill && typeof learnSkill === 'function') learnSkill(rw.skill);
    if(rw.flag){ game.flags = game.flags || {}; game.flags[rw.flag] = true; }
    if(rw.title){
      player.titles = player.titles || [];
      if(player.titles.indexOf(rw.title) < 0) player.titles.push(rw.title);
    }
    if(rw.knowledge){
      game.knowledge = game.knowledge || [];
      game.knowledge.push(typeof rw.knowledge === 'string' ? rw.knowledge : name + '旧事');
    }
    if(typeof jl2_emit === 'function'){
      jl2_emit('aff', { npc:name, delta:rw.aff || 0, tier:jl2_relTier(name), event:ev.id,
                        turns:jl2_num(game.turns, 0) });
    }
  }catch(e){ jl2_socErr('fireEvent', e); }
}

/* 关系事件链判定：条件读 game.rel（三维）与 game.flags / qlog */
function jl2_relCheckEvents(name){
  try{
    jl2_socSelfHeal();
    if(game._jl2EvBusy) return;               // 防奖励再加 aff 造成重入
    game._jl2EvBusy = true;
    try{
      var rel = jl2_relGet(name);
      var defs = (JL2_REL_EVENTS && JL2_REL_EVENTS[name]) || JL2_REL_EVENTS_DEFAULT;
      for(var i = 0; i < defs.length; i++){
        var ev = defs[i];
        if(rel.events[ev.id]) continue;       // 已触发过
        var w = ev.when || {};
        if(w.aff !== undefined && rel.aff < w.aff) continue;
        if(w.respect !== undefined && rel.respect < w.respect) continue;
        if(w.debt !== undefined && rel.debt < w.debt) continue;
        if(w.flag && !(game.flags && game.flags[w.flag])) continue;
        if(w.notFlag && game.flags && game.flags[w.notFlag]) continue;
        if(w.quest){
          var qid = String(w.quest).split(':')[0];
          var done = (game.qlog && game.qlog.done && game.qlog.done[qid]) ||
                     (game.questDone && game.questDone[qid]);
          if(!done) continue;
        }
        if(w.item && !hasItem(w.item)) continue;
        var r = jl2_socRaw(name);
        r.events[ev.id] = true;               // 先落标记再发奖，避免重入重复触发
        jl2_socFireEvent(name, ev);
      }
    }finally{ game._jl2EvBusy = false; }
  }catch(e){ jl2_socErr('relCheckEvents', e); }
}

/* 三回合后后续事件的具体内容 */
function jl2_socFollowup(e){
  try{
    if(!e || !e.npc) return;
    var n = e.npc;
    if(e.kind === 'entrust'){
      game.flags = game.flags || {};
      game.flags['gift_entrust_' + n] = true;
      if(typeof logLove === 'function') logLove('（三日前收下的礼有了回音——' + n + '托你办一件事。）');
    } else if(e.kind === 'meet'){
      if(typeof logLove === 'function') logLove('（' + n + '如约而至，邀你赴一场私宴。）');
      if(e.scene && typeof jl2_playDialogue === 'function'){
        try{ jl2_playDialogue(e.scene, { npc:n }); }catch(e2){}
      }
    } else if(e.kind === 'rumor'){
      var rumor = '（听说' + n + '近来常在人前提起你。）';
      game.world = game.world || {};
      game.world.rumors = game.world.rumors || [];
      game.world.rumors.push(rumor);
      if(typeof logLove === 'function') logLove(rumor);
    }
    if(typeof jl2_emit === 'function') jl2_emit('gift_followup', { npc:n, kind:e.kind, turns:jl2_num(game.turns, 0) });
  }catch(err){ jl2_socErr('followup', err); }
}

/* 回合推进时调用：结算三回合后的送礼后续（回合字段为 game.turns） */
function jl2_socialTick(){
  try{
    if(!game || !game.giftFollow) return;
    var t = jl2_num(game.turns, 0);
    var list = game.giftFollow;
    for(var i = list.length - 1; i >= 0; i--){
      if(list[i] && jl2_num(list[i].at, Infinity) <= t){
        var e = list.splice(i, 1)[0];
        jl2_socFollowup(e);
      }
    }
  }catch(e){ jl2_socErr('socialTick', e); }
}

/*
 * 送礼结算：taste × timing × value × repeat × satur。
 * 与旧 giveGift 并存，不覆盖；调用现有 hasItem / removeItem / logLove / addItem。
 * ctx: { festival, crisis, public, demandReturn }
 */
function jl2_gift(npc, item, ctx){
  ctx = ctx || {};
  try{
    jl2_socSelfHeal();
    var def = (typeof getNpc === 'function') ? getNpc(npc) : ((typeof NPCS !== 'undefined' && NPCS) ? NPCS[npc] : null);
    if(!def){ if(typeof logInfo === 'function') logInfo('（查无此人。）'); return { ok:false, reason:'no_npc' }; }
    if(typeof hasItem !== 'function' || !hasItem(item)){
      if(typeof logInfo === 'function') logInfo('（你身上没有「' + item + '」。）');
      return { ok:false, reason:'no_item' };
    }

    var rel = jl2_relGet(npc);
    var likes = def.likes || ['干粮'];
    var hates = def.hates || [];

    // taste：喜好 2.0 / 厌恶 -1.5 / 其它 1.0
    var taste = 1.0;
    if(likes.indexOf(item) > -1) taste = 2.0;
    else if(hates.indexOf(item) > -1) taste = -1.5;

    // timing：节庆 > 危难 > 当众 > 寻常
    var timing = ctx.festival ? 1.5 : ctx.crisis ? 1.2 : ctx.public ? 0.5 : 0.8;

    // value：相对对方身价
    var price = jl2_itemPrice(item);
    var income = jl2_num(def.income, 200) || 200;
    var value = 1 + Math.min(1, price / income);

    // repeat：同类记忆递减；连送同物再打四折（§7.6）
    var r = jl2_socRaw(npc);
    var seen = jl2_num(r.giftMemory[item], 0);
    var repeat = 1 / (1 + seen * 0.6);
    if(seen > 0) repeat *= 0.4;

    // satur：好感越高越难打动
    var satur = 1 / (1 + rel.aff / 60);

    var score = 10 * taste * timing * value * repeat * satur;
    if(!isFinite(score)) score = 0;
    var gain = jl2_clamp(Math.round(score), -25, 30);

    // 消费礼物（走现有函数）
    if(typeof removeItem === 'function') removeItem(item);
    r.giftMemory[item] = seen + 1;
    game.knownLikes[npc] = true;              // 送过一次，也算摸清了脾气

    // 喜好 / 厌恶记忆
    if(taste >= 2 && r.likedGifts.indexOf(item) < 0) r.likedGifts.push(item);
    if(taste <= -1 && r.hatedGifts.indexOf(item) < 0) r.hatedGifts.push(item);

    // 敬重修正：送厌恶物 -3；清高者当众收重礼 -5；送对 +2
    var dRespect = 0;
    if(taste <= -1) dRespect = -3;
    else if(taste >= 2) dRespect = 2;
    if(ctx.public && price >= income * 0.8 && jl2_isAloof(def)){
      dRespect -= 5;
      if(typeof logLove === 'function') logLove('（' + npc + '微微侧过身：“你在施舍我？”）');
    }

    // 立即索要回报：翻车
    if(ctx.demandReturn){
      gain -= 8;
      if(typeof logLove === 'function') logLove('（' + npc + '脸色淡了：“原来你是这个意思。”）');
    }

    jl2_socBumpAff(npc, gain);               // 送礼增量先落权威源 player.aff
    jl2_relAdd(npc, 'aff', 0);               // 同步三维，不 emit('aff')
    if(dRespect) jl2_relAdd(npc, 'respect', dRespect);

    // 主叙述（走现有 logLove）
    if(typeof logLove === 'function'){
      var tone = rel.tier >= 3 ? '热' : rel.tier >= 1 ? '温' : '冷';
      var react;
      if(taste >= 2) react = tone === '热'
        ? '（' + npc + '怔怔看着礼物，低声道了句“谢谢”。）'
        : '（' + npc + '眼神亮了一瞬，将礼物小心收好。）';
      else if(taste <= -1) react = '（' + npc + '把礼物推了回来：“这物什，你留着罢。”）';
      else react = '（' + npc + '收下礼物，客气地笑了笑。）';
      logLove('你将「' + item + '」赠予 ' + npc + '。' + react);
      if(gain > 0) logLove('（' + npc + ' 好感 +' + gain + '。）');
      else if(gain < 0) logLove('（' + npc + ' 好感 ' + gain + '。）');
      if(seen > 0) logLove('（同样的东西再送一遍，' + npc + '的语气淡了许多。）');
    }

    // 回礼表（按档位概率）
    var tier = jl2_relTier(npc);
    var prob = tier >= 4 ? 0.8 : tier >= 3 ? 0.6 : tier >= 2 ? 0.4 : 0.2;
    var pools = [
      ['碎银', '干粮', '止血草'],
      ['碎银', '干粮', '止血草'],
      ['药草', '符纸', '金疮药'],
      ['功法残页', '旧书', '玉佩'],
      ['传家玉', '祖传剑谱', '古砚']
    ];
    var returned = null;
    if(Math.random() < prob){
      var pool = pools[jl2_clamp(tier, 0, 4)];
      returned = pool[Math.floor(Math.random() * pool.length)];
      if(typeof addItem === 'function') addItem(returned);
      if(typeof logLove === 'function') logLove('（' + npc + '回赠你「' + returned + '」。）');
    }

    // 传闻扩散（档位 ≥ 2）
    if(tier >= 2 && game.world && game.world.rumors){
      game.world.rumors.push('（听说了吗，' + npc + '近来与你有来往。）');
      if(typeof logLove === 'function') logLove('（街坊间渐渐有了你与' + npc + '的传闻。）');
    }

    // 三回合后后续事件：埋一颗三日开花的种子（回合字段 game.turns）
    var kind = tier >= 4 ? 'entrust' : tier >= 3 ? 'meet' : tier >= 2 ? 'rumor' : 'none';
    if(kind !== 'none'){
      game.giftFollow.push({ at:jl2_num(game.turns, 0) + 3, npc:npc, tier:tier, kind:kind });
      if(typeof logLove === 'function') logLove('（你隐约觉得，这份人情三日后会有回响。）');
    }

    if(typeof jl2_emit === 'function'){
      jl2_emit('gift', { npc:npc, item:item, aff:gain, tier:tier, taste:taste, turns:jl2_num(game.turns, 0) });
    }
    return { ok:true, gain:gain, respect:dRespect, tier:tier, returned:returned, score:score };
  }catch(e){ jl2_socErr('gift', e); return { ok:false, reason:'error' }; }
}

/* 关系面板：三维 / 当前档 / 下一档解锁 / 已打听到的喜好忌讳 */
function jl2_socialPanel(){
  try{
    jl2_socSelfHeal();
    var h = document.createElement('div');
    h.style.cssText = 'font-size:.8em;color:#e8e2d0;max-height:70vh;overflow:auto;';

    var names = [];
    for(var k in game.rel){
      if(!Object.prototype.hasOwnProperty.call(game.rel, k)) continue;
      var r0 = game.rel[k];
      if(!r0) continue;
      if((jl2_num(r0.aff, 0) > 0) || (jl2_num(r0.respect, 0) > 0) ||
         (jl2_num(r0.debt, 0) !== 0) || (r0.events && Object.keys(r0.events).length)){
        names.push(k);
      }
    }
    names.sort(function(a, b){
      return jl2_num(game.rel[b].aff, 0) - jl2_num(game.rel[a].aff, 0);
    });

    if(!names.length){
      jl2_mkLine(h, '（江湖路远，你尚未与人结下渊源。多聊聊、多帮些忙，便有人记得你。）', '#b8b8c0');
    }

    names.forEach(function(n){
      var r = jl2_relGet(n);
      var tier = r.tier;
      var u = JL2_REL_UNLOCK[tier];
      var box = document.createElement('div');
      box.style.cssText = 'border-bottom:1px solid #5a4a30;padding:8px 2px;margin-bottom:6px;';

      jl2_mkLine(box, n + '　·　' + u.title + '（第 ' + tier + ' 档）', '#f0d890');
      jl2_mkLine(box,
        '亲密 ' + Math.round(r.aff) + '　敬重 ' + Math.round(r.respect) + '　亏欠 ' + Math.round(r.debt),
        '#c9c9cf');
      jl2_mkLine(box, '已享实利：' + u.perkText, '#9fd6a0');
      jl2_mkLine(box, jl2_relNextUnlock(n), '#b8d8f0');

      var def = (typeof getNpc === 'function') ? getNpc(n) : ((typeof NPCS !== 'undefined' && NPCS) ? NPCS[n] : null);
      if(game.knownLikes && game.knownLikes[n]){
        var likes = (def && def.likes) || ['干粮'];
        var hates = (def && def.hates) || [];
        jl2_mkLine(box, '喜好：' + likes.join('、') + '　忌讳：' + (hates.length ? hates.join('、') : '未见明确忌讳'), '#d8b0d8');
        var rr = jl2_socRaw(n);
        if(rr.likedGifts && rr.likedGifts.length) jl2_mkLine(box, '送过的心头好：' + rr.likedGifts.join('、'), '#b8b8c0');
        if(rr.hatedGifts && rr.hatedGifts.length) jl2_mkLine(box, '碰过的霉头：' + rr.hatedGifts.join('、'), '#b8b8c0');
      } else {
        jl2_mkLine(box, '喜好/忌讳：尚未打听（可在“谈天论道”里旁敲侧击）', '#b8b8c0');
      }
      h.appendChild(box);
    });

    if(typeof openModal === 'function') openModal('人物关系', function(){ return h; });
    return h;
  }catch(e){ jl2_socErr('socialPanel', e); return null; }
}

/* 初始化：自愈 + 旧 player.aff 迁移 + 订阅回合推进（回合字段 game.turns） */
function jl2_socialInit(){
  try{
    if(!jl2_socSelfHeal()) return;
    // 旧档：player.aff 数字 → 三维；以 player.aff 为权威，绝不写 NaN
    for(var k in player.aff){
      if(!Object.prototype.hasOwnProperty.call(player.aff, k)) continue;
      jl2_relSync(k);                          // 同步 + 刷新解锁
      jl2_relCheckEvents(k);
    }
    // 订阅总线：借 '*' 观察回合推进，驱动三回合后事件；回合数统一取 game.turns
    if(typeof jl2_on === 'function'){
      jl2_on('*', function(p){
        try{
          var t = jl2_num(game.turns, 0);
          if(t > jl2_num(game._jl2LastTurn, 0)){
            game._jl2LastTurn = t;
            jl2_socialTick();
          }
        }catch(e){ jl2_socErr('onTurn', e); }
      });
    }
  }catch(e){ jl2_socErr('socialInit', e); }
}
