//<<LOOPS2-BEGIN>>
/*
 * loops2.js —— JL2 可重复游玩循环引擎：行当二十环 + 奇遇条件触发
 *
 * 只读依赖（全部做存在性兜底，不重定义任何现有全局）：
 *   JL2_CONTENT.jobs / JL2_CONTENT.encounters   （content2.js）
 *   game.qlog.daily / game.world.flags / game.flags / game.turns / game.hour / game.weather
 *   player.room / player.inventory / player.aff / player.skills
 *   jl2_on / jl2_emit            （quest2.js）
 *   jl2_reward                   （progression2.js）
 *   jl2_playDialogue             （dialogue2.js）
 *   log / logSuccess / addItem / removeItem / curWeather / WEATHERS / openModal （index.html）
 *
 * 铁律：所有新全局函数 jl2_ 前缀；不重定义任何现有全局；无 import/export/require；
 *       代码字符串用 ASCII 直引号 ' / "；中文正文用中文引号“”；出错写 window.__bootErrs。
 */
(function (root) {
  'use strict';

  var G = root || (typeof globalThis !== 'undefined' ? globalThis : this);

  function jl2_err(where, e) {
    try {
      if (!G.__bootErrs) G.__bootErrs = [];
      G.__bootErrs.push('[loops2] ' + where + ': ' + ((e && e.message) || e));
    } catch (_) { /* 最后一道防线，绝不再抛 */ }
  }
  function jl2_safe(label, fn) {
    try { return fn(); } catch (e) { jl2_err(label, e); return undefined; }
  }

  /* ============================================================
   * 0. 基础设施：只读访问器 / 自愈
   * ========================================================== */
  function jl2_game() { return (typeof game !== 'undefined') ? game : null; }
  function jl2_player() { return (typeof player !== 'undefined') ? player : null; }

  function jl2_content() {
    var c = G.JL2_CONTENT;
    if (!c && typeof JL2_CONTENT !== 'undefined') c = JL2_CONTENT;
    return c || null;
  }
  function jl2_fn(name) {
    try { return (typeof G[name] === 'function') ? G[name] : null; }
    catch (e) { return null; }
  }
  function jl2_log(text, cls) {
    var f = jl2_fn('log');
    if (f) f(text, cls || 'sys');
  }
  function jl2_logSuccess(text) {
    var f = jl2_fn('logSuccess');
    if (f) f(text); else jl2_log(text, 'success');
  }
  function jl2_turn() {
    var g = jl2_game();
    if (!g) return 0;
    if (typeof g.turns === 'number') return g.turns;
    if (typeof g.turn === 'number') return g.turn;
    return 0;
  }
  // 一回合一日（见 index.html 注释「一回合一日」），turns 可作稳定的“第几日”
  function jl2_dayNow() {
    var g = jl2_game();
    if (!g) return 1;
    if (typeof g.turns === 'number') return g.turns;
    return 1;
  }

  // 自愈 game.qlog.daily.job / done、game.world.flags、game.flags
  function jl2_daily() {
    var g = jl2_game();
    if (!g) return null;
    if (!g.qlog || typeof g.qlog !== 'object') g.qlog = {};
    if (!g.qlog.daily || typeof g.qlog.daily !== 'object') g.qlog.daily = {};
    if (!g.qlog.daily.done || typeof g.qlog.daily.done !== 'object') g.qlog.daily.done = {};
    if (!Object.prototype.hasOwnProperty.call(g.qlog.daily, 'job')) g.qlog.daily.job = null;
    if (!g.world || typeof g.world !== 'object') g.world = {};
    if (!g.world.flags || typeof g.world.flags !== 'object') g.world.flags = {};
    if (!g.flags || typeof g.flags !== 'object') g.flags = {};
    return g.qlog.daily;
  }

  /* 行当表按“中文名”或“id”取条目（content2.js 里 jobs 以中文名做键） */
  function jl2_jobDef(jobId) {
    var c = jl2_content();
    var jobs = c && c.jobs;
    if (!jobs || !jobId) return null;
    if (jobs[jobId]) return jobs[jobId];
    var keys = Object.keys(jobs);
    for (var i = 0; i < keys.length; i++) {
      if (jobs[keys[i]] && jobs[keys[i]].id === jobId) return jobs[keys[i]];
    }
    return null;
  }
  function jl2_jobKey(def) {
    var c = jl2_content();
    var jobs = c && c.jobs;
    if (!jobs || !def) return '';
    var keys = Object.keys(jobs);
    for (var i = 0; i < keys.length; i++) if (jobs[keys[i]] === def) return keys[i];
    return def.name || '';
  }

  /* ============================================================
   * 1. 环类型属性与事件映射
   * ========================================================== */
  var JL2_RING_LABEL = {
    escort: '护送', kill: '缉拿', reach: '抵达', choice: '抉择', deliver: '交付',
    collect: '采集', craft: '制作', talk: '攀谈'
  };
  // 每种环目标可被哪些事件满足（事件类型见 quest2.js 契约）
  var JL2_RING_EVENTS = {
    escort:  { quest: 1, enter: 1, choice: 1, job: 1 },
    kill:    { kill: 1, battle_end: 1 },
    reach:   { enter: 1, quest: 1 },
    choice:  { choice: 1, quest: 1 },
    deliver: { item: 1, talk: 1, quest: 1 },
    collect: { item: 1 },
    craft:   { craft: 1 },
    talk:    { talk: 1 }
  };

  function jl2_ringInfo(def, ring) {
    var info = { type: 'choice', desc: '', alt: '', isVariant: false };
    if (!def) return info;
    var types = (def.ringTypes && def.ringTypes.length) ? def.ringTypes : ['choice'];
    var n = Math.max(1, ring | 0);
    info.type = types[(n - 1) % types.length];
    var rules = def.variantRules || [];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i] && rules[i].at === n) {
        info.type = rules[i].type || info.type;
        info.desc = rules[i].desc || '';
        info.alt = rules[i].alt || '';
        info.isVariant = true;
        break;
      }
    }
    if (!info.desc) info.desc = '第' + n + '环 · ' + (JL2_RING_LABEL[info.type] || info.type);
    return info;
  }

  function jl2_eventMatches(ringType, type, p) {
    var map = JL2_RING_EVENTS[ringType];
    if (!map || !map[type]) return false;
    p = p || {};
    // 采集要进 item、交付要出 item；quest 只认已办结类
    if (ringType === 'collect' && type === 'item' && p.delta != null && p.delta <= 0) return false;
    if (ringType === 'deliver' && type === 'item' && p.delta != null && p.delta >= 0) return false;
    if (ringType === 'kill' && p.win === false) return false;
    if (type === 'quest') {
      var ph = p.phase || p.action;
      if (ph && ph !== 'done' && ph !== 'progress' && ph !== 'ready') return false;
    }
    return true;
  }

  /* 物品增减：优先复用 addItem/removeItem（它们自己会发 item 事件） */
  function jl2_itemDelta(name, delta) {
    if (!name) return;
    delta = delta > 0 ? 1 : -1;
    var fn = jl2_fn(delta > 0 ? 'addItem' : 'removeItem');
    if (fn) { try { fn(name); } catch (e) { jl2_err('itemDelta', e); } return; }
    var p = jl2_player();
    if (!p || !Array.isArray(p.inventory)) return;
    if (delta > 0) p.inventory.push(name);
    else { var at = p.inventory.indexOf(name); if (at > -1) p.inventory.splice(at, 1); }
    var emit = jl2_fn('jl2_emit');
    if (emit) emit('item', { name: name, delta: delta });
  }

  // 防自激：结算本环时忽略自己发出的 item/reward 事件
  var _advancing = false;

  /* ============================================================
   * 2. jl2_loopsInit()
   * ========================================================== */
  function jl2_loopsInit() {
    try {
      jl2_daily(); // 自愈 game.qlog.daily.job
      var handler = function (type, p) {
        if (type === 'job' || type === 'quest' || type === 'turn' || type === 'item' ||
            type === 'enter' || type === 'kill' || type === 'talk' || type === 'craft' ||
            type === 'choice') {
          jl2_jobAdvance(type, p);
        }
      };
      var on = jl2_fn('jl2_on');
      if (on) {
        on('*', handler);
      } else {
        // 兜底：jl2_emit 兼容旧式 game._qsub 订阅
        var g = jl2_game();
        if (g) {
          if (!Array.isArray(g._qsub)) g._qsub = [];
          g._qsub.push(handler);
        }
      }
      return true;
    } catch (e) { jl2_err('jl2_loopsInit', e); return false; }
  }

  /* ============================================================
   * 3. jl2_jobStart(jobId)
   * ========================================================== */
  function jl2_jobStart(jobId) {
    try {
      var def = jl2_jobDef(jobId);
      if (!def) { jl2_log('（没有这个行当：' + jobId + '）', 'sys'); return null; }
      var daily = jl2_daily();
      if (!daily) return null;
      var st = {
        id: def.id || jl2_jobKey(def),
        name: def.name,
        ring: 1,
        date: jl2_dayNow(),
        done: [],
        streak: 0,
        lastOutput: ''
      };
      daily.job = st;
      jl2_log('（接下行当：' + def.name + '，从第一环做起。）', 'sys');
      return st;
    } catch (e) { jl2_err('jl2_jobStart', e); return null; }
  }

  /* ============================================================
   * 4. jl2_jobAdvance(type, p)
   * ========================================================== */
  function jl2_jobAdvance(type, p) {
    if (_advancing) return null;
    try {
      var daily = jl2_daily();
      var st = daily && daily.job;
      if (!st) return null;
      var def = jl2_jobDef(st.id) || jl2_jobDef(st.name);
      if (!def) return null;
      var day = jl2_dayNow();

      // 新的一日：streak 断、回到第 1 环（行当本身不清空）
      if (st.date !== day) {
        st.date = day;
        st.ring = 1;
        st.streak = 0;
        st.done = [];
        st.lastOutput = '';
      }

      // turn / job 事件只做日期校验；显式 advance 才完成当前环
      if (type === 'turn' || type === 'job') {
        if (!p || (p.advance !== true && p.complete !== true)) return null;
      }

      var ring = Math.max(1, st.ring | 0);
      var info = jl2_ringInfo(def, ring);
      if (!jl2_eventMatches(info.type, type, p)) return null;

      _advancing = true;
      try {
        // 链规：下一环先消耗上一环产出（用 item 事件体现）
        if (st.lastOutput) jl2_itemDelta(st.lastOutput, -1);

        // 本环产出：变式环给 special，普通环给 normal
        var outputs = def.outputs || {};
        var outName = info.isVariant ? (outputs.special || outputs.normal) : (outputs.normal || outputs.special);
        if (outName) jl2_itemDelta(outName, 1);
        st.lastOutput = outName || '';

        var rec = { ring: ring, type: info.type, at: jl2_turn(), variant: !!info.isVariant };
        if (!Array.isArray(st.done)) st.done = [];
        st.done.push(rec);
        var dkey = jl2_jobKey(def) + ':ring' + ring + '@' + day;
        try { daily.done[dkey] = rec; } catch (_) {}

        var total = (def.template && def.template.rings) || 20;
        st.streak = (st.streak || 0) + 1;
        if (ring >= total) {
          jl2_jobGrand(def, st, day, daily);
        } else {
          st.ring = ring + 1;
          jl2_log('（' + def.name + '第' + ring + '环了结：' + info.desc +
                  '。得“' + (outName || '酬劳') + '”，下一环——' +
                  jl2_ringInfo(def, st.ring).desc + '。）', 'sys');
        }
        return st;
      } finally {
        _advancing = false;
      }
    } catch (e) { jl2_err('jl2_jobAdvance', e); return null; }
  }

  /* 第 20 环大赏：world.flags + qlog.daily.done 双重防重，发完重置为下一日第 1 环 */
  function jl2_jobGrand(def, st, day, daily) {
    var prize = def.ring20 || {};
    var g = jl2_game();
    var key = 'jl2_job20_' + (def.id || jl2_jobKey(def)) + '_' + day;
    if (!g.world.flags) g.world.flags = {};
    if (g.world.flags[key]) return;
    g.world.flags[key] = true;
    try { daily.done[key] = true; } catch (_) {}

    var reward = {
      items: [{ name: prize.item || prize.name || '赏赐', n: 1 }],
      exp: 60,
      gold: 100,
      fame: 5
    };
    if (prize.unlock) reward.unlock = Array.isArray(prize.unlock) ? prize.unlock : [prize.unlock];
    var rewardFn = jl2_fn('jl2_reward');
    if (rewardFn) {
      try { rewardFn(reward, { silent: false, ctx: 'loops2.job20', job: def.id }); }
      catch (e) { jl2_err('job20.reward', e); }
    }
    jl2_logSuccess('（' + def.name + '二十环圆满：' + (prize.name || '大赏') +
                   '——“' + (prize.item || '赏赐') + '”。' + (prize.desc || '') + '。明日再接第一环。）');

    st.ring = 1;
    st.date = day + 1;
    st.done = [];
    st.lastOutput = '';
  }

  /* ============================================================
   * 5. jl2_jobPanel()
   * ========================================================== */
  function jl2_jobPanel() {
    try {
      var doc = (typeof document !== 'undefined') ? document : null;
      if (!doc) return null;
      var c = jl2_content();
      var jobs = (c && c.jobs) || {};
      var daily = jl2_daily();
      var st = daily && daily.job;
      var wrap = doc.createElement('div');
      wrap.className = 'jl2-job-panel';
      wrap.style.cssText = 'max-height:70vh;overflow:auto;padding:2px 6px;';

      Object.keys(jobs).forEach(function (key) {
        var def = jobs[key];
        if (!def) return;
        var isActive = !!(st && (st.id === def.id || st.id === key || st.name === def.name));
        var total = (def.template && def.template.rings) || 20;
        var ring = isActive ? Math.max(1, st.ring | 0) : 1;
        var cur = jl2_ringInfo(def, ring);
        var nxt = jl2_ringInfo(def, ring + 1);

        var card = doc.createElement('div');
        card.style.cssText = 'border-bottom:1px solid #4a4a4a;padding:8px 2px;';

        var h = doc.createElement('div');
        h.style.cssText = 'font-weight:bold;margin-bottom:4px;';
        h.textContent = def.name + ' · ' + (def.giver || '') + (def.home ? ('（' + def.home + '）') : '');
        card.appendChild(h);

        var info = doc.createElement('div');
        info.style.cssText = 'font-size:13px;line-height:1.7;';
        info.textContent = isActive
          ? ('当前 ' + ring + '/' + total + ' 环 · 连做 ' + (st.streak || 0) +
             ' · 下一环：' + (JL2_RING_LABEL[nxt.type] || nxt.type) + '（' + nxt.desc + '）')
          : ('未接取 · 第一环：' + (JL2_RING_LABEL[cur.type] || cur.type) + '（' + cur.desc + '）');
        card.appendChild(info);

        var p = def.ring20 || {};
        var grand = doc.createElement('div');
        grand.style.cssText = 'font-size:13px;color:#d8b26a;margin:4px 0;line-height:1.6;';
        grand.textContent = '第' + total + '环大赏：' + (p.name || '') + ' · ' + (p.item || '') +
                            (p.desc ? (' —— ' + p.desc) : '');
        card.appendChild(grand);

        var btn = doc.createElement('button');
        btn.style.cssText = 'margin-top:6px;';
        if (isActive) {
          btn.textContent = '放弃';
          btn.addEventListener('click', function () {
            try {
              if (daily.job === st) daily.job = null;
              jl2_log('（暂且搁下这一行的行当。）', 'sys');
              jl2_jobPanel();
            } catch (e) { jl2_err('jobPanel.放弃', e); }
          });
        } else {
          btn.textContent = '接取';
          btn.addEventListener('click', function () {
            try { jl2_jobStart(key); jl2_jobPanel(); }
            catch (e) { jl2_err('jobPanel.接取', e); }
          });
        }
        card.appendChild(btn);
        wrap.appendChild(card);
      });

      var open = jl2_fn('openModal');
      if (open) { open('行当 · 二十环', function () { return wrap; }); return wrap; }
      return wrap;
    } catch (e) { jl2_err('jl2_jobPanel', e); return null; }
  }

  /* ============================================================
   * 6. jl2_jobTrackerText()
   * ========================================================== */
  function jl2_jobTrackerText() {
    try {
      var daily = jl2_daily();
      var st = daily && daily.job;
      if (!st) return '';
      var def = jl2_jobDef(st.id) || jl2_jobDef(st.name);
      if (!def) return '';
      var total = (def.template && def.template.rings) || 20;
      var ring = Math.max(1, st.ring | 0);
      var next = jl2_ringInfo(def, ring);
      return def.name + ' ' + ring + '/' + total + ' · 下一环：' +
             (JL2_RING_LABEL[next.type] || next.type);
    } catch (e) { jl2_err('jl2_jobTrackerText', e); return ''; }
  }

  /* ============================================================
   * 7. jl2_checkEncounters()
   * ========================================================== */
  function jl2_weatherName() {
    var g = jl2_game();
    if (!g) return '';
    var cur = jl2_fn('curWeather');
    if (cur) {
      try { var w = cur(); if (w && w.name) return w.name; } catch (_) {}
    }
    try {
      if (g.weather && g.weather.t && typeof WEATHERS !== 'undefined' && WEATHERS[g.weather.t]) {
        return WEATHERS[g.weather.t].name;
      }
    } catch (_) {}
    return (g.world && g.world.weather) ? g.world.weather : '';
  }
  // game.hour 为 0-11 的子时序号（每格约两小时），换算成 0-23 的钟点
  function jl2_hourNow() {
    var g = jl2_game();
    if (!g) return 0;
    if (typeof g.hour === 'number') return (g.hour * 2) % 24;
    if (g.world && typeof g.world.hour === 'number') return g.world.hour % 24;
    return 0;
  }
  function jl2_hourInRange(range, now) {
    if (range == null) return true;
    if (typeof range !== 'string') return true;
    var m = /^(\d{1,2})\s*-\s*(\d{1,2})$/.exec(range);
    if (!m) return range === String(now);
    var lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
    if (hi <= lo) hi += 24; // 跨夜区间
    return now >= lo && now < hi;
  }
  function jl2_condMatch(cond) {
    if (!cond || typeof cond !== 'object') return true;
    var g = jl2_game(), p = jl2_player();
    if (!g || !p) return false;
    var i, list, ok;

    if (cond.weather != null) {
      var w = jl2_weatherName();
      list = Array.isArray(cond.weather) ? cond.weather : [cond.weather];
      ok = false;
      for (i = 0; i < list.length; i++) if (list[i] === w) { ok = true; break; }
      if (!ok) return false;
    }
    if (cond.room != null) {
      list = Array.isArray(cond.room) ? cond.room : [cond.room];
      if (list.indexOf(p.room) < 0) return false;
    }
    if (cond.hour != null && !jl2_hourInRange(cond.hour, jl2_hourNow())) return false;
    if (cond.item != null) {
      var inv = Array.isArray(p.inventory) ? p.inventory : [];
      list = Array.isArray(cond.item) ? cond.item : [cond.item];
      ok = false;
      for (i = 0; i < list.length; i++) if (inv.indexOf(list[i]) > -1) { ok = true; break; }
      if (!ok) return false;
    }
    if (cond.skill != null) {
      var sk = Array.isArray(p.skills) ? p.skills : [];
      list = Array.isArray(cond.skill) ? cond.skill : [cond.skill];
      ok = false;
      for (i = 0; i < list.length; i++) if (sk.indexOf(list[i]) > -1) { ok = true; break; }
      if (!ok) return false;
    }
    if (cond.aff && typeof cond.aff === 'object') {
      var aff = (p.aff && typeof p.aff === 'object') ? p.aff : {};
      var names = Object.keys(cond.aff);
      for (i = 0; i < names.length; i++) {
        if ((aff[names[i]] || 0) < Number(cond.aff[names[i]])) return false;
      }
    }
    if (cond.flag != null) {
      list = Array.isArray(cond.flag) ? cond.flag : [cond.flag];
      ok = false;
      for (i = 0; i < list.length; i++) {
        if ((g.flags && g.flags[list[i]]) || (g.world.flags && g.world.flags[list[i]])) { ok = true; break; }
      }
      if (!ok) return false;
    }
    if (cond.rep != null && (Number(g.fame || 0) < Number(cond.rep))) return false;
    return true;
  }

  function jl2_checkEncounters() {
    try {
      var c = jl2_content();
      var list = (c && c.encounters) || [];
      var g = jl2_game();
      if (!g) return 0;
      if (!g.world.flags || typeof g.world.flags !== 'object') g.world.flags = {};
      var fired = 0, turn = jl2_turn();
      for (var i = 0; i < list.length; i++) {
        var enc = list[i];
        if (!enc || !enc.id) continue;
        var flag = 'jl2_enc_' + enc.id;
        if (enc.once && g.world.flags[flag]) continue;
        if (!jl2_condMatch(enc.cond)) continue;

        var chance = (typeof enc.chance === 'number') ? enc.chance : 1;
        if (Math.random() > chance) {
          // 未掷中：留一句若有若无的提示，不写 flag，下回合还能再遇（带冷却防刷屏）
          var hintKey = 'jl2_enc_hint_' + enc.id;
          if (turn >= (Number(g.world.flags[hintKey]) || 0)) {
            g.world.flags[hintKey] = turn + 3;
            jl2_log('（似有异动，' + (enc.desc || '一念之间，机缘擦肩') + '……）', 'sys');
          }
          continue;
        }

        if (enc.once) g.world.flags[flag] = true;
        fired++;
        var hasGraph = false;
        try { hasGraph = !!(c && c.dialogues && c.dialogues[enc.quest]); } catch (_) {}
        var play = jl2_fn('jl2_playDialogue');
        if (play && enc.quest && hasGraph) {
          try { play(enc.quest, { source: 'encounter', id: enc.id }); }
          catch (e) {
            jl2_err('encounter.dialogue.' + enc.id, e);
            jl2_logSuccess('（' + (enc.desc || '奇遇降临') + '）');
          }
        } else {
          jl2_logSuccess('（' + (enc.desc || '奇遇降临') + '）');
        }
      }
      return fired;
    } catch (e) { jl2_err('jl2_checkEncounters', e); return 0; }
  }

  /* ============================================================
   * 8. 导出（全部 jl2_ 前缀）
   * ========================================================== */
  var API = {
    jl2_loopsInit: jl2_loopsInit,
    jl2_jobStart: jl2_jobStart,
    jl2_jobAdvance: jl2_jobAdvance,
    jl2_jobPanel: jl2_jobPanel,
    jl2_jobTrackerText: jl2_jobTrackerText,
    jl2_checkEncounters: jl2_checkEncounters
  };
  for (var key in API) if (Object.prototype.hasOwnProperty.call(API, key)) G[key] = API[key];

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
//<<LOOPS2-END>>
