// 重写 TUT_STEPS：10 步系统全覆盖（赠宅/行囊/修炼+演练/任务中心/赠礼/安睡存档）
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const re = /const TUT_STEPS=\[[\s\S]*?\n\];/;
if (!re.test(src)) { console.log('anchor not found'); process.exit(1); }
const block = `const TUT_STEPS=[
  {hint:function(){ return '（'+tutMentorName()+'远远看着你：初来乍到——先点开「✦ 就地行事」，把四周打量一番。）'; }, done:function(){ return game.tutFlags.look; }, rw:function(){ return '（眼观六路，是江湖第一步。）'; }, onDone:function(){ grantStarterHouse(); }},
  {hint:function(){ return '（'+homeRoom()+'虽好，总要走出去——点舆图上的地名，或直接点相邻的格子，出去走走。）'; }, done:function(){ return player.visited.length>2; }, rw:function(){ return '（路是走出来的，不是想出来的。）'; }},
  {hint:function(){ return '（江湖是人组成的——在人物栏里点一个人，跟他攀谈几句。）'; }, done:function(){ return game.tutFlags.talk; }, rw:function(){ return '（会说话的人，比会出拳的人走得远。）'; }},
  {hint:function(){ return '（点「行囊」——认一认你的兵刃衣甲，能穿的就穿上。）'; }, done:function(){ return game.flags.packOnce===true; }, rw:function(){ return '（人靠衣甲马靠鞍——江湖行走，先把自己武装好。）'; }},
  {hint:function(){ return '（点「修炼」：先吐纳调息，再用「演练功法」把潜能磨进招式里——功夫是磨出来的。）'; }, done:function(){ return game.tutFlags.cult && game.flags.practicedOnce===true; }, rw:function(){ return '（功夫是磨出来的——潜能别攒着，化进招式里才算你的。）'; }, onDone:function(){ giftCultStarter(); }},
  {hint:function(){ return '（镇外的世界很大——试着去远一点的地方（走远路或找「行旅」），长长见闻。）'; }, done:function(){ return player.visited.length>=5; }, rw:function(){ return '（见过了，才算见过。见闻日日都在长。）'; }},
  {hint:function(){ return '（人在江湖，难免动手——遇敌时记住：回合制，出招、守御、逃走都在下方，打不过就跑。）'; }, done:function(){ return game.tutFlags.fight; }, rw:function(){ return '（打不打得过是本事，该不该打是学问。）'; }},
  {hint:function(){ return '（点「任务剧情」——任务栏里已有你能接的委托，挑一件接下，江湖就有方向了。）'; }, done:function(){ return game.quests.length>=1; }, rw:function(){ return '（有委托的人，走路都带风。）'; }},
  {hint:function(){ return '（人情是走出来的——在人物栏挑一个人，「赠礼」一份投其所好的东西。）'; }, done:function(){ return game.flags.giftOnce===true; }, rw:function(){ return '（一份薄礼，胜过千言——人情的账，从今天记起。）'; }},
  {hint:function(){ return '（'+tutMentorName()+'替你置下的祖宅就在'+homeRoom()+'——回「家园」安睡一晚，睡前记得「存档」。）'; }, done:function(){ return game.flags.sleptHome===true && game.flags.savedOnce===true; }, rw:function(){ return '（有了家，存了档——江湖才算真正开了张。）'; }}
];
// —— 引导修习礼：传一课吐纳 + 按职业赠入门功法 + 40 潜能（演练教学用） ——
function giftCultStarter(){
  try{
    const got=addPotential(40);
    logSkill('（'+tutMentorName()+'传了你一课呼吸吐纳的法门——潜能 +40。去「修炼 → 演练功法」，把潜能磨进招式里。）');
    const GIFT={
      '练气士':['青虹剑诀','（又塞给你一卷《青虹剑诀》抄本：练气士的手，也该有一柄剑。）'],
      '剑修':['流云十三剑','（又丢给你一册《流云十三剑》残页：一式是剑，两式是江湖。）'],
      '体修':['破风刀法','（又扔给你一本《破风刀法》：刀是武夫的第一件兵器。）']
    }[player.path];
    if(GIFT && SKILLS[GIFT[0]] && !hasSkill(GIFT[0])){
      player.skills.push(GIFT[0]);
      logSkill(GIFT[1]);
    }
  }catch(e){}
}`;
src = src.replace(re, block);
fs.writeFileSync('index.html', src);
console.log('TUT_STEPS rewritten (10 steps)');
