/*
 * dialogue2.js —— 对话节点图引擎（JL2 重构）
 *
 * 只依赖现有全局：game / player / log / logDiv / logTitle / logInfo /
 * renderMap / updateSidebar / openModal / gainAff / addItem / removeItem /
 * learnSkill / gainFame / hasItem / hasSkill / acceptQuest 等，均只读调用不重定义。
 * 所有新全局函数一律 jl2_ 前缀。出错写 window.__bootErrs。
 */

var jl2_attrLabelMap = {
  gengu: '根骨', tili: '体力', zhihui: '智慧',
  minjie: '敏捷', jiyuan: '机缘', meili: '魅力',
  level: '境界', gold: '银两', fame: '侠义'
};

function jl2_dlgErr(tag, e) {
  try {
    if (window && window.__bootErrs) {
      window.__bootErrs.push('[dialogue2] ' + tag + ': ' + ((e && e.message) || e));
    }
  } catch (_) {}
}

function jl2_dlgSelfHeal() {
  if (typeof game === 'undefined' || typeof player === 'undefined') return;
  if (!game.flags) game.flags = {};
  if (!game.world) game.world = {};
  if (!game.world.flags) game.world.flags = {};
  if (!game.rel) game.rel = {};
  if (!game.knowledge) game.knowledge = [];
  if (!player.aff) player.aff = {};
  if (!player.inventory) player.inventory = [];
  if (!player.skills) player.skills = [];
  if (!player.attrs) player.attrs = { gengu: 0, tili: 0, zhihui: 0, minjie: 0, jiyuan: 0, meili: 0 };
}

function jl2_dlgStyleInject() {
  if (typeof document === 'undefined' || !document.getElementById) return;
  if (document.getElementById('jl2-dlg-style')) return;
  try {
    var css =
      '.msg .line.jl2-narr{color:var(--ink-faint);text-indent:2em;}' +
      '.msg .line.jl2-say{color:#f3e6cd;}' +
      '.msg .line.jl2-act{color:#7fd0c0;font-style:italic;text-indent:2em;}' +
      '.msg .line.jl2-inner{color:#d9c084;font-style:italic;text-indent:2em;}' +
      '.msg .line.jl2-sys{color:var(--green);font-size:.88em;text-align:right;}' +
      '.msg .line.jl2-sys.neg{color:#e88282;}' +
      '.choice-group button.jl2-dlg-disabled{opacity:.45;filter:grayscale(.6);cursor:not-allowed;}' +
      '.choice-group button.picked{border-color:var(--gold-bright);color:var(--gold-bright);}';
    var st = document.createElement('style');
    st.id = 'jl2-dlg-style';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { jl2_dlgErr('css', e); }
}

/* 把长句拆成 <=42 字的短句，优先在句读处收行 */
function jl2_splitLines(text, max) {
  max = max || 42;
  var s = String(text == null ? '' : text);
  if (!s) return [];
  var out = [], buf = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    buf += ch;
    var brk = ('。！？；!?;\n').indexOf(ch) >= 0 && buf.length >= 10;
    var comma = ('，、,').indexOf(ch) >= 0 && buf.length >= max - 10;
    if (brk || comma || buf.length >= max) { out.push(buf); buf = ''; }
  }
  if (buf) out.push(buf);
  return out;
}

