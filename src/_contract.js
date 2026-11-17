/*
 * JL2 模块共享契约（只读，勿修改）
 *
 * 项目：单文件 HTML 文字 MUD
 * 入口：E:/workbuddy/2026-11-17-15-14-35/jianlaimud/index.html
 * 设计文档：同目录 重做方案-系统设计与实施.md
 * 行对齐 JS 抽取：E:/workbuddy/2026-11-17-15-14-35/.jl-tools/extracted.js
 *
 * ── 铁律 ──────────────────────────────────────────────────
 * 1. 每个代理只写自己被分配的那一个文件，绝不碰 index.html 或别人的文件。
 * 2. 所有新全局函数一律 jl2_ 前缀；禁止重定义现有全局：
 *    QUESTS NPCS ITEMS SKILLS ROOMS SECTS game player
 *    emit gift gainAff playScene addItem removeItem log openModal 等。
 *    （注意：现有代码里没有 emit，新总线叫 jl2_emit，不要抢名字。）
 * 3. 不要 import / export / require，不要引入任何依赖。产物是普通脚本，
 *    必须能被 node -e "new (require('vm').Script)(fs.readFileSync(path,'utf8'))" 解析。
 * 4. 代码里的字符串用 ASCII 直引号 ' 或 "；中文正文叙述用中文引号“”。
 * 5. 新 game 字段由集成方写进初始字面量（PRISTINE 快照之前）。
 *    模块内必须自愈兜底：if(!game.qlog) game.qlog={...} 等。
 * 6. UI 只能使用现有 DOM id：#log #modal #overlay #s-quest #map-svg #app 等；
 *    写新面板用现有 openModal(title, builderFn) 约定（builderFn 返回 DOM 节点）。
 * 7. 所有可能出错的地方 try/catch，错误写入 window.__bootErrs，不要静默吞错。
 *
 * ── 全局数据（读取即可，不要改结构）────────────────────────
 * game : { chapter, turn, flags, quests:[], questOpen:{}, questDone:{},
 *          qlog:{active:{},done:{},failed:{},daily:{},track:[]},
 *          rel:{npc:{aff,respect,debt,tier,events:{}}},
 *          world:{day,hour,weather,flags:{},rooms:{},npc:{},faction:{},rumors:[]},
 *          giftTick, evDone, evCd, escort, ... }
 * player: { aff:{npc:num}, inventory:[], skills:[], equipment:{weapon,armor,head,hands,waist,feet},
 *           level, exp, gold, potential, fame, bgName, perks, traits, ... }
 * 数据表: QUESTS NPCS ITEMS SKILLS ROOMS ENEMIES SECTS BACKGROUNDS CHENG_CFG
 *
 * ── 模块 API 契约 ─────────────────────────────────────────
 *
 * [quest2.js]
 *   jl2_on(type, fn)                  注册事件订阅（type='*' 表示全部）
 *   jl2_emit(type, payload)           广播；自动补 payload.turn
 *   jl2_questInit()                   初始化：注册订阅、适配旧任务
 *   jl2_questAccept(id)               接任务，返回 bool
 *   jl2_questTurnIn(id)               交付，返回 bool
 *   jl2_adaptLegacy(q)                旧 target -> stages 的适配
 *   jl2_questTrackerText(q)           追踪条文案
 *   jl2_questOnEvent(type,p)          订阅回调（内部自行注册）
 *   事件类型：kill item talk enter craft gift equip skill aff choice rest battle_end
 *
 * [progression2.js]
 *   jl2_reward(rewardObj, ctx)        统一奖励分发，返回中文摘要字符串
 *     rewardObj: {exp,gold,potential,fame,items:[{name,n}],aff:{npc:v},skill,title,unlock:[]}
 *   jl2_progressionInit()
 *   jl2_itemData(name)                带词条/品质的物品数据
 *   jl2_forge(kind, materialList)     加工：forge/alchemy/cook/talisman/weave
 *
 * [dialogue2.js]
 *   jl2_dialogueInit()
 *   jl2_playDialogue(sceneId, opts)   按 id 从 JL2_CONTENT.dialogues 取节点图并演出
 *   jl2_renderDialogue(graph, opts)   直接演出节点图
 *   jl2_dialogueEffects(effects)      effects -> 状态变更
 *   节点图格式见方案 §4.6；样式 narr/say/act/inner/sys
 *
 * [social2.js]
 *   jl2_socialInit()
 *   jl2_relGet(name)                  -> {aff,respect,debt,tier,events}
 *   jl2_relAdd(name, axis, delta)     axis: aff|respect|debt
 *   jl2_relTier(name)                 -> 0..4
 *   jl2_gift(npc, item, ctx)          完整送礼结算（与旧 giveGift 并存，不覆盖）
 *   jl2_socialPanel()                 关系面板
 *
 * [guides2.js]
 *   jl2_guideInit()
 *   JL2_GUIDES = { originId: {spot, name, steps:[...]} }   8 地 17 出身
 *   jl2_guideStart(originId)
 *   jl2_guideOnEvent(type,p)
 *   jl2_guideBar()                    更新顶部目标条（若无 #s-quest 则写 #log）
 *   step 格式见方案 §4.10，stage 复用 §4.3 的 14 种类型
 *
 * [content2.js]
 *   JL2_CONTENT = { quests:{}, dialogues:{}, relations:{}, jobs:{}, encounters:{} }
 *   jl2_contentInstall()              把数据装进 QUESTS 等现有表（不覆盖已有键）
 *
 * [combat2.js]
 *   jl2_combatInit()
 *   jl2_combatPrepare(ctx)            战斗开始时的战术选择（架势/招式/破绽），返回上下文
 *   jl2_combatDamageMod(ctx)          伤害系数，由集成方在伤害计算处调用
 *   jl2_combatAfter(enemy, win)       战斗结束反馈与状态写回
 *
 * [materials2.js]
 *   jl2_materialsInit()
 *   jl2_materialInfo(name)            产地/再生/品质/价格
 *   jl2_gatherRules(roomName)         采集点规则（上限/冷却/品质）
 *   jl2_consumeRules(kind)            材料消耗与产出规则
 *   注意：加工链 jl2_forge 由 progression2.js 提供，本模块不要重复实现
 *
 * [text2.js]
 *   jl2_textInit()
 *   jl2_textInstall()                 启动期文本补丁：重复模板台词、物品描述、日志文案
 *   注意：不要覆盖 content2.js 的手写内容；只清理模板化/空白文案
 *
 * [_boot.js —— 集成方编写，代理不用写]
 *   jl2_boot() 依次调用：contentInstall -> questInit -> progressionInit ->
 *              dialogueInit -> socialInit -> guideInit -> emit('boot')
 *
 * ── 自检命令 ──────────────────────────────────────────────
 * node -e "new (require('vm').Script)(require('fs').readFileSync('你的文件','utf8'));console.log('ok')"
 */
