#!/usr/bin/env node
/* equip_slots_items.js —— 单独追加新槽位物品（插在大骊腰牌块后） */
'use strict';
const fs=require('fs');
const FILE=require('path').join(__dirname,'..','index.html');
let src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
if(src.includes("'藤编斗笠'")){ console.log('已存在，跳过'); process.exit(0); }
const anchor="'大骊腰牌':{type:'accessory',atkBonus:5,price:900,quality:'珍品',desc:'大骊军中腰牌，见牌如见军令。'}\n});";
if(!src.includes(anchor)) throw new Error('腰牌收尾锚未找到');
const block=`
// —— 装备部位扩展物品（头/手/腰/足/副手） ——
Object.assign(ITEMS,{
  '皮帽':{type:'head',defBonus:2,price:30,quality:'凡品',desc:'鞣制的皮帽，遮风挡雨兼防流矢。'},
  '藤编斗笠':{type:'head',defBonus:4,price:80,quality:'良品',desc:'山里人手编的斗笠，笠沿宽大，藤条韧性极好。'},
  '边军铁盔':{type:'head',defBonus:7,price:320,quality:'珍品',desc:'大骊边军的制式铁盔，盔沿带护颈。'},
  '玄铁面甲':{type:'head',defBonus:11,price:980,quality:'绝品',desc:'玄铁冷锻的面甲，只露双目，气势慑人。'},
  '布手套':{type:'hands',defBonus:1,price:12,quality:'凡品',desc:'粗布手套，搬砖练拳两相宜。'},
  '皮护腕':{type:'hands',defBonus:3,price:60,quality:'良品',desc:'双层牛皮的护腕，腕骨稳当出拳才稳。'},
  '虎皮护腕':{type:'hands',defBonus:5,critBonus:2,price:280,quality:'珍品',desc:'虎皮为面、虎筋为里，戴上便有三分虎气。'},
  '玄铁手甲':{type:'hands',defBonus:8,price:760,quality:'绝品',desc:'玄铁手甲覆至指尖，握剑更稳，挥拳更沉。'},
  '粗布腰带':{type:'waist',defBonus:1,price:10,quality:'凡品',desc:'一条粗布腰带，束紧了好干活。'},
  '兽皮带':{type:'waist',defBonus:3,price:70,quality:'良品',desc:'兽皮带扣的宽腰封，能挂刀能悬壶。'},
  '金精腰带':{type:'waist',defBonus:6,hpBonus:30,price:520,quality:'珍品',desc:'金精铜扣的腰封，束上便觉腰马合一。'},
  '龙筋束腰':{type:'waist',defBonus:9,hpBonus:60,price:1400,quality:'绝品',desc:'以蛟筋混编的束腰，束之则气血鼓荡不散。'},
  '草编履':{type:'feet',defBonus:1,dodgeBonus:1,price:8,quality:'凡品',desc:'草编的履，轻便，走远路不磨脚。'},
  '麻鞋':{type:'feet',defBonus:2,dodgeBonus:2,price:35,quality:'凡品',desc:'麻线纳底，走山路稳当。'},
  '踏云靴':{type:'feet',defBonus:5,dodgeBonus:4,price:520,quality:'珍品',desc:'靴底绣云纹，起步生风，纵跃更高。'},
  '追风乌靴':{type:'feet',defBonus:8,dodgeBonus:6,price:1300,quality:'绝品',desc:'乌皮短靴，靴帮嵌铁叶——追风逐电不过如此。'},
  '木盾':{type:'offhand',defBonus:4,price:60,quality:'凡品',desc:'包铁皮的木盾，架得住寻常刀劈。'},
  '铁壁圆盾':{type:'offhand',defBonus:9,price:420,quality:'珍品',desc:'玄铁圆盾，盾墙之称，架住便不退。'},
  '备用长剑':{type:'offhand',atkBonus:6,price:260,quality:'良品',desc:'一柄备用的长剑——主剑脱手时，它就是你的道理。'},
  '双刀·鸳鸯':{type:'offhand',atkBonus:10,critBonus:3,price:900,quality:'珍品',desc:'鸳鸯成对的副刀，主刀既出，副刀补位。'}
});
`;
src=src.replace(anchor,"'大骊腰牌':{type:'accessory',atkBonus:5,price:900,quality:'珍品',desc:'大骊军中腰牌，见牌如见军令。'}\n});"+block);
fs.writeFileSync(FILE,src.replace(/\n/g,'\r\n'),{encoding:'utf8'});
console.log('✓ 新槽位物品 20 件已加');
