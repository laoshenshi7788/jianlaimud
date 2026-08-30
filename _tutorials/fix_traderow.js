const fs = require('fs');
const file = 'E:/1/mud/2/JianLai mud/index.html';
let f = fs.readFileSync(file, 'utf8');
const old = "mk('行商带货','六货逐城逐日行情——低买高卖走真路','blue',function(){ document.getElementById('overlay').classList.remove('show'); openTradePanel(); });";
const neu = "mk('商队贩货','特产差价、行情逐日波动、商会投资——大航海式贸易','blue',function(){ document.getElementById('overlay').classList.remove('show'); openTrade(); });";
if (f.includes(old)) { f = f.replace(old, neu); console.log('OK: 财货行已指向现有 openTrade'); }
else console.log('!! 未匹配');
fs.writeFileSync(file, f, 'utf8');