function jl2_paren(t) {
  t = String(t == null ? '' : t);
  if (/^[（(]/.test(t)) return t;
  return '（' + t + '）';
}

/* 五种行样式 -> 不同 CSS class + 颜色；say 加「」，act/inner 加（） */
function jl2_emitLine(style, text, who) {
  var map = { narr: 'jl2-narr', say: 'jl2-say', act: 'jl2-act', inner: 'jl2-inner', sys: 'jl2-sys' };
  var cls = map[style] || 'jl2-narr';
  text = String(text == null ? '' : text);
  if (style === 'say') text = '「' + text + '」';
  else if (style === 'act' || style === 'inner') text = jl2_paren(text);
  var lines = jl2_splitLines(text, 42);
  for (var i = 0; i < lines.length; i++) {
    try { log(lines[i], cls, i === 0 ? (who || null) : null); }
    catch (e) { jl2_dlgErr('line', e); }
  }
}

function jl2_sysLine(msg, neg) {
  try { log(msg, neg ? 'jl2-sys neg' : 'jl2-sys', null); }
  catch (e) { jl2_dlgErr('sys', e); }
}

function jl2_affOf(npc) {
  if (!npc) return 0;
  if (player && player.aff && typeof player.aff[npc] === 'number') return player.aff[npc];
  if (game && game.rel && game.rel[npc] && typeof game.rel[npc].aff === 'number') return game.rel[npc].aff;
  return 0;
}

/* cond:{flag/aff/item/skill/gold/level/notflag} —— 全部满足才算通过 */
function jl2_checkCond(cond, npc) {
  if (!cond) return true;
  try {
    if (typeof cond === 'function') return !!cond();
    if (cond.flag != null) {
      var fs = Array.isArray(cond.flag) ? cond.flag : [cond.flag];
      return fs.every(function (f) { return !!(game.flags && game.flags[f]); });
    }
    if (cond.notflag != null) return !(game.flags && game.flags[cond.notflag]);
    if (cond.item != null) {
      return typeof hasItem === 'function' ? hasItem(cond.item) : ((player.inventory || []).indexOf(cond.item) > -1);
    }
    if (cond.skill != null) {
      return typeof hasSkill === 'function' ? hasSkill(cond.skill) : ((player.skills || []).indexOf(cond.skill) > -1);
    }
    if (cond.aff != null) {
      var need = Array.isArray(cond.aff) ? (cond.aff[1] || 0) : (cond.aff || 0);
      var who = Array.isArray(cond.aff) ? cond.aff[0] : npc;
      return jl2_affOf(who || npc) >= need;
    }
    if (cond.gold != null) return (player.gold || 0) >= cond.gold;
    if (cond.level != null) return (player.level || 0) >= cond.level;
    return true;
  } catch (e) { jl2_dlgErr('cond', e); return false; }
}

/* req:{gengu:6} 属性检定 -> {ok, why} */
function jl2_checkReq(req) {
  if (!req) return { ok: true, why: '' };
  if (typeof req === 'function') return { ok: !!req(), why: '条件未满足' };
  try {
    for (var k in req) {
      if (!Object.prototype.hasOwnProperty.call(req, k)) continue;
      var need = req[k];
      var val;
      if (k === 'level') val = player.level || 0;
      else if (k === 'gold') val = player.gold || 0;
      else if (k === 'fame') val = game.fame || player.fame || 0;
      else val = (player.attrs && player.attrs[k]) || 0;
      if (val < need) {
        var label = jl2_attrLabelMap[k] || k;
        return { ok: false, why: '需' + label + ' ' + need + '（当前 ' + val + '）' };
      }
    }
    return { ok: true, why: '' };
  } catch (e) { jl2_dlgErr('req', e); return { ok: false, why: '条件未满足' }; }
}

/* ttl 限时：按回合数计，首次出现时记下截止回合，写回 game.flags */
function jl2_ttlState(ch, sceneId, nodeId, idx) {
  if (!ch.ttl) return { ok: true, left: null };
  var key = 'jl2ttl_' + sceneId + '_' + nodeId + '_' + idx;
  var turn = game.turns || 0;
  if (game.flags[key] === undefined) game.flags[key] = turn + (Number(ch.ttl) || 0);
  var left = game.flags[key] - turn;
  return { ok: left >= 0, left: left };
}

/* 供集成方在重开某场景时清空 ttl 计时 */
function jl2_ttlReset(sceneId) {
  try {
    var pre = 'jl2ttl_' + sceneId + '_';
    Object.keys(game.flags || {}).forEach(function (k) { if (k.indexOf(pre) === 0) delete game.flags[k]; });
  } catch (e) { jl2_dlgErr('ttlReset', e); }
}

/* 整组选项用过即弃：禁用所有 .choice-group，杜绝翻旧账重复领奖 */
function jl2_invalidateChoices() {
  if (typeof document === 'undefined' || !document.getElementById) return;
  try {
    var box = document.getElementById('log');
    if (!box) return;
    var groups = box.querySelectorAll ? box.querySelectorAll('.choice-group') : [];
    Array.prototype.forEach.call(groups, function (g) {
      if (g.classList.contains('spent')) return;
      g.classList.add('spent');
      var btns = g.querySelectorAll('button');
      Array.prototype.forEach.call(btns, function (b) { b.disabled = true; });
    });
  } catch (e) { jl2_dlgErr('invalidate', e); }
}

function jl2_itemNames(v) {
  if (v == null) return [];
  if (Array.isArray(v)) {
    if (typeof v[0] === 'string' || typeof v[0] === 'number') {
      return [{ name: String(v[0]), n: v[1] == null ? 1 : (Number(v[1]) || 1) }];
    }
    return v.map(function (x) { return { name: x.name || x[0], n: x.n || x[1] || 1 }; });
  }
  if (typeof v === 'object') return [{ name: v.name || v.item || '', n: v.n || 1 }];
  return [{ name: String(v), n: 1 }];
}

/* 统一奖励兜底（jl2_reward 不可用时使用），仍落回现有全局 */
function jl2_fallbackReward(r) {
  if (!r || typeof r !== 'object') return '';
  var out = [];
  if (r.exp) { player.exp = (player.exp || 0) + Number(r.exp); out.push('经验+' + r.exp); }
  if (r.gold) { player.gold = (player.gold || 0) + Number(r.gold); out.push('银两+' + r.gold); }
  if (r.potential) { player.potential = (player.potential || 0) + Number(r.potential); out.push('潜能+' + r.potential); }
  if (r.fame) {
    try { if (typeof gainFame === 'function') gainFame(Number(r.fame)); else game.fame = (game.fame || 0) + Number(r.fame); }
    catch (e) { game.fame = (game.fame || 0) + Number(r.fame); }
    player.fame = game.fame || 0;
    out.push('侠义+' + r.fame);
  }
  if (r.items) {
    jl2_itemNames(r.items).forEach(function (it) {
      for (var i = 0; i < it.n; i++) { if (typeof addItem === 'function') addItem(it.name); else player.inventory.push(it.name); }
      out.push(it.name + (it.n > 1 ? ('×' + it.n) : ''));
    });
  }
  if (r.aff) {
    for (var k in r.aff) {
      if (typeof gainAff === 'function') gainAff(k, Number(r.aff[k]));
      else player.aff[k] = (player.aff[k] || 0) + Number(r.aff[k]);
      out.push(k + '好感+' + r.aff[k]);
    }
  }
  if (r.skill) {
    if (typeof learnSkill === 'function') learnSkill(r.skill);
    else if ((player.skills || []).indexOf(r.skill) < 0) player.skills.push(r.skill);
    out.push('习得' + r.skill);
  }
  if (r.title) { game.flags['title_' + r.title] = true; out.push('称号' + r.title); }
  if (r.unlock && r.unlock.length) {
    r.unlock.forEach(function (u) { game.flags['unlock_' + u] = true; });
    out.push('解锁新内容');
  }
  return out.join('、');
}

/* 单条 effect -> 中文摘要；所有状态写回 game.flags / game.world / player */
function jl2_applyEffectOne(eff) {
  if (eff == null) return '';
  if (!game.world) game.world = {};
  if (!game.world.flags) game.world.flags = {};
  if (typeof eff === 'string') { game.flags[eff] = true; return '（记下 ' + eff + '）'; }
  var s = '';

  if (eff.aff != null) {
    var a = eff.aff, npc, d;
    if (Array.isArray(a)) { npc = a[0]; d = a[1]; }
    else if (typeof a === 'object') { npc = a.npc || a.name || a[0]; d = a.v != null ? a.v : (a.delta != null ? a.delta : a[1]); }
    else { d = a; npc = eff.npc || eff.who || ''; }
    d = Number(d) || 0;
    if (npc) {
      if (typeof gainAff === 'function') gainAff(npc, d);
      else player.aff[npc] = (player.aff[npc] || 0) + d;
      try { if (typeof jl2_emit === 'function') jl2_emit('aff', { npc: npc, delta: d }); } catch (_) {}
      s += npc + '好感' + (d >= 0 ? '+' : '') + d + '　';
    }
  }
  if (eff.gold != null) {
    var g = Number(eff.gold) || 0;
    player.gold = (player.gold || 0) + g;
    if (player.gold < 0) player.gold = 0;
    s += '银两' + (g >= 0 ? '+' : '') + g + '　';
  }
  if (eff.item != null) {
    var its = jl2_itemNames(eff.item), got = [];
    its.forEach(function (it) {
      for (var i = 0; i < it.n; i++) { if (typeof addItem === 'function') addItem(it.name); else player.inventory.push(it.name); }
      got.push(it.name + (it.n > 1 ? ('×' + it.n) : ''));
    });
    s += '获得「' + got.join('、') + '」　';
  }
  if (eff.removeItem != null) {
    var rits = jl2_itemNames(eff.removeItem), lost = [];
    rits.forEach(function (it) {
      for (var i = 0; i < it.n; i++) { if (typeof removeItem === 'function') removeItem(it.name); else { var ix = player.inventory.indexOf(it.name); if (ix > -1) player.inventory.splice(ix, 1); } }
      lost.push(it.name + (it.n > 1 ? ('×' + it.n) : ''));
    });
    s += '失去「' + lost.join('、') + '」　';
  }
  if (eff.flag != null) {
    if (typeof eff.flag === 'object') {
      for (var fk in eff.flag) { if (Object.prototype.hasOwnProperty.call(eff.flag, fk)) game.flags[fk] = eff.flag[fk]; }
      s += '（世情已记）　';
    } else { game.flags[eff.flag] = true; s += '（记下 ' + eff.flag + '）　'; }
  }
  // —— 世界后果：章节选择必须真的改变房间、商店、江湖传闻 ——
  if (eff.worldFlag != null) {
    var wf = eff.worldFlag;
    var wk, wv;
    if (Array.isArray(wf)) { wk = wf[0]; wv = wf.length > 1 ? wf[1] : true; }
    else if (typeof wf === 'object') { for (var wkk in wf) { if (Object.prototype.hasOwnProperty.call(wf, wkk)) { game.world.flags[wkk] = wf[wkk]; } } s += '（世道有变）　'; wk = null; }
    else { wk = String(wf); wv = true; }
    if (wk) game.world.flags[wk] = wv;
    if (Array.isArray(wf)) s += '（世道：' + wk + '→' + wv + '）　';
  }
  if (eff.roomFlag != null) {
    var rf = Array.isArray(eff.roomFlag) ? eff.roomFlag : [eff.roomFlag, 'changed', true];
    var rn = rf[0], rk = rf[1] || 'changed', rv = rf.length > 2 ? rf[2] : true;
    if (!game.world.rooms) game.world.rooms = {};
    if (!game.world.rooms[rn]) game.world.rooms[rn] = {};
    if (!game.world.rooms[rn].flags) game.world.rooms[rn].flags = {};
    game.world.rooms[rn].flags[rk] = rv;
    s += '（' + rn + '气象已变）　';
  }
  if (eff.shopStock != null) {
    var sf = Array.isArray(eff.shopStock) ? eff.shopStock : [eff.shopStock, '?', 1];
    var shop = sf[0], item = sf[1], delta = Number(sf[2]) || 1;
    if (!game.world.shopStock) game.world.shopStock = {};
    if (!game.world.shopStock[shop]) game.world.shopStock[shop] = {};
    game.world.shopStock[shop][item] = (game.world.shopStock[shop][item] || 0) + delta;
    s += '（' + shop + '货架：' + item + (delta > 0 ? '+' : '') + delta + '）　';
  }
  if (eff.respect != null || eff.debt != null) {
    var who = eff.npc || (Array.isArray(eff.respect) ? eff.respect[0] : (Array.isArray(eff.debt) ? eff.debt[0] : ''));
    var rv2 = eff.respect != null ? (Array.isArray(eff.respect) ? eff.respect[1] : eff.respect) : 0;
    var dv = eff.debt != null ? (Array.isArray(eff.debt) ? eff.debt[1] : eff.debt) : 0;
    who = who || eff.who || '';
    if (who && typeof jl2_relAdd === 'function') {
      if (rv2) jl2_relAdd(who, 'respect', Number(rv2) || 0);
      if (dv) jl2_relAdd(who, 'debt', Number(dv) || 0);
      s += who + (rv2 ? '敬重' + (rv2 > 0 ? '+' : '') + rv2 : '') + (dv ? '人情' + (dv > 0 ? '+' : '') + dv : '') + '　';
    }
  }
  if (eff.quest != null) {
    var qid = typeof eff.quest === 'object' ? (eff.quest.id || eff.quest.name) : eff.quest;
    game.flags['quest_' + qid] = true;
    try { if (typeof jl2_emit === 'function') jl2_emit('quest', { id: qid, action: 'progress' }); } catch (_) {}
    s += '（' + qid + ' 有进展）　';
  }
  if (eff.accept != null) {
    var aid = eff.accept;
    try {
      if (typeof jl2_questAccept === 'function') jl2_questAccept(aid);
      else if (typeof acceptQuest === 'function') acceptQuest(aid);
    } catch (e) { jl2_dlgErr('accept', e); }
    s += '（接下 ' + aid + '）　';
  }
  if (eff.decline != null) {
    var did = eff.decline;
    if (game.questOpen) delete game.questOpen[did];
    game.flags['declined_' + did] = true;
    try { if (typeof jl2_emit === 'function') jl2_emit('decline', { id: did }); } catch (_) {}
    s += '（谢绝 ' + did + '）　';
  }
  // 主线交付 / 抉择 / 分支：转发给 quest2 引擎（questTurnIn 内部已刷新面板）
  if (eff.turnin != null) {
    var tids = Array.isArray(eff.turnin) ? eff.turnin : [eff.turnin];
    for (var ti = 0; ti < tids.length; ti++) {
      var tid = tids[ti];
      if (!tid) continue;
      if (typeof jl2_questTurnIn === 'function') {
        try { jl2_questTurnIn(tid); } catch (e) { jl2_dlgErr('turnin', e); }
      }
    }
    s += '（交付 ' + tids.join('、') + '）　';
  }
  if (eff.choose != null) {
    var qid2 = null, ck = null, cst = null;
    if (Array.isArray(eff.choose)) { qid2 = eff.choose[0]; ck = eff.choose[1]; cst = eff.choose[2]; }
    else if (typeof eff.choose === 'object') {
      qid2 = eff.choose.id || eff.choose.quest;
      ck = eff.choose.key;
      cst = eff.choose.stage || eff.choose.stageId;
    }
    if (qid2 && typeof jl2_questChoose === 'function') {
      try { jl2_questChoose(qid2, ck, cst); } catch (e) { jl2_dlgErr('choose', e); }
      s += '（抉择 ' + qid2 + '）　';
    }
  }
  if (eff.branch != null) {
    var bqid = eff.quest || eff.id ||
      (typeof eff.branch === 'object' ? (eff.branch.id || eff.branch.quest || eff.branch.qid) : null);
    var bk = (typeof eff.branch === 'object' ? (eff.branch.key || eff.branch.branch || eff.branch.value) : eff.branch);
    var bst = (typeof eff.branch === 'object' ? (eff.branch.stage || eff.branch.stageId) : null);
    if (bqid && bk != null && typeof jl2_questChoose === 'function') {
      try { jl2_questChoose(bqid, bk, bst); } catch (e) { jl2_dlgErr('branch', e); }
      s += '（择 ' + bk + '）　';
    }
  }
  if (eff.knowledge != null) {
    var ks = Array.isArray(eff.knowledge) ? eff.knowledge : [eff.knowledge];
    ks.forEach(function (k) { if ((game.knowledge || []).indexOf(k) < 0) game.knowledge.push(k); });
    s += '（见闻：' + ks.join('、') + '）　';
  }
  if (eff.world != null) {
    if (!game.world) game.world = {};
    if (!game.world.flags) game.world.flags = {};
    if (typeof eff.world === 'object') {
      for (var wk in eff.world) {
        if (!Object.prototype.hasOwnProperty.call(eff.world, wk)) continue;
        if (wk === 'flags' && typeof eff.world.flags === 'object') {
          for (var wf in eff.world.flags) { if (Object.prototype.hasOwnProperty.call(eff.world.flags, wf)) game.world.flags[wf] = eff.world.flags[wf]; }
        } else { game.world.flags[wk] = eff.world[wk]; }
      }
    } else { game.world.flags[String(eff.world)] = true; }
    s += '（世道有变）　';
  }
  if (eff.fame != null) {
    var f = Number(eff.fame) || 0;
    try { if (typeof gainFame === 'function') gainFame(f); else game.fame = (game.fame || 0) + f; }
    catch (e) { game.fame = (game.fame || 0) + f; }
    player.fame = game.fame || 0;
    s += '侠义' + (f >= 0 ? '+' : '') + f + '　';
  }
  if (eff.exp != null) {
    var ex = Number(eff.exp) || 0;
    player.exp = (player.exp || 0) + ex;
    s += '经验' + (ex >= 0 ? '+' : '') + ex + '　';
  }
  if (eff.potential != null) {
    var po = Number(eff.potential) || 0;
    player.potential = (player.potential || 0) + po;
    s += '潜能+' + po + '　';
  }
  if (eff.skill != null) {
    if (typeof learnSkill === 'function') learnSkill(eff.skill);
    else if ((player.skills || []).indexOf(eff.skill) < 0) player.skills.push(eff.skill);
    s += '（习得 ' + eff.skill + '）　';
  }
  if (eff.reward != null) {
    var rs = '';
    if (typeof jl2_reward === 'function') {
      try { rs = jl2_reward(eff.reward, { source: 'dialogue' }) || ''; }
      catch (e) { jl2_dlgErr('reward', e); }
    }
    if (!rs) rs = jl2_fallbackReward(eff.reward);
    if (rs) s += '（' + rs + '）　';
  }
  return s;
}

/* effects 数组 -> 状态变更 + 统一 sys 行结算（数值不混进正文） */
function jl2_dialogueEffects(effects) {
  if (effects == null) return '';
  if (!Array.isArray(effects)) effects = [effects];
  var notes = [];
  for (var i = 0; i < effects.length; i++) {
    try {
      var n = jl2_applyEffectOne(effects[i]);
      if (n) notes.push(n);
    } catch (e) { jl2_dlgErr('effect', e); }
  }
  var text = notes.join('').replace(/\s+$/, '');
  if (text) jl2_sysLine(text);
  return text;
}

function jl2_dlgFinish(graph, sceneId, opts, st) {
  try {
    if (!st.changed) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[dialogue2] 无状态变更：' + (graph && graph.id || sceneId));
    }
    if (opts && typeof opts.onEnd === 'function') opts.onEnd({ scene: sceneId, changed: st.changed });
    if (typeof updateSidebar === 'function') updateSidebar();
    if (typeof renderMap === 'function') renderMap();
  } catch (e) { jl2_dlgErr('finish', e); }
}

