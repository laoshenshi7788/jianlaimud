#!/usr/bin/env node
/* ui_polish.js —— 五项 UI 修正
   1 物品行标注品级（凡/良/珍/绝/仙，颜色 chip）
   2 每行加「详情」按钮 → 弹全属性/效果明细
   3 「舆图」小按钮固定在 ◎ 左（cheng 层显示，点击回洲图）；cheng 层不再画大牌坊
   4 删「浩 然 舆 图」标题
   5 默认字体改黑体 */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const rep=(o,n,t)=>{ if(!src.includes(o)){ throw new Error('NOT FOUND: '+t); } src=src.split(o).join(n); console.log('OK '+t); };

// 5) 默认字体黑体
rep("--font-ui:'Microsoft YaHei','PingFang SC','Segoe UI',sans-serif;",
    "--font-ui:'SimHei','Microsoft YaHei','PingFang SC',sans-serif;", '默认字体黑体');

// 4) 删浩然舆图标题
rep('<span class="t">浩 然 舆 图</span>\n          <span class="legend" id="map-legend"></span>',
    '<span class="legend" id="map-legend"></span>', '删舆图标题');

// 3) 舆图小按钮：插到 ◎ 定位按钮之前（HTML + 绑定 + 显示逻辑）
rep('<button class="zbtn" id="map-locate" title="定位：聚焦当前位置">◎</button>',
    '<button class="zbtn" id="map-zhou" title="返回洲际舆图" style="display:none;">舆 图</button>\n            <button class="zbtn" id="map-locate" title="定位：聚焦当前位置">◎</button>',
    '舆图按钮HTML');
rep("  if(zi) zi.addEventListener('click',function(e){ e.stopPropagation(); mapZoomBy(1.2); });",
    "  const zv=document.getElementById('map-zhou');\n"+
    "  if(zv) zv.addEventListener('click',function(e){ e.stopPropagation(); if(game.mapLevel==='cheng') exitToZhou(); });",
    '舆图按钮绑定');
// cheng 层显示、其他层隐藏（renderMapNow 尾部统一控制）
rep("  // 渲染完成后再次套用视口：让「返回」节点锚定在当前可见角落\n  applyMapView();",
    "  // 渲染完成后再次套用视口：让「返回」节点锚定在当前可见角落\n  applyMapView();\n"+
    "  const zvBtn=document.getElementById('map-zhou');\n"+
    "  if(zvBtn) zvBtn.style.display=(lv==='cheng')?'':'none';", '舆图按钮显隐');
// cheng 层不再画大牌坊（nei 保留「返回街道」）
rep("  back.setAttribute('class','gate-btn');",
    "  if(!isNei){ setMapLegend(isNei?'nei':'cheng'); return; }\n  back.setAttribute('class','gate-btn');", 'cheng层去大牌坊');

// 2+1) 背包行：品质标注 + 详情按钮
rep("      row.innerHTML='<span class=\"lname\">'+itemLabel(name)+(cnt>1?(' <span class=\"chip\">×'+cnt+'</span>'):'')+'</span><span class=\"lmeta\">'+info+'</span>';",
    "      const _q=itemQuality(name);\n"+
    "      row.innerHTML='<span class=\"lname\">'+itemLabel(name)+(cnt>1?(' <span class=\"chip\">×'+cnt+'</span>'):'')+' <span class=\"chip q-'+_q+'\">'+_q+'</span>'+'</span><span class=\"lmeta\">'+info+'</span>';", '品质标注');

// 详情按钮（插在丢弃按钮之前）+ itemDetail 弹窗函数
rep("      // —— 丢弃：一次丢一件，可连点 ——",
    "      // —— 详情：全属性与效果 ——\n"+
    "      const det=document.createElement('button');\n"+
    "      det.className='btn small blue'; det.textContent='详情';\n"+
    "      det.addEventListener('click',function(){ itemDetail(name); });\n"+
    "      row.appendChild(det);\n"+
    "      // —— 丢弃：一次丢一件，可连点 ——", '详情按钮插入');

const detailFn=[
"// —— 物品详情弹窗：品级 / 部位 / 全属性 / 效果 ——",
"function itemDetail(name){",
"  const it=itemData(name); if(!it){ return; }",
"  const q=itemQuality(name);",
"  const h=document.createElement('div');",
"  h.style.cssText='font-size:.9em;line-height:2;';",
"  const TYPE_CN={weapon:'武器',offhand:'副手',armor:'防具',accessory:'饰品',garb:'衣装',head:'头部',hands:'手部',waist:'腰部',feet:'足部',material:'材料',special:'道具',consumable:'消耗品',quest:'任务物'};",
"  const stats=[];",
"  if(it.atkBonus) stats.push('攻击 +'+it.atkBonus);",
"  if(it.defBonus) stats.push('防御 +'+it.defBonus);",
"  if(it.hpBonus) stats.push('气血上限 +'+it.hpBonus);",
"  if(it.mpBonus) stats.push('内力上限 +'+it.mpBonus);",
"  if(it.critBonus) stats.push('会心率 +'+it.critBonus+'%');",
"  if(it.critDmgBonus) stats.push('暴击伤害 +'+it.critDmgBonus+'%');",
"  if(it.drBonus) stats.push('减伤 +'+it.drBonus+'%');",
"  if(it.dodgeBonus) stats.push('闪避 +'+it.dodgeBonus+'%');",
"  if(it.looksBonus) stats.push('容貌 +'+it.looksBonus);",
"  if(it.type==='consumable'&&it.effect==='heal') stats.push('使用：恢复生命 '+it.value);",
"  if(it.type==='consumable'&&it.effect==='mana') stats.push('使用：恢复内力 '+it.value);",
"  if(it.type==='consumable'&&it.effect==='exp') stats.push('使用：修为 +'+it.value);",
"  if(it.type==='consumable'&&it.effect==='wound') stats.push('使用：舒缓伤势');",
"  if(it.effect==='wound') stats.push('使用：舒缓伤势');",
"  if(it.value&&!it.type) stats.push('价值 '+it.value+' 两');",
"  const rows=[];",
"  rows.push('<div style=\"text-align:center;margin-bottom:8px;\"><span class=\"chip q-'+q+'\">'+q+'</span> <span class=\"chip\">'+(TYPE_CN[it.type]||it.type||'?')+'</span>'+(it.price?(' <span class=\"chip\">价值 '+it.price+' 两</span>'):'')+' <span class=\"chip\">评分 '+equipScore(it)+'</span></div>');",
"  if(stats.length) rows.push('<div style=\"margin:6px 0;\">'+stats.map(function(s){ return '<div>◆ '+s+'</div>'; }).join('')+'</div>');",
"  if(it.desc) rows.push('<div style=\"color:#c6bca6;line-height:1.9;\">'+it.desc+'</div>');",
"  h.innerHTML=rows.join('');",
"  const c=document.createElement('button'); c.className='btn small'; c.textContent='知道了'; c.style.cssText='margin-top:10px;';",
"  c.addEventListener('click',function(){ document.getElementById('overlay').classList.remove('show'); openBackpack(); });",
"  h.appendChild(c);",
"  openModal(itemLabel(name)+' · 详情', ()=>h);",
"}",
""
].join('\n');
const fnAnchor='function openBackpack(){';
if(!src.includes(fnAnchor)) throw new Error('openBackpack 未找到');
if(!src.includes(fnAnchor)) throw new Error('openBackpack 未找到');
src=src.replace(fnAnchor, detailFn+fnAnchor);
console.log('OK 详情弹窗函数');

fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('=== UI 五项修正完成 ===');
