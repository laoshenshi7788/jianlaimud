// 用新的任务中心面板替换 openQuests 整个函数（正则整体替换）
const fs = require('fs');
let src = fs.readFileSync('index.html', 'utf8');
const re = /function openQuests\(\)\{[\s\S]*?\n\}/;
if (!re.test(src)) { console.log('anchor not found'); process.exit(1); }
const newFn = `function openQuests(){
  const h=document.createElement('div');
  const head=document.createElement('div'); head.className='hunt-head';
  head.innerHTML='<span>章节</span><span>状态</span>';
  h.appendChild(head);
  const CHROWS=[
    ['序章 · 初入江湖', game.chapter===0?'（进行中）':game.chapter>0?'✔ 已通过':'（未开启）'],
    ['第一章 · 初试锋芒', game.chapter===1?'（进行中）':game.chapter>1?'✔ 已通过':game.chapter===0?'（先在家乡立足）':'（未开启）'],
    ['第二章 · 名动一洲', game.chapter===2?'（进行中）':game.chapter>2?'✔ 已通过':'（未开启）'],
    ['第三章 · 妖祸横流', game.chapter===3?'（进行中）':game.chapter>3?'✔ 已通过':'（未开启）'],
    ['第四章 · 剑气长城', game.chapter===4?'（进行中）':game.chapter>4?'✔ 已通过':'（未开启）'],
    ['第五章 · 北俱霜天', game.chapter===5?'（进行中）':game.chapter>5?'✔ 已通过':'（未开启）'],
    ['终章 · 问鼎天下', game.chapter===6?'（进行中）':'（未开启）'],
    ['大结局', game.chapter>=7?'✔ 已达成':'（未开启）']
  ];
  CHROWS.forEach(function(row){
    const r=document.createElement('div'); r.className='list-row';
    r.innerHTML='<span class="lname">'+row[0]+'</span><span class="lmeta">'+row[1]+'</span>';
    h.appendChild(r);
  });
  const guide=document.createElement('div');
  guide.style.cssText='color:#ffffff;font-size:.76em;line-height:1.8;padding:6px 10px;border-left:2px solid #e8b84a;margin:6px 0 2px;background:rgba(255,255,255,.04);';
  guide.textContent=chapterGoal();
  h.appendChild(guide);
  const LZ_ALL=['lz1','lz2','lz3','lz4','lz5','lz6','lz7','lz8'];
  const lzDone=LZ_ALL.filter(function(k){ return game.questDone[k]; }).length;
  if(lzDone>0 || game.quests.some(function(x){ return /^lz\\d$/.test(x.id); })){
    const lz=document.createElement('div'); lz.style.cssText='color:#c9c9cf;font-size:.7em;letter-spacing:3px;margin:8px 0 4px;';
    lz.textContent='— 长支线 · 骊珠旧事（'+lzDone+'/8） —'; h.appendChild(lz);
    const lp=document.createElement('div'); lp.style.cssText='font-size:.74em;color:#ffffff;padding:4px 8px;';
    lp.textContent= lzDone>=8?'（旧日江湖，一剑了却——齐静春前，一段长叹。）':'（除狼安民 → 故人之伤 → 正阳山问罪 → 书院之路 → 老剑条 → 王座伏诛 → 十年之约 → 问鼎托月山。可至骊珠小镇寻齐静春接续。）';
    h.appendChild(lp);
  }
  function section(cat, label){
    const openList=[];
    if(game.questOpen) for(const id in game.questOpen){ if(game.questOpen[id] && questCatOf(id)===cat) openList.push(id); }
    const active=game.quests.filter(function(q){ return q.cat===cat && !q.done && !q.failed; });
    if(!openList.length && !active.length) return;
    const t=document.createElement('div'); t.style.cssText='color:#c9c9cf;font-size:.7em;letter-spacing:3px;margin:10px 0 4px;';
    t.textContent='— '+label+' —'; h.appendChild(t);
    openList.forEach(function(id){
      const qd=QUESTS[id]; if(!qd) return;
      const row=document.createElement('div'); row.className='list-row';
      row.innerHTML='<span class="lname">'+qd.title+'</span><span class="lmeta">'+qd.desc+(qd.ttl?('（限时 · 接取后 '+qd.ttl+' 回合内完成）'):'')+'　↳ '+questGiverLoc(qd.giver||qd.turnin)+'</span>';
      const b=document.createElement('button'); b.className='btn small primary'; b.textContent='接取';
      b.addEventListener('click',function(){ acceptQuest(id); openQuests(); });
      row.appendChild(b); h.appendChild(row);
    });
    active.forEach(function(q){
      const row=document.createElement('div'); row.className='list-row';
      let st, sc='';
      if(q.failed){ st='（作废）'; }
      else if(questReady(q)){ st='（可交付）'; }
      else { st='（进行中'+(q.ttl>0?' · 限 '+q.ttl+' 回合':'')+'）'; }
      sc=questProgressText(q);
      row.innerHTML='<span class="lname">'+q.title+'</span><span class="lmeta">'+sc+'　↳ '+questGiverLoc(q.giver||q.turnin)+'</span><span class="lscore">'+st+'</span>';
      h.appendChild(row);
    });
  }
  section('主线', '主 线');
  section('支线', '支 线');
  section('宗门', '宗 门');
  section('日常', '日 常（每日刷新）');
  section('限时', '限 时');
  const qf=game.questFailed||{};
  const qfKeys=Object.keys(qf).filter(function(k){ return qf[k]; });
  if(qfKeys.length){
    const t3=document.createElement('div'); t3.style.cssText='color:#c9c9cf;font-size:.7em;letter-spacing:3px;margin:8px 0 4px;'; t3.textContent='— 曾超时的委托 —'; h.appendChild(t3);
    qfKeys.forEach(function(k){
      const qd=QUESTS[k]||GEN_QUESTS[k];
      const row=document.createElement('div'); row.className='list-row';
      row.innerHTML='<span class="lname">'+(qd?qd.title:k)+'</span><span class="lmeta">超时作废 · 可回委托人处重新请托</span><span class="lscore">（作废）</span>';
      h.appendChild(row);
    });
  }
  const t2=document.createElement('div'); t2.style.cssText='color:#c9c9cf;font-size:.7em;letter-spacing:3px;margin:10px 0 4px;'; t2.textContent='— 江湖奇缘 —'; h.appendChild(t2);
  const side=[
    '任务随你的行迹与境界「解锁上架」——条件一到，任务栏里自然多出一行。',
    '美人榜：与阮秀、宁姚交好，可结良缘（好感≥85 + 定情信物）。',
    '天骄榜：击败高手，扬名立万，你的名字终将写入榜单。',
    '武林追杀令：为民除害，缉拿蛮荒妖物，赏金丰厚。',
    '云游之人：许多人物会在天下行走，多走动才能遇见他们。'
  ];
  side.forEach(s=>{ const p=document.createElement('div'); p.style.cssText='font-size:.76em;color:#ffffff;padding:5px 8px;border-left:2px solid rgba(255,255,255,.4);margin:4px 0;'; p.textContent=s; h.appendChild(p); });
  openModal('任务与剧情', ()=>h);
}`;
src = src.replace(re, newFn);
fs.writeFileSync('index.html', src);
console.log('openQuests rewritten');
