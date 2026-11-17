//<<QUEST2-BEGIN>>
/*
 * quest2.js —— JL2 任务引擎：事件总线 + QuestDef 2.0 状态机
 *
 * 只读依赖（均来自 index.html，均做存在性兜底）：
 *   game player QUESTS GEN_QUESTS JL2_CONTENT(可选)
 *   log logQuest logSuccess renderMap updateSidebar countItem addItem removeItem gainAff
 * 可选协作模块：
 *   jl2_reward(rewardObj, ctx)       -> 中文摘要；不存在则直接加数值
 *   jl2_dialogueEffects(effects)     -> 结算 effects；不存在则本地结算
 *   WORLD_ON(type, payload)          -> 世界状态订阅（方案 §4.1）
 *
 * 铁律：所有新全局函数 jl2_ 前缀；不重定义任何现有全局；无 import/export/require；
 *       代码字符串用 ASCII 直引号；中文正文用中文引号“”；出错写 window.__bootErrs。
 */
(function (root) {
  'use strict';

  var G = root || (typeof globalThis !== 'undefined' ? globalThis : this);

  /* ============================================================
   * 0. 基础设施
   * ========================================================== */
  var _subs = [];      // 事件订阅表 [{type, fn}]
  var _adapted = {};   // 旧任务适配缓存 {id: def}
  var _seen = {};      // 事件去重 {questId#eid: 1}
  var _eid = 0;        // 事件自增序号
  var _advancing = {}; // 状态机重入保护 {questId: true}：reward 等事件在结算中同步回抛时防自激

  function jl2_err(where, e) {
    try {
      if (!G.__bootErrs) G.__bootErrs = [];
      G.__bootErrs.push('[quest2] ' + where + ': ' + ((e && e.message) || e));
    } catch (_) { /* 最后一道防线，绝不再抛 */ }
  }

  function jl2_safe(label, fn) {
    try { return fn(); }
    catch (e) { jl2_err(label, e); return undefined; }
  }

  function jl2_game() { return (typeof game !== 'undefined') ? game : null; }
  function jl2_player() { return (typeof player !== 'undefined') ? player : null; }

  // 契约写 game.turns，现有存档实际字段是 game.turns —— 两者兼容。
  function jl2_turn() {
    var g = jl2_game();
    if (!g) return 0;
    if (typeof g.turns === 'number') return g.turns;
    if (typeof g.turn === 'number') return g.turn;
    return 0;
  }

  function jl2_fn(name) {
    try { return (typeof G[name] === 'function') ? G[name] : null; }
    catch (e) { return null; }
  }

  function jl2_log(text, cls) {
    var f = jl2_fn('log');
    if (f) f(text, cls || 'sys');
  }
  function jl2_logQuest(text) {
    var f = jl2_fn('logQuest');
    if (f) f(text); else jl2_log(text, 'quest');
  }
  function jl2_logSuccess(text) {
    var f = jl2_fn('logSuccess');
    if (f) f(text); else jl2_log(text, 'success');
  }
  function jl2_refreshUI() {
    jl2_safe('renderMap', function () { var f = jl2_fn('renderMap'); if (f) f(); });
    jl2_safe('updateSidebar', function () { var f = jl2_fn('updateSidebar'); if (f) f(); });
  }

  function jl2_countItem(name) {
    var f = jl2_fn('countItem');
    if (f) return f(name) || 0;
    var p = jl2_player();
    if (!p || !p.inventory) return 0;
    var n = 0;
    for (var i = 0; i < p.inventory.length; i++) if (p.inventory[i] === name) n++;
    return n;
  }
  function jl2_addItem(name, n) {
    n = (typeof n === 'number' && n > 0) ? n : 1;
    var f = jl2_fn('addItem'), p = jl2_player();
    for (var i = 0; i < n; i++) {
      if (f) f(name);
      else if (p && p.inventory) p.inventory.push(name);
    }
  }
  function jl2_removeItem(name, n) {
    n = (typeof n === 'number' && n > 0) ? n : 1;
    var f = jl2_fn('removeItem'), p = jl2_player();
    for (var i = 0; i < n; i++) {
      if (f) f(name);
      else if (p && p.inventory) {
        var at = p.inventory.indexOf(name);
        if (at > -1) p.inventory.splice(at, 1);
      }
    }
  }
  function jl2_gainAff(npc, delta) {
    if (!npc || !delta) return;
    var f = jl2_fn('gainAff');
    if (f) { f(npc, delta); return; }
    var p = jl2_player();
    if (!p) return;
    if (!p.aff) p.aff = {};
    p.aff[npc] = Math.max(0, (p.aff[npc] || 0) + delta);
  }

  function jl2_match(a, b) {
    if (b === undefined || b === null || b === '') return true;
    if (Array.isArray(b)) {
      for (var i = 0; i < b.length; i++) if (String(b[i]) === String(a)) return true;
      return false;
    }
    return String(a) === String(b);
  }
  function jl2_inList(t, list) {
    if (!Array.isArray(list)) return false;
    for (var i = 0; i < list.length; i++) {
      var alt = list[i];
      if (typeof alt === 'string' && alt === t) return true;
      if (alt && typeof alt === 'object' && alt.type === t) return true;
    }
    return false;
  }

  /* ============================================================
   * 1. 事件总线（方案 §4.1）
   * ========================================================== */
  function jl2_on(type, fn) {
    try {
      if (typeof type !== 'string' || typeof fn !== 'function') return null;
      var sub = { type: type, fn: fn };
      _subs.push(sub);
      return function jl2_off() {
        var at = _subs.indexOf(sub);
        if (at > -1) _subs.splice(at, 1);
      };
    } catch (e) { jl2_err('jl2_on', e); return null; }
  }

  function jl2_emit(type, payload) {
    try {
      if (!payload || typeof payload !== 'object') payload = {};
      if (payload.turn == null) payload.turn = jl2_turn();
      // 同时提供 turns 别名：引导/材料等模块按此字段读回合数
      payload.turns = payload.turn;

      // 新总线订阅（'*' 订阅者任意事件都能收到）
      var list = _subs.slice();
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        if (s.type === '*' || s.type === type) {
          try { s.fn(type, payload); }
          catch (e) { jl2_err('订阅者[' + s.type + '] 处理 ' + type, e); }
        }
      }

      // 兼容旧式 game._qsub 订阅（单条出错隔离）
      var g = jl2_game();
      if (g && Array.isArray(g._qsub)) {
        var old = g._qsub.slice();
        for (var j = 0; j < old.length; j++) {
          if (typeof old[j] !== 'function') continue;
          try { old[j](type, payload); }
          catch (e2) { jl2_err('_qsub[' + j + '] 处理 ' + type, e2); }
        }
      }

      // 世界状态订阅（方案 §4.1）
      if (typeof WORLD_ON === 'function') {
        try { WORLD_ON(type, payload); }
        catch (e3) { jl2_err('WORLD_ON ' + type, e3); }
      }
      return payload;
    } catch (e) { jl2_err('jl2_emit ' + type, e); return payload; }
  }

  /* ============================================================
   * 2. QuestLog 运行时读写（方案 §4.4，全字段自愈）
   * ========================================================== */
  function jl2_qlog() {
    try {
      var g = jl2_game();
      if (!g) return null;
      if (!g.qlog || typeof g.qlog !== 'object' || Array.isArray(g.qlog)) g.qlog = {};
      var q = g.qlog;
      if (!q.active || typeof q.active !== 'object' || Array.isArray(q.active)) q.active = {};
      if (!q.done || typeof q.done !== 'object' || Array.isArray(q.done)) q.done = {};
      if (!q.failed || typeof q.failed !== 'object' || Array.isArray(q.failed)) q.failed = {};
      if (!q.daily || typeof q.daily !== 'object' || Array.isArray(q.daily)) q.daily = {};
      if (!Array.isArray(q.track)) q.track = [];
      return q;
    } catch (e) { jl2_err('jl2_qlog', e); return null; }
  }

  function jl2_active(id) {
    try {
      var q = jl2_qlog();
      if (!q || !id) return null;
      var a = q.active[id];
      if (!a || typeof a !== 'object' || Array.isArray(a)) {
        a = {};
        q.active[id] = a;
      }
      var now = jl2_turn();
      if (typeof a.stage !== 'number') a.stage = 0;
      if (!a.prog || typeof a.prog !== 'object' || Array.isArray(a.prog)) a.prog = {};
      if (typeof a.startedAt !== 'number') a.startedAt = now;
      if (typeof a.stageAt !== 'number') a.stageAt = now;
      if (!a.flags || typeof a.flags !== 'object' || Array.isArray(a.flags)) a.flags = {};
      if (a.branch === undefined) a.branch = null;
      return a;
    } catch (e) { jl2_err('jl2_active ' + id, e); return null; }
  }

  function jl2_trackAdd(id) {
    try {
      var q = jl2_qlog();
      if (!q || !id) return;
      if (q.track.indexOf(id) > -1) return;
      q.track.push(id);
      while (q.track.length > 3) q.track.shift();
    } catch (e) { jl2_err('jl2_trackAdd ' + id, e); }
  }
  function jl2_trackRemove(id) {
    try {
      var q = jl2_qlog();
      if (!q) return;
      var at = q.track.indexOf(id);
      if (at > -1) q.track.splice(at, 1);
    } catch (e) { jl2_err('jl2_trackRemove ' + id, e); }
  }
  function jl2_today() {
    try { return new Date().toISOString().slice(0, 10); }
    catch (e) { return '1970-01-01'; }
  }
  function jl2_dailyRoll(q) {
    try {
      if (!q || !q.daily) return;
      var today = jl2_today();
      if (q.daily.date !== today) { q.daily.date = today; q.daily.done = []; }
      if (!Array.isArray(q.daily.done)) q.daily.done = [];
    } catch (e) { jl2_err('jl2_dailyRoll', e); }
  }

  /* ============================================================
   * 3. 旧任务降级适配（方案 §12.1 / 附录 A，446 条零改写）
   * ========================================================== */
  function jl2_nodeToStage(node, sid, q, legacy) {
    node = node || {};
    var type = node.type || 'talk';
    var what = (node.what !== undefined && node.what !== null) ? node.what : (node.name || '');
    var need = (typeof node.need === 'number' && node.need > 0) ? node.need : 1;
    var s = {
      id: node.id || sid,
      type: type,
      need: need,
      desc: node.label || node.desc || q.desc || '',
      hint: node.hint || '',
      _legacy: !!legacy
    };
    if (type === 'kill') {
      s.enemy = what;
      // 方案 §4.3 红线：kill 阶段必须附非战斗路径
      s.alt = node.alt || ['下毒', '引兽相斗', '买通山匪'];
    } else if (type === 'collect' || type === 'item') {
      s.type = 'collect';
      s.item = what;
    } else if (type === 'reach') {
      s.room = what;
    } else if (type === 'talk') {
      s.npc = what;
      s.topic = node.topic || '';
    } else if (type === 'deliver') {
      s.item = what;
      s.to = node.to || q.turnin || q.giver || '';
    } else {
      s.what = what;
    }
    if (node.reward) s.reward = node.reward;
    if (node.effects) s.effects = node.effects;
    return s;
  }

  function jl2_adaptLegacy(q, forcedId) {
    try {
      if (!q || typeof q !== 'object') return null;
      var id = q.id || forcedId || '';
      if (id && _adapted[id] && _adapted[id].__jl2) return _adapted[id];

      // 已是 QuestDef 2.0：补齐 id 后原样返回
      if (Array.isArray(q.stages) && q.stages.length) {
        if (!q.id && id) q.id = id;
        if (id) _adapted[id] = q;
        return q;
      }

      var t = q.target || {};
      var stages = [];
      if (t.type === 'chain' && Array.isArray(t.nodes)) {
        for (var i = 0; i < t.nodes.length; i++) stages.push(jl2_nodeToStage(t.nodes[i], 's' + i, q, true));
      } else {
        stages.push(jl2_nodeToStage(t, 's0', q, true));
      }

      var cat = q.cat;
      if (cat === '主线') cat = 'main';
      else if (cat === '日常' || q.daily) cat = 'daily';
      else if (cat === '支线') cat = 'side';
      else cat = cat || 'side';

      // 附录 A：旧 reward{item} 归一为新 reward{items:[{name,n}]}
      var reward = {};
      if (q.reward && typeof q.reward === 'object') {
        for (var rk in q.reward) {
          if (Object.prototype.hasOwnProperty.call(q.reward, rk) && rk !== 'item') reward[rk] = q.reward[rk];
        }
        if (q.reward.item && !reward.items) {
          reward.items = Array.isArray(q.reward.item)
            ? q.reward.item.map(function (n) { return { name: n, n: 1 }; })
            : [{ name: q.reward.item, n: 1 }];
        }
      }

      var d = {
        __jl2: true,
        _legacy: true,
        id: id,
        cat: cat,
        title: q.title || id || '无名委托',
        giver: q.giver || q.turnin || '',
        turnin: q.turnin || q.giver || '',
        hook: q.hook || q.desc || '',
        desc: q.desc || '',
        levelReq: q.levelReq || 0,
        stages: stages,
        reward: reward,
        once: !!q.once,
        repeat: q.repeat || 0,
        _legacyTarget: t
      };
      // 保留旧对白内容与新扩展字段：由对话引擎包装成临时节点图，绝不丢内容、不改写
      var carry = ['acceptLines', 'acceptOptions', 'turnLines', 'turnOptions', 'dialogue', 'auto',
        'ttl', 'daily', 'fail', 'branch', 'world', 'lock', 'cooldown', 'knowledge'];
      for (var c = 0; c < carry.length; c++) {
        if (q[carry[c]] !== undefined) d[carry[c]] = q[carry[c]];
      }
      if (q.ttl && !d.fail) d.fail = { type: 'time', turns: q.ttl, penalty: {} };
      if (id) _adapted[id] = d;
      return d;
    } catch (e) { jl2_err('jl2_adaptLegacy ' + (forcedId || ''), e); return null; }
  }

  function jl2_questDef(id) {
    try {
      if (id === undefined || id === null || id === '') return null;
      if (_adapted[id] && _adapted[id].__jl2) return _adapted[id];
      var tables = [];
      if (typeof JL2_CONTENT !== 'undefined' && JL2_CONTENT && JL2_CONTENT.quests) tables.push(JL2_CONTENT.quests);
      if (typeof QUESTS !== 'undefined' && QUESTS) tables.push(QUESTS);
      if (typeof GEN_QUESTS !== 'undefined' && GEN_QUESTS) tables.push(GEN_QUESTS);
      for (var i = 0; i < tables.length; i++) {
        var q = tables[i][id];
        if (q) return jl2_adaptLegacy(q, id) || q;
      }
    } catch (e) { jl2_err('jl2_questDef ' + id, e); }
    return null;
  }

  function jl2_stages(def) {
    if (!def) return [];
    if (Array.isArray(def.stages) && def.stages.length) {
      for (var i = 0; i < def.stages.length; i++) {
        if (!def.stages[i]) def.stages[i] = { id: 's' + i, type: 'talk', need: 1 };
        if (!def.stages[i].id) def.stages[i].id = 's' + i;
      }
      return def.stages;
    }
    var ad = jl2_adaptLegacy(def, def.id);
    return ad && Array.isArray(ad.stages) ? ad.stages : [];
  }

  function jl2_stageIndex(def, sid) {
    var stages = jl2_stages(def);
    for (var i = 0; i < stages.length; i++) if (stages[i].id === sid) return i;
    return -1;
  }

  function jl2_findChoice(stage, branch) {
    var list = (stage && stage.choices) || [];
    if (branch === undefined || branch === null || branch === '') {
      return list.length === 1 ? list[0] : null;
    }
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (c.id === branch || c.branch === branch || c.key === branch ||
          c.text === branch || String(i) === String(branch)) return c;
    }
    return null;
  }

  /* ============================================================
   * 4. effects / branch / reward / world 结算
   * ========================================================== */
  function jl2_applyEffectsLocal(effects, ctx) {
    if (!Array.isArray(effects)) return;
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      if (!e || typeof e !== 'object') continue;
      try {
        if (e.aff) {
          if (Array.isArray(e.aff)) jl2_gainAff(e.aff[0], e.aff[1]);
          else if (typeof e.aff === 'object') {
            for (var an in e.aff) if (Object.prototype.hasOwnProperty.call(e.aff, an)) jl2_gainAff(an, e.aff[an]);
          }
        }
        if (e.flag) {
          var g0 = jl2_game();
          if (g0) {
            if (!g0.flags) g0.flags = {};
            if (Array.isArray(e.flag)) g0.flags[e.flag[0]] = (e.flag.length > 1 ? e.flag[1] : true);
            else if (typeof e.flag === 'object') {
              for (var fk in e.flag) if (Object.prototype.hasOwnProperty.call(e.flag, fk)) g0.flags[fk] = e.flag[fk];
            } else g0.flags[e.flag] = true;
          }
        }
        if (typeof e.gold === 'number') { var p1 = jl2_player(); if (p1) p1.gold = (p1.gold || 0) + e.gold; }
        if (typeof e.exp === 'number') { var p2 = jl2_player(); if (p2) p2.exp = (p2.exp || 0) + e.exp; }
        if (typeof e.fame === 'number') { var g1 = jl2_game(); if (g1) g1.fame = (g1.fame || 0) + e.fame; }
        if (typeof e.potential === 'number') { var p3 = jl2_player(); if (p3) p3.potential = (p3.potential || 0) + e.potential; }
        if (e.item) jl2_addItem(e.item, 1);
        if (Array.isArray(e.items)) {
          for (var j = 0; j < e.items.length; j++) {
            var it = e.items[j];
            jl2_addItem((it && it.name) || it, (it && it.n) || 1);
          }
        }
        if (Array.isArray(e.unlock)) {
          var g2 = jl2_game();
          if (g2) {
            if (!g2.questOpen) g2.questOpen = {};
            for (var u = 0; u < e.unlock.length; u++) g2.questOpen[e.unlock[u]] = true;
          }
        }
      } catch (err) { jl2_err('jl2_applyEffectsLocal#' + i, err); }
    }
  }

  function jl2_applyEffects(effects, ctx) {
    if (!Array.isArray(effects)) return;
    var gotoId = null;
    for (var i = 0; i < effects.length; i++) {
      if (effects[i] && effects[i].goto) gotoId = effects[i].goto;
    }
    // 优先交给对话引擎统一结算（契约指定）
    var df = (typeof jl2_dialogueEffects === 'function') ? jl2_dialogueEffects :
             ((typeof G.jl2_dialogueEffects === 'function') ? G.jl2_dialogueEffects : null);
    if (df) {
      try { df(effects); }
      catch (e) { jl2_err('jl2_dialogueEffects', e); jl2_applyEffectsLocal(effects, ctx); }
    } else {
      jl2_applyEffectsLocal(effects, ctx);
    }
    // goto 属于状态机控制，始终由本模块处理
    if (gotoId && ctx && ctx.a && ctx.def) jl2_gotoStage(ctx.def, ctx.a, gotoId);
  }

  function jl2_payCost(cost) {
    if (!cost || typeof cost !== 'object') return;
    try {
      if (typeof cost.gold === 'number') {
        var p = jl2_player();
        if (p) p.gold = (p.gold || 0) - cost.gold;
      }
      if (cost.item) jl2_removeItem(cost.item, 1);
      if (Array.isArray(cost.items)) {
        for (var i = 0; i < cost.items.length; i++) {
          var it = cost.items[i];
          jl2_removeItem((it && it.name) || it, (it && it.n) || 1);
        }
      }
    } catch (e) { jl2_err('jl2_payCost', e); }
  }

  function jl2_rewardFallback(reward) {
    try {
      var bits = [];
      var p = jl2_player(), g = jl2_game();
      if (typeof reward.exp === 'number' && p) { p.exp = (p.exp || 0) + reward.exp; bits.push('经验 +' + reward.exp); }
      if (typeof reward.gold === 'number' && p) { p.gold = (p.gold || 0) + reward.gold; bits.push('银两 +' + reward.gold); }
      if (typeof reward.potential === 'number' && p) { p.potential = (p.potential || 0) + reward.potential; bits.push('潜力 +' + reward.potential); }
      if (typeof reward.fame === 'number' && g) { g.fame = (g.fame || 0) + reward.fame; bits.push('声望 +' + reward.fame); }
      if (Array.isArray(reward.items)) {
        for (var i = 0; i < reward.items.length; i++) {
          var it = reward.items[i];
          if (!it) continue;
          var nm = it.name || it, n = it.n || 1;
          jl2_addItem(nm, n);
          bits.push(nm + ' ×' + n);
        }
      }
      if (reward.aff && typeof reward.aff === 'object') {
        for (var an in reward.aff) {
          if (!Object.prototype.hasOwnProperty.call(reward.aff, an)) continue;
          jl2_gainAff(an, reward.aff[an]);
          bits.push(an + ' 好感 ' + reward.aff[an]);
        }
      }
      if (reward.skill && p && p.skills && p.skills.indexOf(reward.skill) < 0) {
        p.skills.push(reward.skill);
        bits.push('习得 ' + reward.skill);
      }
      if (reward.title && p) { p.title = reward.title; bits.push('称号 ' + reward.title); }
      if (Array.isArray(reward.unlock) && g) {
        if (!g.questOpen) g.questOpen = {};
        for (var u = 0; u < reward.unlock.length; u++) g.questOpen[reward.unlock[u]] = true;
      }
      if (Array.isArray(reward.knowledge) && g) {
        if (!g.info) g.info = {};
        if (!Array.isArray(g.info.knowledge)) g.info.knowledge = [];
        for (var k = 0; k < reward.knowledge.length; k++) {
          if (g.info.knowledge.indexOf(reward.knowledge[k]) < 0) g.info.knowledge.push(reward.knowledge[k]);
        }
      }
      return bits.length ? ('（' + bits.join('、') + '）') : '';
    } catch (e) { jl2_err('jl2_rewardFallback', e); return ''; }
  }

  function jl2_grantReward(reward, ctx) {
    if (!reward || typeof reward !== 'object') return '';
    // 优先统一奖励分发（另一模块提供）
    var rf = (typeof jl2_reward === 'function') ? jl2_reward :
             ((typeof G.jl2_reward === 'function') ? G.jl2_reward : null);
    if (rf) {
      try {
        var s = rf(reward, ctx);
        return (typeof s === 'string') ? s : jl2_rewardFallback(reward);
      } catch (e) {
        jl2_err('jl2_reward', e);
        return jl2_rewardFallback(reward); // 降级：直接加数值
      }
    }
    return jl2_rewardFallback(reward);
  }

  function jl2_applyWorld(w) {
    if (!w || typeof w !== 'object') return;
    try {
      var g = jl2_game();
      if (!g) return;
      if (w.setFlags) {
        if (!g.flags) g.flags = {};
        for (var f in w.setFlags) if (Object.prototype.hasOwnProperty.call(w.setFlags, f)) g.flags[f] = w.setFlags[f];
      }
      if (w.npcState) {
        if (!g.world) g.world = {};
        if (!g.world.npc) g.world.npc = {};
        for (var n in w.npcState) if (Object.prototype.hasOwnProperty.call(w.npcState, n)) g.world.npc[n] = w.npcState[n];
      }
      if (w.roomState) {
        if (!g.world) g.world = {};
        if (!g.world.rooms) g.world.rooms = {};
        for (var r in w.roomState) if (Object.prototype.hasOwnProperty.call(w.roomState, r)) g.world.rooms[r] = w.roomState[r];
      }
    } catch (e) { jl2_err('jl2_applyWorld', e); }
  }

  /* ============================================================
   * 5. 14 种 Stage 完成判定（方案 §4.3）
   * ========================================================== */
  function jl2_stageDone(id, def, a, stage, ev, sid) {
    var g = jl2_game(), p = jl2_player();
    var need = (typeof stage.need === 'number' && stage.need > 0) ? stage.need : 1;
    var pr = a.prog[sid] || (a.prog[sid] = {});
    var done = false;
    var t = (ev && (ev.type || ev.t)) || '';
    var nameOf = (ev && (ev.enemy || ev.what || ev.name || ev.item || '')) || '';

    function bump() { pr.n = (pr.n || 0) + 1; }

    switch (stage.type) {
      case 'kill': {
        // 战斗路径 + alt 非战斗路径（下毒/引兽相斗/买通/技能/抉择）
        var enemy = stage.enemy || stage.what || '';
        if (t === 'kill' || t === 'battle_end') {
          if ((!enemy || jl2_match(nameOf, enemy)) && (t !== 'battle_end' || ev.win !== false)) bump();
        } else if (ev && ev.altKill && (!enemy || jl2_match(ev.altKill, enemy))) bump();
        else if (t === 'choice' && ev.altFor && (!enemy || jl2_match(ev.altFor, enemy))) bump();
        else if (stage.alt && jl2_inList(t, stage.alt) && (!enemy || jl2_match(nameOf, enemy))) bump();
        done = (pr.n || 0) >= need;
        // 旧任务按 player.kills 累计计数，保证 446 条旧任务零改写可跑
        if (!done && stage._legacy && p && p.kills && (p.kills[enemy] || 0) >= need) done = true;
        break;
      }
      case 'collect': {
        // 背包内数量即权威，买/换/偷等非战斗路径天然生效
        done = jl2_countItem(stage.item || stage.what) >= need;
        break;
      }
      case 'talk': {
        var npc = stage.npc || stage.what || '';
        if (t === 'talk' && (!npc || jl2_match(ev.npc || ev.who, npc)) &&
            (!stage.topic || ev.topic === stage.topic)) pr.n = 1;
        if (g && g.flags && g.flags['qTalk_' + id]) pr.n = 1; // 旧版拜会标记
        done = (pr.n || 0) >= 1;
        break;
      }
      case 'reach': {
        var room = stage.room || stage.what || '';
        if (t === 'enter' && (!room || jl2_match(ev.room || ev.what, room))) pr.n = 1;
        if (p && p.room === room) pr.n = 1;
        if (g && g.flags && g.flags['qReach_' + id]) pr.n = 1; // 旧版抵达标记
        done = (pr.n || 0) >= 1;
        break;
      }
      case 'deliver': {
        var to = stage.to || stage.turnin || '';
        if ((t === 'deliver' || t === 'gift' || t === 'talk') &&
            (!to || jl2_match(ev.to || ev.npc || ev.who, to)) &&
            (!stage.item || jl2_match(ev.item || ev.what, stage.item))) bump();
        done = (pr.n || 0) >= need;
        break;
      }
      case 'escort': {
        if (t === 'enter' && (!stage.to || jl2_match(ev.room, stage.to)) &&
            (!stage.npc || !ev.npc || jl2_match(ev.npc, stage.npc))) pr.n = 1;
        if (g && g.escort && stage.to && g.escort.to === stage.to && g.escort.done) pr.n = 1;
        done = (pr.n || 0) >= 1;
        break;
      }
      case 'craft': {
        if (t === 'craft' && (!stage.kind || jl2_match(ev.kind, stage.kind)) &&
            (!stage.out || jl2_match(ev.out || ev.name, stage.out))) bump();
        done = (pr.n || 0) >= need;
        break;
      }
      case 'equip': {
        var nm = stage.name || stage.what || '';
        if (p && p.equipment) {
          if (stage.slot) done = (p.equipment[stage.slot] === nm);
          else {
            for (var k in p.equipment) {
              if (Object.prototype.hasOwnProperty.call(p.equipment, k) && p.equipment[k] === nm) { done = true; break; }
            }
          }
        }
        if (t === 'equip' && (!nm || jl2_match(ev.name, nm))) done = true;
        break;
      }
      case 'use': {
        if ((t === 'use' || t === 'item' || t === 'skill') &&
            (!stage.name || jl2_match(ev.name || ev.item, stage.name))) bump();
        done = (pr.n || 0) >= (stage.times || need);
        break;
      }
      case 'gift': {
        if (t === 'gift' && (!stage.npc || jl2_match(ev.npc, stage.npc)) &&
            (!stage.item || jl2_match(ev.item, stage.item))) bump();
        done = (pr.n || 0) >= need;
        break;
      }
      case 'aff': {
        var av = (p && p.aff && p.aff[stage.npc]) || 0;
        if (g && g.rel && g.rel[stage.npc] && typeof g.rel[stage.npc].aff === 'number') {
          av = Math.max(av, g.rel[stage.npc].aff);
        }
        done = av >= (stage.value !== undefined ? stage.value : need);
        break;
      }
      case 'rep': {
        var rk = stage.kind || 'fame';
        var key = stage.target || stage.npc || stage.what || '';
        var rv = 0;
        if (rk === 'fame' || rk === '声望') rv = (g && g.fame) || (p && p.fame) || 0;
        else if (rk === 'sect' || rk === '宗门') rv = (g && g.sectFavor && g.sectFavor[key]) || 0;
        else if (rk === 'local' || rk === '地方') rv = (g && g.localRep && g.localRep[key]) || 0;
        else rv = (g && g.fame) || 0;
        done = rv >= (stage.value !== undefined ? stage.value : need);
        break;
      }
      case 'choice': {
        if (t === 'choice' && ev.quest === id && (!ev.stage || ev.stage === sid)) {
          pr.n = 1;
          pr.branch = ev.branch || null;
          done = true;
          var chosen = jl2_findChoice(stage, ev.branch);
          if (chosen) {
            if (chosen.cost) jl2_payCost(chosen.cost);
            if (chosen.effects) jl2_applyEffects(chosen.effects, { id: id, def: def, a: a, stage: stage });
          }
        }
        break;
      }
      case 'timed': {
        // 限时阶段本身只设置死线；超时由 jl2_questTimeoutCheck 处理
        if (!pr.deadline) pr.deadline = (a.stageAt || a.startedAt || jl2_turn()) + (stage.turns || need);
        done = true;
        break;
      }
      default: {
        if (t === stage.type || t === 'item' || t === 'use') {
          bump();
          done = (pr.n || 0) >= need;
        }
        break;
      }
    }
    if (done) pr.done = true;
    return done;
  }

  /* ============================================================
   * 6. 状态机推进 / 超时 / 失败
   * ========================================================== */
  function jl2_gotoStage(def, a, sid) {
    try {
      var idx = jl2_stageIndex(def, sid);
      a.stage = (idx >= 0) ? idx : (a.stage + 1);
      a.stageAt = jl2_turn();
      a.ready = false;
    } catch (e) { jl2_err('jl2_gotoStage ' + sid, e); }
  }

  function jl2_questFail(id, reason) {
    try {
      var log = jl2_qlog();
      if (!log || !log.active[id]) return false;
      var a = log.active[id], def = jl2_questDef(id);
      if (def && def.fail && def.fail.penalty) {
        jl2_applyEffects([def.fail.penalty], { id: id, def: def, a: a });
      }
      delete log.active[id];
      log.failed[id] = { at: jl2_turn(), reason: reason || '失败' };
      var g = jl2_game();
      if (g) { if (!g.questFailed) g.questFailed = {}; g.questFailed[id] = true; }
      jl2_markIndex(id, 'failed');
      jl2_trackRemove(id);
      jl2_log('（任务 “' + ((def && def.title) || id) + '” 失败：' + (reason || '未知原因') + '）', 'sys');
      jl2_emit('quest', { quest: id, phase: 'fail', reason: reason });
      jl2_refreshUI();
      return true;
    } catch (e) { jl2_err('jl2_questFail ' + id, e); return false; }
  }

  function jl2_questTimeoutCheck(id, def, a) {
    try {
      var now = jl2_turn();
      if (def.fail && def.fail.type === 'time' && typeof def.fail.turns === 'number') {
        if (now - (a.startedAt || now) > def.fail.turns) {
          jl2_questFail(id, '超时');
          return true;
        }
      }
      var stages = jl2_stages(def);
      var st = stages[a.stage];
      if (!st) return false;
      var sid = st.id || ('s' + a.stage);
      var since = now - (a.stageAt || a.startedAt || now);

      if (st.type === 'timed') {
        var pr = a.prog[sid] || (a.prog[sid] = {});
        if (!pr.deadline) pr.deadline = (a.stageAt || a.startedAt || now) + (st.turns || st.need || 10);
        if (now > pr.deadline) {
          if (st.onTimeout) jl2_gotoStage(def, a, st.onTimeout);
          else jl2_questFail(id, '阶段超时');
          return true;
        }
      }
      if (typeof st.maxTurns === 'number' && since > st.maxTurns) {
        if (st.onTimeout) jl2_gotoStage(def, a, st.onTimeout);
        else jl2_questFail(id, '阶段超时');
        return true;
      }
      if (st.type === 'escort' && typeof st.turns === 'number' && since > st.turns) {
        jl2_questFail(id, '护送超时');
        return true;
      }
    } catch (e) { jl2_err('jl2_questTimeoutCheck ' + id, e); }
    return false;
  }

  function jl2_questAdvance(id, type, p, silent) {
    if (_advancing[id]) return; // 重入直接丢弃：结算中 jl2_emit('reward') 会同步回到这里
    _advancing[id] = true;
    try {
      var log = jl2_qlog();
      if (!log || !log.active[id]) return;
      var a = log.active[id], def = jl2_questDef(id);
      if (!def) return;
      if (jl2_questTimeoutCheck(id, def, a)) return;

      var stages = jl2_stages(def);
      var title = def.title || id;
      var ev = {};
      if (p) for (var pk in p) if (Object.prototype.hasOwnProperty.call(p, pk)) ev[pk] = p[pk];
      ev.type = type;

      var guard = 0;
      while (a.stage < stages.length && guard++ < 64) {
        var st = stages[a.stage];
        var sid = st.id || ('s' + a.stage);
        var done = jl2_stageDone(id, def, a, st, ev, sid);

        if (done) {
          if (!silent) jl2_logQuest('（「' + title + '」' + (st.desc || sid) + ' 完成）');
          if (st.effects) jl2_applyEffects(st.effects, { id: id, def: def, a: a, stage: st });
          if (st.reward) jl2_grantReward(st.reward, { quest: id, stage: sid, def: def });
          a.stage++;
          a.stageAt = jl2_turn();
          continue;
        }
        // 可选阶段不阻塞推进（可跳过）
        if (st.optional) {
          a.stage++;
          a.stageAt = jl2_turn();
          continue;
        }
        break;
      }

      if (a.stage >= stages.length && !a.ready) {
        a.ready = true;
        if (!silent) {
          jl2_logQuest('（「' + title + '」诸事已毕——回 ' +
            (def.turnin || def.giver || '委托人') + ' 处交付。）');
          jl2_emit('quest', { quest: id, phase: 'ready' });
          jl2_refreshUI();
        }
      }
    } catch (e) { jl2_err('jl2_questAdvance ' + id, e); }
    finally { delete _advancing[id]; }
  }

  /* ============================================================
   * 7. 接取 / 交付 / 分支抉择（方案 §4.2）
   * ========================================================== */
  function jl2_lockOk(def) {
    try {
      var g = jl2_game(), p = jl2_player();
      if (def.levelReq && p && (p.level || 0) < def.levelReq) return false;
      var lock = def.lock || {};
      if (lock.flags) {
        for (var f in lock.flags) if (Object.prototype.hasOwnProperty.call(lock.flags, f)) {
          if (!g || !g.flags || g.flags[f] !== lock.flags[f]) return false;
        }
      }
      if (lock.notFlags) {
        for (var nf in lock.notFlags) if (Object.prototype.hasOwnProperty.call(lock.notFlags, nf)) {
          if (g && g.flags && g.flags[nf] === lock.notFlags[nf]) return false;
        }
      }
      if (lock.aff) {
        for (var n in lock.aff) if (Object.prototype.hasOwnProperty.call(lock.aff, n)) {
          var av = (p && p.aff && p.aff[n]) || 0;
          if (g && g.rel && g.rel[n] && typeof g.rel[n].aff === 'number') av = Math.max(av, g.rel[n].aff);
          if (av < lock.aff[n]) return false;
        }
      }
      if (Array.isArray(lock.items)) {
        for (var i = 0; i < lock.items.length; i++) {
          var it = lock.items[i];
          if (jl2_countItem((it && it.name) || it) < ((it && it.n) || 1)) return false;
        }
      }
      if (def.cat === 'daily') {
        var q = jl2_qlog();
        jl2_dailyRoll(q);
        if (q && q.daily.done && q.daily.done.indexOf(def.id) >= 0) return false;
      }
      return true;
    } catch (e) { jl2_err('jl2_lockOk', e); return false; }
  }

  function jl2_markIndex(id, state) {
    try {
      var g = jl2_game();
      if (!g || !Array.isArray(g.quests)) return;
      for (var i = 0; i < g.quests.length; i++) {
        if (g.quests[i] && g.quests[i].id === id) {
          if (state === 'done') g.quests[i].done = true;
          else g.quests[i].failed = true;
          return;
        }
      }
    } catch (e) { jl2_err('jl2_markIndex ' + id, e); }
  }

  function jl2_questAccept(id) {
    try {
      var def = jl2_questDef(id);
      if (!def) return false;
      var log = jl2_qlog();
      if (!log) return false;
      if (log.active[id]) return true; // 幂等：已在身
      if (log.failed[id]) return false;
      if (log.done[id] && !(def.once === false || (def.repeat && def.repeat > 0))) return false;
      if (!jl2_lockOk(def)) return false;

      var a = jl2_active(id);
      if (!a) return false;
      var now = jl2_turn();
      a.stage = 0;
      a.prog = {};
      a.startedAt = now;
      a.stageAt = now;
      a.flags = {};
      a.branch = null;
      a.ready = false;

      // 与旧索引并存（§4.4）：只补齐索引，推进仍走 qlog
      var g = jl2_game();
      if (g) {
        if (Array.isArray(g.quests) && !g.quests.some(function (x) { return x && x.id === id; })) {
          g.quests.push({
            id: id, title: def.title, giver: def.giver, desc: def.hook || def.desc || '',
            target: def._legacyTarget || {}, reward: def.reward, turnin: def.turnin,
            cat: def.cat, done: false, failed: false
          });
        }
        if (g.questOpen) delete g.questOpen[id];
        if (g.questFailed) delete g.questFailed[id];
      }

      jl2_trackAdd(id);
      jl2_logQuest('—— 接取任务 “' + (def.title || id) + '”。' + (def.hook || def.desc || '') + ' ——');
      jl2_emit('quest', { quest: id, phase: 'accept' });
      jl2_refreshUI();
      // 首帧用当前世界状态判定一次（如 reach/aff 已满足）
      jl2_questAdvance(id, 'accept', { quest: id }, true);
      return true;
    } catch (e) { jl2_err('jl2_questAccept ' + id, e); return false; }
  }

  function jl2_questTurnIn(id) {
    try {
      var def = jl2_questDef(id);
      if (!def) return false;
      var log = jl2_qlog();
      if (!log || !log.active[id]) {
        jl2_log('（身上没有 “' + ((def && def.title) || id) + '” 可交付）', 'sys');
        return false;
      }
      var a = log.active[id];
      if (jl2_questTimeoutCheck(id, def, a)) return false;

      var g = jl2_game();
      var stages = jl2_stages(def);

      // deliver 阶段：背包已备齐则就地完成（交付时扣除）
      var guard = 0;
      while (a.stage < stages.length && stages[a.stage].type === 'deliver' && guard++ < 32) {
        var ds = stages[a.stage];
        var dsid = ds.id || ('s' + a.stage);
        if (jl2_countItem(ds.item || ds.what) >= (ds.need || 1)) {
          a.prog[dsid] = { n: (ds.need || 1) };
          jl2_questAdvance(id, 'deliver', { quest: id, to: ds.to, item: ds.item }, true);
        } else break;
      }
      // 以交付动作刷新一次（collect/equip/aff/rep 等看实时状态）
      jl2_questAdvance(id, 'turnin', { quest: id, npc: def.turnin || def.giver }, true);
      a = log.active[id];
      if (!a) return false;

      if (a.stage < stages.length && !a.ready) {
        var cur = stages[a.stage] || {};
        jl2_log('（「' + (def.title || id) + '」还差一步：' +
          (cur.desc || cur.id || '尚未办妥') + '）', 'sys');
        return false;
      }

      // 扣除交付物
      for (var i = 0; i < stages.length; i++) {
        var st = stages[i];
        if (st.type !== 'deliver') continue;
        var stid = st.id || ('s' + i);
        if (a.prog[stid] && a.prog[stid].n) jl2_removeItem(st.item || st.what, st.need || 1);
      }

      var summary = jl2_grantReward(def.reward, { quest: id, def: def, a: a, turnin: true });

      // branch.effects：分支结算（分支已选时）
      var branch = a.branch || null;
      if (def.branch && branch && def.branch.options && def.branch.options[branch]) {
        var bo = def.branch.options[branch];
        jl2_applyEffects(bo.effects, { id: id, def: def, a: a, branch: branch });
      }
      // 世界后果
      jl2_applyWorld(def.world);

      delete log.active[id];
      log.done[id] = { at: jl2_turn(), branch: branch, rank: a.rank || null };
      if (g) {
        if (!g.questDone) g.questDone = {};
        g.questDone[id] = true;
        if (def.cat === 'daily') {
          jl2_dailyRoll(log);
          if (log.daily.done.indexOf(id) < 0) log.daily.done.push(id);
        }
      }
      jl2_markIndex(id, 'done');
      jl2_trackRemove(id);
      jl2_logSuccess('—— 完成任务 “' + (def.title || id) + '” ' + (summary || '') + ' ——');
      jl2_emit('quest', { quest: id, phase: 'done', branch: branch });
      jl2_refreshUI();
      return true;
    } catch (e) { jl2_err('jl2_questTurnIn ' + id, e); return false; }
  }

  function jl2_questChoose(id, key, stageId) {
    try {
      var log = jl2_qlog();
      var a = log && log.active[id];
      if (!a) return false;
      var def = jl2_questDef(id);
      if (!def) return false;

      // 任务级 branch（影响后续任务/NPC/世界）
      if (def.branch && def.branch.options && def.branch.options[key] !== undefined) {
        a.branch = key;
        var bo = def.branch.options[key];
        jl2_applyEffects(bo.effects, { id: id, def: def, a: a, branch: key });
        jl2_emit('choice', { quest: id, branch: key, stage: stageId || null });
        jl2_refreshUI();
        return true;
      }

      // 阶段级 choice：推进状态机，由 stageDone 统一结算 effects / goto
      var stages = jl2_stages(def);
      for (var i = 0; i < stages.length; i++) {
        var st = stages[i];
        if (stageId && st.id !== stageId) continue;
        if (st.type !== 'choice' || a.stage !== i) continue;
        if (!jl2_findChoice(st, key)) continue;
        a.prog[st.id || ('s' + i)] = {}; // 交给 stageDone 计次并套用 effects
        jl2_questAdvance(id, 'choice', { quest: id, branch: key, stage: st.id || ('s' + i) }, true);
        return true;
      }
      return false;
    } catch (e) { jl2_err('jl2_questChoose ' + id, e); return false; }
  }

  /* ============================================================
   * 8. 事件回调 / 追踪条 / 初始化
   * ========================================================== */
  function jl2_questOnEvent(type, p) {
    try {
      // 'quest' 与 'reward' 均为引擎自产：'reward' 由 jl2_reward 在奖励结算末尾同步回抛，
      // 不是任务判定输入，必须忽略，否则同一阶段会被重复结算（配合 _advancing 双保险）。
      if (type === 'quest' || type === 'reward') return;
      var log = jl2_qlog();
      if (!log) return;
      p = p || {};
      if (p.__jl2eid == null) p.__jl2eid = ++_eid;

      var ids = Object.keys(log.active);
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        if (!log.active[id]) continue;
        var dkey = id + '#' + p.__jl2eid;
        if (_seen[dkey]) continue; // 同一事件对同一任务只结算一次
        _seen[dkey] = 1;

        jl2_questAdvance(id, type, p);
        var a = log.active[id];
        var def = jl2_questDef(id);
        if (a && def && !def.turnin && !def.giver && a.stage >= jl2_stages(def).length) {
          jl2_questTurnIn(id); // 无交付 NPC 的任务自动完成
        }
      }

      var sk = Object.keys(_seen);
      if (sk.length > 2000) for (var s = 0; s < 500; s++) delete _seen[sk[s]];
    } catch (e) { jl2_err('jl2_questOnEvent ' + type, e); }
  }

  function jl2_questTrackerText(q) {
    try {
      if (!q) return '';
      var id = (typeof q === 'string') ? q : q.id;
      if (!id) return '';
      var def = jl2_questDef(id);
      if (!def) return '';
      var title = def.title || id;
      var log = jl2_qlog();
      var a = log && log.active[id];

      if (!a) {
        return '“' + title + '”' + ((log && log.done[id]) ? '（已完成）' : '（可接取）');
      }
      var stages = jl2_stages(def);
      if (a.ready || a.stage >= stages.length) return '“' + title + '” ✔ 可交付';

      var st = stages[a.stage] || {};
      var sid = st.id || ('s' + a.stage);
      var pr = a.prog[sid] || {};
      var need = st.need || 1;
      var n = pr.n || 0;
      var ptext = '';
      switch (st.type) {
        case 'kill': ptext = '已诛 ' + n + '/' + need + ' ' + (st.enemy || st.what || '敌'); break;
        case 'collect': ptext = jl2_countItem(st.item || st.what) + '/' + need + ' ' + (st.item || st.what || ''); break;
        case 'talk': ptext = '拜会 ' + (st.npc || st.what || ''); break;
        case 'reach': ptext = '前往 ' + (st.room || st.what || ''); break;
        case 'deliver': ptext = '送 ' + (st.item || '') + ' 予 ' + (st.to || '') + ' ' + n + '/' + need; break;
        case 'gift': ptext = '赠 ' + (st.item || '') + ' 于 ' + (st.npc || '') + ' ' + n + '/' + need; break;
        case 'escort': ptext = '护送至 ' + (st.to || '') + ' ' + n + '/' + need; break;
        case 'craft': ptext = '打造 ' + (st.out || st.what || '') + ' ' + n + '/' + need; break;
        case 'equip': ptext = '装备 ' + (st.name || st.what || ''); break;
        case 'use': ptext = '使用 ' + (st.name || st.what || '') + ' ' + n + '/' + (st.times || need); break;
        case 'aff': ptext = '亲近 ' + (st.npc || '') + ' 至 ' + (st.value !== undefined ? st.value : need); break;
        case 'rep': ptext = (st.kind || '声望') + ' 达 ' + (st.value !== undefined ? st.value : need); break;
        case 'choice': ptext = '做出抉择'; break;
        case 'timed': ptext = '限时 ' + (st.turns || need) + ' 回合'; break;
        default: ptext = st.desc || '';
      }
      var d = st.desc || def.hook || def.desc || '';
      return '“' + title + '” ' + (d || '') + '（' + ptext + '）';
    } catch (e) { jl2_err('jl2_questTrackerText', e); return ''; }
  }

  function jl2_questInit() {
    try {
      jl2_qlog();

      // 预适配所有旧任务，保证 446 条零改写可跑
      jl2_safe('预适配旧任务', function () {
        var tables = [];
        if (typeof QUESTS !== 'undefined' && QUESTS) tables.push(QUESTS);
        if (typeof GEN_QUESTS !== 'undefined' && GEN_QUESTS) tables.push(GEN_QUESTS);
        if (typeof JL2_CONTENT !== 'undefined' && JL2_CONTENT && JL2_CONTENT.quests) tables.push(JL2_CONTENT.quests);
        for (var i = 0; i < tables.length; i++) {
          for (var k in tables[i]) {
            if (Object.prototype.hasOwnProperty.call(tables[i], k)) jl2_adaptLegacy(tables[i][k], k);
          }
        }
      });

      // 订阅全部事件：任何系统 emit 后任务状态机都能消费
      jl2_on('*', function (type, p) { jl2_questOnEvent(type, p); });

      // 旧档迁移：game.quests -> qlog.active，game.questDone -> qlog.done
      jl2_safe('旧档迁移', function () {
        var g = jl2_game(), log = jl2_qlog();
        if (!g || !log) return;
        if (Array.isArray(g.quests)) {
          for (var i = 0; i < g.quests.length; i++) {
            var q = g.quests[i];
            if (!q || !q.id || q.done || q.failed) continue;
            if (log.active[q.id] || log.done[q.id] || log.failed[q.id]) continue;
            var a = jl2_active(q.id);
            if (a && typeof q.node === 'number') a.stage = q.node; // 旧链节点续接
            jl2_questAdvance(q.id, 'init', { quest: q.id }, true);
            jl2_trackAdd(q.id);
          }
        }
        if (g.questDone) {
          for (var id in g.questDone) {
            if (Object.prototype.hasOwnProperty.call(g.questDone, id) && g.questDone[id] && !log.done[id]) {
              log.done[id] = { at: 0, branch: null, rank: null };
            }
          }
        }
      });
      return true;
    } catch (e) { jl2_err('jl2_questInit', e); return false; }
  }

  /* ============================================================
   * 9. 导出（全部 jl2_ 前缀）
   * ========================================================== */
  var API = {
    jl2_on: jl2_on,
    jl2_emit: jl2_emit,
    jl2_questInit: jl2_questInit,
    jl2_questAccept: jl2_questAccept,
    jl2_questTurnIn: jl2_questTurnIn,
    jl2_questOnEvent: jl2_questOnEvent,
    jl2_adaptLegacy: jl2_adaptLegacy,
    jl2_questTrackerText: jl2_questTrackerText,
    jl2_questChoose: jl2_questChoose,
    jl2_questFail: jl2_questFail
  };
  for (var key in API) if (Object.prototype.hasOwnProperty.call(API, key)) G[key] = API[key];

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
//<<QUEST2-END>>
