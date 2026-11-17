/*
 * materials2.js —— 材料获取与消耗规则（JL2 材料系统）
 *
 * 只提供“规则数据 + 采集/消耗的原子操作”，加工链 jl2_forge 由 progression2.js 提供，
 * 本模块不重复实现加工。所有新全局函数 jl2_ 前缀，不重定义任何现有全局。
 *
 * 数据来源均已 grep 核对于 index.html：
 *   - 材料名与基准价来自 MARKET_MATERIALS（20 种真实可交易材料）与周期采集点掉落；
 *   - 房间名来自 ROOMS / ROOMS_MUNI / 周期采集点场景（真实可进入地点）。
 *   - 不用 progression2.js 里“镇外山坡/老林深处”等游戏里不存在的房间名。
 */
(function () {
  var G = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  /* ─── 基础工具 ─────────────────────────────────────────────── */
  function err(tag, e) {
    try {
      if (!G.__bootErrs) G.__bootErrs = [];
      G.__bootErrs.push('materials2[' + tag + ']: ' + (e && e.message ? e.message : String(e)));
    } catch (_) {}
  }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }
  function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function emitItem(name, delta, from, extra) {
    try {
      if (typeof G.jl2_emit !== 'function') return;
      var p = { name: name, delta: delta, from: from };
      if (isObj(extra)) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
      G.jl2_emit('item', p);
    } catch (e) { err('emit.item', e); }
  }

  /* ─── 材料主表 ─────────────────────────────────────────────── */
  /* grade 下|中|上|绝；from 真实房间名；regen 回合/上限；
     uses 用途；basePrice 基准价(=MARKET_MATERIALS 真实售价)；
     supply 供给高低(越高越便宜)，demand 需求高低(越高越贵)。 */
  var MAT = {
    '草药':     { grade:'下', from:['药王谷','龙虎山'], regen:{turns:8,max:6},  uses:['炼丹·金疮药','任务·采药'], basePrice:12,  supply:8, demand:5 },
    '朱砂':     { grade:'中', from:['龙虎山','骊珠矿洞'], regen:{turns:12,max:4}, uses:['制符·引雷符','制符·镇煞符'], basePrice:14, supply:5, demand:7 },
    '符纸':     { grade:'下', from:['龙虎山'], regen:{turns:6,max:8},  uses:['制符·镇煞符','新手礼'], basePrice:12,  supply:9, demand:6 },
    '剑胚矿石': { grade:'中', from:['骊珠矿洞','剑气长城'], regen:{turns:10,max:8}, uses:['锻造·青锋剑','锻造·名器'], basePrice:18, supply:7, demand:6 },
    '兽皮':     { grade:'下', from:['蛮荒沙海','北俱芦洲'], regen:{turns:14,max:4}, uses:['织造·皮甲','御寒'], basePrice:30, supply:5, demand:5 },
    '灵木':     { grade:'上', from:['落魄山','天姥山'], regen:{turns:30,max:2}, uses:['锻造·法器','制器'], basePrice:40,  supply:3, demand:6 },
    '桃木':     { grade:'中', from:['龙虎山'], regen:{turns:14,max:4}, uses:['制符·桃木剑','锻造·木器'], basePrice:36, supply:5, demand:5 },
    '妖血':     { grade:'中', from:['蛮荒沙海','剑气长城'], regen:{turns:18,max:3}, uses:['炼丹·活血丹','制符'], basePrice:60, supply:4, demand:7 },
    '玄铁':     { grade:'上', from:['骊珠矿洞','剑气长城'], regen:{turns:24,max:2}, uses:['锻造·名器'], basePrice:180, supply:2, demand:8 },
    '寒髓':     { grade:'上', from:['北俱芦洲'], regen:{turns:30,max:2}, uses:['炼丹·寒丹','锻造·神兵'], basePrice:170, supply:2, demand:7 },
    '火髓':     { grade:'上', from:['剑气长城','蛮荒沙海'], regen:{turns:28,max:2}, uses:['炼丹·火丹','锻造·神兵'], basePrice:170, supply:2, demand:7 },
    '雷击木':   { grade:'上', from:['龙虎山'], regen:{turns:30,max:2}, uses:['制符·引雷符','锻造·法器'], basePrice:140, supply:2, demand:7 },
    '剑穗':     { grade:'下', from:['剑冢','剑气长城'], regen:{turns:10,max:6}, uses:['织造·剑穗','装备装饰'], basePrice:24, supply:6, demand:4 },
    '仙酿':     { grade:'中', from:['藕花福地','大骊京城'], regen:{turns:20,max:3}, uses:['烹饪·宴席','送礼·好感'], basePrice:80, supply:4, demand:6 },
    '龙骨':     { grade:'绝', from:['蛮荒沙海','北俱芦洲'], regen:{turns:60,max:1}, uses:['锻造·神兵','炼丹'], basePrice:320, supply:1, demand:9 },
    '龙筋':     { grade:'绝', from:['蛮荒沙海'], regen:{turns:70,max:1}, uses:['锻造·神兵','织造'], basePrice:260, supply:1, demand:9 },
    '悟道茶叶': { grade:'上', from:['龙虎山','山崖书院'], regen:{turns:36,max:2}, uses:['烹饪·悟道茶','送礼'], basePrice:420, supply:2, demand:8 },
    '紫金砂':   { grade:'上', from:['骊珠矿洞','剑气长城'], regen:{turns:32,max:2}, uses:['锻造·名器','制符'], basePrice:190, supply:2, demand:8 },
    '五行精粹': { grade:'绝', from:['龙虎山','藕花福地'], regen:{turns:80,max:1}, uses:['炼丹·五行丹','锻造'], basePrice:520, supply:1, demand:10 },
    '陨铁':     { grade:'上', from:['骊珠矿洞','剑冢'], regen:{turns:40,max:1}, uses:['锻造·神兵'], basePrice:120, supply:2, demand:8 },
    /* 周期采集点真实掉落（index.html 里 addItem 的名字） */
    '仙家雪莲': { grade:'上', from:['藕花福地'], regen:{turns:50,max:1}, uses:['炼丹·还魂丹','烹饪·莲宴'], basePrice:200, supply:1, demand:8 },
    '谷雨钱':   { grade:'中', from:['藕花福地'], regen:{turns:12,max:4}, uses:['收藏','交易'], basePrice:50, supply:5, demand:4 }
  };

  /* ─── 采集点规则 ───────────────────────────────────────────── */
  /* weights 与 materials 一一对应；quality 为品质权重（下/中/上/绝）。 */
  var SPOTS = {
    '骊珠矿洞': {
      materials:['剑胚矿石','玄铁','陨铁','紫金砂'], weights:[60,25,8,7],
      regen:10, max:8, quality:{ '下':20, '中':50, '上':25, '绝':5 },
      emptyHint:'矿脉再生需时，不妨转去“剑气长城”或“剑冢”另寻矿脉。'
    },
    '药王谷': {
      materials:['草药','仙家雪莲'], weights:[88,12],
      regen:8, max:10, quality:{ '下':35, '中':45, '上':18, '绝':2 },
      emptyHint:'药圃采空，采药不采根方能年年再生；可去“龙虎山”或“藕花福地”看看。'
    },
    '藕花福地': {
      materials:['草药','谷雨钱','仙酿','仙家雪莲'], weights:[40,25,20,15],
      regen:12, max:8, quality:{ '下':30, '中':45, '上':20, '绝':5 },
      emptyHint:'莲塘拾遗已尽，改日到“药王谷”或“龙虎山”走走。'
    },
    '龙虎山': {
      materials:['符纸','桃木','朱砂','雷击木','悟道茶叶'], weights:[34,24,20,12,10],
      regen:10, max:8, quality:{ '下':25, '中':45, '上':25, '绝':5 },
      emptyHint:'山中灵材需待时节，可往“天姥山”或“落魄山”寻访。'
    },
    '剑气长城': {
      materials:['剑胚矿石','玄铁','妖血','紫金砂','火髓'], weights:[38,22,20,12,8],
      regen:14, max:6, quality:{ '下':15, '中':40, '上':35, '绝':10 },
      emptyHint:'战地矿脉采尽，移步“骊珠矿洞”或“剑冢”。'
    },
    '蛮荒沙海': {
      materials:['兽皮','妖血','龙骨','龙筋'], weights:[45,30,15,10],
      regen:18, max:5, quality:{ '下':20, '中':40, '上':30, '绝':10 },
      emptyHint:'沙海珍兽遁远，可去“北俱芦洲”另寻。'
    },
    '北俱芦洲': {
      materials:['寒髓','兽皮','龙骨'], weights:[40,40,20],
      regen:24, max:4, quality:{ '下':15, '中':40, '上':35, '绝':10 },
      emptyHint:'冰窟寒髓需岁月重凝，先去“蛮荒沙海”转转。'
    },
    '剑冢': {
      materials:['陨铁','剑穗','灵木'], weights:[45,35,20],
      regen:20, max:5, quality:{ '下':20, '中':45, '上':28, '绝':7 },
      emptyHint:'剑冢残铁已尽，可往“骊珠矿洞”继续寻矿。'
    }
  };

  /* ─── 五类消耗规则（只读规则数据，执行交给 jl2_forge） ─────────
     逐条对齐 progression2.js 的 JL2_RECIPES：材料名、产物名、基础成功率一致；
     失败损耗统一为 half（forge 失败时 consumeMats(mats,'half')）。
     基础 rate 是 forge 计算加成前的净值，实际成功率受技艺/工具/品质影响。 */
  var CRAFT = {
    'forge':    { name:'锻造', executor:'jl2_forge', recipes:[
      { id:'f_qingfeng', product:'青锋剑', mats:{'剑胚矿石':2}, rate:0.65, failLoss:'half' },
      { id:'f_armor',    product:'护腕',   mats:{'剑胚矿石':2,'兽皮':1}, rate:0.55, failLoss:'half' },
      { id:'f_mingqi',   product:'飞剑·云水', mats:{'玄铁':1,'陨铁':1}, rate:0.4, failLoss:'half' }
    ]},
    'alchemy':  { name:'炼丹', executor:'jl2_forge', recipes:[
      { id:'a_jinchuang', product:'疗伤丹', mats:{'草药':2}, rate:0.8, failLoss:'half' },
      { id:'a_huichun',   product:'聚气丹', mats:{'草药':2,'仙家雪莲':1}, rate:0.65, failLoss:'half' },
      { id:'a_huanhun',   product:'还魂丹', mats:{'仙家雪莲':1,'妖血':1}, rate:0.45, failLoss:'half' }
    ]},
    'cook':     { name:'烹饪', executor:'jl2_forge', recipes:[
      { id:'c_kaorou',  product:'干粮',   mats:{'兽皮':1}, rate:0.9, failLoss:'half' },
      { id:'c_jiu',     product:'补气散', mats:{'仙酿':1,'草药':1}, rate:0.8, failLoss:'half' },
      { id:'c_yaoshan', product:'疗伤丹', mats:{'兽皮':1,'仙酿':1,'草药':1}, rate:0.75, failLoss:'half' }
    ]},
    'talisman': { name:'制符', executor:'jl2_forge', recipes:[
      { id:'t_zhensha', product:'护身符', mats:{'符纸':2,'朱砂':1}, rate:0.7, failLoss:'half' },
      { id:'t_yinlei',  product:'雷符',   mats:{'符纸':2,'朱砂':2}, rate:0.5, failLoss:'half' },
      { id:'t_suifu',   product:'符箓',   mats:{'符纸':1,'朱砂':1,'桃木':1}, rate:0.45, failLoss:'half' }
    ]},
    'weave':    { name:'织造', executor:'jl2_forge', recipes:[
      { id:'w_buyi',   product:'布衣', mats:{'剑穗':2,'兽皮':1}, rate:0.85, failLoss:'half' },
      { id:'w_sipao',  product:'法袍', mats:{'剑穗':2,'灵木':1}, rate:0.7, failLoss:'half' },
      { id:'w_daopao', product:'道袍', mats:{'剑穗':2,'陨铁':1,'桃木':1}, rate:0.55, failLoss:'half' }
    ]}
  };

  /* ─── 自愈兜底：把采集库存写进 game.world.rooms[room].resource ── */
  function ensureWorld() {
    try {
      if (!isObj(G.game)) return null;
      if (!isObj(G.game.world)) G.game.world = {};
      if (!isObj(G.game.world.rooms)) G.game.world.rooms = {};
      return G.game.world.rooms;
    } catch (e) { err('ensureWorld', e); return null; }
  }
  function resourceOf(room) {
    var rooms = ensureWorld();
    if (!rooms) return null;
    var key = String(room);
    if (!isObj(rooms[key])) rooms[key] = {};
    if (!isObj(rooms[key].resource)) {
      // 首次到达即满库存，读档时若已有 resource 则沿用其状态。
      var spot = SPOTS[key];
      var mx = spot ? num(spot.max, 1) : 0;
      var now = G.game ? num(G.game.turns, 0) : 0;
      rooms[key].resource = { spot:key, stock:mx, max:mx, lastTurn:now, updated:now };
    }
    return rooms[key].resource;
  }

  /* ─── 价格供需模型：产地近则便宜，稀缺则贵，买卖价分离 ───────── */
  function jl2_priceOf(name, ctx) {
    try {
      var info = jl2_materialInfo(name);
      if (!info) return null;
      ctx = isObj(ctx) ? ctx : {};
      var bp = num(info.basePrice, 10);
      var gIdx = { '下':0, '中':1, '上':2, '绝':3 }[info.grade];
      if (gIdx === undefined) gIdx = 0;
      var scarcity = 1 + gIdx * 0.22;                       // 品质越高越贵
      var market = 1 + (num(info.demand, 0) - num(info.supply, 0)) * 0.05; // 需大于供则涨
      var near = !!(ctx.room && info.from.indexOf(String(ctx.room)) >= 0);
      var buy = Math.max(1, Math.round(bp * scarcity * clamp(market, 0.6, 2.2) * (near ? 0.85 : 1)));
      var sell = Math.max(1, Math.round(buy * 0.55));       // 卖出明显低于买入，防刷差价
      return { buy:buy, sell:sell, base:bp, near:near, grade:info.grade };
    } catch (e) { err('priceOf', e); return null; }
  }

  /* ─── 对外：材料信息 ───────────────────────────────────────── */
  function jl2_materialInfo(name) {
    try {
      var key = String(name);
      if (isObj(MAT[key])) {
        var m = MAT[key];
        return {
          grade:m.grade, from:m.from.slice(),
          regen:{ turns:m.regen.turns, max:m.regen.max },
          uses:m.uses.slice(), basePrice:m.basePrice,
          supply:m.supply, demand:m.demand
        };
      }
      // 兼容 progression2.js 的加工材料（若已加载）：转成同结构，不修改其数据。
      if (typeof G.jl2_materialData === 'function') {
        var d = G.jl2_materialData(key);
        if (d) {
          return {
            grade:d.grade || '下', from:(d.from || []).slice(),
            regen:{ turns:(d.regen && d.regen.turns) || 30, max:(d.regen && d.regen.max) || 1 },
            uses:(d.use || []).slice(), basePrice:num(d.price, 10),
            supply:3, demand:5
          };
        }
      }
      return null;
    } catch (e) { err('materialInfo', e); return null; }
  }

  /* ─── 对外：采集点规则（含当前库存与冷却） ──────────────────── */
  function jl2_gatherRules(roomName) {
    try {
      var key = String(roomName);
      var s = SPOTS[key];
      if (!s) return { room:key, materials:[], max:0, regenTurns:0, quality:{}, remaining:0, wait:0, emptyHint:'（此地无可采之物，换一处试试。）' };
      var turn = G.game ? num(G.game.turns, 0) : 0;
      var res = resourceOf(key);
      var stock = res ? num(res.stock, 0) : 0;
      var lastTurn = res ? num(res.lastTurn, 0) : 0;
      if (stock <= 0 && turn - lastTurn >= num(s.regen, 10)) {
        stock = num(s.max, 1);
        if (res) { res.stock = stock; res.lastTurn = turn; res.updated = turn; }
      }
      var wait = stock <= 0 ? Math.max(1, num(s.regen, 10) - (turn - lastTurn)) : 0;
      var list = s.materials.map(function (n, i) {
        var md = isObj(MAT[n]) ? MAT[n] : null;
        return { name:n, grade:md ? md.grade : '下', weight:num(s.weights[i], 1) };
      });
      return {
        room:key, materials:list, max:num(s.max, 1), regenTurns:num(s.regen, 10),
        quality:{ '下':s.quality['下'], '中':s.quality['中'], '上':s.quality['上'], '绝':s.quality['绝'] },
        remaining:stock, wait:wait, empty:stock <= 0, emptyHint:s.emptyHint
      };
    } catch (e) { err('gatherRules', e); return null; }
  }

  function weightedPick(items, weights) {
    var total = 0, i;
    for (i = 0; i < weights.length; i++) total += Math.max(0, num(weights[i], 0));
    if (total <= 0) return 0;
    var r = Math.random() * total, acc = 0;
    for (i = 0; i < items.length; i++) {
      acc += Math.max(0, num(weights[i], 0));
      if (r < acc) return i;
    }
    return items.length - 1;
  }

  /* ─── 对外：执行一次采集（原子操作，改背包并发事件） ─────────── */
  function jl2_gather(roomName, opts) {
    try {
      opts = isObj(opts) ? opts : {};
      var rules = jl2_gatherRules(roomName);
      if (!rules || !rules.materials.length) return { ok:false, msg:'（此地无可采之物。）' };
      if (rules.remaining <= 0) {
        return { ok:false, wait:rules.wait, msg:'（此处已采空，还需 ' + rules.wait + ' 回合再生。）' + rules.emptyHint };
      }
      var idx;
      if (opts.material) {
        idx = -1;
        for (var k = 0; k < rules.materials.length; k++) if (rules.materials[k].name === opts.material) { idx = k; break; }
        if (idx < 0) return { ok:false, msg:'（此地不产“' + opts.material + '”。）' };
      } else {
        idx = weightedPick(rules.materials, SPOTS[String(roomName)].weights);
      }
      var chosen = rules.materials[idx];
      var q = SPOTS[String(roomName)].quality;
      var qi = weightedPick(['下','中','上','绝'], [q['下'], q['中'], q['上'], q['绝']]);
      var quality = ['下','中','上','绝'][qi];

      var res = resourceOf(roomName);
      var turn = G.game ? num(G.game.turns, 0) : 0;
      res.stock = Math.max(0, num(res.stock, 0) - 1);
      res.updated = turn;
      if (res.stock <= 0) res.lastTurn = turn;

      if (typeof G.addItem === 'function') { try { G.addItem(chosen.name); } catch (e) { err('gather.addItem', e); } }
      emitItem(chosen.name, 1, 'gather', { room:String(roomName), quality:quality });

      var msg = '（采得“' + chosen.name + '”×1（' + quality + '品），此处余 ' + res.stock + '。）';
      if (res.stock <= 0) msg += rules.emptyHint;
      return { ok:true, material:chosen.name, quality:quality, stock:res.stock, msg:msg };
    } catch (e) { err('gather', e); return { ok:false, msg:'（采集出错，已记录。）' }; }
  }

  /* ─── 对外：五类消耗规则 ───────────────────────────────────── */
  function jl2_consumeRules(kind) {
    try {
      if (kind === undefined || kind === null || kind === '') {
        var all = {};
        Object.keys(CRAFT).forEach(function (k) { all[k] = jl2_consumeRules(k); });
        return all;
      }
      var c = CRAFT[String(kind)];
      if (!c) return null;
      return {
        kind:String(kind), name:c.name, executor:c.executor,
        recipes:c.recipes.map(function (r) {
          var mats = {}; Object.keys(r.mats).forEach(function (m) { mats[m] = r.mats[m]; });
          return { id:r.id, product:r.product, mats:mats, rate:r.rate, failLoss:r.failLoss };
        })
      };
    } catch (e) { err('consumeRules', e); return null; }
  }

  /* ─── 对外：扣除材料并广播 craft 事件（不产出成品，成品由 jl2_forge 负责） ── */
  function jl2_consumeMats(mats, opts) {
    try {
      opts = isObj(opts) ? opts : {};
      if (!isObj(mats)) return { ok:false, msg:'（材料参数有误。）' };
      var removed = [];
      Object.keys(mats).forEach(function (name) {
        var n = Math.max(0, Math.floor(num(mats[name], 0)));
        for (var i = 0; i < n; i++) {
          if (typeof G.removeItem === 'function') { try { G.removeItem(name); } catch (e) { err('consume.remove', e); } }
          emitItem(name, -1, 'craft', { kind:opts.kind || '' });
          removed.push(name);
        }
      });
      return { ok:true, removed:removed };
    } catch (e) { err('consumeMats', e); return { ok:false, msg:'（消耗出错，已记录。）' }; }
  }

  /* ─── 对外：回合再生推进（按 game.turns 计算，读档不丢） ─────── */
  function jl2_regenTick() {
    try {
      var rooms = ensureWorld();
      if (!rooms) return 0;
      var turn = G.game ? num(G.game.turns, 0) : 0;
      var filled = 0;
      Object.keys(SPOTS).forEach(function (room) {
        var res = rooms[room] && rooms[room].resource;
        if (!res) return;
        var spot = SPOTS[room];
        if (num(res.stock, 0) < num(spot.max, 1) && turn - num(res.lastTurn, 0) >= num(spot.regen, 10)) {
          res.stock = num(spot.max, 1);
          res.lastTurn = turn;
          res.updated = turn;
          filled++;
        }
      });
      return filled;
    } catch (e) { err('regenTick', e); return 0; }
  }

  /* ─── 初始化：自愈兜底 + 注册事件订阅 ─────────────────────── */
  function jl2_materialsInit() {
    var errs = [];
    try { ensureWorld(); } catch (e) { errs.push('world'); err('init.world', e); }
    try {
      if (typeof G.jl2_on === 'function') {
        // 回合推进时补货；payload.turn 由事件总线自动注入。
        G.jl2_on('turn', function () { try { jl2_regenTick(); } catch (e) { err('on.turn', e); } });
        // 进入房间时惰性补货，使玩家一到产地即见库存刷新。
        G.jl2_on('enter', function (p) {
          try { if (p && p.room && SPOTS[String(p.room)]) jl2_gatherRules(p.room); } catch (e) { err('on.enter', e); }
        });
      }
    } catch (e) { errs.push('on'); err('init.on', e); }
    return { ok:errs.length === 0, errs:errs, materials:Object.keys(MAT).length, spots:Object.keys(SPOTS).length };
  }

  /* ─── 导出 ─────────────────────────────────────────────────── */
  G.jl2_materialsInit = jl2_materialsInit;
  G.jl2_materialInfo = jl2_materialInfo;
  G.jl2_gatherRules = jl2_gatherRules;
  G.jl2_consumeRules = jl2_consumeRules;
  G.jl2_priceOf = jl2_priceOf;
  G.jl2_gather = jl2_gather;
  G.jl2_consumeMats = jl2_consumeMats;
  G.jl2_regenTick = jl2_regenTick;
})();