/* 演出一个节点；用计数器防 goto/next 死循环 */
function jl2_dlgStep(graph, nodeId, sceneId, castNpc, opts, st) {
  if (!nodeId || nodeId === 'end' || nodeId === 'END') { jl2_dlgFinish(graph, sceneId, opts, st); return; }
  if (++st.steps > 300) {
    jl2_dlgErr('loop', '步数超限，疑似死循环：' + nodeId);
    jl2_dlgFinish(graph, sceneId, opts, st);
    return;
  }
  var node = graph.nodes && graph.nodes[nodeId];
  if (!node) {
    jl2_dlgErr('node', '缺少节点 ' + nodeId);
    jl2_dlgFinish(graph, sceneId, opts, st);
    return;
  }
  try {
    if (node.act) jl2_emitLine('act', node.act, null);
    jl2_emitLine(node.style || 'narr', node.text, (node.style === 'say' ? node.who : null));
    if (node.effects && node.effects.length) { jl2_dialogueEffects(node.effects); st.changed++; }
  } catch (e) { jl2_dlgErr('node:' + nodeId, e); }

  if (node.choices && node.choices.length) {
    jl2_showChoices(graph, node, nodeId, sceneId, castNpc, opts, st);
    return;
  }
  if (node.next) jl2_dlgStep(graph, node.next, sceneId, castNpc, opts, st);
  else jl2_dlgFinish(graph, sceneId, opts, st);
}

