/*
 * combat2.js —— JL2 战斗深度模块
 *
 * 职责：战前战术选择（架势 / 招式 / 破绽弱点）、伤害系数、相性克制、
 *       三招成式判定与加成、破绽与寻隙、防重复刷招、战后状态写回与结算、分层演出文本。
 *
 * 铁律：新全局一律 jl2_ 前缀；不重定义 startFight/playerAttack/battle/calcAtk 等现有全局；
 *       无 import/export/require；字符串用 ASCII 直引号 ' "，中文叙述用中文引号 “ ”；
 *       出错写 window.__bootErrs；只读契约见 _contract.js，设计依据见重做方案 §2.2/§3.2/§8.2。
 *
 * 数据来自 progression2.js 暴露的 JL2_MOVES / JL2_COMBOS / jl2_skillData（只读引用）。
 */
(function () {
  'use strict';

  var G = (typeof window !== 'undefined') ? window
        : (typeof globalThis !== 'undefined') ? globalThis : {};

  /* ── 基础设施：错误、类型、全局读取 ─────────────────────────── */
  function err(where, e) {
    try {
      G.__bootErrs = G.__bootErrs || [];
      G.__bootErrs.push('[combat2] ' + where + ': ' +
        (e && e.message ? e.message : String(e)));
    } catch (_) { /* 兜底也不外抛 */ }
  }
  function isObj(o) { return !!o && typeof o === 'object'; }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d || 0); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function getGame() {
    try { return (typeof game !== 'undefined') ? game : G.game; }
    catch (e) { return G.game; }
  }
  function getPlayer() {
    try { return (typeof player !== 'undefined') ? player : G.player; }
    catch (e) { return G.player; }
  }
  function emit(type, payload) {
    try {
      var fn = (typeof jl2_emit === 'function') ? jl2_emit : G.jl2_emit;
      if (typeof fn === 'function') fn(type, payload);
    } catch (e) { err('emit.' + type, e); }
  }
  function on(type, fn) {
    try {
      var reg = (typeof jl2_on === 'function') ? jl2_on : G.jl2_on;
      if (typeof reg === 'function') reg(type, fn);
    } catch (e) { err('on.' + type, e); }
  }

  /* ── 自愈状态：只补字段，不重定义任何现有全局 ─────────────────── */
  var SKEY = 'combat2';
  function state() {
    var g = getGame();
    if (!g) return null;
    var s = g[SKEY];
    if (!isObj(s)) {
      s = g[SKEY] = {
        enemy: null, turn: 0, chain: [], lastMove: null, repeat: 0,
        charge: 0, stance: 'attack', comboId: null, history: {}
      };
    }
    if (!Array.isArray(s.chain)) s.chain = [];
    if (!isObj(s.history)) s.history = {};
    s.turn = num(s.turn, 0);
    s.repeat = num(s.repeat, 0);
    s.charge = num(s.charge, 0);
    return s;
  }

  /* ── 静态表：架势 / 相性 / 克制 / 敌人特性归属 ─────────────────── */
  var STANCES = [
    { id: 'attack', name: '攻', atk: 1.18, taken: 1.10,
      desc: '抢攻压上，伤害最盛，但门户开，受创亦重。',
      hint: '求快求狠时用，宜配“寻隙”补刀。' },
    { id: 'guard', name: '守', atk: 0.90, taken: 0.75,
      desc: '沉肩守中，受创大减，出招稍钝。',
      hint: '硬仗久持时用，先立于不败。' },
    { id: 'flow', name: '游', atk: 1.05, taken: 0.95, dodge: 0.15,
      desc: '游身走位，身法灵动，更易窥见破绽。',
      hint: '对身法诡谲之敌用，周旋中取隙。' },
    { id: 'charge', name: '蓄', atk: 0.85, taken: 1.00, charge: 0.40,
      desc: '敛气蓄势，本回合威力稍减，下招倍涨。',
      hint: '大招前铺垫一回合，后发制人。' }
  ];

  var KIND_NAME = { sword: '剑', blade: '刀', fist: '拳', talisman: '符', body: '体', confucian: '儒' };

  // 行克列：剑克刀/拳，刀克拳/符，拳克符/体，符克体/儒，体克儒/剑，儒克剑/刀。
  // 另两路互不相克（如剑与符），保持中性，便于玩家自行搭配。
  var COUNTER = {
    sword: ['blade', 'fist'],
    blade: ['fist', 'talisman'],
    fist: ['talisman', 'body'],
    talisman: ['body', 'confucian'],
    body: ['confucian', 'sword'],
    confucian: ['sword', 'blade']
  };

  // 敌人特性 → 其主要相性（决定玩家该用哪一路克它）。
  var TRAIT_KIND = {
    pack: 'body', brute: 'body', armored: 'body', iron: 'body',
    constrict: 'body', undead: 'body',
    frenzy: 'fist', berserk: 'fist', feral: 'fist',
    ghost: 'talisman', soul: 'talisman', poison: 'talisman',
    fire: 'talisman', ice: 'talisman', lightning: 'talisman',
    thunder: 'talisman', divine: 'talisman', rebirth: 'talisman',
    thief: 'blade', demon: 'blade', holy: 'confucian'
  };

  /* ── 数据读取：招式 / 组合 / 敌人 ─────────────────────────────── */
  function moveTable() {
    return G.JL2_MOVES || (typeof JL2_MOVES !== 'undefined' ? JL2_MOVES : null);
  }
  function comboTable() {
    return G.JL2_COMBOS || (typeof JL2_COMBOS !== 'undefined' ? JL2_COMBOS : {});
  }
  function moveData(name) {
    try {
      if (typeof G.jl2_skillData === 'function') {
        var d = G.jl2_skillData(name);
        if (d) return d;
      }
    } catch (e) { err('moveData.skillData', e); }
    var tbl = moveTable();
    return tbl ? (tbl[String(name)] || null) : null;
  }
  function enemyData(name) {
    if (!name) return null;
    try { if (typeof ENEMIES !== 'undefined' && ENEMIES[name]) return ENEMIES[name]; }
    catch (e) { err('enemyData.ENEMIES', e); }
    try { if (typeof NPCS !== 'undefined' && NPCS[name]) return NPCS[name]; }
    catch (e) { err('enemyData.NPCS', e); }
    var t = G.ENEMIES || (typeof ENEMIES !== 'undefined' ? ENEMIES : null);
    if (t && t[name]) return t[name];
    var n = G.NPCS || (typeof NPCS !== 'undefined' ? NPCS : null);
    return (n && n[name]) || null;
  }
  function enemyKind(enemy) {
    var name = isObj(enemy) ? (enemy.name || enemy.enemy || '') : (enemy || '');
    var d = enemyData(name);
    var trait = d && (d.trait || (Array.isArray(d.traits) ? d.traits[0] : null));
    if (trait && TRAIT_KIND[trait]) return TRAIT_KIND[trait];
    if (d && d.kind && KIND_NAME[d.kind]) return d.kind;
    var keys = Object.keys(KIND_NAME), h = 0, str = String(name || '');
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return keys[h % keys.length];
  }
  function counterKind(kind) {
    var ids = Object.keys(COUNTER);
    for (var i = 0; i < ids.length; i++) {
      if (COUNTER[ids[i]].indexOf(kind) >= 0) return ids[i];
    }
    return 'sword';
  }
  function getStance(v) {
    var id = normalizeStance(v);
    for (var i = 0; i < STANCES.length; i++) if (STANCES[i].id === id) return STANCES[i];
    return STANCES[0];
  }
  function normalizeStance(v) {
    var map = {
      '攻': 'attack', '守': 'guard', '游': 'flow', '蓄': 'charge',
      attack: 'attack', guard: 'guard', flow: 'flow', charge: 'charge'
    };
    return map[String(v)] || 'attack';
  }
  function matchCombo(chain) {
    if (!Array.isArray(chain) || chain.length < 3) return null;
    var tbl = comboTable(), ids = Object.keys(tbl);
    for (var i = 0; i < ids.length; i++) {
      var c = tbl[ids[i]], ms = c.moves || [];
      if (ms.length === 3 && ms[0] === chain[0] && ms[1] === chain[1] && ms[2] === chain[2]) return c;
    }
    return null;
  }

  /* ── 分层演出文本：起手 / 交锋 / 破绽 / 收势 ───────────────────── */
  function label(name) { return '“' + (name || '对手') + '”'; }
  function textOpen(enemy, stance) {
    var st = getStance(stance);
    return '你脚下错步，' + st.name + '势已成——' + label(enemy) + '的气息扑面而来。';
  }
  function textClash(skill) {
    return skill ? '“' + skill + '”递出，与来势撞在一处，火星四溅。'
                 : '拳脚相交，风声骤紧，谁也不肯退半步。';
  }
  function textBreak(enemy) {
    return label(enemy) + '旧力已尽、新力未生——破绽就在眼前！';
  }
  function textClose(enemy, win) {
    return win ? '你收势立定，' + label(enemy) + '已再无力起身。'
               : '你退开半步，喘息未定，' + label(enemy) + '仍虎视在侧。';
  }
  function jl2_combatText(stage, ctx) {
    ctx = isObj(ctx) ? ctx : {};
    try {
      var e = ctx.enemy || ctx.name;
      if (stage === 'open') return textOpen(e, ctx.stance);
      if (stage === 'clash') return textClash(ctx.skill);
      if (stage === 'break') return textBreak(e);
      if (stage === 'close') return textClose(e, !!ctx.win);
    } catch (e2) { err('text.' + stage, e2); }
    return '';
  }

  /* ── 初始化：自愈兜底 + 事件订阅 ──────────────────────────────── */
  function jl2_combatInit() {
    try {
      state();
      // 订阅战终事件：记录最近一次战终标记；胜负计数由 jl2_combatAfter 统一写回，避免重复。
      on('battle_end', function (p) {
        try {
          var s = state();
          if (!s) return;
          s.lastBattleEnd = { enemy: p && (p.enemy || p.name) || '', win: !!(p && p.win), at: num(getGame() && getGame().turn, 0) };
        } catch (e) { err('on.battle_end', e); }
      });
      return { ok: true };
    } catch (e) { err('combatInit', e); return { ok: false, msg: String(e && e.message || e) }; }
  }

  /* ── 战前战术选择数据（供 UI 直接渲染） ───────────────────────── */
  function emptyPrepared(enemy) {
    return {
      enemy: enemy || '', stances: [], moves: [], actions: [], combos: [],
      weakness: null, breakInfo: null,
      text: { open: '' }, tips: [], ok: false
    };
  }
  function jl2_combatPrepare(ctx) {
    ctx = isObj(ctx) ? ctx : {};
    try {
      var s = state();
      if (!s) return emptyPrepared(ctx.enemy || ctx.name || '');
      var bt = (typeof battle !== 'undefined') ? battle : G.battle;
      var enemy = ctx.enemy || ctx.name || (bt && bt.name) || s.enemy || '';
      s.enemy = enemy;
      // 开战即清空上一场的连招/重复/蓄势，保证战斗深度逐场重新计算。
      s.chain = []; s.lastMove = null; s.repeat = 0; s.charge = 0; s.turn = 0; s.comboId = null;

      var stanceList = STANCES.map(function (st) {
        return { id: st.id, name: st.name, atk: st.atk, taken: st.taken,
                 dodge: num(st.dodge, 0), desc: st.desc, hint: st.hint };
      });

      // 招式：优先玩家已习得；不足则按等级补入可用招式，再退回旧 SKILLS 表。
      var moves = [], p = getPlayer(), tbl = moveTable();
      var known = (p && Array.isArray(p.skills)) ? p.skills : [];
      if (tbl) {
        Object.keys(tbl).forEach(function (nm) {
          var mv = tbl[nm];
          if (mv.phase !== '招式') return;
          if (known.indexOf(nm) < 0) return;
          moves.push(toMoveUI(nm, mv));
        });
        if (moves.length < 6) {
          var extra = Object.keys(tbl).filter(function (nm) {
            var mv = tbl[nm];
            if (mv.phase !== '招式' || known.indexOf(nm) >= 0) return false;
            if (mv.req && mv.req.path) return false;
            return num(mv.req && mv.req.level, 1) <= num(p && p.level, 1);
          }).sort(function (a, b) {
            return num(tbl[a].req && tbl[a].req.level, 1) - num(tbl[b].req && tbl[b].req.level, 1);
          });
          for (var i = 0; i < extra.length && moves.length < 6; i++) moves.push(toMoveUI(extra[i], tbl[extra[i]]));
        }
      }
      if (!moves.length) {
        var sk = G.SKILLS || (typeof SKILLS !== 'undefined' ? SKILLS : null);
        if (sk) Object.keys(sk).slice(0, 6).forEach(function (nm) {
          moves.push({ name: nm, kind: null, kindName: '杂', cost: num(sk[nm].mpCost, 0),
                       coef: 1, desc: sk[nm].desc || '', combo: [], hint: '旧式功法，未见相性。' });
        });
      }

      // 破绽 / 弱点提示
      var ek = enemyKind(enemy), wk = counterKind(ek);
      var weakness = {
        kind: wk, kindName: KIND_NAME[wk],
        enemyKind: ek, enemyKindName: KIND_NAME[ek],
        hint: label(enemy) + '走的是“' + KIND_NAME[ek] + '”路，' + KIND_NAME[wk] + '性招式正克它。'
      };
      var breakInfo = {
        every: 3,
        hint: '每三回合露一次破绽；选“寻隙”抓它，伤害大增。',
        seekHint: '“寻隙”：趁破绽一击，附破甲，重创敌势。'
      };
      var actions = [{ id: 'seekGap', name: '寻隙', hint: breakInfo.seekHint }];

      var combos = Object.keys(comboTable()).map(function (id) {
        var c = comboTable()[id];
        return { id: id, name: c.name || id, moves: (c.moves || []).slice(), desc: c.desc || '' };
      });

      return {
        enemy: enemy, stances: stanceList, moves: moves, actions: actions, combos: combos,
        weakness: weakness, breakInfo: breakInfo,
        text: { open: textOpen(enemy, 'attack') },
        tips: [weakness.hint, breakInfo.hint, '连出同一招会被看穿——三招轮转，方成式。'],
        ok: true
      };
    } catch (e) { err('combatPrepare', e); return emptyPrepared(ctx.enemy || ctx.name || ''); }
  }
  function toMoveUI(nm, mv) {
    var kn = KIND_NAME[mv.kind] || '杂';
    return {
      name: nm, kind: mv.kind || null, kindName: kn,
      cost: num(mv.cost && mv.cost.mp, 0), coef: num(mv.coef, 1),
      effect: mv.effect || {}, combo: (mv.combo || []).slice(),
      desc: mv.desc || '',
      hint: '“' + kn + '”性招式，系数 ' + num(mv.coef, 1).toFixed(2) + '。'
    };
  }

  /* ── 伤害系数：集成方在算出处伤害处调用 ─────────────────────────
   * ctx: { attacker, defender, skill, stance, break, turn, seekGap }
   * 返回 { mul, note, effects }；无有效数据时返回 { mul:1, note:'', effects:[] }。
   */
  function jl2_combatDamageMod(ctx) {
    ctx = isObj(ctx) ? ctx : {};
    var skillName = isObj(ctx.skill) ? (ctx.skill.name || '') : (ctx.skill || '');
    if (!skillName && !ctx.stance && ctx.break !== true && typeof ctx.turn !== 'number') {
      return { mul: 1, note: '', effects: [] };
    }
    try {
      var s = state();
      var mul = 1, notes = [], effects = [];
      var mv = skillName ? moveData(skillName) : null;
      var kind = mv && mv.kind;

      // 架势与蓄势
      var stanceId = normalizeStance(ctx.stance || (s && s.stance));
      var st = getStance(stanceId);
      mul *= st.atk;
      if (s && st.charge) {
        s.charge = Math.min(0.5, num(s.charge, 0) + st.charge);
        notes.push('（敛气蓄势，下一招将更狠。）');
      } else if (s && num(s.charge, 0) > 0) {
        mul *= 1 + Math.min(0.5, s.charge);
        notes.push('（蓄势尽发，劲道陡增！）');
        s.charge = 0;
      }
      if (stanceId === 'guard') effects.push({ type: 'shield', value: 8, turns: 1 });
      if (stanceId === 'flow') effects.push({ type: 'dodge', value: Math.round(num(st.dodge, 0) * 100) / 100, turns: 1 });

      // 相性克制
      var ek = enemyKind(ctx.defender || (s && s.enemy));
      if (kind && ek) {
        if (COUNTER[kind] && COUNTER[kind].indexOf(ek) >= 0) {
          mul *= 1.15;
          notes.push('（' + KIND_NAME[kind] + '克' + KIND_NAME[ek] + '，招势占先。）');
        } else if (COUNTER[ek] && COUNTER[ek].indexOf(kind) >= 0) {
          mul *= 0.85;
          notes.push('（' + KIND_NAME[ek] + '克' + KIND_NAME[kind] + '，路数受制。）');
        }
      }

      // 破绽 + 寻隙：每三回合一次，寻隙可大幅增伤并附破甲
      var turnNum = num(ctx.turn, s ? num(s.turn, 0) + 1 : 1);
      var isBreak = ctx.break === true || (turnNum % 3 === 0);
      if (isBreak && ctx.seekGap === true) {
        mul *= 1.5;
        notes.push(textBreak(ctx.defender || (s && s.enemy)));
        notes.push('（寻隙一击，直中要害！）');
        effects.push({ type: 'armorBreak', value: 2, turns: 2 });
      } else if (isBreak) {
        notes.push('（敌方气息一乱，似有破绽可寻。）');
      }

      // 防无脑刷一招 + 三招成式
      if (s && skillName) {
        s.repeat = (s.lastMove === skillName) ? num(s.repeat, 0) + 1 : 0;
        if (s.repeat >= 2) {
          mul *= 0.55;
          notes.push('（同一招连用，对方已看穿门道，威力大减。）');
        } else if (s.repeat === 1) {
          mul *= 0.8;
          notes.push('（旧招重施，对方已有所防备。）');
        }
        s.lastMove = skillName;
        s.chain.push(skillName);
        if (s.chain.length > 3) s.chain.shift();
        s.turn = turnNum;
        var mc = matchCombo(s.chain);
        if (mc) {
          mul *= 1.3;
          notes.push('（成式：“' + (mc.name || '') + '”！' + (mc.desc || '') + '）');
          s.comboId = mc.id || null;
          for (var bk in (mc.bonus || {})) {
            if (bk === 'turns') continue;
            effects.push({ type: bk, value: mc.bonus[bk], turns: num(mc.bonus.turns, 2) });
          }
        }
      }
      // 招式自带效果
      if (mv && mv.effect) {
        for (var key in mv.effect) {
          if (key === 'turns') continue;
          effects.push({ type: key, value: mv.effect[key], turns: num(mv.effect.turns, 2) });
        }
      }

      return { mul: clamp(Math.round(mul * 100) / 100, 0.2, 4), note: notes.join(''), effects: effects };
    } catch (e) { err('damageMod', e); return { mul: 1, note: '', effects: [] }; }
  }

  /* ── 战后：写回破绽/架势/连击状态，产出反馈，广播 battle_end ────── */
  function jl2_combatAfter(enemy, win) {
    var name = '';
    try {
      name = isObj(enemy) ? (enemy.name || enemy.enemy || '') : (enemy || '');
      var s = state();
      if (s) {
        if (name) {
          if (!isObj(s.history[name])) s.history[name] = { wins: 0, losses: 0 };
          var h = s.history[name];
          if (win) h.wins = num(h.wins, 0) + 1;
          else h.losses = num(h.losses, 0) + 1;
          h.lastAt = num(getGame() && getGame().turn, 0);
        }
        // 战斗结束：清掉本场的连招、重复、蓄势与架势，破绽回合计数归零。
        s.chain = []; s.lastMove = null; s.repeat = 0; s.charge = 0;
        s.comboId = null; s.turn = 0; s.stance = 'attack'; s.enemy = null;
      }
      var performance = [
        textOpen(name, 'attack'), textClash(null), textBreak(name), textClose(name, !!win)
      ];
      var lines = [textClose(name, !!win)];
      if (win) lines.push('（' + label(name) + '已了，架势渐收，余劲散尽。）');
      else lines.push('（你退开两步，' + label(name) + '仍气势如虹——且待来日。）');
      emit('battle_end', { enemy: name, win: !!win });
      return { enemy: name, win: !!win, lines: lines, performance: performance, summary: lines.join('') };
    } catch (e) {
      err('combatAfter', e);
      return { enemy: name, win: !!win, lines: [], performance: [], summary: '' };
    }
  }

  /* ── 导出：仅 jl2_ 前缀 + 只读数据表 ───────────────────────────── */
  G.jl2_combatInit = jl2_combatInit;
  G.jl2_combatPrepare = jl2_combatPrepare;
  G.jl2_combatDamageMod = jl2_combatDamageMod;
  G.jl2_combatAfter = jl2_combatAfter;
  G.jl2_combatText = jl2_combatText;
  G.JL2_COMBAT_STANCES = STANCES;
})();
