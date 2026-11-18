# 参考 MUD 对照清单：我们的问题、能学什么、怎么改

> 2026-11-18 · 参考 `D:/1/2/sgz-main` 与 `D:/1/2/xkx100-main`
> 原则：抽机制，不抄内容；先修断链，再谈深度。

## 1. 我们游戏当前的问题

### P0：直接卡死主线 / 让机制失效

| # | 问题 | 证据 | 后果 |
|---|---|---|---|
| 1 | 源码与运行版脱节 | `src/quest2.js` 已有 `g.flags[id]=true`，但 `index.html` 注入版没有 | 完成 m1_01 后 `game.flags['jl2_m1_01']` 仍为空，m1_02~06 全不可接 |
| 2 | talk 阶段要求不存在的 topic | `src/content2.js` 的 `topic:'认刀'`；唯一 talk 事件只带 npc | m1_01 卡在 s2 |
| 3 | choice 阶段无 UI | `jl2_questChoose` 全项目零调用；17 个 choice 阶段无法选择 | 分支、章末抉择全部不可达 |
| 4 | 交付无 UI | `questReady` 对 JL2 空 target 返回 false；NPC「交付任务」按钮不出现 | 玩家只能靠控制台调 `jl2_questTurnIn` |
| 5 | 世界后果只写不读 | `worldFlag/roomFlag/shopStock/respect/debt` 无 effect 处理器 | 「选择改变世界」是空话 |
| 6 | 战斗架势/寻隙是假决策 | `_cm.effects` 无消费点；`battle.jl2Seek` 一点永久 true | 守/游是陷阱；破绽三回合节奏失效 |
| 7 | 引导条被任务条覆盖 / 二次开局丢失 | `updateQuestTracker` 重写 `#s-quest`；release 永久断开观察器 | 新手看不到分出身目标 |

### P1：有系统名，没有玩法闭环

| # | 问题 | 证据 | 后果 |
|---|---|---|---|
| 8 | 深度函数零调用 | `jl2_gift / jl2_forge / jl2_itemData / jl2_strengthen / jl2_repair / jl2_masteryGain / jl2_enlighten` 均无调用点 | 装备词条、功法熟练度、加工链、送礼回礼玩家碰不到 |
| 9 | 行当/奇遇只有数据 | `JL2_CONTENT.jobs/encounters` 无引擎、无 UI、无触发检查 | 没有每日中循环，重复可玩性为零 |
| 10 | 旧 446 条任务仍是计数器 | `adaptLegacy` 只降级为单 stage | 杀采到谈，无分支、无失败、无非战斗解 |
| 11 | 追踪条只显示一条 | `updateQuestTracker` 只取 `act[0]` | 不知道下一步做什么 |

### P2：反馈与长期驱动

- 奖励没有统一出口，防刷规则分散。
- 没有倒计时、方位罗盘、里程碑礼包。
- NPC 的「问」不能当任务接口。
- 世界事件没有预告、没有持续影响。

## 2. 从 sgz-main 学到什么

路径前缀：`D:/1/2/sgz-main/sgz-main/`

1. **日常行当引擎**：`sgdomain/event/ev_job.c:29-51,165-258`。按发任务者身份分级派发，冷却 `MINRESIGNTIME=7200`，每日次数上限。有效点：一套引擎承载 31 种差事，内容可复用、防刷、有节奏。
2. **ask 关键词回调**：`sgdomain/job/askobj/askobj.c:33-35,51-68`。`set_asklist(kw,file,fun)` 把 NPC 变成可探索接口。
3. **奖励统一出口**：`include/event.h:29` + `sgdomain/job/buildbase/buildbase.c:3`。`AWARD()` 单点控制数值与播报。
4. **技能学习门槛链**：`daemons/sg_skilllearn_d.c:75-115`。文化、师承、天赋、经验、同类技能数共同决定能否学，返回具体失败原因。
5. **战斗公式外置**：`daemons/fight_d/formula.c:64-84,174-195`。装备与骑术真实计入伤害，公式纯函数便于平衡。
6. **NPC 多档交付结果**：`sgdomain/job/letter/letter.c:82-116,128`。按 loyalty 给 5 档结果，甚至移除 NPC 改变世界。
7. **世界事件有后果**：`daemons/fate_d.c:193-228`。灾异改区域数值。

## 3. 从 xkx100-main 学到什么

路径前缀：`D:/1/2/xkx100-main/xkx100-main/`

1. **任务锁链**：`quest/quest.h:12-32`。`lock_quest()` / `islocked()` 让后续任务必须完成前置任务才接，并给出明确提示；不是自动计数解锁。
2. **倒计时 + 罗盘**：`adm/daemons/questd.c:154-264`、`cmds/usr/quest.c:117-136`。目标有时限，也能找到。
3. **动态投放**：`questd.c:75-115`。约 100 个任务物随机撒进房间/NPC/容器，世界像活着。
4. **分档曲线与里程碑**：`quest/w.c:236-245,405-421,432,459+`。新手保底、老手有追求、每 N 次给稀有奖励。
5. **防刷组合**：`quest/w.c:97-115,317-330,387-399`。deadline + cooldown + busy_exp + 取消罚金 + 高经验衰减。
6. **转世/前世天赋**：`adm/daemons/logind.c:570-626`、`adm/daemons/scbornd.c:55-90`。给退坑回归一个 meta 目标。
7. **定时事件 + 谣言预告**：`adm/daemons/eventd.c:15-21,65-89`。先 rumor 再触发，给在线理由。

## 4. 可参考 / 不照搬

### 直接参考

- 行当引擎（分级派发 + 冷却 + 每日限次）
- ask 关键词回调（NPC 变成任务接口）
- 奖励统一出口（防刷、数值、播报单点控制）
- 任务锁链（重复行为变可预期解锁）
- 倒计时 / 罗盘（目标有时限且找得到）
- 动态投放（世界有活差事）
- 分档奖励 / 里程碑礼包
- 防刷组合（deadline/cooldown/取消成本/衰减）
- 成长门槛链（`canLearn` 返回具体原因）
- 战斗公式外置 + 装备真实计入
- 世界状态读回（选择必须有可见后果）
- 事件预告（rumor 先行）

### 不照搬 / 警惕

- 两者的新手引导都很弱，靠 help 文档和老玩家；这正是我们的痛点。
- GBK 编码、ANSI 排版债、高 PK 与高死亡惩罚不适合单机 HTML MUD。
- 指数级数值天花板（转世 exp 到 80M、等级 800）会让奖励失去意义。
- `call_out` 心跳与玩家状态强耦合容易造成硬卡，我们已有同类教训。
- 历史包袱里的死代码（sgz 的 `quest_d.c`、`hintmenu`；xkx 的 `w.c` 注释堆）不能继承。

## 5. 实施顺序

1. **P0-A 主线可通**：重新注入 src → 修 talk topic → choice UI → 交付 UI → flags → 引导重建。
2. **P0-B 战斗可玩**：架势防御/闪避生效，寻隙改一次性，破绽按回合节奏，词条/套装进攻防。
3. **P1-A 深度接线**：送礼、强化、修理、加工、熟练度、顿悟接进真实 UI 和数值。
4. **P1-B 重复循环**：5 行当 20 环引擎 + 奇遇触发 + 任务锁链 + 罗盘/倒计时。
5. **P2 反馈改造**：多任务追踪、里程碑、统一奖励出口、世界事件预告。

每完成一段必须：改 src → `node _tutorials/build-jl2.js` → 跑对应验收脚本 → 再改下一段。