/* 在 #log 里渲染选项按钮；点击后整组 disabled（用过即弃） */
function jl2_showChoices(graph, node, nodeId, sceneId, castNpc, opts, st) {
  var box = typeof document !== 'undefined' && document.getElementById ? document.getElementById('log') : null;
  if (!box) { jl2_dlgErr('dom', '#log 不存在'); return; }
  jl2_invalidateChoices();
  var group = document.createElement('div');
  group.className = 'msg choice-group';
  group.innerHTML = '<span class="line choice">—— 你的选择 ——</span>';
  box.appendChild(group);

  var made = 0;
  node.choices.forEach(function (ch, idx) {
    var condOk = jl2_checkCond(ch.cond, castNpc || node.who);
    var reqRes = jl2_checkReq(ch.req);
    var ttlRes = jl2_ttlState(ch, sceneId, nodeId, idx);

    var disabled = false, suffix = '';
    if (!condOk) {
      if (ch.condFail) { disabled = true; suffix = '（' + ch.condFail + '）'; }
      else return; /* 无 condFail 则直接隐藏 */
    }
    if (!reqRes.ok) { disabled = true; suffix += (suffix ? ' ' : '') + '（' + reqRes.why + '）'; }
    if (!ttlRes.ok) { disabled = true; suffix += (suffix ? ' ' : '') + '（已过时）'; }
    else if (ch.ttl) { suffix += (suffix ? ' ' : '') + '（限 ' + ch.ttl + ' 回合' + (ttlRes.left != null ? ('，剩 ' + ttlRes.left) : '') + '）'; }

    var btn = document.createElement('button');
    btn.className = 'btn small' + (disabled ? ' jl2-dlg-disabled' : '');
    btn.textContent = (made + 1) + '. ' + ch.text + suffix;
    if (disabled) { btn.disabled = true; }
    else {
      btn.addEventListener('click', function () {
        if (group.classList.contains('spent')) return;
        group.classList.add('spent');
        Array.prototype.forEach.call(group.querySelectorAll('button'), function (b) { b.disabled = true; });
        btn.classList.add('picked');
        try {
          if (ch.effects && ch.effects.length) { jl2_dialogueEffects(ch.effects); st.changed++; }
          try { if (typeof jl2_emit === 'function') jl2_emit('choice', { scene: sceneId, node: nodeId, text: ch.text }); } catch (_) {}
        } catch (e) {
          jl2_dlgErr('choice', e);
          jl2_sysLine('（此处似乎出了岔子：' + (e && e.message || '未知错误') + '）', true);
        }
        var dest = ch.goto != null ? ch.goto : (ch.next != null ? ch.next : null);
        if (dest) jl2_dlgStep(graph, dest, sceneId, castNpc, opts, st);
        else jl2_dlgFinish(graph, sceneId, opts, st);
        try { if (typeof renderMap === 'function') renderMap(); if (typeof updateSidebar === 'function') updateSidebar(); } catch (_) {}
      });
    }
    group.appendChild(btn);
    made++;
  });
  if (!made && typeof logInfo === 'function') logInfo('（此处话已说尽，无从选择。）');
  try { box.scrollTop = box.scrollHeight; } catch (_) {}
}

