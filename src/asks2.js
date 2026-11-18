/*
 * asks2.js —— NPC 问话系统（参考 LPC MUD 的 "ask X about Y"）
 *
 * 目标：让 NPC 从固定动作按钮变成可探索的接口。
 * 依赖：JL2_CONTENT / NPCS / player / game / player.aff / game.rel / game.flags
 *       可选：jl2_emit / log / openModal / jl2_relGet / jl2_relTier
 * 铁律：只新增 jl2_ 前缀全局；不改 ITEMS/QUESTS/NPCS 原表；出错写 window.__bootErrs。
 */
(function () {
  'use strict';
  var G = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  function err(where, e) {
    try { G.__bootErrs && G.__bootErrs.push('asks2.' + where + ': ' + (e && e.message)); } catch (_) {}
  }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d || 0); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function content() {
    return (typeof JL2_CONTENT !== 'undefined' && JL2_CONTENT) ? JL2_CONTENT : null;
  }
  function gameState() {
    if (typeof game === 'undefined') return null;
    if (!game.asks || typeof game.asks !== 'object') game.asks = {};
    return game;
  }
  function npcState(name) {
    var g = gameState();
    if (!g) return null;
    if (!g.asks[name]) g.asks[name] = { asked: {}, unlocked: [] };
    return g.asks[name];
  }
  function npcDef(name) {
    return (typeof NPCS !== 'undefined' && NPCS) ? NPCS[name] : null;
  }
  function relOf(name) {
    if (typeof jl2_relGet === 'function') return jl2_relGet(name);
    if (typeof game !== 'undefined' && game.rel && game.rel[name]) return game.rel[name];
    return { aff: (typeof player !== 'undefined' && player.aff) ? num(player.aff[name], 0) : 0, respect: 0, debt: 0, tier: 0 };
  }

  /* ── 话题生成：任务线索 / 喜好忌讳 / 门路掌故 / 关系近况 ── */
  function jl2_askTopics(npcName) {
    try {
      var out = [], seen = {}, c = content(), g = gameState(), st = npcState(npcName);
      if (!g || !st) return out;
      function add(key, label, hint, kind) {
        if (!key || seen[key]) return;
        seen[key] = true;
        out.push({ key: key, label: label, hint: hint || '', kind: kind || 'chat', asked: !!st.asked[key] });
      }
      var rel = relOf(npcName);
      var aff = num(rel.aff, 0);

      // 1) 任务线索：这个 NPC 是委托人，或任务 hook 提到了他
      if (c && c.quests) {
        Object.keys(c.quests).forEach(function (qid) {
          var q = c.quests[qid];
          if (!q) return;
          if (q.giver === npcName || q.turnin === npcName || (q.hook && String(q.hook).indexOf(npcName) >= 0)) {
            add('quest:' + qid, '问「' + (q.title || qid) + '」', q.hook || q.desc || '一桩未了的事', 'quest');
          }
        });
      }
      var nd = npcDef(npcName);
      // 2) 喜好 / 忌讳：送过一次或好感够深才问得出
      if (g.knownLikes && g.knownLikes[npcName]) {
        var likes = (nd && nd.likes) || ['干粮'];
        var hates = (nd && nd.hates) || [];
        add('likes', '他都中意什么', '喜：' + likes.join('、'), 'likes');
        if (hates.length) add('hates', '最忌什么', '厌：' + hates.join('、'), 'hates');
      } else if (aff >= 40) {
        add('likes', '探探他的喜好', '交情够了，或送过一次礼便好开口', 'likes');
      }
      // 3) 门路掌故：人设里的出身、爱好、擅长，都会变成问题
      if (nd) {
        if (nd.title) add('origin', '问他的来历', nd.title, 'lore');
        if (nd.home) add('place', '问' + nd.home, '此地有什么讲究', 'lore');
        if (nd.profile && aff >= 25) add('past', '问他的旧事', String(nd.profile).slice(0, 42), 'lore');
        var relData = c && c.relations && c.relations[npcName];
        if (relData && relData.persona && relData.persona.hobby && relData.persona.hobby.length) {
          add('hobby', '问他的闲好', relData.persona.hobby.join('、'), 'lore');
        }
      }
      // 4) 关系近况：三维关系档位变化本身解锁新话题
      if (aff >= 15) add('tier', '问我们算什么交情', '如今：' + (num(rel.tier, 0) >= 3 ? '肝胆相照' : '相见恨晚'), 'relation');
      if (num(rel.respect, 0) >= 20) add('respect', '问为何敬我', '敬重来自办过的事，不是送过的礼', 'relation');
      if (num(rel.debt, 0) !== 0) add('debt', '提一提前人情分', '欠下的人情总得有个说法', 'relation');
      if (!out.length) add('hello', '随口寒暄', '“近日如何？”', 'chat');
      return out;
    } catch (e) { err('topics', e); return []; }
  }

  /* ── 问话回答：每个 kind 都给具体信息，并落下状态 ── */
  function jl2_ask(npcName, key) {
    try {
      var g = gameState(), st = npcState(npcName), nd = npcDef(npcName);
      if (!g || !st) return { ok: false, text: '' };
      var topics = jl2_askTopics(npcName);
      var topic = topics.filter(function (t) { return t.key === key; })[0];
      if (!topic) return { ok: false, text: '（这话问不出口。）' };
      var rel = relOf(npcName);
      var text = '';

      if (topic.kind === 'quest' && key.indexOf('quest:') === 0) {
        var qid = key.slice(6), c = content(), q = c && c.quests && c.quests[qid];
        text = '（' + npcName + '沉吟片刻）“' + ((q && q.hook) || topic.hint) + '”';
        if (!g.flags[qid + '_asked']) {
          g.flags[qid + '_asked'] = true;
          text += '（你记下了这条线索。）';
        }
        if (typeof jl2_emit === 'function') jl2_emit('choice', { source: 'ask', npc: npcName, key: key, quest: qid });
      } else if (topic.kind === 'likes') {
        var likes = (nd && nd.likes) || ['干粮'];
        text = '（' + npcName + '想了想）“要说中意……' + likes.join('、') + '。”';
        g.knownLikes[npcName] = true;
      } else if (topic.kind === 'hates') {
        var hates = (nd && nd.hates) || [];
        text = hates.length ? '（' + npcName + '皱眉）“' + hates.join('、') + '，休要再提。”'
          : '（' + npcName + '摇头）“倒没什么特别厌的。”';
      } else if (topic.kind === 'lore') {
        text = '（' + npcName + '缓缓道）“' + topic.hint + '”';
        if (!g.knowledge) g.knowledge = [];
        if (g.knowledge.indexOf(key) < 0) g.knowledge.push(key + ':' + npcName);
      } else if (topic.kind === 'relation') {
        text = '（' + npcName + '看了你一眼）“' + topic.hint + '”';
      } else {
        text = '（' + npcName + '笑了笑）“' + topic.hint + '”';
      }

      if (!st.asked[key]) {
        st.asked[key] = true;
        if (st.unlocked.indexOf(key) < 0) st.unlocked.push(key);
      }
      if (typeof log === 'function') log(text, 'npc', npcName);
      if (typeof jl2_emit === 'function') jl2_emit('ask', { npc: npcName, key: key, kind: topic.kind });
      return { ok: true, text: text, kind: topic.kind };
    } catch (e) { err('ask', e); return { ok: false, text: '' }; }
  }

  /* ── 面板 ── */
  function jl2_openAskPanel(npcName) {
    try {
      var topics = jl2_askTopics(npcName);
      var h = document.createElement('div');
      h.style.cssText = 'font-size:.8em;color:#ffffff;';
      var head = document.createElement('div');
      head.style.cssText = 'color:#c9c9cf;font-size:.72em;margin-bottom:8px;line-height:1.7;';
      head.textContent = '（向「' + npcName + '」问话——有些话要交情够了才问得出。）';
      h.appendChild(head);
      topics.forEach(function (t) {
        var row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = '<span class="lname">' + esc(t.label) + (t.asked ? '（已问）' : '') + '</span>' +
          '<span class="lmeta">' + esc(t.hint) + '</span>';
        var b = document.createElement('button');
        b.className = 'btn small';
        b.textContent = '问';
        b.addEventListener('click', function () {
          jl2_ask(npcName, t.key);
          jl2_openAskPanel(npcName);
        });
        row.appendChild(b);
        h.appendChild(row);
      });
      var tip = document.createElement('div');
      tip.style.cssText = 'color:#a8a8b0;font-size:.7em;margin-top:8px;';
      tip.textContent = jl2_askTrackerText(npcName);
      h.appendChild(tip);
      if (typeof openModal === 'function') openModal('问话 · ' + npcName, function () { return h; });
      return h;
    } catch (e) { err('panel', e); return null; }
  }

  function jl2_askTrackerText(npcName) {
    try {
      var topics = jl2_askTopics(npcName);
      var asked = topics.filter(function (t) { return t.asked; }).length;
      return '可问 ' + topics.length + ' 个 · 已问 ' + asked + ' 个 · 未问 ' + (topics.length - asked) + ' 个';
    } catch (e) { return ''; }
  }

  function jl2_asksInit() {
    try {
      gameState();
      if (typeof jl2_on === 'function') {
        jl2_on('ask', function () {});
      }
      return { ok: true };
    } catch (e) { err('init', e); return { ok: false }; }
  }

  G.jl2_asksInit = jl2_asksInit;
  G.jl2_askTopics = jl2_askTopics;
  G.jl2_ask = jl2_ask;
  G.jl2_openAskPanel = jl2_openAskPanel;
  G.jl2_askTrackerText = jl2_askTrackerText;
})();
