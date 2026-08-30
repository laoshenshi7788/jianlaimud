$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
$anchor='/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */'
$s=$html.IndexOf($anchor)
if($s -lt 0){ throw 'anchor not found' }
$new=@'
/* ===== 野外秘境：随机野区生成器（mudcore maze 蓝本；删掉此段即复原） =====
   每个野区=入口+网格房间+深处，入口挂在主城空余方向。
   重要地点之间由这些野地隔开，不再一个要地贴着一个要地。 */
(function buildWildZones(){
  const WILD=[
    { key:'老桃山密林', hook:'泥瓶拳馆', dir:'s',
      entryDesc:'老桃山南麓的林子入口，树上钉着块褪色木牌：「山中有兽，结伴而行」。',
      deepDesc:'密林深处的林间空地，四周树影幢幢，隐隐有兽类低吼。',
      descs:[
        '林间小道被落叶盖得严严实实，踩上去沙沙作响，惊起几只不知名的鸟。',
        '一棵歪脖子老松拦在路中，树皮上有深浅不一的爪痕，看着有些年头了。',
        '密林深处光线昏暗，藤蔓垂落如帘，远处隐隐有溪水声。',
        '此地灌木丛生，地上散落着些兽骨，不知是何物啃剩的。',
        '林中雾气渐浓，十步开外便看不真切，只能凭着脚感辨路。'
      ],
      enemies:['妖狼','阴鬼'], boss:'黑风魔狼' },
    { key:'野猪林', hook:'铁匠铺', dir:'s',
      entryDesc:'铁匠铺往南的野猪林，林子里满是拱翻的泥土——野猪群夜里常来糟蹋庄稼。',
      deepDesc:'野猪林深处的泥塘边，蹄印密密麻麻，空气里有股腥气。',
      descs:[
        '林中树干上满是野猪磨牙的痕迹，树皮翻卷，露出白生生的木质。',
        '一小片被拱得坑坑洼洼的泥地，泥浆里还冒着泡。',
        '枯枝堆里藏着个鸟窝，几枚青壳蛋竟还没碎。',
        '林子越走越密，头顶枝叶交叠，日光漏下来只剩星星点点。',
        '地上有半只被啃剩的野兔，血迹还没干透。'
      ],
      enemies:['妖狼','蛮荒小妖'], boss:'赤鬃狮' },
    { key:'披云山山道', hook:'回春医馆', dir:'n',
      entryDesc:'一条石阶山道蜿蜒而上，直通披云山深处。山风过处，云海在脚下翻涌。',
      deepDesc:'山道尽头的观景石台，云海滔滔，远处山峦如剑如戟。',
      descs:[
        '山道依崖而凿，一侧是壁，一侧是渊，云雾从谷底缓缓升上来。',
        '几株野山桃斜生在崖边，花已谢了大半，枝头却还挂着几颗青果。',
        '山风渐大，吹得人衣衫猎猎作响，仿佛下一步就要乘风而去。',
        '道旁有半截断碑，字迹已被风雨磨平，只余一个「云」字依稀可辨。',
        '此处地势渐高，回头望去，来路已隐入云雾之中。'
      ],
      enemies:['搬山猿','蛮荒小妖'], boss:'赤鬃狮' },
    { key:'黑松峡', hook:'渡口街市', dir:'n',
      entryDesc:'两座石崖夹出一条窄峡，峡里种满黑松，风穿峡而过，呜呜如号。',
      deepDesc:'黑松峡最深处的崖壁下，一块平地被松针铺得厚厚的。',
      descs:[
        '峡壁高耸，抬头只见一线天光，黑松的影子压得人心里发沉。',
        '松脂的气味浓得化不开，脚下的松针积了不知多少年。',
        '崖壁上有几个黑黢黢的洞口，深浅不知，最好别去掏。',
        '一股山泉从石缝里渗出来，在洼处积成一汪碧水。',
        '风忽大忽小，松涛声一阵紧似一阵，像有人在暗处喘息。'
      ],
      enemies:['阴鬼','蛮荒妖兵'], boss:'白骨妖将' },
    { key:'白雁滩涂', hook:'宝瓶洲渡口·泊船坞', dir:'s',
      entryDesc:'泊船坞往南的滩涂，芦苇齐人高，滩上白雁成群，见人便哄然飞起。',
      deepDesc:'滩涂深处的烂泥地里，插着几根系船的旧木桩。',
      descs:[
        '滩涂软陷，一脚下去泥浆没过脚踝，拔出来时吧唧作响。',
        '成片的芦苇沙沙摇晃，苇穗上的白絮随风飘散。',
        '几只白鹭单腿立在浅水里，纹丝不动，像是在打坐。',
        '潮气带着淡淡的腥咸味，远处水天一色，分不清界限。',
        '泥滩上有大大小小的蟹洞，偶尔有指节大的青蟹横着掠过。'
      ],
      enemies:['沼泽巨蟒','双头蛇'], boss:'寒渊魔蛟' },
    { key:'古沙场', hook:'荒郊野岭', dir:'s',
      entryDesc:'一片开阔的荒原，据说是前朝旧沙场。风过沙鸣，似有金戈之声。',
      deepDesc:'古沙场正中，半截锈矛斜插在土里，四周白骨隐约。',
      descs:[
        '黄沙漫漫，偶有白骨半掩沙中，不知是哪一朝的士卒。',
        '风卷沙起，呜呜作响，老人们说那是阵亡将士在喊杀。',
        '此处地势平坦，视野开阔，正是两军对冲的旧战场形制。',
        '沙地里散落着锈箭头、破甲片，捡起来轻飘飘的，却压手。',
        '夕阳西照，沙丘影子拉得老长，像一排排卧倒的兵俑。'
      ],
      enemies:['蛮荒妖兵','妖族死士'], boss:'铁背犀' },
    { key:'乱葬岗', hook:'望江崖', dir:'w',
      entryDesc:'一片埋无名尸骨的乱葬岗，坟头东一个西一个，草长得比坟高。',
      deepDesc:'乱葬岗最深处的义庄残屋，门板歪斜，里面黑得看不透。',
      descs:[
        '纸钱灰被风卷着打转，粘在裤脚上，拍都拍不掉。',
        '几座坟头塌了，露出半截朽木棺板，也没人管。',
        '夜鸮在枯树上叫了两声，扑棱棱飞走了，惊出一身冷汗。',
        '此地阴气森森，大白天走也觉得后脖颈发凉。',
        '有个新坟前插着块木牌，字迹歪歪扭扭，连个正经名姓都没有。'
      ],
      enemies:['阴鬼','妖族死士'], boss:'白骨妖将' },
    { key:'倒马河谷', hook:'小镇官道', dir:'e',
      entryDesc:'官道旁有条下坡岔路，通向一处河谷。河水湍急，相传曾有战马在此失蹄，故名倒马。',
      deepDesc:'河谷深处的浅滩，水声轰鸣，两岸崖壁如削。',
      descs:[
        '河谷幽深，水声在崖壁间来回撞，嗡嗡作响。',
        '河滩上尽是圆润的鹅卵石，踩上去滑溜得很。',
        '此处水流稍缓，深潭幽幽，说不清水底有什么。',
        '崖壁上有前人凿出的把手坑，看来常有人攀壁而过。',
        '水汽扑面，凉意沁骨，衣裳很快就潮了。'
      ],
      enemies:['沼泽巨蟒','双头蛇'], boss:'寒渊魔蛟' },
    { key:'落枫谷', hook:'王家民房', dir:'n',
      entryDesc:'山谷里种满枫树，深秋时红叶铺满谷底，镇上人叫它落枫谷。',
      deepDesc:'落枫谷深处的一眼山泉，泉边立着块无名石碑。',
      descs:[
        '红叶飘落，铺了满地，踩上去软软的没有声音。',
        '谷中风向多变，枫叶打着旋儿往怀里钻。',
        '泉眼咕嘟咕嘟冒着水，泉边的石碑字迹已经磨平。',
        '几株老枫虬枝盘曲，树洞里塞着前人避雨时留下的干柴。',
        '风起时满谷红叶翻飞，美得不太真实，让人不敢久留。'
      ],
      enemies:['搬山猿','阴鬼'], boss:'噬魂魔蝶' },
    { key:'荒废窑址', hook:'小镇官道', dir:'e',
      entryDesc:'官道岔路口往南的荒坡上，塌了半边的龙窑残址还在，碎瓷片遍地都是。',
      deepDesc:'窑址最深处的主窑室，窑膛漆黑，热气竟还未散尽。',
      descs:[
        '半塌的窑膛像只巨兽的嘴，碎瓷片在脚下咔嚓作响。',
        '废窑边堆着成山的次品瓷，青花纹路依然好看。',
        '一座废弃的辘轳车歪在草里，摇柄锈死，转不动了。',
        '窑壁上的釉彩被烟火熏出深深浅浅的斑，像一幅糊了的画。',
        '偶有野猫从塌落的窑洞里窜出，吓人一跳。'
      ],
      enemies:['蛮荒小妖','搬山猿'], boss:'镇墓妖兽' }
  ];
  const OP={n:'s',s:'n',e:'w',w:'e'};
  WILD.forEach(function(z){
    const COLS=3, ROWS=3;
    const P=[]; let k=0;
    for(let ry=0;ry<COLS;ry++) for(let cx=0;cx<ROWS;cx++){ P.push({key:z.key+'·'+(++k), dx:cx, dy:ry}); }
    const entryKey=P[0].key, deepKey=P[P.length-1].key;
    P.forEach(function(c,idx){
      const isEntry=(idx===0), isDeep=(idx===P.length-1);
      if(!ROOMS[c.key]){
        const desc=isDeep? z.deepDesc : z.descs[idx%z.descs.length];
        ROOMS[c.key]={area:z.area, zone:z.zone, label:z.label, desc:desc, exits:{}};
      }
      const r=ROOMS[c.key];
      if(!r.area) r.area=z.area; // 老房间缺 area 会成为地图孤岛，补全
      if(!r.exits) r.exits={};
      if(isDeep && z.boss && !(r.enemies&&r.enemies.length)) r.enemies=[z.boss];
      else if(!isEntry && Math.random()<0.55 && !(r.enemies&&r.enemies.length)) r.enemies=[z.enemies[idx%z.enemies.length]];
    });
    P.forEach(function(c){
      const r=ROOMS[c.key]; if(!r) return;
      P.forEach(function(c2){
        const dx=c2.dx-c.dx, dy=c2.dy-c.dy;
        if(dx===1) r.exits.e=c2.key; else if(dx===-1) r.exits.w=c2.key;
        else if(dy===1) r.exits.s=c2.key; else if(dy===-1) r.exits.n=c2.key;
        if(dx===1) ROOMS[c2.key].exits.w=c.key; else if(dx===-1) ROOMS[c2.key].exits.e=c.key;
        else if(dy===1) ROOMS[c2.key].exits.n=c.key; else if(dy===-1) ROOMS[c2.key].exits.s=c.key;
      });
    });
    const hook=ROOMS[z.hook];
    if(hook){
      if(!hook.exits) hook.exits={};
      let dir=z.dir;
      if(hook.exits[dir]){ dir=['n','e','s','w'].find(function(d){ return !hook.exits[d]; }); }
      if(dir){
        hook.exits[dir]=entryKey;
        const er=ROOMS[entryKey]; if(er) er.exits[OP[dir]]=z.hook;
      }
    }
  });
})();

/* ===== 字体 / 标题色 / 背景图 / 诗句 / 音乐 常量 ===== */
'@
$html=$html.Insert($s,$new)
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'WILD ZONES INSTALLED (10 zones)'