/* 直接演出一张节点图 */
function jl2_renderDialogue(graph, opts) {
  opts = opts || {};
  try {
    jl2_dlgSelfHeal();
    jl2_dlgStyleInject();
    if (!graph || !graph.nodes) { jl2_dlgErr('render', '节点图无效'); return; }
    var sceneId = opts.sceneId || graph.id || 'dialogue';
    var castNpc = opts.npc || (graph.cast && graph.cast[0]) || '';
    var st = { steps: 0, changed: 0 };
    try { if (typeof logDiv === 'function') logDiv(); } catch (_) {}
    if (opts.title || graph.title) {
      try { if (typeof logTitle === 'function') logTitle('◆ ' + (opts.title || graph.title)); } catch (_) {}
    }
    jl2_invalidateChoices();
    var start = opts.entry || graph.entry || Object.keys(graph.nodes)[0];
    jl2_dlgStep(graph, start, sceneId, castNpc, opts, st);
  } catch (e) { jl2_dlgErr('render', e); }
}

/* 按 id 从 JL2_CONTENT.dialogues 取图演出（兼容旧 DIALOGUES） */
function jl2_playDialogue(sceneId, opts) {
  opts = opts || {};
  try {
    var graph = null;
    try {
      if (typeof JL2_CONTENT !== 'undefined' && JL2_CONTENT && JL2_CONTENT.dialogues) {
        graph = JL2_CONTENT.dialogues[sceneId];
      }
    } catch (_) {}
    if (!graph) {
      try { if (typeof DIALOGUES !== 'undefined' && DIALOGUES) graph = DIALOGUES[sceneId]; }
      catch (_) {}
    }
    if (!graph) {
      jl2_dlgErr('play', '未找到对话图 ' + sceneId);
      jl2_sysLine('（这段对话尚未写下：' + sceneId + '）', true);
      return;
    }
    opts.sceneId = sceneId;
    jl2_renderDialogue(graph, opts);
  } catch (e) { jl2_dlgErr('play', e); }
}

