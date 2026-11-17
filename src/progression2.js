/*
 * progression2.js —— JL2 成长系统模块
 * 职责：统一奖励分发、装备派生与强化/修理/鉴定、主动招式数据与熟练度、
 *       材料再生与五条加工链、自愈初始化。
 * 铁律：新全局一律 jl2_ 前缀；不重定义任何现有全局；无 import/export/require；
 *       字符串用 ASCII 直引号 ' / "，中文叙述用中文引号 “ ”；出错写 window.__bootErrs。
 * 只读契约见 _contract.js，设计依据见 重做方案 §4.9 / §5.6 / §8.1~8.4 / 附录A。
 */
(function () {
  'use strict';

  var G = (typeof window !== 'undefined') ? window
        : (typeof globalThis !== 'undefined') ? globalThis : {};

  function err(where, e) {
    try {
      G.__bootErrs = G.__bootErrs || [];
      G.__bootErrs.push('[progression2] ' + where + ': ' +
        (e && e.message ? e.message : String(e)));
    } catch (_) { /* 兜底失败也绝不外抛 */ }
  }
  function isObj(o) { return !!o && typeof o === 'object'; }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : (d || 0); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hashStr(s) {
    var h = 2166136261, i;
    s = String(s == null ? '' : s);
    for (i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; }
    return h >>> 0;
  }

  /* ─── 自愈兜底：只补字段，绝不重定义现有函数 ───────────────── */
  function ensurePlayer() {
    if (typeof player === 'undefined') return null;
    if (player.potential == null) player.potential = 0;
    if (!Array.isArray(player.titles)) player.titles = [];
    if (!isObj(player.skillMastery)) player.skillMastery = {};
    if (!isObj(player.crafts)) {
      player.crafts = { forge: 1, alchemy: 1, cook: 1, talisman: 1, weave: 1 };
    }
    return player;
  }
  function ensureGame() {
    if (typeof game === 'undefined') return null;
    if (!Array.isArray(game.unlocks)) game.unlocks = [];
    if (!isObj(game.flags)) game.flags = {};
    return game;
  }

  /* ─── 九类奖励统一分发 ─────────────────────────────────────── */
  function normalizeItems(raw) {
    var out = [];
    if (Array.isArray(raw)) {
      raw.forEach(function (it) {
        if (typeof it === 'string') out.push({ name: it, n: 1 });
        else if (isObj(it) && it.name) out.push({ name: String(it.name), n: Math.max(1, num(it.n, 1)) });
      });
    } else if (typeof raw === 'string') {
      out.push({ name: raw, n: 1 });
    } else if (isObj(raw) && raw.name) {
      out.push({ name: String(raw.name), n: Math.max(1, num(raw.n, 1)) });
    }
    return out;
  }

  function jl2_reward(rewardObj, ctx) {
    var parts = [];
    try {
      ctx = isObj(ctx) ? ctx : {};
      rewardObj = isObj(rewardObj) ? rewardObj : {};
      var p = ensurePlayer();
      var g = ensureGame();

      var v;
      v = num(rewardObj.exp, 0);
      if (v > 0 && p) { p.exp = num(p.exp, 0) + v; parts.push('经验+' + v); }
      else if (v < 0 && p) { p.exp = Math.max(0, num(p.exp, 0) + v); parts.push('经验' + v); }

      v = num(rewardObj.gold, 0);
      if (v > 0 && p) { p.gold = num(p.gold, 0) + v; parts.push('银两+' + v); }
      else if (v < 0 && p) { p.gold = Math.max(0, num(p.gold, 0) + v); parts.push('银两' + v); }

      v = num(rewardObj.potential, 0);
      if (v > 0 && p) { p.potential = num(p.potential, 0) + v; parts.push('潜力+' + v); }

      v = num(rewardObj.fame, 0);
      if (v !== 0) {
        try {
          if (typeof gainFame === 'function') gainFame(v);
          else if (g) g.fame = num(g.fame, 0) + v;
        } catch (e) { err('reward.gainFame', e); if (g) g.fame = num(g.fame, 0) + v; }
        parts.push('声望+' + v);
      }

      var items = normalizeItems(rewardObj.items).concat(normalizeItems(rewardObj.item));
      items.forEach(function (it) {
        for (var k = 0; k < it.n; k++) {
          try { if (typeof addItem === 'function') addItem(it.name); } catch (e) { err('reward.addItem', e); }
        }
        parts.push(it.name + (it.n > 1 ? '×' + it.n : ''));
      });

      var aff = rewardObj.aff;
      if (isObj(aff)) {
        Object.keys(aff).forEach(function (npc) {
          var dv = num(aff[npc], 0);
          try {
            if (typeof gainAff === 'function') gainAff(npc, dv);
            else if (p) { p.aff = p.aff || {}; p.aff[npc] = num(p.aff[npc], 0) + dv; }
          } catch (e) {
            err('reward.gainAff', e);
            if (p) { p.aff = p.aff || {}; p.aff[npc] = num(p.aff[npc], 0) + dv; }
          }
          parts.push(npc + '好感+' + dv);
        });
      }

      if (rewardObj.skill) {
        var learned = false;
        try { if (typeof learnSkill === 'function') learned = learnSkill(String(rewardObj.skill)); } catch (e) { err('reward.learnSkill', e); }
        parts.push((learned ? '习得“' : '已习“') + rewardObj.skill + '”');
      }

      if (rewardObj.title && p) {
        if (p.titles.indexOf(String(rewardObj.title)) < 0) p.titles.push(String(rewardObj.title));
        p.title = String(rewardObj.title);
        parts.push('称号“' + rewardObj.title + '”');
      }

      if (rewardObj.unlock && g) {
        var unlocks = Array.isArray(rewardObj.unlock) ? rewardObj.unlock : [rewardObj.unlock];
        unlocks.forEach(function (u) {
          u = String(u);
          if (g.unlocks.indexOf(u) < 0) g.unlocks.push(u);
          g.flags['unlock_' + u] = true;
          parts.push('解锁“' + u + '”');
        });
      }

      var summary = parts.length ? ('获得 ' + parts.join('、') + '。') : '（无奖励）';
      if (!ctx.silent) {
        try { if (typeof logSuccess === 'function') logSuccess(summary); }
        catch (e) { err('reward.log', e); }
      }
      try {
        if (typeof jl2_emit === 'function') {
          var gt = (typeof game !== 'undefined') ? num(game.turns, 0) : 0;
          jl2_emit('reward', { reward: rewardObj, ctx: ctx, summary: summary, turn: gt });
        }
      } catch (e) { err('reward.emit', e); }
      return summary;
    } catch (e) {
      err('reward', e);
      return '（奖励结算出错，已记录到 __bootErrs）';
    }
  }

  /* ─── 装备：品质 / 词条 / 套装 ─────────────────────────────── */
  var JL2_AFFIXES = ['锋利', '坚韧', '轻捷', '破甲', '吸血', '通灵'];
  var JL2_AFFIX_DESC = {
    锋利: '暴击', 坚韧: '减伤', 轻捷: '闪避', 破甲: '无视防御', 吸血: '吸血', 通灵: '技能效果'
  };
  var JL2_QUALITY = {
    凡: { mul: 1.0, affixes: 0, color: '白' },
    精: { mul: 1.15, affixes: 1, color: '绿' },
    良: { mul: 1.35, affixes: 2, color: '蓝' },
    珍: { mul: 1.6, affixes: 3, color: '紫' },
    神: { mul: 2.0, affixes: 4, color: '金' }
  };
  var JL2_SETS = {
    青萍: {
      name: '青萍', pieces: 3,
      bonus2: { swordDmg: 0.12 }, bonus3: { swordDmg: 0.12, bleed: 2, turns: 3 },
      desc2: '剑法伤害+12%', desc3: '剑法伤害+12%，招式附带流血'
    },
    金刚: {
      name: '金刚', pieces: 3,
      bonus2: { def: 0.1 }, bonus3: { def: 0.1, shield: 30 },
      desc2: '防御+10%', desc3: '防御+10%，受击生成护盾'
    },
    浩然: {
      name: '浩然', pieces: 3,
      bonus2: { holyDmg: 0.1 }, bonus3: { holyDmg: 0.1, heal: 15 },
      desc2: '正气伤害+10%', desc3: '正气伤害+10%，攻击回血'
    }
  };
  var JL2_EQUIP_DB = {
    青锋剑: { quality: '良', affix: ['锋利+2', '轻捷+1'], set: '青萍', from: '铁匠铺·三级', lore: '剑身有一道旧痕，像是替人挡过什么。' },
    青萍剑: { quality: '珍', affix: ['锋利+3', '破甲+2', '通灵+2'], set: '青萍', from: '任务·剑气长城', lore: '青萍二字，是故人临别时刻下的。' },
    青萍甲: { quality: '珍', affix: ['坚韧+3', '轻捷+2', '吸血+1'], set: '青萍', from: '打造·青萍三件套', lore: '甲片轻得像一层薄萍，却挡得住刀。' },
    青萍佩: { quality: '珍', affix: ['通灵+3', '锋利+2', '坚韧+2'], set: '青萍', from: '人物志·左右赠', lore: '佩上刻着一柄极小的剑，据说能引雷。' },
    浩然剑: { quality: '神', affix: ['通灵+4', '锋利+4', '破甲+3', '吸血+3'], set: '浩然', from: '人物志·齐静春', lore: '此剑不斩人，只斩心中不平事。' },
    金刚伏魔杵: { quality: '珍', affix: ['坚韧+4', '破甲+2', '通灵+2'], set: '金刚', from: '掉落·佛光寺', lore: '杵头有经文，念一声便重一分。' }
  };

  function splitName(name) {
    var s = String(name == null ? '' : name);
    var m = /^(.*?)(?:\+(\d+))?$/.exec(s);
    return { base: m ? m[1] : s, level: m && m[2] ? parseInt(m[2], 10) : 0 };
  }

  // 返回派生对象；绝不修改 ITEMS 原表。
  function jl2_itemData(name) {
    try {
      var sp = splitName(name);
      var base = sp.base;
      var db = JL2_EQUIP_DB[base] || {};
      var src = null;
      if (typeof ITEMS !== 'undefined') src = ITEMS[base] || ITEMS[name] || null;

      var quality = db.quality;
      if (!quality || !JL2_QUALITY[quality]) {
        var keys = ['凡', '精', '良', '珍', '神'];
        quality = keys[hashStr(base) % keys.length];
      }
      var q = JL2_QUALITY[quality];
      var h = hashStr(base);
      var rawDmg = src ? num(src.damage != null ? src.damage : src.atkBonus, 10 + (h % 9)) : (10 + (h % 9));
      var rawDef = src ? num(src.defBonus, 0) : (h % 5);

      var affix = db.affix ? db.affix.slice() : [];
      if (!affix.length && q.affixes > 0) {
        var used = {};
        for (var i = 0; i < q.affixes; i++) {
          var idx = (h + i * 7) % JL2_AFFIXES.length;
          if (used[idx]) idx = (idx + 1) % JL2_AFFIXES.length;
          used[idx] = true;
          var val = 1 + Math.floor(h / (i + 3)) % 4;
          affix.push(JL2_AFFIXES[idx] + '+' + val);
        }
      }

      var level = clamp(num(sp.level, 0), 0, 9);
      var lvMul = 1 + 0.06 * level;
      var data = {
        name: String(name), base: base,
        type: src ? (src.type || 'equipment') : 'equipment',
        quality: quality, qualityMul: q.mul, qualityColor: q.color,
        atkBonus: Math.round(rawDmg * q.mul * lvMul),
        defBonus: Math.round(rawDef * q.mul * lvMul),
        affix: affix,
        affixDesc: affix.map(function (a) { return a.replace(/\+.*$/, '') + '（' + (JL2_AFFIX_DESC[a.replace(/\+.*$/, '')] || '增益') + '）'; }),
        set: db.set || null,
        setData: db.set && JL2_SETS[db.set] ? JL2_SETS[db.set] : null,
        durability: 100, maxDurability: 100,
        levelReq: db.levelReq != null ? db.levelReq : (src && src.levelReq != null ? src.levelReq : Math.max(1, Math.floor(h % 12))),
        price: db.price != null ? db.price : (src && src.price != null ? num(src.price, 100) : 80 + (h % 400)),
        from: db.from || (src && src.from) || '江湖流传·出处待考',
        lore: db.lore || (src && src.desc) || '一件来历不明的旧物，只知它陪主人走过不少路。',
        strengthen: level, identified: true
      };
      return data;
    } catch (e) { err('itemData', e); return null; }
  }

  // 实际加成：强化已计入 atkBonus/defBonus；耐久为 0 时减半。
  function jl2_itemBonus(item) {
    try {
      if (!isObj(item)) return { atk: 0, def: 0 };
      var worn = num(item.durability, 100) <= 0;
      var f = worn ? 0.5 : 1;
      return { atk: Math.round(num(item.atkBonus, 0) * f), def: Math.round(num(item.defBonus, 0) * f) };
    } catch (e) { err('itemBonus', e); return { atk: 0, def: 0 }; }
  }

  /* ─── 强化 / 修理 / 鉴定 ───────────────────────────────────── */
  function jl2_strengthen(item, opts) {
    try {
      opts = isObj(opts) ? opts : {};
      if (!isObj(item)) return { ok: false, msg: '（没有可强化的装备）' };
      var lv = clamp(num(item.strengthen != null ? item.strengthen : item.level, 0), 0, 9);
      if (lv >= 9) return { ok: false, level: lv, msg: '（已至 +9，无法再强化）' };
      var next = lv + 1;
      var smith = Math.max(0, num(opts.blacksmithLv, 0));
      var rate = 1 - 0.08 * lv + 0.02 * smith;
      if (next === 4 || next === 7) rate -= 0.2; // +4 / +7 为坎
      rate = clamp(rate, 0.15, 0.99);
      var cost = Math.round(30 * (lv + 1) * (1 + num(item.price, 100) / 500));
      var pl = ensurePlayer();
      if (!opts.free && pl && num(pl.gold, 0) < cost) {
        return { ok: false, level: lv, rate: rate, cost: cost, msg: '（银两不足，强化需 ' + cost + ' 两）' };
      }
      if (!opts.free && pl) pl.gold -= cost;
      var success = Math.random() < rate;
      var newLv = success ? next : Math.max(0, lv - 1);
      item.strengthen = newLv;
      item.level = newLv;
      var mul = 1 + 0.06 * newLv;
      var msg = success
        ? '（强化成功，装备至 +' + newLv + '，基础属性 ×' + mul.toFixed(2) + '。）'
        : '（强化失败，跌回 +' + newLv + '，但未掉至 0 以下。）';
      if (typeof logSuccess === 'function' && !opts.silent) { try { logSuccess(msg); } catch (e) { err('strengthen.log', e); } }
      return { ok: success, level: newLv, rate: rate, cost: cost, mult: mul, msg: msg };
    } catch (e) { err('strengthen', e); return { ok: false, msg: '（强化出错，已记录）' }; }
  }

  function jl2_repair(item, opts) {
    try {
      opts = isObj(opts) ? opts : {};
      if (!isObj(item)) return { ok: false, msg: '（没有可修理的装备）' };
      var missing = Math.max(0, num(item.maxDurability, 100) - num(item.durability, 0));
      if (missing <= 0) return { ok: true, durability: num(item.durability, 100), cost: 0, msg: '（装备完好，无需修理）' };
      var smith = Math.max(0, num(opts.blacksmithLv, 0));
      var cost = Math.max(1, Math.ceil(missing * num(item.price, 100) / 100 * (1 - 0.05 * smith)));
      var pl = ensurePlayer();
      if (!opts.free && pl && num(pl.gold, 0) < cost) {
        return { ok: false, cost: cost, msg: '（银两不足，修理需 ' + cost + ' 两）' };
      }
      if (!opts.free && pl) pl.gold -= cost;
      item.durability = num(item.maxDurability, 100);
      var msg = '（花 ' + cost + ' 两修好，耐久恢复至 ' + item.durability + '。）';
      if (typeof logSuccess === 'function' && !opts.silent) { try { logSuccess(msg); } catch (e) { err('repair.log', e); } }
      return { ok: true, durability: item.durability, cost: cost, msg: msg };
    } catch (e) { err('repair', e); return { ok: false, msg: '（修理出错，已记录）' }; }
  }

  function jl2_identify(item, opts) {
    try {
      opts = isObj(opts) ? opts : {};
      if (!isObj(item)) return { ok: false, msg: '（没有可鉴定的物品）' };
      if (item.identified) {
        return { ok: true, identified: true, affix: item.affix || [], msg: '（此物已鉴定过。）' };
      }
      var data = jl2_itemData(item.name || item.base);
      if (data) {
        item.quality = data.quality;
        item.affix = data.affix;
        item.lore = data.lore;
      }
      item.identified = true;
      var msg = '（鉴定完毕：' + (item.quality || '凡') + '品' +
        (item.affix && item.affix.length ? '，词条 ' + item.affix.join('、') : '，无词条') + '。）';
      if (typeof logSuccess === 'function' && !opts.silent) { try { logSuccess(msg); } catch (e) { err('identify.log', e); } }
      return { ok: true, identified: true, affix: item.affix || [], msg: msg };
    } catch (e) { err('identify', e); return { ok: false, msg: '（鉴定出错，已记录）' }; }
  }

  /* ─── 功法：相性 / 主动招式 / 组合成式 ─────────────────────── */
  var JL2_KIND = { sword: '剑', blade: '刀', fist: '拳', talisman: '符', body: '体', confucian: '儒' };

  var JL2_COMBOS = {
    qishou: { id: 'qishou', name: '起手剑式', moves: ['起手式', '滚龙壁', '收剑式'], bonus: { armorBreak: 2, bleed: 3, turns: 3 }, desc: '破防并令敌流血。' },
    badao: { id: 'badao', name: '拔刀三连', moves: ['拔刀斩', '反背刀', '劈山刀'], bonus: { crit: 0.35 }, desc: '三刀叠加，暴击大增。' },
    fulv: { id: 'fulv', name: '符箓三叠', moves: ['镇煞符', '引雷符', '燎原符'], bonus: { burn: 4, turns: 2, stun: 1 }, desc: '雷火交加，焚身定身。' },
    quantui: { id: 'quantui', name: '问心三拳', moves: ['市井拳脚', '伏虎拳', '问拳'], bonus: { stun: 1, armorBreak: 1 }, desc: '拳意层层递进，破防眩晕。' }
  };

  // 列: 名称, 相性, 品阶, 内力, 系数, 命中, 效果串, 等级, 流派, 组合, 描述
  var MOVE_ROWS = [
    ['起手式', 'sword', '下品', 0, 1.0, 1.0, '', 1, null, 'qishou', '剑招起手，平平无奇却最见根基。'],
    ['滚龙壁', 'sword', '上品', 18, 1.6, 0.9, 'bleed:2,turns:3', 9, '剑修', 'qishou', '剑气如壁翻卷，中者血流不止。'],
    ['收剑式', 'sword', '中品', 8, 1.2, 0.95, 'armorBreak:1', 3, null, 'qishou', '收势一瞬，剑锋已入敌隙。'],
    ['平沙落雁', 'sword', '中品', 14, 1.35, 0.95, '', 5, '山崖书院', null, '书生执笔意，剑落如雁点沙。'],
    ['斩妖剑气', 'sword', '上品', 22, 1.8, 0.9, 'holy:2', 12, '剑修', null, '浩然正气灌注剑身，妖邪辟易。'],
    ['青松剑', 'sword', '中品', 16, 1.4, 0.92, 'heal:5', 7, '落魄山', null, '剑意坚韧如崖上青松，攻中带养。'],
    ['守城一剑', 'sword', '绝品', 26, 2.0, 0.95, 'shield:20', 15, '剑气长城', null, '一剑在城在，气吞万里。'],
    ['御剑术', 'sword', '上品', 20, 1.5, 0.9, 'crit:0.2', 10, '剑修', null, '御剑离手，取敌于三尺之外。'],
    ['雷池剑', 'sword', '上品', 24, 1.75, 0.88, 'stun:1', 13, null, null, '剑走雷池，中者须臾难动。'],
    ['压箱底剑招', 'sword', '绝品', 28, 2.1, 0.9, 'armorBreak:2', 18, null, null, '陈平安压箱底的一招，轻易不示人。'],
    ['拔刀斩', 'blade', '中品', 10, 1.4, 0.92, 'crit:0.15', 3, null, 'badao', '刀出鞘即见血，快得只剩一线光。'],
    ['反背刀', 'blade', '中品', 12, 1.3, 0.9, 'bleed:1', 6, null, 'badao', '反手一刀，专取敌不及防处。'],
    ['劈山刀', 'blade', '上品', 16, 1.7, 0.85, '', 10, null, 'badao', '力劈华山，势大力沉。'],
    ['饮血刀', 'blade', '上品', 18, 1.6, 0.9, 'lifesteal:0.3,bleed:2', 11, null, null, '刀身饮血，越强越渴。'],
    ['金背大刀', 'blade', '中品', 14, 1.55, 0.88, 'armorBreak:1', 8, null, null, '刀背镶金，劈甲如裂竹。'],
    ['市井拳脚', 'fist', '下品', 0, 1.0, 0.95, '', 1, null, 'quantui', '巷里摸爬滚打的拳脚，粗浅却扎实。'],
    ['伏虎拳', 'fist', '中品', 12, 1.45, 0.9, 'stun:1', 6, null, 'quantui', '拳风沉猛，可伏猛虎。'],
    ['问拳', 'fist', '上品', 20, 1.7, 0.9, 'armorBreak:1', 14, null, 'quantui', '曹慈问拳，一拳有一拳的道理。'],
    ['崩山拳', 'fist', '上品', 18, 1.65, 0.88, 'crit:0.2', 12, null, null, '拳出如崩山，避无可避。'],
    ['寸劲', 'fist', '中品', 8, 1.25, 0.95, 'stun:1', 4, null, null, '贴身一寸发力，专破内家气。'],
    ['镇煞符', 'talisman', '中品', 10, 1.2, 0.95, 'shield:15', 3, null, 'fulv', '黄纸朱砂，镇一时煞气。'],
    ['引雷符', 'talisman', '上品', 18, 1.7, 0.9, 'stun:1', 9, null, 'fulv', '符成雷落，轰然作响。'],
    ['燎原符', 'talisman', '上品', 20, 1.8, 0.88, 'burn:3,turns:2', 11, null, 'fulv', '一点星火，可燎原野。'],
    ['金钟护身符', 'talisman', '中品', 12, 1.0, 1.0, 'shield:30', 6, null, null, '金钟罩体，刀剑难伤。'],
    ['朱砂爆符', 'talisman', '上品', 16, 1.6, 0.9, 'crit:0.25', 8, null, null, '朱砂过处，轰然炸开。'],
    ['铁布衫', 'body', '中品', 8, 1.0, 1.0, 'shield:25', 4, null, null, '皮肉如铁，寻常拳脚难伤。'],
    ['金刚不坏', 'body', '上品', 16, 1.1, 1.0, 'shield:40', 12, '佛光寺', null, '佛门护体神通，万法不侵。'],
    ['缩地成寸', 'body', '上品', 14, 1.0, 0.95, 'dodge:0.3', 10, null, null, '一步千里，去来无迹。'],
    ['踏雪无痕', 'body', '中品', 10, 1.0, 0.95, 'dodge:0.2', 5, null, null, '身法轻灵，雪上不留痕。'],
    ['燕返身法', 'body', '中品', 12, 1.1, 0.95, 'dodge:0.25,crit:0.1', 7, null, null, '如燕回身，闪避间反击。'],
    ['浩然正气', 'confucian', '中品', 14, 1.4, 0.95, 'holy:2,shield:10', 5, '山崖书院', null, '胸中浩然，邪不能近。'],
    ['言出法随', 'confucian', '上品', 22, 1.7, 0.9, 'stun:1', 13, '山崖书院', null, '读书人一言，重若千钧。'],
    ['一字千金', 'confucian', '上品', 18, 1.6, 0.9, 'crit:0.3', 10, null, null, '一字既出，价值千金。'],
    ['仁者无敌', 'confucian', '绝品', 26, 1.9, 0.95, 'heal:20,shield:20', 16, '山崖书院', null, '仁者无敌，攻守兼备。'],
    ['定身诀', 'confucian', '中品', 12, 1.0, 0.95, 'stun:1', 6, null, null, '一句“定”，敌身如缚。']
  ];

  function parseEffect(s) {
    var out = {};
    if (!s) return out;
    String(s).split(',').forEach(function (kv) {
      var p = kv.split(':');
      if (p.length === 2) out[p[0]] = num(p[1], 0);
    });
    return out;
  }

  var JL2_MOVES = {};
  MOVE_ROWS.forEach(function (r) {
    try {
      JL2_MOVES[r[0]] = {
        name: r[0], kind: r[1], kindName: JL2_KIND[r[1]] || '杂', grade: r[2], phase: '招式',
        cost: { mp: r[3] }, coef: r[4], hit: r[5], effect: parseEffect(r[6]),
        req: { level: r[7], path: r[8] || null },
        combo: r[9] && JL2_COMBOS[r[9]] ? JL2_COMBOS[r[9]].moves : [],
        comboId: r[9] || null,
        desc: r[10] || ''
      };
    } catch (e) { err('moves.build:' + r[0], e); }
  });

  function jl2_skillData(name) { return JL2_MOVES[String(name)] || null; }

  function masteryState(name) {
    var p = ensurePlayer();
    if (!p) return null;
    var key = String(name);
    if (!isObj(p.skillMastery[key])) {
      p.skillMastery[key] = { mastery: 0, bottleneck: false, enlightenment: false };
    }
    return p.skillMastery[key];
  }

  function jl2_masteryGain(name, amount) {
    try {
      var st = masteryState(name);
      if (!st) return { ok: false, msg: '（无法记录熟练度）' };
      var add = num(amount, 1);
      st.mastery = clamp(num(st.mastery, 0) + add, 0, 100);
      if (!st.enlightenment && st.mastery >= 50) st.bottleneck = true;
      var msg = '（“' + name + '”熟练度 +' + add + '，当前 ' + Math.round(st.mastery) + '/100）' +
        (st.bottleneck && !st.enlightenment ? ' 已到瓶颈，可尝试顿悟。' : '');
      return { ok: true, mastery: st.mastery, bottleneck: st.bottleneck, msg: msg };
    } catch (e) { err('masteryGain', e); return { ok: false, msg: '（熟练度出错）' }; }
  }

  function jl2_checkBottleneck(name) {
    var st = masteryState(name);
    return !!(st && st.bottleneck && !st.enlightenment);
  }

  function jl2_enlighten(name) {
    try {
      var st = masteryState(name);
      var mv = JL2_MOVES[String(name)];
      if (!st || !mv) return { ok: false, msg: '（无此招式）' };
      if (st.enlightenment) return { ok: false, msg: '（此招已顿悟过）' };
      if (st.mastery < 50) return { ok: false, msg: '（熟练度未满 50，尚不能顿悟）' };
      st.enlightenment = true;
      st.bottleneck = false;
      var boosted = Math.round(num(mv.coef, 1) * 1.2 * 100) / 100;
      var msg = '（顿悟！“' + name + '”豁然贯通，威力系数由 ' + mv.coef + ' 提升至 ' + boosted + '。）';
      if (typeof logSuccess === 'function') { try { logSuccess(msg); } catch (e) { err('enlighten.log', e); } }
      return { ok: true, coef: boosted, msg: msg };
    } catch (e) { err('enlighten', e); return { ok: false, msg: '（顿悟出错）' }; }
  }

  function jl2_comboCheck(names) {
    try {
      if (!Array.isArray(names)) return { ok: false, msg: '（组合需为招式数组）' };
      var key = names.join('|');
      var ids = Object.keys(JL2_COMBOS);
      for (var i = 0; i < ids.length; i++) {
        var c = JL2_COMBOS[ids[i]];
        if (c.moves.join('|') === key) {
          return { ok: true, id: c.id, name: c.name, bonus: c.bonus, desc: c.desc, msg: '（成式：“' + c.name + '”！' + c.desc + '）' };
        }
      }
      return { ok: false, msg: '（三招未成式）' };
    } catch (e) { err('comboCheck', e); return { ok: false, msg: '（组合出错）' }; }
  }

  /* ─── 材料品质标注（仅供加工成功率；产地/再生/供需归 materials2.js） ─── */
  // 名称严格对齐 MARKET_MATERIALS（index.html:19202）与 materials2.js 的真实材料全集；
  // 只标注品质，不实现采集点、再生或价格供需规则，避免与 materials2.js 重复。
  // 名称与品质均严格对齐 materials2.js 的 MAT 表（index.html 真实材料）。
  var JL2_MAT_GRADES = {
    草药: '下', 朱砂: '中', 符纸: '下', 剑胚矿石: '中', 兽皮: '下', 灵木: '上',
    桃木: '中', 妖血: '中', 玄铁: '上', 寒髓: '上', 火髓: '上', 雷击木: '上',
    剑穗: '下', 仙酿: '中', 龙骨: '绝', 龙筋: '绝', 悟道茶叶: '上', 紫金砂: '上',
    五行精粹: '绝', 陨铁: '上', 仙家雪莲: '上', 谷雨钱: '中'
  };

  function gradeIndex(g) {
    return { '下': 0, '中': 1, '上': 2, '绝': 3 }[g] || 0;
  }

  /* ─── 五条加工链 + jl2_forge ──────────────────────────────── */
  // 材料名与产物名均为 index.html 中真实存在的名字（材料对齐 MARKET_MATERIALS，
  // 产物对齐 ITEMS），确保 forge 的 addItem/removeItem 能正常闭环，不会出现凑不齐的死配方。
  var JL2_RECIPES = {
    forge: [
      { id: 'f_qingfeng', name: '青锋剑', mats: { 剑胚矿石: 2 }, rate: 0.65, product: '青锋剑' },
      { id: 'f_armor', name: '护腕', mats: { 剑胚矿石: 2, 兽皮: 1 }, rate: 0.55, product: '护腕' },
      { id: 'f_mingqi', name: '飞剑', mats: { 玄铁: 1, 陨铁: 1 }, rate: 0.4, product: '飞剑·云水' }
    ],
    alchemy: [
      { id: 'a_jinchuang', name: '金疮药', mats: { 草药: 2 }, rate: 0.8, product: '疗伤丹' },
      { id: 'a_huichun', name: '回春丹', mats: { 草药: 2, 仙家雪莲: 1 }, rate: 0.65, product: '聚气丹' },
      { id: 'a_huanhun', name: '还魂丹', mats: { 仙家雪莲: 1, 妖血: 1 }, rate: 0.45, product: '还魂丹' }
    ],
    cook: [
      { id: 'c_kaorou', name: '烤肉', mats: { 兽皮: 1 }, rate: 0.9, product: '干粮' },
      { id: 'c_jiu', name: '暖身酒', mats: { 仙酿: 1, 草药: 1 }, rate: 0.8, product: '补气散' },
      { id: 'c_yaoshan', name: '药膳', mats: { 兽皮: 1, 仙酿: 1, 草药: 1 }, rate: 0.75, product: '疗伤丹' }
    ],
    talisman: [
      { id: 't_zhensha', name: '镇煞符', mats: { 符纸: 2, 朱砂: 1 }, rate: 0.7, product: '护身符' },
      { id: 't_yinlei', name: '引雷符', mats: { 符纸: 2, 朱砂: 2 }, rate: 0.5, product: '雷符' },
      { id: 't_suifu', name: '随身符', mats: { 符纸: 1, 朱砂: 1, 桃木: 1 }, rate: 0.45, product: '符箓' }
    ],
    weave: [
      { id: 'w_buyi', name: '布衣', mats: { 剑穗: 2, 兽皮: 1 }, rate: 0.85, product: '布衣' },
      { id: 'w_sipao', name: '法袍', mats: { 剑穗: 2, 灵木: 1 }, rate: 0.7, product: '法袍' },
      { id: 'w_daopao', name: '道袍', mats: { 剑穗: 2, 陨铁: 1, 桃木: 1 }, rate: 0.55, product: '道袍' }
    ]
  };
  var JL2_CRAFT_KINDS = ['forge', 'alchemy', 'cook', 'talisman', 'weave'];
  var JL2_CRAFT_NAME = { forge: '锻造', alchemy: '炼丹', cook: '烹饪', talisman: '制符', weave: '织造' };

  function normalizeMats(materials) {
    var need = {};
    if (Array.isArray(materials)) {
      materials.forEach(function (m) {
        if (typeof m === 'string') need[m] = (need[m] || 0) + 1;
        else if (isObj(m) && m.name) need[m.name] = (need[m.name] || 0) + Math.max(1, num(m.n, 1));
      });
    } else if (isObj(materials)) {
      Object.keys(materials).forEach(function (k) { need[k] = Math.max(1, num(materials[k], 1)); });
    }
    return need;
  }

  function matchRecipe(kind, have) {
    var list = JL2_RECIPES[kind] || [];
    for (var i = 0; i < list.length; i++) {
      var ok = true;
      Object.keys(list[i].mats).forEach(function (m) {
        if (num(have[m], 0) < num(list[i].mats[m], 0)) ok = false;
      });
      if (ok) return list[i];
    }
    return null;
  }

  function consumeMats(mats, count) {
    if (typeof removeItem !== 'function') return;
    Object.keys(mats).forEach(function (m) {
      var n = Math.max(0, Math.floor(num(mats[m], 0) * (count === 'half' ? 0.5 : 1)));
      if (count === 'half' && n < 1) n = 1;
      for (var k = 0; k < n; k++) { try { removeItem(m); } catch (e) { err('forge.remove', e); } }
    });
  }

  function jl2_forge(kind, materials, opts) {
    try {
      opts = isObj(opts) ? opts : {};
      kind = String(kind);
      if (JL2_CRAFT_KINDS.indexOf(kind) < 0) return { ok: false, msg: '（未知加工类别：“' + kind + '”）' };
      var have = normalizeMats(materials);
      var recipe = matchRecipe(kind, have);
      if (!recipe) return { ok: false, msg: '（材料不足或配方不存在）' };

      var p = ensurePlayer();
      var skillLv = Math.max(1, p ? num(p.crafts[kind], 1) : 1);
      var toolBonus = Math.max(0, num(opts.toolBonus, 0));
      var gradeSum = 0, gradeN = 0;
      Object.keys(recipe.mats).forEach(function (m) {
        var gd = JL2_MAT_GRADES[m];
        if (gd) { gradeSum += gradeIndex(gd); gradeN++; }
      });
      var gradeBonus = gradeN ? (gradeSum / gradeN) * 0.05 : 0;
      var rate = clamp(num(recipe.rate, 0.5) + 0.03 * (skillLv - 1) + toolBonus + gradeBonus, 0.05, 0.98);

      if (Math.random() < rate) {
        consumeMats(recipe.mats, 'all');
        if (typeof addItem === 'function') addItem(recipe.product);
        var quality = Math.random() < 0.25 ? '上' : '中';
        var msg = '（' + JL2_CRAFT_NAME[kind] + '成功，得“' + recipe.product + '”（' + quality + '品）！）';
        if (typeof logSuccess === 'function' && !opts.silent) { try { logSuccess(msg); } catch (e) { err('forge.log', e); } }
        return { ok: true, product: recipe.product, quality: quality, rate: rate, msg: msg };
      } else {
        consumeMats(recipe.mats, 'half');
        var fail = '（' + JL2_CRAFT_NAME[kind] + '失败，损失部分材料。成功率 ' + Math.round(rate * 100) + '%。）';
        if (typeof log === 'function' && !opts.silent) { try { log(fail, 'sys'); } catch (e) { err('forge.log', e); } }
        return { ok: false, rate: rate, msg: fail };
      }
    } catch (e) { err('forge', e); return { ok: false, msg: '（加工出错，已记录）' }; }
  }

  /* ─── 初始化：自愈兜底，不覆盖任何现有全局 ─────────────────── */
  function jl2_progressionInit() {
    var errs = [];
    try { ensurePlayer(); } catch (e) { errs.push('player'); err('progressionInit.player', e); }
    try { ensureGame(); } catch (e) { errs.push('game'); err('progressionInit.game', e); }
    // 防御性检查：现有函数必须存在，但绝不重定义它们。
    ['addItem', 'removeItem', 'learnSkill', 'gainFame', 'gainAff', 'logSuccess', 'useItem', 'giveGift'].forEach(function (fn) {
      try {
        if (typeof G[fn] !== 'function') {
          errs.push(fn + ':missing');
          err('progressionInit.missing:' + fn, new Error('全局函数缺失：' + fn));
        }
      } catch (e) { err('progressionInit.check:' + fn, e); }
    });
    return { ok: errs.length === 0, errs: errs, moves: Object.keys(JL2_MOVES).length, recipes: Object.keys(JL2_RECIPES).length };
  }

  /* ─── 导出：全部 jl2_ 前缀，挂到全局对象 ───────────────────── */
  G.jl2_reward = jl2_reward;
  G.jl2_itemData = jl2_itemData;
  G.jl2_itemBonus = jl2_itemBonus;
  G.jl2_strengthen = jl2_strengthen;
  G.jl2_repair = jl2_repair;
  G.jl2_identify = jl2_identify;
  G.jl2_skillData = jl2_skillData;
  G.jl2_masteryGain = jl2_masteryGain;
  G.jl2_checkBottleneck = jl2_checkBottleneck;
  G.jl2_enlighten = jl2_enlighten;
  G.jl2_comboCheck = jl2_comboCheck;
  G.jl2_forge = jl2_forge;
  G.jl2_progressionInit = jl2_progressionInit;
  // 只读数据表（冻结非强制，供其他模块查阅）
  G.JL2_MOVES = JL2_MOVES;
  G.JL2_COMBOS = JL2_COMBOS;
  G.JL2_RECIPES = JL2_RECIPES;
  G.JL2_SETS = JL2_SETS;
  G.JL2_EQUIP_DB = JL2_EQUIP_DB;
})();
