#!/usr/bin/env node
/* ================================================================
   text_doctor.js —— 剑来MUD 文案病句深度扫描器
   规则依据：高考病句六大类型（语序不当/搭配不当/成分残缺或赘余/
   结构混乱/表意不明/不合逻辑）+ 游戏文案常见毛病
   用法：node text_doctor.js [--fix-report]
   输出：text_issues.txt（严重度+行号+上下文）
   ================================================================ */
'use strict';
const fs=require('fs');
const path=require('path');

const FILE=path.join(__dirname,'..','index.html');
const OUT=path.join(__dirname,'text_issues.txt');

const RULES=[
  // —— 赘余（成分赘余）——
  {n:'赘余-的了连用', re:/[\u4e00-\u9fa5]的了(?![\u4e00-\u9fa5])/g, sev:'高', why:'「的了」连用多为赘余（例外：确实说「……的」了）'},
  {n:'赘余-的的', re:/的的/g, sev:'高', why:'「的的」重复'},
  {n:'赘余-是是', re:/是是/g, sev:'高', why:'「是是」重复（例外：是是非非）'},
  {n:'赘余-在在', re:/在在/g, sev:'中', why:'「在在」重复（例外：在在处处）'},
  {n:'赘余-和和', re:/和和/g, sev:'高', why:'「和和」重复'},
  {n:'赘余-们们', re:/们们/g, sev:'高', why:'「们们」重复'},
  {n:'三连字', re:/([\u4e00-\u9fa5])\1\1/g, sev:'中', why:'三个连续相同汉字（拟声词除外）'},
  // —— 中英混杂 ——
  {n:'中英混杂', re:/[\u4e00-\u9fa5]{2,}[a-zA-Z]{2,}[\u4e00-\u9fa5]{2,}/g, sev:'高', why:'中文句子中夹入英文单词'},
  // —— 结构混乱（句式杂糅）——
  {n:'杂糅-围绕着…为中心', re:/围绕着?.{0,12}为中心/g, sev:'高', why:'「围绕…」与「以…为中心」杂糅'},
  {n:'杂糅-原因是…造成的', re:/原因是.{0,16}造成的/g, sev:'高', why:'「原因是…」与「是…造成的」杂糅'},
  {n:'杂糅-本着…为原则', re:/本着.{0,12}为原则/g, sev:'高', why:'「本着…原则」与「以…为原则」杂糅'},
  {n:'杂糅-由于…下', re:/由于.{0,12}下[，,]/g, sev:'中', why:'「由于…」与「在…下」杂糅'},
  {n:'杂糅-关键在于…是十分重要的', re:/关键在于.{0,16}是十分重要/g, sev:'高', why:'「关键在于…」与「…是十分重要的」杂糅'},
  // —— 不合逻辑（否定不当等）——
  {n:'逻辑-避免不受', re:/避免不(?:受|了)/g, sev:'高', why:'「避免」与「不受」连用表意相反'},
  {n:'逻辑-防止不再', re:/防止不再/g, sev:'高', why:'「防止」与「不再」连用表意相反'},
  {n:'逻辑-切忌不要', re:/切忌不要/g, sev:'高', why:'「切忌」与「不要」双重否定表意相反'},
  {n:'逻辑-缺乏不应', re:/缺乏.{0,6}不应/g, sev:'中', why:'「缺乏」含否定义，与「不应」叠用'},
  {n:'逻辑-无非不是', re:/无非不是/g, sev:'中', why:'双重否定嵌套易歧义'},
  // —— 指代/重复 ——
  {n:'指代-其其', re:/其其/g, sev:'高', why:'「其其」重复'},
  {n:'重复-然后然后', re:/然后然后/g, sev:'高', why:'连词重复'},
  {n:'重复-但是但是', re:/但是但是/g, sev:'高', why:'连词重复'},
  {n:'重复-可以可以', re:/可以可以/g, sev:'高', why:'能愿动词重复'},
  {n:'重复-已经已经', re:/已经已经/g, sev:'高', why:'副词重复'},
  // —— 标点异常 ——
  {n:'标点-句号在逗号前', re:/[\u4e00-\u9fa5]。，/g, sev:'中', why:'句号后接逗号，断句混乱'},
  {n:'标点-问号连用', re:/？？/g, sev:'低', why:'问号连用（语气需要除外）'},
  {n:'标点-省略号错式', re:/[\u4e00-\u9fa5]\.(?!\.)/g, sev:'低', why:'中文句用单英文句点（应为。或…）'},
  {n:'标点-半角逗号', re:/[\u4e00-\u9fa5],[\u4e00-\u9fa5]/g, sev:'中', why:'中文句使用半角逗号'},
  {n:'标点-半角句号', re:/[\u4e00-\u9fa5]\.[\u4e00-\u9fa5]/g, sev:'中', why:'中文句使用半角句号'},
  // —— 游戏文案特有 ——
  {n:'文案-括号未闭合', re:/（[^（）]{0,60}$/g, sev:'中', why:'全角括号疑似未闭合'},
  {n:'文案-引号未闭合', re:/「[^「」]{0,40}$/g, sev:'中', why:'「」引号疑似未闭合'},
  {n:'文案-下划线占位', re:/__+|TODO|FIXME|占位/g, sev:'高', why:'疑似未完成的占位文本'}
];

function scan(){
  const src=fs.readFileSync(FILE,'utf8');
  const lines=src.split(/\r?\n/);
  const out=[];
  out.push('=== 剑来MUD 文案病句扫描报告 ===');
  out.push('生成时间: '+new Date().toLocaleString());
  out.push('规则数: '+RULES.length);
  out.push('');
  let count=0;
  let ln=0;
  for(const line of lines){
    ln++;
    if(!/[\u4e00-\u9fa5]/.test(line)) continue;
    // 跳过纯代码行（无中文引号包裹的对话/文案时）——JS 语法行谨慎放行含文案引号的
    const isCodeLine=/function |=>|return |if\(|for\(|var |let |const /.test(line);
    const hasQuote=/[「」『』“”]/.test(line);
    if(isCodeLine && !hasQuote && !/[（(]['"]/g.test(line)) continue;
    for(const r of RULES){
      r.re.lastIndex=0;
      let m;
      while((m=r.re.exec(line))!==null){
        const st=Math.max(0,m.index-24);
        const ctx=line.substr(st,72).replace(/\s+/g,' ');
        out.push('['+r.sev+']['+r.n+'] 行'+ln+' …'+ctx+'…  （'+r.why+'）');
        count++;
        if(m.index===r.re.lastIndex) r.re.lastIndex++;
      }
    }
  }
  out.push('');
  out.push('=== 扫描完成: 共 '+count+' 条疑似问题 ===');
  // 严重度统计
  const bySev={高:0,中:0,低:0};
  for(const line of out){ const m=line.match(/^\[(高|中|低)\]/); if(m) bySev[m[1]]++; }
  out.push('高(必须改): '+bySev['高']+' | 中(建议改): '+bySev['中']+' | 低(提示): '+bySev['低']);
  fs.writeFileSync(OUT,out.join('\r\n'),{encoding:'utf8'});
  console.log('扫描完成: '+count+' 条疑似问题（高 '+bySev['高']+' / 中 '+bySev['中']+' / 低 '+bySev['低']+'）');
  console.log('报告: '+OUT);
}
scan();