/* 只读预览面板：用 openModal 展示某场景的文本，便于回看/校对 */
function jl2_dialoguePanel(sceneId) {
  try {
    var graph = null;
    try {
      if (typeof JL2_CONTENT !== 'undefined' && JL2_CONTENT && JL2_CONTENT.dialogues) graph = JL2_CONTENT.dialogues[sceneId];
    } catch (_) {}
    if (!graph) { try { if (typeof DIALOGUES !== 'undefined' && DIALOGUES) graph = DIALOGUES[sceneId]; } catch (_) {} }
    if (!graph || !graph.nodes) { jl2_sysLine('（未找到对话图：' + sceneId + '）', true); return; }
    var title = graph.title || sceneId;
    if (typeof openModal !== 'function') return;
    openModal(title, function () {
      var body = document.createElement('div');
      var ids = Object.keys(graph.nodes);
      ids.forEach(function (id) {
        var n = graph.nodes[id] || {};
        var p = document.createElement('div');
        p.className = 'line ' + (n.style || 'narr');
        p.textContent = (n.who ? (n.who + '：') : '') + (n.text || '');
        body.appendChild(p);
      });
      return body;
    });
  } catch (e) { jl2_dlgErr('panel', e); }
}

function jl2_dialogueInit() {
  try { jl2_dlgSelfHeal(); jl2_dlgStyleInject(); }
  catch (e) { jl2_dlgErr('init', e); }
}
