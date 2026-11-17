/*
 * JL2 content2.js —— 第一章主线 / 人物关系 / 对话 / 行当 / 奇遇 数据
 * 只产出 JL2_CONTENT 与 jl2_contentInstall()，只读引用现有全局表。
 * 所有 room / npc / item / enemy 名均来自现有数据（.jl-tools/extracted.js 核实）。
 * 新全局一律 jl2_ / JL2_ 前缀；出错写 window.__bootErrs。
 */
(function () {
  'use strict';

  function jl2_bootErr(msg) {
    try {
      if (typeof window !== 'undefined' && window.__bootErrs) {
        window.__bootErrs.push('content2: ' + msg);
      }
    } catch (e) {}
  }
  function jl2_str(v) { return typeof v === 'string' ? v : ''; }

  // 安装幂等哨兵（只认自己的标志，不动别人的全局）
  var JL2_INSTALLED_KEY = '__jl2_content_installed';

  var JL2_CONTENT = {
    quests: {},
    relations: {},
    dialogues: {},
    jobs: {},
    encounters: {}
  };

  // ============================================================
  // 一、quests —— 第一章「初试锋芒」6 条手写主线
  //     id: jl2_m1_01 ... jl2_m1_06
  //     五段式：目标 → 阻碍 → 转折 → 代价 → 收获；章末不可逆选择。
  //     奖励按 §5.6 九类配比；fail 用 time/flag；world 改 game.world。
  // ============================================================
  JL2_CONTENT.quests = {
    'jl2_m1_01': {
      id: 'jl2_m1_01', cat: 'main', chapter: 1, tier: 1,
      title: '巷口的死人', giver: '杨老头', turnin: '杨老头', levelReq: 1,
      lock: { flags: {}, aff: {}, items: [], time: null, notFlags: {} },
      hook: '泥瓶巷口躺着一个外乡人，胸口插着半截断刀，手里攥着半张药方。',
      dialogue: { accept: 'd_m1_01_accept', turnin: 'd_m1_01_turnin' },
      stages: [
        { id: 's1', type: 'reach', room: '泥瓶巷', desc: '去巷口看那具尸体', hint: '泥瓶巷' },
        { id: 's2', type: 'talk', npc: '杨老头', topic: '认刀', desc: '请杨老头认那截断刀', hint: '杨老头在泥瓶巷' },
        { id: 's3', type: 'choice', desc: '死人的事，报官还是不报', choices: [
          { text: '报官，交衙门处置', effects: [{ aff: ['巡城武官', 10] }, { flag: 'jl2_ch1_tip_off' }], goto: 's4' },
          { text: '私了，先收好那半张药方', effects: [{ aff: ['杨老头', 8] }, { flag: 'jl2_ch1_cover_up' }, { item: '断刀' }], goto: 's4' },
          { text: '（先问问这刀值几个钱）', req: { meili: 5 }, effects: [{ gold: 20 }, { aff: ['顾璨', 4] }], goto: 's4' }
        ] },
        { id: 's4', type: 'collect', item: '草药', need: 3, desc: '照药方采三株草药', hint: '荒郊野岭',
          alt: '可向药王或福地游商用银两购得' },
        { id: 's5', type: 'deliver', item: '草药', to: '杨老头', need: 3, desc: '把草药送回药铺' }
      ],
      branch: { key: 'jl2_ch1_tipoff', options: {
        A: { desc: '报官（秩序）', effects: [{ aff: ['巡城武官', 10] }, { flag: 'jl2_ch1_order' }, { fame: 1 }] },
        B: { desc: '私了（人情）', effects: [{ aff: ['杨老头', 8] }, { aff: ['顾璨', 6] }, { flag: 'jl2_ch1_bond' }, { item: '断刀' }] }
      } },
      reward: { exp: 180, gold: 90, potential: 30, fame: 2,
        items: [{ name: '疗伤丹', n: 2 }], aff: { '杨老头': 6 }, skill: '市井拳脚',
        title: null, unlock: ['jl2_m1_02'], knowledge: ['断刀的来历'] },
      fail: { type: 'time', turns: 40, penalty: { aff: { '杨老头': -6 }, flag: 'jl2_m1_01_failed' } },
      once: true, repeat: 0, cooldown: 0,
      world: { setFlags: { '泥瓶巷_有死人': true }, npcState: { '杨老头': '忧虑' },
        roomState: { '泥瓶巷': '巷口多了一摊洗不掉的血迹。' } }
    },

    'jl2_m1_02': {
      id: 'jl2_m1_02', cat: 'main', chapter: 1, tier: 2,
      title: '药铺里的三味药', giver: '杨老头', turnin: '杨老头', levelReq: 2,
      lock: { flags: { jl2_m1_01: true }, aff: { '杨老头': 5 }, items: [], time: null, notFlags: {} },
      hook: '李家娘子难产，药铺就差一味止血草——而山上刚闹过狼。',
      dialogue: { accept: 'd_m1_02_accept', turnin: 'd_m1_02_turnin' },
      stages: [
        { id: 's1', type: 'talk', npc: '杨老头', desc: '问清要哪三味药', hint: '泥瓶巷药铺' },
        { id: 's2', type: 'collect', item: '草药', need: 3, desc: '采三株草药', hint: '荒郊野岭',
          spawn: 'herb_slope', maxTurns: 20, onTimeout: 's2b', alt: '城里药铺可购得' },
        { id: 's2b', type: 'choice', desc: '空手而归，如何交代', optional: true, choices: [
          { text: '实话说没采到', effects: [{ aff: ['杨老头', -2] }, { goto: 's3' }] },
          { text: '去城里买三株顶上', cost: { gold: 60 }, effects: [{ goto: 's3' }] },
          { text: '拿医理搪塞过去', req: { gengu: 6 }, effects: [{ aff: ['杨老头', 3] }, { goto: 's3' }] }
        ] },
        { id: 's3', type: 'kill', enemy: '妖狼', need: 2, desc: '山路有狼，先清两条', hint: '荒郊野岭',
          optional: true, alt: '下毒 / 引狼相斗 / 买通猎户绕行', reward: { exp: 60 } },
        { id: 's4', type: 'deliver', item: '草药', to: '杨老头', need: 3, desc: '把药送回药铺' }
      ],
      branch: { key: 'jl2_m1_02_credit', options: {
        A: { desc: '把功劳让给药童', effects: [{ aff: ['李宝瓶', 12] }, { flag: 'jl2_m1_02_humble' }] },
        B: { desc: '当众讨赏', effects: [{ gold: 80 }, { fame: -1 }, { aff: ['杨老头', -4] }] }
      } },
      reward: { exp: 220, gold: 120, potential: 40, fame: 2,
        items: [{ name: '金疮药', n: 3 }], aff: { '杨老头': 8, '李宝瓶': 4 },
        skill: null, title: null, unlock: ['jl2_m1_03'], knowledge: ['药理·止血草'] },
      fail: { type: 'time', turns: 40, penalty: { aff: { '杨老头': -6 }, flag: 'jl2_m1_02_failed' } },
      once: true, repeat: 0, cooldown: 0,
      world: { setFlags: { '药铺_止血草_有货': true }, npcState: { '杨老头': '感激' },
        roomState: { '泥瓶巷': '药铺门口晒着新采的草药。' } }
    },

    'jl2_m1_03': {
      id: 'jl2_m1_03', cat: 'main', chapter: 1, tier: 2,
      title: '铁匠铺的剑胚', giver: '铁匠', turnin: '铁匠', levelReq: 2,
      lock: { flags: { jl2_m1_02: true }, aff: {}, items: [], time: null, notFlags: {} },
      hook: '矿脉被妖族占了，铁匠说：寻两块剑胚矿石，最好的一把剑归你。',
      dialogue: { accept: 'd_m1_03_accept', turnin: 'd_m1_03_turnin' },
      stages: [
        { id: 's1', type: 'talk', npc: '铁匠', desc: '问清矿石的去处', hint: '铁匠铺' },
        { id: 's2', type: 'collect', item: '剑胚矿石', need: 2, desc: '寻两块剑胚矿石', hint: '荒郊野岭',
          alt: '向阮邛或福地游商购买' },
        { id: 's3', type: 'kill', enemy: '蛮荒小妖', need: 1, desc: '矿脉有妖族把守', hint: '荒郊野岭',
          optional: true, alt: '买通蛮荒游商绕开 / 夜潜矿脉', reward: { exp: 70 } },
        { id: 's4', type: 'choice', desc: '剑到手，如何作答', choices: [
          { text: '按约取剑，谢过铁匠', effects: [{ aff: ['铁匠', 8] }, { goto: 's5' }] },
          { text: '请铁匠再添一副护手', req: { meili: 6 }, effects: [{ item: '软猬甲' }, { aff: ['铁匠', -3] }, { goto: 's5' }] },
          { text: '把矿石分给阮邛一半', cond: { aff: { '阮邛': 20 } }, effects: [{ aff: ['阮邛', 10] }, { flag: 'jl2_m1_03_ruan' }, { goto: 's5' }] }
        ] },
        { id: 's5', type: 'deliver', item: '剑胚矿石', to: '铁匠', need: 2, desc: '把矿石交回铁匠铺' }
      ],
      branch: { key: 'jl2_m1_03_forge', options: {
        A: { desc: '只要剑，不欠人情', effects: [{ item: '青锋剑' }, { flag: 'jl2_ch1_no_debt' }] },
        B: { desc: '欠铁匠一个人情', effects: [{ aff: ['铁匠', 10] }, { debt: ['铁匠', 1] }, { flag: 'jl2_ch1_debt' }] }
      } },
      reward: { exp: 200, gold: 100, potential: 35, fame: 1,
        items: [{ name: '青锋剑', n: 1 }, { name: '兽皮', n: 2 }],
        aff: { '铁匠': 6 }, skill: null, title: null, unlock: ['jl2_m1_04'], knowledge: ['剑胚矿石·产地'] },
      fail: { type: 'time', turns: 45, penalty: { aff: { '铁匠': -6 }, flag: 'jl2_m1_03_failed' } },
      once: true, repeat: 0, cooldown: 0,
      world: { setFlags: { '铁匠铺_剑胚_有货': true }, npcState: { '铁匠': '热络' },
        roomState: { '铁匠铺': '炉火映着新锻的剑胚。' } }
    },

    'jl2_m1_04': {
      id: 'jl2_m1_04', cat: 'main', chapter: 1, tier: 3,
      title: '山上有狼', giver: '衙门捕头', turnin: '衙门捕头', levelReq: 3,
      lock: { flags: { jl2_m1_03: true }, aff: {}, items: [], time: null, notFlags: {} },
      hook: '狼患惊了官面，衙门捕头开价：清了荒郊的狼群，赏银照发。',
      dialogue: { accept: 'd_m1_04_accept', turnin: 'd_m1_04_turnin' },
      stages: [
        { id: 's1', type: 'talk', npc: '衙门捕头', desc: '领缉狼的差事', hint: '大骊衙门' },
        { id: 's2', type: 'kill', enemy: '妖狼', need: 3, desc: '清三头妖狼', hint: '荒郊野岭',
          alt: '设陷阱 / 引兽相斗 / 请驯兽老妪驱赶' },
        { id: 's3', type: 'collect', item: '兽皮', need: 2, desc: '剥两张狼皮作凭证', hint: '荒郊野岭',
          alt: '向蛮荒游商购买' },
        { id: 's4', type: 'choice', desc: '狼皮如何处置', choices: [
          { text: '如数交官', effects: [{ aff: ['衙门捕头', 10] }, { fame: 2 }, { goto: 's5' }] },
          { text: '留一张自己用', effects: [{ item: '兽皮' }, { aff: ['衙门捕头', -5] }, { goto: 's5' }] },
          { text: '送给驯兽老妪', cond: { aff: { '驯兽老妪': 15 } }, effects: [{ aff: ['驯兽老妪', 12] }, { goto: 's5' }] }
        ] },
        { id: 's5', type: 'deliver', item: '兽皮', to: '衙门捕头', need: 2, desc: '回衙门交差' }
      ],
      branch: { key: 'jl2_m1_04_wolf', options: {
        A: { desc: '替官面立威', effects: [{ aff: ['巡城武官', 8] }, { flag: 'jl2_ch1_law' }, { fame: 2 }] },
        B: { desc: '把好处让给巷里人', effects: [{ aff: ['杨老头', 8] }, { gold: -40 }, { flag: 'jl2_ch1_people' }] }
      } },
      reward: { exp: 240, gold: 140, potential: 40, fame: 3,
        items: [{ name: '狼牙', n: 2 }, { name: '疗伤丹', n: 2 }],
        aff: { '衙门捕头': 6 }, skill: null, title: null, unlock: ['jl2_m1_05'], knowledge: ['狼群习性'] },
      fail: { type: 'time', turns: 50, penalty: { aff: { '衙门捕头': -8 }, flag: 'jl2_m1_04_failed' } },
      once: true, repeat: 0, cooldown: 0,
      world: { setFlags: { '荒郊野岭_狼患': false }, npcState: { '衙门捕头': '赞许' },
        roomState: { '荒郊野岭': '狼嚎稀了，山道重新有人走。' } }
    },

    'jl2_m1_05': {
      id: 'jl2_m1_05', cat: 'main', chapter: 1, tier: 3,
      title: '三条路,一个人', giver: '宋集薪', turnin: '宋集薪', levelReq: 3,
      lock: { flags: { jl2_m1_04: true }, aff: {}, items: [], time: null, notFlags: {} },
      hook: '巷口死人的旧案翻了出来——杀，放，还是交给官府，你说了算。',
      dialogue: { accept: 'd_m1_05_accept', turnin: 'd_m1_05_turnin' },
      stages: [
        { id: 's1', type: 'talk', npc: '宋集薪', desc: '问清旧案牵连', hint: '泥瓶巷' },
        { id: 's2', type: 'reach', room: '街尾民居', desc: '去街尾查那人的下落', hint: '街尾民居' },
        { id: 's3', type: 'kill', enemy: '好色恶徒', need: 1, desc: '恶徒拦路，了结他', hint: '街尾民居',
          alt: '买通顾璨说和 / 请巡城武官拿人' },
        { id: 's4', type: 'choice', desc: '三条路,只选一条', ttl: 3, choices: [
          { text: '就地处决', effects: [{ flag: 'jl2_ch1_execute' }, { fame: 2 }, { aff: ['巡城武官', -4] }] },
          { text: '放他一条生路', effects: [{ flag: 'jl2_ch1_spare' }, { aff: ['稚圭', 6] }, { debt: ['好色恶徒', 1] }] },
          { text: '捆了送衙门', effects: [{ flag: 'jl2_ch1_arrest' }, { aff: ['衙门捕头', 10] }, { fame: 3 }] }
        ] },
        { id: 's5', type: 'deliver', item: '断刀', to: '宋集薪', need: 1, desc: '把断刀交还宋集薪', optional: true }
      ],
      branch: { key: 'jl2_ch1_verdict', options: {
        A: { desc: '依法（送官）', effects: [{ flag: 'jl2_ch1_order' }, { aff: ['巡城武官', 8] }, { fame: 2 }] },
        B: { desc: '循情（私了）', effects: [{ flag: 'jl2_ch1_bond' }, { aff: ['杨老头', 8] }, { aff: ['宋集薪', 6] }] }
      } },
      reward: { exp: 260, gold: 120, potential: 45, fame: 2,
        items: [{ name: '断刀', n: 1 }, { name: '大还丹', n: 1 }],
        aff: { '宋集薪': 6 }, skill: null, title: null, unlock: ['jl2_m1_06'], knowledge: ['巷口旧案真相'] },
      fail: { type: 'flag', turns: 0, penalty: { flag: 'jl2_m1_05_failed', fame: -2 } },
      once: true, repeat: 0, cooldown: 0,
      world: { setFlags: { '泥瓶巷_旧案_了结': true }, npcState: { '宋集薪': '叹服' },
        roomState: { '街尾民居': '街坊们重新敢在门前说话。' } }
    },

    'jl2_m1_06': {
      id: 'jl2_m1_06', cat: 'main', chapter: 1, tier: 3,
      title: '两条狼,三个人', giver: '齐静春', turnin: '齐静春', levelReq: 4,
      lock: { flags: { jl2_m1_05: true }, aff: {}, items: [], time: null, notFlags: {} },
      hook: '狼群背后有人驱使——带上信得过的人上山，这一局定你在此地的名分。',
      dialogue: { accept: 'd_m1_06_accept', turnin: 'd_m1_06_turnin' },
      stages: [
        { id: 's1', type: 'talk', npc: '齐静春', desc: '听齐静春点将', hint: '泥瓶巷' },
        { id: 's2', type: 'aff', npc: '杨老头', value: 40, desc: '请一位好感≥40的同伴同行', hint: '好感够的人才肯跟来',
          alt: '改请巡城武官 / 宋集薪同行' },
        { id: 's3', type: 'kill', enemy: '妖狼', need: 4, desc: '第一段：狼群', hint: '荒郊野岭',
          alt: '用火把驱散 / 请驯兽老妪引导' },
        { id: 's4', type: 'kill', enemy: '血牙狼王', need: 1, desc: '第二段：头狼', hint: '荒郊野岭',
          alt: '下毒 / 设陷阱' },
        { id: 's5', type: 'choice', desc: '第三段：幕后驱狼之人', ttl: 3, choices: [
          { text: '杀了他', effects: [{ flag: 'jl2_ch1_kill_master' }, { fame: 2 }, { aff: ['巡城武官', -6] }] },
          { text: '放了他', effects: [{ flag: 'jl2_ch1_free_master' }, { aff: ['杨老头', 6] }, { debt: ['杨老头', 1] }] },
          { text: '交给官府', effects: [{ flag: 'jl2_ch1_turn_master' }, { aff: ['衙门捕头', 12] }, { fame: 3 }] }
        ] },
        { id: 's6', type: 'choice', desc: '章末抉择：报官,还是私了', ttl: 3, choices: [
          { text: '报官——立一个秩序', effects: [{ branch: 'A' }, { flag: 'ch1_choice_order' }, { worldFlag: ['ch1_choice', 'order'] }] },
          { text: '私了——还一份人情', effects: [{ branch: 'B' }, { flag: 'ch1_choice_bond' }, { worldFlag: ['ch1_choice', 'bond'] }] }
        ] }
      ],
      branch: { key: 'ch1_choice', options: {
        A: { desc: '报官（秩序线）', effects: [
          { worldFlag: ['ch1_choice', 'order'] },
          { aff: ['巡城武官', 12] }, { aff: ['衙门捕头', 10] }, { aff: ['齐静春', -3] },
          { respect: ['齐静春', 4] },
          { roomFlag: ['大骊衙门', 'ch1_order', true] },
          { roomFlag: ['泥瓶巷', 'ch1_order', true] },
          { shopStock: ['铁匠铺', '青锋剑', -1] },
          { flag: 'ch1_order' }, { fame: 3 }
        ] },
        B: { desc: '私了（人情线）', effects: [
          { worldFlag: ['ch1_choice', 'bond'] },
          { aff: ['杨老头', 12] }, { aff: ['宋集薪', 10] }, { aff: ['顾璨', 8] },
          { respect: ['齐静春', -3] },
          { roomFlag: ['泥瓶巷', 'ch1_bond', true] },
          { roomFlag: ['云来客栈', 'ch1_bond', true] },
          { shopStock: ['铁匠铺', '青锋剑', 1] },
          { flag: 'ch1_bond' }, { debt: ['杨老头', 1] }
        ] }
      } },
      reward: { exp: 320, gold: 160, potential: 55, fame: 4,
        items: [{ name: '槐木剑', n: 1 }, { name: '大还丹', n: 2 }],
        aff: { '齐静春': 8 }, skill: '浩然剑气', title: '初试锋芒',
        unlock: ['jl2_m2_01'], knowledge: ['驱使狼群的幕后'] },
      fail: { type: 'time', turns: 60, penalty: { aff: { '齐静春': -8 }, flag: 'jl2_m1_06_failed' } },
      once: true, repeat: 0, cooldown: 0,
      // 章末：写入 game.world.flags，并改变 ≥3 NPC 态度 / ≥2 房间状态 / 1 商店库存
      world: {
        setFlags: { ch1_done: true, '大骊京城_狼患_平': true, ch1_choice: 'pending' },
        npcState: { '齐静春': '肃然', '杨老头': '凝重', '衙门捕头': '观望' },
        roomState: { '泥瓶巷': '巷口的人开始留意你的来路。', '大骊京城': '茶楼里有了关于你的议论。' },
        rumors: ['泥瓶巷那个后生，一个人平了狼患。']
      }
    }
  };

  // ============================================================
  // 二、relations —— 20 个核心 NPC（名字均核实存在于 NPCS）
  //     字段：persona（人设/口癖/忌讳/日程）、memory（记忆规则）、
  //           rel（三维关系初值）、unlock（五档解锁，见 §7.2）
  // ============================================================
  JL2_CONTENT.relations = {
    '齐静春': {
      persona: { rank: '书院君子', camp: '文庙', speech: '文白夹杂，少用感叹',
        catchphrases: ['读书人不争一时', '路要自己走'], taboo: ['提他的死', '提陈平安的剑'],
        hobby: ['读书', '下棋'], schedule: { '6-10': '巷口', '10-16': '山崖书院', '16-20': '巷口', '20-6': '山崖书院' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_06:done', line: '那场狼患，你没有躲。', aff: 3, respect: 4 },
        { when: 'gift:悟道茶叶', line: '这茶……你从哪寻来的？', aff: 6 },
        { when: 'kill:妖狼>=10', line: '山上的狼，近来少了。', aff: 3 },
        { when: 'betray:书院', line: '（他不再看你）', aff: -40 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_qi'], 3: ['recommend_letter', 'teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '阮秀': {
      persona: { rank: '青莲洞天之主', camp: '火神一脉', speech: '清澈直接，偶尔出神',
        catchphrases: ['你从哪儿得来的？', '常来陪我说说话'], taboo: ['提她娘的死', '催她回天上'],
        hobby: ['看莲', '听人讲故事'], schedule: { '6-12': '青莲洞天', '12-18': '青莲洞天', '18-24': '荷塘' } },
      memory: { max: 12, rules: [
        { when: 'gift:金莲种子', line: '我娘当年，也种过一株。', aff: 14, respect: 2 },
        { when: 'quest:jl2_m1_06:done', line: '你平了狼患，我听说了。', aff: 5 },
        { when: 'flag:ruanxi_mother', line: '（她把旧物收进袖里）', aff: 4 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_ruan'], 3: ['gift_lotus', 'teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '杨老头': {
      persona: { rank: '泥瓶巷药铺掌柜', camp: '神道旧人', speech: '市井里藏着机锋',
        catchphrases: ['抓药？还是看相？', '有些人天生该拿剑'], taboo: ['点上说出他的真身'],
        hobby: ['抽旱烟', '看相'], schedule: { '6-20': '泥瓶巷', '20-6': '泥瓶巷' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_02:done', line: '那三株草药，救了两条命。', aff: 2 },
        { when: 'flag:ch1_bond', line: '你选了人情，我记得。', aff: 8 },
        { when: 'gift:山神香', line: '这香……点得值。', aff: 6 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'herb_recipe'], 3: ['alchemy_bonus', 'teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '李宝瓶': {
      persona: { rank: '山崖书院学生', camp: '书院', speech: '脆生生，爱追问',
        catchphrases: ['你是新来的？', '讲给我听嘛'], taboo: ['说读书无用'],
        hobby: ['背书', '问东问西'], schedule: { '6-18': '山崖书院', '18-21': '小镇官道' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_02:done', line: '你把功劳让给我，我记着呢！', aff: 12 },
        { when: 'gift:草药', line: '这是给我的？', aff: 5 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_baoping'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '陈平安': {
      persona: { rank: '落魄山山主', camp: '落魄山', speech: '质朴，话少，句句落地',
        catchphrases: ['山不在高，有剑则名', '挨的拳，都得记着'], taboo: ['提他幼年的穷', '提剑气长城的败'],
        hobby: ['劈剑', '酿酒'], schedule: { '6-18': '落魄山', '18-24': '云来客栈' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_06:done', line: '你把狼患平了，好。', aff: 6, respect: 5 },
        { when: 'gift:剑胚矿石', line: '这料子，配得上一把好剑。', aff: 6 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_chen'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '崔瀺': {
      persona: { rank: '大骊绣虎', camp: '大骊朝堂', speech: '谋士口吻，留半句',
        catchphrases: ['天下大势，如棋局', '算不过人心'], taboo: ['被说算计齐静春'],
        hobby: ['布局', '观棋'], schedule: { '8-18': '宝瓶洲渡口', '18-24': '大骊京城' } },
      memory: { max: 12, rules: [
        { when: 'flag:ch1_order', line: '你选了秩序，好棋。', aff: 6, respect: 6 },
        { when: 'flag:ch1_bond', line: '人情……也是一步棋。', aff: 2 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_cui'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '阿良': {
      persona: { rank: '亚圣之子·剑客', camp: '文庙', speech: '大笑，随性',
        catchphrases: ['我叫阿良，善良的良', '江湖也就酒好'], taboo: ['说他不善良'],
        hobby: ['喝酒', '斗酒'], schedule: { '12-24': '云来客栈' } },
      memory: { max: 12, rules: [
        { when: 'gift:陈年女儿红', line: '好酒！这朋友，交定了。', aff: 10 },
        { when: 'quest:jl2_m1_06:done', line: '那一剑，有点意思。', aff: 4, respect: 4 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_aliang'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '巡城武官': {
      persona: { rank: '大骊巡城武官', camp: '大骊军方', speech: '公事公办，短句',
        catchphrases: ['天子脚下，莫要生事', '有据便讲'], taboo: ['徇私', '无凭据的指控'],
        hobby: ['巡街', '校场'], schedule: { '6-18': '大骊京城', '18-24': '大骊皇宫' } },
      memory: { max: 12, rules: [
        { when: 'flag:ch1_order', line: '你报了官，是个体面人。', aff: 12 },
        { when: 'kill:妖狼>=5', line: '山路清了，你出了力。', aff: 4 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_guard'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '衙门捕头': {
      persona: { rank: '大骊捕头', camp: '大骊衙门', speech: '利落，讲规矩',
        catchphrases: ['公事公办', '拿妖丹来换赏'], taboo: ['包庇', '妖言惑众'],
        hobby: ['缉盗', '核对案卷'], schedule: { '6-20': '大骊衙门' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_04:done', line: '这桩差事，办得干净。', aff: 10 },
        { when: 'flag:ch1_order', line: '你走的是官面，好。', aff: 8 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'bounty_bonus'], 3: ['official_rank', 'teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '宋集薪': {
      persona: { rank: '泥瓶巷少年', camp: '大骊暗子', speech: '眼睛亮，话里带刺',
        catchphrases: ['你是新来的？', '你知道陈平安吗'], taboo: ['揭他的身世'],
        hobby: ['打听', '闲逛'], schedule: { '6-20': '泥瓶巷', '20-24': '镇外小路' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_05:done', line: '断刀还我，旧案就算了了。', aff: 8 },
        { when: 'flag:ch1_bond', line: '你把我当自己人。', aff: 6 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_song'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '顾璨': {
      persona: { rank: '泥瓶巷无赖少年', camp: '泥瓶巷', speech: '压低声音，江湖气',
        catchphrases: ['手头宽裕不？', '我罩你'], taboo: ['提陈平安回来之前'],
        hobby: ['混街', '放贷'], schedule: { '12-24': '泥瓶巷' } },
      memory: { max: 12, rules: [
        { when: 'gold>0:talk', line: '借我几两？', aff: 2 },
        { when: 'flag:ch1_bond', line: '够意思，兄弟。', aff: 8 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'loan'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '铁匠': {
      persona: { rank: '铁匠铺匠人', camp: '市井', speech: '闷声，一句是一句',
        catchphrases: ['要打铁吗？', '手艺不掺假'], taboo: ['催工期', '贬他的手艺'],
        hobby: ['打铁', '磨剑'], schedule: { '6-20': '铁匠铺' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_03:done', line: '你寻的料，实诚。', aff: 8 },
        { when: 'flag:ch1_debt', line: '你欠我一个人情，记得。', debt: 1 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'forge_discount'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '阮邛': {
      persona: { rank: '骑龙巷铁匠·兵家圣人', camp: '兵家', speech: '硬气，惜字',
        catchphrases: ['三十年只铸一把', '剑这东西，等得起'], taboo: ['催他铸剑', '提阮秀的天机'],
        hobby: ['打铁', '守炉'], schedule: { '6-20': '铁匠铺' } },
      memory: { max: 12, rules: [
        { when: 'gift:玄铁', line: '这铁，配得上炉子。', aff: 8 },
        { when: 'flag:jl2_m1_03_ruan', line: '你把矿石分我一半，厚道。', aff: 10 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'forge_master'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '刘羡阳': {
      persona: { rank: '少年侠客', camp: '落魄山', speech: '豪爽，爱拍桌',
        catchphrases: ['兄弟，喝一杯？', '有酒有朋友就够了'], taboo: ['提他被打成重伤'],
        hobby: ['喝酒', '走江湖'], schedule: { '10-24': '云来客栈' } },
      memory: { max: 12, rules: [
        { when: 'gift:陈年女儿红', line: '痛快！干了。', aff: 10 },
        { when: 'flag:ch1_bond', line: '你够朋友。', aff: 6 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_liuxiangyang'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '裴钱': {
      persona: { rank: '落魄山弟子·女武夫', camp: '落魄山', speech: '抱拳，直来直去',
        catchphrases: ['见人要先见礼', '你是好人还是坏人'], taboo: ['说她师父坏话'],
        hobby: ['练拳', '纠错'], schedule: { '6-18': '落魄山' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_06:done', line: '你不是软柿子。', aff: 6, respect: 6 },
        { when: 'gift:疗伤丹', line: '这……给我？', aff: 5 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_peiqian'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '茅小冬': {
      persona: { rank: '山崖书院副山主', camp: '书院', speech: '温和，引经据典',
        catchphrases: ['先立其大', '可读过《问剑》'], taboo: ['轻薄书院', '浮躁之论'],
        hobby: ['讲学', '整理典籍'], schedule: { '6-18': '山崖书院' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_02:done', line: '你肯把功劳让人，难得。', aff: 8, respect: 6 },
        { when: 'gift:悟道茶叶', line: '好茶，正好佐读。', aff: 6 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_mao'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '稚圭': {
      persona: { rank: '宋集薪的婢女', camp: '真龙', speech: '又轻又冷，短句',
        catchphrases: ['公子不在', '你在看什么'], taboo: ['提她的真龙之身'],
        hobby: ['静立', '看月'], schedule: { '6-24': '街尾民居' } },
      memory: { max: 12, rules: [
        { when: 'flag:jl2_ch1_spare', line: '你放了人……为何？', aff: 6 },
        { when: 'gift:夜明珠', line: '……这颗，给我？', aff: 8 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_zhigui'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '宁姚': {
      persona: { rank: '剑仙之女', camp: '剑气长城', speech: '清冷，话少',
        catchphrases: ['……', '莫要趟这浑水'], taboo: ['轻慢剑气长城'],
        hobby: ['练剑', '看海'], schedule: { '6-20': '云来客栈' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_06:done', line: '你的剑，还没歪。', aff: 6, respect: 6 },
        { when: 'gift:仙家雪莲', line: '……多谢。', aff: 6 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_ningyao'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '药王': {
      persona: { rank: '药王谷主', camp: '药王谷', speech: '老迈恳切',
        catchphrases: ['老夫自有重谢', '专治疑难杂症'], taboo: ['糟蹋药材'],
        hobby: ['采药', '炼丹'], schedule: { '6-20': '药王谷' } },
      memory: { max: 12, rules: [
        { when: 'quest:jl2_m1_02:done', line: '你采的药，救了人。', aff: 6 },
        { when: 'gift:草药', line: '又是草药？也罢。', aff: 2 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'alchemy_recipe'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '剑灵老妪': {
      persona: { rank: '守剑人', camp: '藕花福地', speech: '幽幽，话里有剑意',
        catchphrases: ['来寻古剑残意？', '先退镇墓妖兽'], taboo: ['轻慢残剑'],
        hobby: ['守剑', '参悟剑诀'], schedule: { '6-24': '藕花福地' } },
      memory: { max: 12, rules: [
        { when: 'kill:镇墓妖兽>=1', line: '镇墓兽退了，你可以看看剑。', aff: 6, respect: 6 },
        { when: 'gift:疗伤丹', line: '老身用不上，但收下了。', aff: 3 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_jianling'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    },
    '赊月': {
      persona: { rank: '明月前身', camp: '蛮荒妖族', speech: '轻，带三分怯',
        catchphrases: ['别紧张，我不会跑', '就说月亮照过他屋顶'], taboo: ['提刘羡阳', '提月魄被夺'],
        hobby: ['看月', '临水'], schedule: { '18-6': '藕花福地' } },
      memory: { max: 12, rules: [
        { when: 'gift:夜明珠', line: '月光……落在珠上了。', aff: 8 },
        { when: 'quest:jl2_m1_06:done', line: '你平了狼患，我听说了。', aff: 4 }
      ] },
      rel: { aff: 0, respect: 0, debt: 0, tier: 0, events: {} },
      unlock: { 1: ['rumor_local'], 2: ['discount_10', 'quest_side_sheyue'], 3: ['teach_skill'], 4: ['escort_help'], 5: ['legacy'] }
    }
  };

  // ============================================================
  // 三、dialogues —— 与任务/NPC 配套的节点图（≥30 段，格式见 §4.6）
  //     每段至少 1 个条件选项（cond / req）。
  //     含齐静春「交心」与阮秀送礼两段完整样板。
  // ============================================================
  JL2_CONTENT.dialogues = {
    'd_m1_01_accept': {
      cast: ['杨老头'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '泥瓶巷口围了一圈人，谁也不肯先靠近那具尸体。', next: 'b' },
        b: { who: '杨老头', style: 'say', act: '（他蹲下身，烟杆在鞋底磕了磕）', text: '半截断刀，不是这条巷子的东西。', next: 'c' },
        c: { who: '杨老头', style: 'say', text: '他手里还攥着半张药方。你要管，就先认认这刀。', next: 'd' },
        d: { who: '你', style: 'inner', text: '（人命关天，可这刀看着就不简单。）', next: 'e' },
        e: { who: '杨老头', style: 'ask', choices: [
          { text: '我这就去认刀。', effects: [{ accept: 'jl2_m1_01' }, { aff: ['杨老头', 4] }], goto: 'f' },
          { text: '这刀出自何处？', cond: { flag: 'jl2_m1_01' }, effects: [{ flag: 'jl2_ask_blade' }, { aff: ['杨老头', 2] }], goto: 'g' },
          { text: '（先要几两跑腿钱）', req: { meili: 5 }, effects: [{ gold: 10 }, { aff: ['杨老头', -2] }], goto: 'f' },
          { text: '这活我接不了。', effects: [{ decline: 'jl2_m1_01' }], goto: 'h' }
        ] },
        f: { who: '杨老头', style: 'say', text: '早去早回，天黑前巷口不太平。', next: 'end' },
        g: { who: '杨老头', style: 'say', text: '断口像官造的，可官造的刀，不会丢在泥瓶巷。', next: 'e' },
        h: { who: '杨老头', style: 'say', text: '也罢，我再寻个人。', next: 'end' }
      }
    },
    'd_m1_01_turnin': {
      cast: ['杨老头'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '药铺的灯刚点上，柜台后是杨老头吧嗒作响的烟杆。', next: 'b' },
        b: { who: '杨老头', style: 'say', text: '药来了？李家娘子还等着。', next: 'c' },
        c: { who: '杨老头', style: 'ask', choices: [
          { text: '三株草药，如数交上。', effects: [{ turnin: 'jl2_m1_01' }, { aff: ['杨老头', 6] }], goto: 'd' },
          { text: '（讨价还价）再添两文？', req: { meili: 6 }, effects: [{ gold: 15 }, { aff: ['杨老头', -3] }], goto: 'd' },
          { text: '那半张药方，能给我看看吗', cond: { aff: { '杨老头': 10 } }, effects: [{ item: '断刀' }, { flag: 'jl2_m1_01_recipe' }], goto: 'e' }
        ] },
        d: { who: '杨老头', style: 'say', text: '好，好。这份情，老头子记下了。', next: 'end' },
        e: { who: '杨老头', style: 'say', act: '（他盯了你一眼，把药方推过来）', text: '拿去，别惹祸。', next: 'end' }
      }
    },
    'd_m1_02_accept': {
      cast: ['杨老头'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '药铺柜台上摊着三张方子，墨迹被手汗洇开。', next: 'b' },
        b: { who: '杨老头', style: 'say', act: '（他把烟杆在柜面上磕了磕）', text: '李家娘子难产，就差一味止血草。', next: 'c' },
        c: { who: '杨老头', style: 'say', text: '山上刚闹过狼。你去，我不拦；不去，我也不怪。', next: 'd' },
        d: { who: '你', style: 'inner', text: '（三株草，两条命。这买卖不亏。）', next: 'e' },
        e: { who: '杨老头', style: 'ask', choices: [
          { text: '我去。', effects: [{ accept: 'jl2_m1_02' }, { aff: ['杨老头', 6] }], goto: 'f' },
          { text: '山上闹狼，你怎不叫武馆的人去？', cond: { flag: 'jl2_ch1_tip_off' }, effects: [{ flag: 'jl2_asked_yang' }, { aff: ['杨老头', 2] }], goto: 'g' },
          { text: '（要些定金）', req: { meili: 6 }, effects: [{ gold: 30 }, { aff: ['杨老头', -3] }], goto: 'f' },
          { text: '这活我接不了。', effects: [{ decline: 'jl2_m1_02' }], goto: 'h' }
        ] },
        f: { who: '杨老头', style: 'say', text: '早去早回。天黑之前，山路上不太平。', next: 'end' },
        g: { who: '杨老头', style: 'say', text: '（他沉默了一会儿）武馆的人，昨日去了三个，回来两个。', next: 'e' },
        h: { who: '杨老头', style: 'say', text: '也罢。', next: 'end' }
      }
    },
    'd_m1_02_turnin': {
      cast: ['杨老头', '李宝瓶'], entry: 'a', nodes: {
        a: { who: '李宝瓶', style: 'say', text: '小师叔回来了！三株草采到了吗？', next: 'b' },
        b: { who: '杨老头', style: 'say', act: '（他数着草药，手指发抖）', text: '够了，够了……', next: 'c' },
        c: { who: '你', style: 'ask', choices: [
          { text: '把功劳让给药童。', effects: [{ turnin: 'jl2_m1_02' }, { aff: ['李宝瓶', 12] }, { flag: 'jl2_m1_02_humble' }], goto: 'd' },
          { text: '当着众人讨赏。', effects: [{ turnin: 'jl2_m1_02' }, { gold: 80 }, { fame: -1 }, { aff: ['杨老头', -4] }], goto: 'e' },
          { text: '（若懂医理，指出药方一处错漏）', req: { gengu: 8 }, effects: [{ turnin: 'jl2_m1_02' }, { respect: ['杨老头', 6] }, { knowledge: '药理·止血草' }], goto: 'f' }
        ] },
        d: { who: '杨老头', style: 'say', text: '（他看了你一眼，没说话，眼神却软了。）', next: 'end' },
        e: { who: '李宝瓶', style: 'act', act: '（她张了张嘴，终究没出声。）', next: 'end' },
        f: { who: '杨老头', style: 'say', text: '你这后生……有眼界。', next: 'end' }
      }
    },
    'd_m1_03_accept': {
      cast: ['铁匠'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '铁匠铺里热浪逼人，铁匠光着膀子，正对着一炉废铁运气。', next: 'b' },
        b: { who: '铁匠', style: 'say', text: '矿脉被蛮荒妖族占了，好料都糟蹋在野地里。', next: 'c' },
        c: { who: '铁匠', style: 'say', text: '你替我弄两块剑胚矿石来，这铺子里最好的一把剑，归你。', next: 'd' },
        d: { who: '铁匠', style: 'ask', choices: [
          { text: '替你取来便是。', effects: [{ accept: 'jl2_m1_03' }, { aff: ['铁匠', 6] }], goto: 'e' },
          { text: '矿石到手，兵器可要打折。', req: { meili: 6 }, effects: [{ accept: 'jl2_m1_03' }, { gold: 20 }, { aff: ['铁匠', -3] }], goto: 'e' },
          { text: '若分阮邛一半，可肯？', cond: { aff: { '阮邛': 20 } }, effects: [{ accept: 'jl2_m1_03' }, { aff: ['阮邛', 10] }, { flag: 'jl2_m1_03_ruan' }], goto: 'f' }
        ] },
        e: { who: '铁匠', style: 'say', text: '（他重重一点头：好。）', next: 'end' },
        f: { who: '铁匠', style: 'say', text: '阮邛那老东西？……随你。', next: 'end' }
      }
    },
    'd_m1_03_turnin': {
      cast: ['铁匠'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '剑胚矿石在砧上泛着冷光，铁匠的锤子停在半空。', next: 'b' },
        b: { who: '铁匠', style: 'ask', choices: [
          { text: '按约取剑，不欠人情。', effects: [{ turnin: 'jl2_m1_03' }, { item: '青锋剑' }, { flag: 'jl2_ch1_no_debt' }], goto: 'c' },
          { text: '这人情，我先记下。', effects: [{ turnin: 'jl2_m1_03' }, { aff: ['铁匠', 10] }, { debt: ['铁匠', 1] }, { flag: 'jl2_ch1_debt' }], goto: 'd' },
          { text: '（讨一副护手）', req: { meili: 6 }, effects: [{ turnin: 'jl2_m1_03' }, { item: '软猬甲' }, { aff: ['铁匠', -3] }], goto: 'e' }
        ] },
        c: { who: '铁匠', style: 'say', text: '干净。拿剑走人。', next: 'end' },
        d: { who: '铁匠', style: 'say', text: '（他咧嘴一笑）记住就好。', next: 'end' },
        e: { who: '铁匠', style: 'say', text: '得寸进尺——也给你。', next: 'end' }
      }
    },
    'd_m1_04_accept': {
      cast: ['衙门捕头'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '大骊衙门前，捕头按刀立在阶上，案卷摞得老高。', next: 'b' },
        b: { who: '衙门捕头', style: 'say', text: '荒郊的狼群惊了官面。清了它，赏银照发。', next: 'c' },
        c: { who: '衙门捕头', style: 'ask', choices: [
          { text: '这差事，我接。', effects: [{ accept: 'jl2_m1_04' }, { aff: ['衙门捕头', 6] }], goto: 'd' },
          { text: '赏银几何，先说明白。', req: { meili: 5 }, effects: [{ accept: 'jl2_m1_04' }, { gold: 20 }, { aff: ['衙门捕头', -3] }], goto: 'd' },
          { text: '若走官面，能不能给个身份？', cond: { flag: 'jl2_ch1_tip_off' }, effects: [{ accept: 'jl2_m1_04' }, { flag: 'jl2_seek_office' }, { aff: ['巡城武官', 6] }], goto: 'e' }
        ] },
        d: { who: '衙门捕头', style: 'say', text: '带上狼皮回来交差。', next: 'end' },
        e: { who: '衙门捕头', style: 'say', text: '先把差事办漂亮，身份的事，后头再说。', next: 'end' }
      }
    },
    'd_m1_04_turnin': {
      cast: ['衙门捕头'], entry: 'a', nodes: {
        a: { who: '衙门捕头', style: 'say', text: '狼皮可带来了？', next: 'b' },
        b: { who: '衙门捕头', style: 'ask', choices: [
          { text: '如数交官。', effects: [{ turnin: 'jl2_m1_04' }, { aff: ['衙门捕头', 10] }, { fame: 2 }, { flag: 'jl2_ch1_law' }], goto: 'c' },
          { text: '留一张自己用。', effects: [{ turnin: 'jl2_m1_04' }, { item: '兽皮' }, { aff: ['衙门捕头', -5] }], goto: 'd' },
          { text: '把好处让给巷里人。', cond: { aff: { '杨老头': 15 } }, effects: [{ turnin: 'jl2_m1_04' }, { aff: ['杨老头', 8] }, { gold: -40 }, { flag: 'jl2_ch1_people' }], goto: 'e' }
        ] },
        c: { who: '衙门捕头', style: 'say', text: '办得干净。这才像官面的人。', next: 'end' },
        d: { who: '衙门捕头', style: 'say', text: '（他皱了皱眉，还是收下了。）', next: 'end' },
        e: { who: '衙门捕头', style: 'say', text: '你倒会做人。', next: 'end' }
      }
    },
    'd_m1_05_accept': {
      cast: ['宋集薪'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '宋集薪倚着巷墙，眼睛亮晶晶的，压低了声音。', next: 'b' },
        b: { who: '宋集薪', style: 'say', text: '巷口死人的旧案，翻出来了。你知道那半张药方吗？', next: 'c' },
        c: { who: '宋集薪', style: 'ask', choices: [
          { text: '我知道，正要查。', effects: [{ accept: 'jl2_m1_05' }, { aff: ['宋集薪', 6] }], goto: 'd' },
          { text: '（要他先透个底）', req: { meili: 6 }, effects: [{ accept: 'jl2_m1_05' }, { gold: 15 }, { aff: ['宋集薪', -2] }], goto: 'd' },
          { text: '当初私了，现在又闹？', cond: { flag: 'jl2_ch1_cover_up' }, effects: [{ accept: 'jl2_m1_05' }, { flag: 'jl2_old_case' }, { aff: ['宋集薪', 3] }], goto: 'e' }
        ] },
        d: { who: '宋集薪', style: 'say', text: '街尾民居，去问问就知道了。', next: 'end' },
        e: { who: '宋集薪', style: 'say', text: '（他眼神一闪）你当年选了私了，如今也别后悔。', next: 'end' }
      }
    },
    'd_m1_05_turnin': {
      cast: ['宋集薪', '稚圭'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '街尾的灯灭了又亮，宋集薪在门口等了很久。', next: 'b' },
        b: { who: '宋集薪', style: 'ask', choices: [
          { text: '依法，捆了送衙门。', effects: [{ turnin: 'jl2_m1_05' }, { flag: 'jl2_ch1_arrest' }, { aff: ['衙门捕头', 10] }, { fame: 3 }], goto: 'c' },
          { text: '放他一条生路。', effects: [{ turnin: 'jl2_m1_05' }, { flag: 'jl2_ch1_spare' }, { aff: ['稚圭', 6] }, { debt: ['好色恶徒', 1] }], goto: 'd' },
          { text: '（我自会了断）', req: { gengu: 8 }, effects: [{ turnin: 'jl2_m1_05' }, { flag: 'jl2_ch1_execute' }, { fame: 2 }, { aff: ['巡城武官', -4] }], goto: 'e' }
        ] },
        c: { who: '宋集薪', style: 'say', text: '走官面……也好。', next: 'end' },
        d: { who: '稚圭', style: 'say', text: '（她微微抬眼）你放了人。为何？', next: 'end' },
        e: { who: '宋集薪', style: 'say', text: '（他沉默片刻）你比我想的狠。', next: 'end' }
      }
    },
    'd_m1_06_accept': {
      cast: ['齐静春'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '老槐树下，齐静春合上书，抬头看你。', next: 'b' },
        b: { who: '齐静春', style: 'say', text: '狼群背后有人驱使。这一局，定你在此地的名分。', next: 'c' },
        c: { who: '齐静春', style: 'say', text: '带上信得过的人——好感不到四十的，不会跟你上山。', next: 'd' },
        d: { who: '齐静春', style: 'ask', choices: [
          { text: '我这就去点将。', effects: [{ accept: 'jl2_m1_06' }, { aff: ['齐静春', 6] }], goto: 'e' },
          { text: '先生为何不亲自去？', cond: { aff: { '齐静春': 45 } }, effects: [{ accept: 'jl2_m1_06' }, { flag: 'jl2_qi_why' }, { respect: ['齐静春', 4] }], goto: 'f' },
          { text: '（我想先备些丹药）', req: { gengu: 6 }, effects: [{ accept: 'jl2_m1_06' }, { item: '疗伤丹' }, { aff: ['齐静春', 2] }], goto: 'e' }
        ] },
        e: { who: '齐静春', style: 'say', text: '去吧。山路小心。', next: 'end' },
        f: { who: '齐静春', style: 'say', text: '（他望着远处）有些路，得你们自己走。', next: 'end' }
      }
    },
    // —— 章末不可逆选择：写入 world.flags，改变后续世界 ——
    'd_m1_06_turnin': {
      cast: ['齐静春', '杨老头', '巡城武官'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '山路尽头，狼尸横陈。齐静春站在高处，等人来定这一局的结局。', next: 'b' },
        b: { who: '齐静春', style: 'say', text: '幕后的人，一并拿了。现在，轮到你选。', next: 'c' },
        c: { who: '齐静春', style: 'ask', choices: [
          { text: '报官——立一个秩序。', effects: [{ turnin: 'jl2_m1_06' }, { branch: 'A' }, { worldFlag: ['ch1_choice', 'order'] }, { flag: 'ch1_order' }, { aff: ['巡城武官', 12] }, { respect: ['齐静春', 4] }, { fame: 3 }], goto: 'd' },
          { text: '私了——还一份人情。', effects: [{ turnin: 'jl2_m1_06' }, { branch: 'B' }, { worldFlag: ['ch1_choice', 'bond'] }, { flag: 'ch1_bond' }, { aff: ['杨老头', 12] }, { debt: ['杨老头', 1] }], goto: 'e' },
          { text: '（若与齐静春交心，问他的意思）', cond: { aff: { '齐静春': 45 } }, effects: [{ turnin: 'jl2_m1_06' }, { flag: 'jl2_qi_advice' }, { respect: ['齐静春', 6] }], goto: 'f' }
        ] },
        d: { who: '旁白', style: 'sys', text: '【世界改变】京城的风向变了。官面上的人开始记得你的名字。', next: 'end' },
        e: { who: '旁白', style: 'sys', text: '【世界改变】泥瓶巷的人把你当自己人。人情，比银子沉。', next: 'end' },
        f: { who: '齐静春', style: 'say', text: '（他望着你）你心里已有答案，何必问我。', next: 'end' }
      }
    },

    // —— 人物志：齐静春三环 ——
    'd_qi_1': {
      cast: ['齐静春'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '老槐树下，他仍坐在那张矮凳上，手里一卷书。', next: 'b' },
        b: { who: '齐静春', style: 'say', text: '你来了。坐。', next: 'c' },
        c: { who: '齐静春', style: 'ask', choices: [
          { text: '先生在读什么书？', effects: [{ aff: ['齐静春', 6] }, { flag: 'qi_talk_book' }], goto: 'd' },
          { text: '（若已平狼患，提起此事）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['齐静春', 4] }, { respect: ['齐静春', 4] }], goto: 'e' },
          { text: '（要向他讨教剑理）', req: { gengu: 6 }, effects: [{ respect: ['齐静春', 6] }, { knowledge: '浩然气' }], goto: 'f' }
        ] },
        d: { who: '齐静春', style: 'say', text: '圣贤书。可书里的道理，要走出来才算数。', next: 'end' },
        e: { who: '齐静春', style: 'say', text: '那场狼患，你没有躲。好。', next: 'end' },
        f: { who: '齐静春', style: 'say', text: '剑是末，心是本。你且记着。', next: 'end' }
      }
    },
    // —— 样板：齐静春·第二环「交心」（据方案 §6.5 润色）——
    'd_qi_2': {
      cast: ['齐静春'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '（巷口的老槐树下，他仍坐在那张矮凳上，手里一卷书，半天没翻。）', next: 'b' },
        b: { who: '齐静春', style: 'say', text: '你来了。他没抬头。', next: 'c' },
        c: { who: '齐静春', style: 'say', text: '坐。', next: 'd' },
        d: { who: '旁白', style: 'narr', text: '（你坐下。风把书页吹得哗哗响，他伸手按住。）', next: 'e' },
        e: { who: '齐静春', style: 'say', text: '我教过一个学生。比你聪明，也比你倔。', next: 'f' },
        f: { who: '你', style: 'say', text: '后来呢？', next: 'g' },
        g: { who: '旁白', style: 'narr', text: '（他沉默了一会儿。）', next: 'h' },
        h: { who: '齐静春', style: 'say', text: '后来他死了。死在一件他觉得自己对的事上。', next: 'i' },
        i: { who: '旁白', style: 'narr', text: '（他终于抬头，望着你。）', next: 'j' },
        j: { who: '齐静春', style: 'say', text: '我今日叫你来，不是要你学他。是要你看看——这条路，走到头是什么样子。', next: 'k' },
        k: { who: '你', style: 'ask', choices: [
          { text: '我不怕。', req: { gengu: 8 }, effects: [{ respect: ['齐静春', 8] }, { flag: 'qi_no_fear' }], goto: 'l' },
          { text: '那我换条路走。', effects: [{ aff: ['齐静春', 8] }, { flag: 'qi_hide_edge' }, { unlock: 'hide_edge' }], goto: 'm' },
          { text: '你后悔教他吗？', cond: { aff: { '齐静春': 45 } }, effects: [{ aff: ['齐静春', 6] }, { item: '悟道茶叶' }, { flag: 'qi_hidden_talk' }, { knowledge: '书院旧事' }], goto: 'n' }
        ] },
        l: { who: '齐静春', style: 'say', text: '（他看了你很久）好。那便走下去。', next: 'end' },
        m: { who: '齐静春', style: 'say', text: '换路，也要换得明白。', next: 'end' },
        n: { who: '旁白', style: 'sys', text: '【隐藏对话已解锁】你得到了一卷旧书。', next: 'end' }
      }
    },
    'd_qi_3': {
      cast: ['齐静春'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '学塾后院，齐静春把一封信推到你面前。', next: 'b' },
        b: { who: '齐静春', style: 'say', text: '这封信，可免试进山崖书院。', next: 'c' },
        c: { who: '齐静春', style: 'ask', choices: [
          { text: '（郑重接过）我不会辜负。', effects: [{ item: '洞天玉简' }, { title: '文脉' }, { unlock: 'ending_literati' }, { respect: ['齐静春', 8] }], goto: 'd' },
          { text: '我若不想进书院呢？', req: { meili: 7 }, effects: [{ flag: 'qi_decline_letter' }, { aff: ['齐静春', -4] }], goto: 'e' },
          { text: '（若走过藏锋路，问他缘由）', cond: { flag: 'qi_hide_edge' }, effects: [{ knowledge: '藏锋之义' }, { aff: ['齐静春', 6] }], goto: 'f' }
        ] },
        d: { who: '齐静春', style: 'say', text: '去吧。读书人，也要走得动路。', next: 'end' },
        e: { who: '齐静春', style: 'say', text: '（他点点头）人各有志。', next: 'end' },
        f: { who: '齐静春', style: 'say', text: '藏锋不是退，是把刀磨得更亮。', next: 'end' }
      }
    },

    // —— 人物志：阮秀送礼 + 三环 ——
    'd_ruan_1': {
      cast: ['阮秀'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '青莲洞天，一池青莲开得正好。红衣女子立在莲畔。', next: 'b' },
        b: { who: '阮秀', style: 'say', text: '你是什么人？这洞天许久没有生人来了。', next: 'c' },
        c: { who: '阮秀', style: 'ask', choices: [
          { text: '路过的旅人，来陪你说说话。', effects: [{ aff: ['阮秀', 8] }, { flag: 'ruan_friends' }], goto: 'd' },
          { text: '（夸这池青莲好看）', req: { meili: 6 }, effects: [{ aff: ['阮秀', 6] }], goto: 'd' },
          { text: '（若已平狼患，提起外面的事）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['阮秀', 5] }, { respect: ['阮秀', 3] }], goto: 'e' }
        ] },
        d: { who: '阮秀', style: 'say', text: '那……常来。', next: 'end' },
        e: { who: '阮秀', style: 'say', text: '外面的事，我听得不多。你讲吧。', next: 'end' }
      }
    },
    // —— 样板：给阮秀送「莲种」（据方案 §7.7 润色，物品用真实项 金莲种子）——
    'd_ruan_gift': {
      cast: ['阮秀'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '（她把莲种托在掌心，看了很久。荷塘的风把她的袖子吹起来一角。）', next: 'b' },
        b: { who: '阮秀', style: 'say', text: '这是……青莲？', act: '（她抬头，眼睛亮了一下，又暗下去。）', next: 'c' },
        c: { who: '阮秀', style: 'say', text: '你从哪儿得来的？', next: 'd' },
        d: { who: '旁白', style: 'narr', text: '（你如实说了。）', next: 'e' },
        e: { who: '旁白', style: 'narr', text: '（她低下头，指尖在莲种上轻轻碰了碰，像是怕碰碎了。）', next: 'f' },
        f: { who: '阮秀', style: 'say', text: '我娘当年，也种过一株。', act: '（她说得很轻）', next: 'g' },
        g: { who: '阮秀', style: 'say', text: '后来枯了。', next: 'h' },
        h: { who: '旁白', style: 'narr', text: '（她把莲种收进袖里，忽然想起什么，从腕上褪下一只旧镯子。）', next: 'i' },
        i: { who: '阮秀', style: 'say', text: '这个给你。不值钱，可是……戴着吧。', next: 'j' },
        j: { who: '你', style: 'ask', choices: [
          { text: '（郑重收下，什么也不问）', effects: [{ gift: ['阮秀', '金莲种子'] }, { aff: ['阮秀', 14] }, { respect: ['阮秀', 2] }, { item: '玉佩' }, { flag: 'ruanxi_mother' }, { nextDialogue: 'd_ruan_night' }], goto: 'k' },
          { text: '这太贵重，我不能收。', req: { meili: 7 }, effects: [{ aff: ['阮秀', 6] }, { respect: ['阮秀', 4] }, { gold: 60 }], goto: 'l' },
          { text: '（追问她娘的事）', cond: { aff: { '阮秀': 30 } }, effects: [{ aff: ['阮秀', 8] }, { flag: 'ruan_ask_mother' }, { knowledge: '阮秀往事' }], goto: 'm' }
        ] },
        k: { who: '旁白', style: 'sys', text: '【亲密 +14 · 敬重 +2】得「玉佩」；三回合后触发「荷塘夜话」。', next: 'end' },
        l: { who: '阮秀', style: 'say', text: '（她把镯子收回去）你倒实在。', next: 'end' },
        m: { who: '阮秀', style: 'say', text: '（她沉默了很久）……改日再说吧。', next: 'end' }
      }
    },
    'd_ruan_night': {
      cast: ['阮秀'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '三日后，荷塘月色如水。她坐在石阶上，像是早等你来。', next: 'b' },
        b: { who: '阮秀', style: 'say', text: '我娘说，莲种要埋在心里，才会发芽。', next: 'c' },
        c: { who: '阮秀', style: 'ask', choices: [
          { text: '（陪她看月，不说话）', effects: [{ aff: ['阮秀', 10] }, { flag: 'ruan_night' }], goto: 'd' },
          { text: '讲一个外面的故事给她听。', req: { meili: 6 }, effects: [{ aff: ['阮秀', 8] }, { knowledge: '荷塘夜话' }], goto: 'e' },
          { text: '（若已解她心事，提起她娘）', cond: { flag: 'ruanxi_mother' }, effects: [{ aff: ['阮秀', 12] }, { respect: ['阮秀', 4] }], goto: 'f' }
        ] },
        d: { who: '旁白', style: 'narr', text: '（荷叶上的露，慢慢亮了。）', next: 'end' },
        e: { who: '阮秀', style: 'say', text: '再讲一个……', next: 'end' },
        f: { who: '阮秀', style: 'say', text: '（她轻轻靠过来）谢谢你。', next: 'end' }
      }
    },
    'd_ruan_3': {
      cast: ['阮秀'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '她把一枚莲子递给你，掌心还带着荷塘的凉。', next: 'b' },
        b: { who: '阮秀', style: 'say', text: '这是我家传的莲子。戴在身上，辟邪。', next: 'c' },
        c: { who: '阮秀', style: 'ask', choices: [
          { text: '（收下，郑重道谢）', effects: [{ item: '藕花莲子' }, { aff: ['阮秀', 10] }, { unlock: 'ending_lotus' }], goto: 'd' },
          { text: '我该拿什么回你？', req: { meili: 7 }, effects: [{ debt: ['阮秀', -1] }, { aff: ['阮秀', 6] }], goto: 'e' },
          { text: '（若已解心事，问她是否还回天上）', cond: { flag: 'ruanxi_mother' }, effects: [{ flag: 'ruan_stay' }, { aff: ['阮秀', 12] }], goto: 'f' }
        ] },
        d: { who: '阮秀', style: 'say', text: '常来。', next: 'end' },
        e: { who: '阮秀', style: 'say', text: '你人来了，就够了。', next: 'end' },
        f: { who: '阮秀', style: 'say', text: '（她笑了）这里有莲，有你，我哪儿也不去。', next: 'end' }
      }
    },

    // —— 其余 NPC 配套对话（每条 ≥1 个条件选项）——
    'd_yang_1': {
      cast: ['杨老头'], entry: 'a', nodes: {
        a: { who: '杨老头', style: 'say', text: '抓药？还是看相？', next: 'b' },
        b: { who: '杨老头', style: 'ask', choices: [
          { text: '抓药。', effects: [{ aff: ['杨老头', 2] }, { shop: '药铺' }], goto: 'c' },
          { text: '看相。', req: { meili: 6 }, effects: [{ aff: ['杨老头', 4] }, { flag: 'yang_fortune' }], goto: 'd' },
          { text: '（若走人情线，提那一摊血）', cond: { flag: 'ch1_bond' }, effects: [{ aff: ['杨老头', 6] }], goto: 'e' }
        ] },
        c: { who: '杨老头', style: 'say', text: '药在柜上，自取。', next: 'end' },
        d: { who: '杨老头', style: 'say', text: '你这面相……藏着一段没走完的路。', next: 'end' },
        e: { who: '杨老头', style: 'say', text: '那摊血，我洗不掉。你倒洗干净了。', next: 'end' }
      }
    },
    'd_yang_2': {
      cast: ['杨老头'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '夜里的药铺，只剩烟头一点红光。', next: 'b' },
        b: { who: '杨老头', style: 'say', text: '有些人天生该拿剑，有些人走一条没人走过的路。', next: 'c' },
        c: { who: '杨老头', style: 'ask', choices: [
          { text: '（请他赐一味炼丹的方子）', effects: [{ knowledge: '药方·炼丹' }, { aff: ['杨老头', 6] }, { unlock: 'alchemy_bonus' }], goto: 'd' },
          { text: '你究竟是谁？', req: { gengu: 9 }, effects: [{ flag: 'yang_true' }, { respect: ['杨老头', 6] }], goto: 'e' },
          { text: '（若欠他人情，提起）', cond: { debt: { '杨老头': 1 } }, effects: [{ debt: ['杨老头', -1] }, { aff: ['杨老头', 4] }], goto: 'f' }
        ] },
        d: { who: '杨老头', style: 'say', text: '拿去。炼丹成的那日，别忘了我。', next: 'end' },
        e: { who: '杨老头', style: 'say', text: '（他吐出一口烟）知道太多，不是好事。', next: 'end' },
        f: { who: '杨老头', style: 'say', text: '你还记得。好。', next: 'end' }
      }
    },
    'd_guard_order': {
      cast: ['巡城武官'], entry: 'a', nodes: {
        a: { who: '巡城武官', style: 'say', text: '天子脚下，莫要生事。', next: 'b' },
        b: { who: '巡城武官', style: 'ask', choices: [
          { text: '（亮明官面身份）', effects: [{ aff: ['巡城武官', 6] }, { flag: 'guard_recognize' }], goto: 'c' },
          { text: '（若走秩序线，报上狼患之功）', cond: { flag: 'ch1_order' }, effects: [{ aff: ['巡城武官', 10] }, { fame: 2 }], goto: 'd' },
          { text: '（若走人情线，闭口不提）', cond: { flag: 'ch1_bond' }, effects: [{ aff: ['巡城武官', -4] }], goto: 'e' }
        ] },
        c: { who: '巡城武官', style: 'say', text: '既如此，办事去吧。', next: 'end' },
        d: { who: '巡城武官', style: 'say', text: '报官之举，我记得。', next: 'end' },
        e: { who: '巡城武官', style: 'say', text: '（他冷冷看你一眼）你走的路，我记着。', next: 'end' }
      }
    },
    'd_ali_1': {
      cast: ['阿良'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '云来客栈墙根，一个男人靠着喝酒，见你来，大笑。', next: 'b' },
        b: { who: '阿良', style: 'say', text: '我叫阿良，善良的良！', next: 'c' },
        c: { who: '阿良', style: 'ask', choices: [
          { text: '（请他喝一坛女儿红）', effects: [{ gift: ['阿良', '陈年女儿红'] }, { aff: ['阿良', 10] }, { unlock: 'teach_skill' }], goto: 'd' },
          { text: '（比拼酒量）', req: { gengu: 7 }, effects: [{ respect: ['阿良', 8] }, { aff: ['阿良', 4] }], goto: 'e' },
          { text: '（若走过狼患，问他剑意）', cond: { flag: 'ch1_done' }, effects: [{ respect: ['阿良', 6] }, { knowledge: '道理剑' }], goto: 'f' }
        ] },
        d: { who: '阿良', style: 'say', text: '好酒！这朋友，交定了。', next: 'end' },
        e: { who: '阿良', style: 'say', text: '海量！再来！', next: 'end' },
        f: { who: '阿良', style: 'say', text: '那一战，有点意思。剑，要这么用——', next: 'end' }
      }
    },
    'd_ningyao_1': {
      cast: ['宁姚'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '斗笠下，一双清冷的眼看了过来。', next: 'b' },
        b: { who: '宁姚', style: 'say', text: '……', next: 'c' },
        c: { who: '宁姚', style: 'ask', choices: [
          { text: '（行一礼，不打扰）', effects: [{ aff: ['宁姚', 6] }, { respect: ['宁姚', 4] }], goto: 'd' },
          { text: '（请她指点一剑）', req: { gengu: 8 }, effects: [{ respect: ['宁姚', 8] }, { knowledge: '剑意·清' }], goto: 'e' },
          { text: '（若平了狼患，报上名号）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['宁姚', 6] }, { fame: 2 }], goto: 'f' }
        ] },
        d: { who: '宁姚', style: 'say', text: '……嗯。', next: 'end' },
        e: { who: '宁姚', style: 'say', text: '你的剑，还没歪。', next: 'end' },
        f: { who: '宁姚', style: 'say', text: '江湖险恶，但你走得不差。', next: 'end' }
      }
    },
    'd_peiqian_1': {
      cast: ['裴钱'], entry: 'a', nodes: {
        a: { who: '裴钱', style: 'say', text: '见人要先见礼。你是好人还是坏人？', next: 'b' },
        b: { who: '裴钱', style: 'ask', choices: [
          { text: '（认真抱拳行礼）', effects: [{ aff: ['裴钱', 6] }, { respect: ['裴钱', 6] }], goto: 'c' },
          { text: '（与她比试一拳）', req: { gengu: 7 }, effects: [{ respect: ['裴钱', 8] }], goto: 'd' },
          { text: '（若平了狼患，说是你做的）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['裴钱', 8] }, { respect: ['裴钱', 6] }], goto: 'e' }
        ] },
        c: { who: '裴钱', style: 'say', text: '还行，像个好人。', next: 'end' },
        d: { who: '裴钱', style: 'say', text: '有点力气！再来！', next: 'end' },
        e: { who: '裴钱', style: 'say', text: '你不是软柿子。我认了。', next: 'end' }
      }
    },
    'd_chen_1': {
      cast: ['陈平安'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '落魄山主蹲在檐下，正劈一截青竹。', next: 'b' },
        b: { who: '陈平安', style: 'say', text: '落魄山主，陈平安。', next: 'c' },
        c: { who: '陈平安', style: 'ask', choices: [
          { text: '（行礼，请教剑道）', effects: [{ respect: ['陈平安', 6] }, { knowledge: '落魄剑法' }], goto: 'd' },
          { text: '（递上剑胚矿石）', effects: [{ gift: ['陈平安', '剑胚矿石'] }, { aff: ['陈平安', 6] }], goto: 'e' },
          { text: '（若走过狼患，问他那条路）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['陈平安', 6] }, { respect: ['陈平安', 5] }], goto: 'f' }
        ] },
        d: { who: '陈平安', style: 'say', text: '山不在高，有剑则名。先扎稳马步。', next: 'end' },
        e: { who: '陈平安', style: 'say', text: '这料子，配得上一把好剑。', next: 'end' },
        f: { who: '陈平安', style: 'say', text: '路是一剑一剑劈出来的。你走得不差。', next: 'end' }
      }
    },
    'd_song_1': {
      cast: ['宋集薪'], entry: 'a', nodes: {
        a: { who: '宋集薪', style: 'say', text: '你是新来的？你知道陈平安吗？', next: 'b' },
        b: { who: '宋集薪', style: 'ask', choices: [
          { text: '听过。他如今是大剑仙。', effects: [{ aff: ['宋集薪', 6] }, { flag: 'song_chen' }], goto: 'c' },
          { text: '（替他保密那半张药方）', req: { meili: 6 }, effects: [{ aff: ['宋集薪', 8] }, { debt: ['宋集薪', -1] }], goto: 'd' },
          { text: '（若走人情线，认他做朋友）', cond: { flag: 'ch1_bond' }, effects: [{ aff: ['宋集薪', 10] }], goto: 'e' }
        ] },
        c: { who: '宋集薪', style: 'say', text: '那会儿他可穷了。谁能想到。', next: 'end' },
        d: { who: '宋集薪', style: 'say', text: '（他眼睛一亮）你懂我。', next: 'end' },
        e: { who: '宋集薪', style: 'say', text: '（他拍了拍你肩）自己人。', next: 'end' }
      }
    },
    'd_cui_1': {
      cast: ['崔瀺'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '渡口风大，谋士抬眼，眸中似有星河流转。', next: 'b' },
        b: { who: '崔瀺', style: 'say', text: '天下大势，如棋局。', next: 'c' },
        c: { who: '崔瀺', style: 'ask', choices: [
          { text: '（请他点评你的路）', effects: [{ respect: ['崔瀺', 4] }, { flag: 'cui_read' }], goto: 'd' },
          { text: '（以棋局反问）', req: { gengu: 8 }, effects: [{ respect: ['崔瀺', 8] }, { knowledge: '纵横术' }], goto: 'e' },
          { text: '（若走秩序线，报上名号）', cond: { flag: 'ch1_order' }, effects: [{ aff: ['崔瀺', 6] }, { respect: ['崔瀺', 6] }], goto: 'f' }
        ] },
        d: { who: '崔瀺', style: 'say', text: '你这一步，落得还算稳。', next: 'end' },
        e: { who: '崔瀺', style: 'say', text: '有意思。算得再准，也算不过人心。', next: 'end' },
        f: { who: '崔瀺', style: 'say', text: '秩序线。好棋。', next: 'end' }
      }
    },
    'd_yaowang_1': {
      cast: ['药王'], entry: 'a', nodes: {
        a: { who: '药王', style: 'say', text: '药王谷，专治疑难杂症。', next: 'b' },
        b: { who: '药王', style: 'ask', choices: [
          { text: '（递上草药）', effects: [{ gift: ['药王', '草药'] }, { aff: ['药王', 6] }], goto: 'c' },
          { text: '（请他炼丹）', req: { gengu: 6 }, effects: [{ knowledge: '丹方残页' }, { respect: ['药王', 4] }], goto: 'd' },
          { text: '（若采药有功，提起）', cond: { flag: 'jl2_m1_02_done' }, effects: [{ aff: ['药王', 8] }], goto: 'e' }
        ] },
        c: { who: '药王', style: 'say', text: '好草，好草。', next: 'end' },
        d: { who: '药王', style: 'say', text: '化凡草为灵药，老夫拿手。', next: 'end' },
        e: { who: '药王', style: 'say', text: '你采的药，救了人。', next: 'end' }
      }
    },
    'd_jianling_1': {
      cast: ['剑灵老妪'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '藕花福地深处，一柄上古残剑剑意不散。', next: 'b' },
        b: { who: '剑灵老妪', style: 'say', text: '你……是来寻那截古剑残意的吗？', next: 'c' },
        c: { who: '剑灵老妪', style: 'ask', choices: [
          { text: '愿替老身参悟壁上剑诀。', effects: [{ respect: ['剑灵老妪', 6] }, { flag: 'jianling_sword' }], goto: 'd' },
          { text: '（需先退镇墓妖兽）', req: { gengu: 8 }, effects: [{ kill: '镇墓妖兽' }, { respect: ['剑灵老妪', 8] }], goto: 'e' },
          { text: '（若已平狼患，正好显显胆色）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['剑灵老妪', 6] }], goto: 'f' }
        ] },
        d: { who: '剑灵老妪', style: 'say', text: '剑意不散，你有缘。', next: 'end' },
        e: { who: '剑灵老妪', style: 'say', text: '镇墓兽退了，看剑吧。', next: 'end' },
        f: { who: '剑灵老妪', style: 'say', text: '能平狼患，也算有胆。', next: 'end' }
      }
    },
    'd_sheyue_1': {
      cast: ['赊月'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '荷塘畔，白衣女子立于月下，水中月影随她一齐颤了颤。', next: 'b' },
        b: { who: '赊月', style: 'say', text: '……是你。别紧张，我不会跑。', next: 'c' },
        c: { who: '赊月', style: 'ask', choices: [
          { text: '（不提刘羡阳，陪她看月）', effects: [{ aff: ['赊月', 8] }, { flag: 'sheyue_trust' }], goto: 'd' },
          { text: '（赠一颗夜明珠）', effects: [{ gift: ['赊月', '夜明珠'] }, { aff: ['赊月', 8] }], goto: 'e' },
          { text: '（若已平狼患，提起外界）', cond: { flag: 'ch1_done' }, effects: [{ aff: ['赊月', 4] }, { respect: ['赊月', 3] }], goto: 'f' }
        ] },
        d: { who: '赊月', style: 'say', text: '……谢谢你。', next: 'end' },
        e: { who: '赊月', style: 'say', text: '月光……落在珠上了。', next: 'end' },
        f: { who: '赊月', style: 'say', text: '外面的事，我听说了几分。', next: 'end' }
      }
    },
    'd_baoping_1': {
      cast: ['李宝瓶'], entry: 'a', nodes: {
        a: { who: '李宝瓶', style: 'say', text: '你是新来的？讲段见闻给我听嘛！', next: 'b' },
        b: { who: '李宝瓶', style: 'ask', choices: [
          { text: '（讲狼患的故事）', effects: [{ aff: ['李宝瓶', 6] }, { flag: 'baoping_story' }], goto: 'c' },
          { text: '（考她一句书）', req: { gengu: 6 }, effects: [{ respect: ['李宝瓶', 6] }, { knowledge: '书气' }], goto: 'd' },
          { text: '（若把功劳让过她，提起）', cond: { flag: 'jl2_m1_02_humble' }, effects: [{ aff: ['李宝瓶', 8] }], goto: 'e' }
        ] },
        c: { who: '李宝瓶', style: 'say', text: '哇！再讲一个！', next: 'end' },
        d: { who: '李宝瓶', style: 'say', text: '这都对？你好厉害！', next: 'end' },
        e: { who: '李宝瓶', style: 'say', text: '你就是那个让功的人！', next: 'end' }
      }
    },
    'd_liuxiangyang_1': {
      cast: ['刘羡阳'], entry: 'a', nodes: {
        a: { who: '刘羡阳', style: 'say', text: '兄弟，喝一杯？', next: 'b' },
        b: { who: '刘羡阳', style: 'ask', choices: [
          { text: '（陪他喝）', effects: [{ aff: ['刘羡阳', 8] }], goto: 'c' },
          { text: '（比剑经）', req: { gengu: 7 }, effects: [{ respect: ['刘羡阳', 8] }], goto: 'd' },
          { text: '（若走人情线，说是一路人）', cond: { flag: 'ch1_bond' }, effects: [{ aff: ['刘羡阳', 10] }], goto: 'e' }
        ] },
        c: { who: '刘羡阳', style: 'say', text: '痛快！', next: 'end' },
        d: { who: '刘羡阳', style: 'say', text: '祖传剑经，果然没看错人。', next: 'end' },
        e: { who: '刘羡阳', style: 'say', text: '够朋友！走江湖去！', next: 'end' }
      }
    },
    'd_mao_1': {
      cast: ['茅小冬'], entry: 'a', nodes: {
        a: { who: '茅小冬', style: 'say', text: '这位同窗，可读过《问剑》？', next: 'b' },
        b: { who: '茅小冬', style: 'ask', choices: [
          { text: '（请教剑理）', effects: [{ respect: ['茅小冬', 6] }, { knowledge: '剑心通明' }], goto: 'c' },
          { text: '（论浩然正气）', req: { gengu: 7 }, effects: [{ respect: ['茅小冬', 8] }], goto: 'd' },
          { text: '（若让功给药童，提起）', cond: { flag: 'jl2_m1_02_humble' }, effects: [{ aff: ['茅小冬', 8] }, { respect: ['茅小冬', 6] }], goto: 'e' }
        ] },
        c: { who: '茅小冬', style: 'say', text: '学问之道，先立其大。', next: 'end' },
        d: { who: '茅小冬', style: 'say', text: '正大光明，方是剑道。', next: 'end' },
        e: { who: '茅小冬', style: 'say', text: '你肯让人，难得。', next: 'end' }
      }
    },
    'd_zhigui_1': {
      cast: ['稚圭'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '婢女模样的少女垂着眼帘，声音又轻又冷。', next: 'b' },
        b: { who: '稚圭', style: 'say', text: '公子不在。', next: 'c' },
        c: { who: '稚圭', style: 'ask', choices: [
          { text: '（不追问，转身要走）', effects: [{ aff: ['稚圭', 6] }], goto: 'd' },
          { text: '（赠一颗夜明珠）', effects: [{ gift: ['稚圭', '夜明珠'] }, { aff: ['稚圭', 8] }], goto: 'e' },
          { text: '（若放了恶徒，问她缘由）', cond: { flag: 'jl2_ch1_spare' }, effects: [{ aff: ['稚圭', 8] }, { flag: 'zhigui_spare' }], goto: 'f' }
        ] },
        d: { who: '稚圭', style: 'say', text: '……嗯。', next: 'end' },
        e: { who: '稚圭', style: 'say', text: '……这颗，给我？', next: 'end' },
        f: { who: '稚圭', style: 'say', text: '你放了人，为何？', next: 'end' }
      }
    },
    'd_ruanqiong_1': {
      cast: ['阮邛'], entry: 'a', nodes: {
        a: { who: '旁白', style: 'narr', text: '赤膊老人盯着炉火，头也不抬。', next: 'b' },
        b: { who: '阮邛', style: 'say', text: '要铸剑？三十年只铸一把。', next: 'c' },
        c: { who: '阮邛', style: 'ask', choices: [
          { text: '（递上玄铁）', effects: [{ gift: ['阮邛', '玄铁'] }, { aff: ['阮邛', 8] }], goto: 'd' },
          { text: '（论铸剑之道）', req: { gengu: 8 }, effects: [{ respect: ['阮邛', 8] }, { knowledge: '铸剑术' }], goto: 'e' },
          { text: '（若把矿石分他一半）', cond: { flag: 'jl2_m1_03_ruan' }, effects: [{ aff: ['阮邛', 10] }], goto: 'f' }
        ] },
        d: { who: '阮邛', style: 'say', text: '这铁，配得上炉子。', next: 'end' },
        e: { who: '阮邛', style: 'say', text: '剑这东西，等得起。', next: 'end' },
        f: { who: '阮邛', style: 'say', text: '你厚道。剑，给你留着。', next: 'end' }
      }
    },
    'd_gucan_1': {
      cast: ['顾璨'], entry: 'a', nodes: {
        a: { who: '顾璨', style: 'say', text: '兄弟，手头宽裕不？', next: 'b' },
        b: { who: '顾璨', style: 'ask', choices: [
          { text: '（借他几两）', effects: [{ gold: -20 }, { aff: ['顾璨', 8] }, { debt: ['顾璨', 1] }], goto: 'c' },
          { text: '（要他罩着你）', req: { meili: 6 }, effects: [{ aff: ['顾璨', 6] }, { flag: 'gucan_protect' }], goto: 'd' },
          { text: '（若走人情线，认他做兄弟）', cond: { flag: 'ch1_bond' }, effects: [{ aff: ['顾璨', 10] }], goto: 'e' }
        ] },
        c: { who: '顾璨', style: 'say', text: '够意思！', next: 'end' },
        d: { who: '顾璨', style: 'say', text: '行，这条巷子我罩你。', next: 'end' },
        e: { who: '顾璨', style: 'say', text: '自己人，没说的。', next: 'end' }
      }
    },
    'd_tiesjiang_1': {
      cast: ['铁匠'], entry: 'a', nodes: {
        a: { who: '铁匠', style: 'say', text: '要打铁吗？', next: 'b' },
        b: { who: '铁匠', style: 'ask', choices: [
          { text: '（请他锻一件兵刃）', effects: [{ shop: '铁匠铺' }, { aff: ['铁匠', 4] }], goto: 'c' },
          { text: '（论手艺）', req: { gengu: 6 }, effects: [{ respect: ['铁匠', 6] }, { knowledge: '锻造术' }], goto: 'd' },
          { text: '（若欠他人情，提起）', cond: { debt: { '铁匠': 1 } }, effects: [{ debt: ['铁匠', -1] }, { aff: ['铁匠', 6] }], goto: 'e' }
        ] },
        c: { who: '铁匠', style: 'say', text: '手艺不掺假。', next: 'end' },
        d: { who: '铁匠', style: 'say', text: '（他难得一笑）懂行。', next: 'end' },
        e: { who: '铁匠', style: 'say', text: '你还记得。好。', next: 'end' }
      }
    }
  };

  // ============================================================
  // 四、jobs —— 5 行当 × 20 环（模板 + 变式规则，不手写 100 条）
  //     每 5 环插一次变式；下一环消耗上一环产出；20 环大赏。
  // ============================================================
  var JL2_JOB_TEMPLATE = {
    rings: 20,
    variationEvery: 5,
    // 第 n 环奖励系数：20 环 ≈ 前 19 环之和（指数收尾）
    rewardCurve: function (n) {
      if (n >= 20) return 12;
      return 1 + (n - 1) * 0.35;
    },
    // 断环不清零，但 streak 断，次日从第 1 环重来
    chainRule: 'eachRingConsumesPreviousOutput',
    streakRule: 'breakResetsToRing1'
  };
  JL2_CONTENT.jobs = {
    '镖师': {
      id: 'job_biaoshi', name: '镖师', giver: '任枕月镖师', home: '大骊京城·京华镖局',
      template: JL2_JOB_TEMPLATE,
      ringTypes: ['escort', 'kill', 'reach', 'choice', 'deliver'],
      outputs: { normal: '镖银', special: '路线情报' },
      variantRules: [
        { at: 5, type: 'choice', desc: '绕过关卡还是硬闯？', alt: '买通 / 绕路 / 伪装' },
        { at: 10, type: 'escort', desc: '护送一位 NPC 平安抵达', alt: '雇帮手 / 走小道' },
        { at: 15, type: 'choice', desc: '镖银被劫，追不追？', alt: '谈判 / 设伏' }
      ],
      ring20: { name: '稀有马具', item: '江湖快靴', desc: '京华镖局压箱底的快靴' }
    },
    '采药': {
      id: 'job_caiyao', name: '采药', giver: '药王', home: '药王谷',
      template: JL2_JOB_TEMPLATE,
      ringTypes: ['collect', 'reach', 'craft', 'choice', 'deliver'],
      outputs: { normal: '草药', special: '丹方残页' },
      variantRules: [
        { at: 5, type: 'choice', desc: '辨药：三株里有一株是假', alt: '问药童 / 查典籍' },
        { at: 10, type: 'reach', desc: '采崖上灵药', alt: '攀索 / 请人攀' },
        { at: 15, type: 'choice', desc: '药圃被糟蹋，报不报？', alt: '私了 / 报官' }
      ],
      ring20: { name: '稀有丹方', item: '大还丹', desc: '药王亲传的丹方与成品' }
    },
    '捕快': {
      id: 'job_bukuai', name: '捕快', giver: '衙门捕头', home: '大骊衙门',
      template: JL2_JOB_TEMPLATE,
      ringTypes: ['talk', 'kill', 'collect', 'choice', 'deliver'],
      outputs: { normal: '赏金', special: '声望' },
      variantRules: [
        { at: 5, type: 'choice', desc: '查案：证词有疑，信谁？', alt: '暗访 / 验尸' },
        { at: 10, type: 'kill', desc: '缉拿要犯', alt: '设伏 / 买通线人' },
        { at: 15, type: 'choice', desc: '上司施压，如何自处？', alt: '抗命 / 从命' }
      ],
      ring20: { name: '官身', item: '镇妖令', unlock: 'official_rank', desc: '得一官半职，对话解锁官面选项' }
    },
    '说书': {
      id: 'job_shuoshu', name: '说书', giver: '酒肆河婆', home: '河畔酒肆',
      template: JL2_JOB_TEMPLATE,
      ringTypes: ['talk', 'collect', 'choice', 'reach', 'deliver'],
      outputs: { normal: '情报', special: '人脉' },
      variantRules: [
        { at: 5, type: 'choice', desc: '听客追问，哪段真哪段假？', alt: '含糊 / 实话' },
        { at: 10, type: 'talk', desc: '赴宴打探消息', alt: '敬酒 / 攀交' },
        { at: 15, type: 'choice', desc: '说书得罪人，收不收？', alt: '赔罪 / 硬扛' }
      ],
      ring20: { name: '奇遇线索', item: '洞天玉简', unlock: 'encounter_hint', desc: '一条指向奇遇的秘闻' }
    },
    '厨子': {
      id: 'job_chuzi', name: '厨子', giver: '店小二', home: '云来客栈',
      template: JL2_JOB_TEMPLATE,
      ringTypes: ['collect', 'craft', 'choice', 'deliver', 'talk'],
      outputs: { normal: '食物 buff', special: '好感' },
      variantRules: [
        { at: 5, type: 'choice', desc: '食材不够，以何代？', alt: '换料 / 赊账' },
        { at: 10, type: 'craft', desc: '掌勺宴席', alt: '帮厨 / 掌勺' },
        { at: 15, type: 'choice', desc: '客人挑刺，如何应对？', alt: '赔礼 / 硬碰' }
      ],
      ring20: { name: '宴席', item: '灵泉仙酿', unlock: 'group_aff_feast', desc: '一桌宴席，群体好感' }
    }
  };

  // ============================================================
  // 五、encounters —— 10 条奇遇条件表（条件可主动凑；once + chance）
  //     字段 cond 支持 weather / room / item / aff / flag / skill / hour
  // ============================================================
  JL2_CONTENT.encounters = [
    { id: 'e_rain_temple', cond: { weather: '雨', room: '荒郊野岭', hour: '18-24' },
      once: true, chance: 0.4, quest: 'e01', desc: '雨夜荒郊，破庙里亮着一盏孤灯。' },
    { id: 'e_beggar_gift', cond: { item: '干粮', aff: { '顾璨': 20 } },
      once: true, chance: 0.2, quest: 'e02', desc: '巷里的泼皮讨一口干粮，你给了。' },
    { id: 'e_sword_grave', cond: { skill: ['山崖剑法'], room: '剑气长城城头', flag: 'ch1_done' },
      once: true, chance: 0.15, quest: 'e03', desc: '城头剑痕里，一缕残剑意认出了你。' },
    { id: 'e_lotus_pond', cond: { room: '青莲洞天', aff: { '阮秀': 30 }, weather: '晴' },
      once: true, chance: 0.3, quest: 'e04', desc: '晴日荷开，阮秀邀你赏莲。' },
    { id: 'e_yang_rain', cond: { weather: '雨', room: '泥瓶巷', item: '陈年女儿红' },
      once: true, chance: 0.25, quest: 'e05', desc: '雨夜药铺，杨老头要与你喝一杯。' },
    { id: 'e_wolf_cave', cond: { room: '荒郊野岭', flag: 'jl2_ch1_order', item: '狼牙' },
      once: true, chance: 0.2, quest: 'e06', desc: '狼患平息之后，你寻到了狼穴。' },
    { id: 'e_snow_lotus', cond: { room: '藕花福地', item: '仙家雪莲', skill: ['浩然剑气'] },
      once: true, chance: 0.18, quest: 'e07', desc: '雪莲映剑，剑灵老妪似有所悟。' },
    { id: 'e_night_moon', cond: { hour: '20-24', room: '藕花福地', aff: { '赊月': 25 } },
      once: true, chance: 0.3, quest: 'e08', desc: '月下荷塘，赊月的影子与你并肩。' },
    { id: 'e_office_visit', cond: { room: '大骊衙门', flag: 'ch1_order', rep: 10 },
      once: true, chance: 0.35, quest: 'e09', desc: '官面线后，捕头请你进内堂说话。' },
    { id: 'e_bond_reunion', cond: { room: '云来客栈', flag: 'ch1_bond', aff: { '刘羡阳': 20 } },
      once: true, chance: 0.3, quest: 'e10', desc: '人情线后，刘羡阳在客栈摆酒等你。' }
  ];

  // ============================================================
  // 六、导出（挂到 window，若在非 window 环境则退化为局部）
  // ============================================================
  var JL2_ROOT = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  JL2_ROOT.JL2_CONTENT = JL2_CONTENT;

  // ============================================================
  // 七、jl2_contentInstall() —— 安装进现有表，不覆盖已有键，幂等
  // ============================================================
  function jl2_contentInstall() {
    try {
      if (JL2_ROOT[JL2_INSTALLED_KEY] === true) {
        return true;
      }
      // 自愈兜底：新 game 字段（集成方应在 PRISTINE 前写入，这里再保底）
      try {
        if (typeof game !== 'undefined' && game) {
          if (!game.flags) game.flags = {};
          if (!game.world) game.world = {};
          if (!game.world.flags) game.world.flags = {};
          if (!game.world.npc) game.world.npc = {};
          if (!game.world.rooms) game.world.rooms = {};
          if (!game.world.rumors) game.world.rumors = [];
          if (!game.rel) game.rel = {};
          if (!game.qlog) game.qlog = { active: {}, done: {}, failed: {}, daily: {}, track: [] };
        }
      } catch (e) { jl2_bootErr('game 自愈: ' + (e && e.message)); }

      // 1) 任务装进 QUESTS：绝不覆盖已有键
      if (typeof QUESTS !== 'undefined' && QUESTS) {
        Object.keys(JL2_CONTENT.quests).forEach(function (id) {
          try { if (!Object.prototype.hasOwnProperty.call(QUESTS, id)) QUESTS[id] = JL2_CONTENT.quests[id]; }
          catch (e) { jl2_bootErr('quest ' + id + ': ' + (e && e.message)); }
        });
      } else {
        jl2_bootErr('QUESTS 未定义，任务未安装');
      }

      // 2) NPC 人设/记忆/解锁：注入 NPCS 现有条目，不覆盖已有字段
      if (typeof NPCS !== 'undefined' && NPCS) {
        Object.keys(JL2_CONTENT.relations).forEach(function (name) {
          try {
            var npc = NPCS[name];
            if (!npc) return; // 名字必须真实存在
            if (!npc.persona) npc.persona = JL2_CONTENT.relations[name].persona;
            if (!npc.memory) npc.memory = JL2_CONTENT.relations[name].memory;
            if (!npc.rel) npc.rel = JL2_CONTENT.relations[name].rel;
            if (!npc.unlock) npc.unlock = JL2_CONTENT.relations[name].unlock;
          } catch (e) { jl2_bootErr('npc ' + name + ': ' + (e && e.message)); }
        });
      } else {
        jl2_bootErr('NPCS 未定义，关系未注入');
      }

      // 3) 对话/行当/奇遇：数据留在 JL2_CONTENT，由 dialogue2/quest2 读取
      //    若集成方预留了全局表，则填充且不覆盖；否则跳过（不新建抢名全局）。
      try {
        if (typeof DIALOGUES !== 'undefined' && DIALOGUES) {
          Object.keys(JL2_CONTENT.dialogues).forEach(function (id) {
            if (!Object.prototype.hasOwnProperty.call(DIALOGUES, id)) DIALOGUES[id] = JL2_CONTENT.dialogues[id];
          });
        }
      } catch (e) { jl2_bootErr('dialogues: ' + (e && e.message)); }
      try {
        if (typeof ENCOUNTERS !== 'undefined' && ENCOUNTERS && ENCOUNTERS.push) {
          var eIds = {};
          ENCOUNTERS.forEach(function (e) { if (e && e.id) eIds[e.id] = true; });
          JL2_CONTENT.encounters.forEach(function (e) { if (!eIds[e.id]) ENCOUNTERS.push(e); });
        }
      } catch (e) { jl2_bootErr('encounters: ' + (e && e.message)); }

      JL2_ROOT[JL2_INSTALLED_KEY] = true;
      return true;
    } catch (e) {
      jl2_bootErr('install: ' + (e && e.message));
      return false;
    }
  }

  JL2_ROOT.jl2_contentInstall = jl2_contentInstall;
  JL2_ROOT.JL2_CONTENT = JL2_CONTENT;
})();
