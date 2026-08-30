const fs = require('fs');
const P = 'E:/1/mud/2/JianLai mud/index.html';
let html = fs.readFileSync(P, 'utf8');

// 1) 从事件数组里取出误插的文戏段落（文件为 CRLF，\s 吸收换行差异）
const BAD_START = "  }},\r\n  // —— 文圣：读书人的道理 ——";
const END_MARK = "];\r\nconst ENC_RECENT=[];";
const i1 = html.indexOf(BAD_START);
if (i1 < 0) { console.log('BAD_START not found'); process.exit(1); }
const i2 = html.indexOf(END_MARK, i1);
if (i2 < 0) { console.log('END_MARK not found'); process.exit(1); }
const scenes = html.slice(i1 + "  }},\r\n".length, i2).replace(/\s+$/, '');
html = html.slice(0, i1) + "  }}\r\n];\r\nconst ENC_RECENT=[];" + html.slice(i2 + END_MARK.length);

// 2) 找到 DRAMA 真正的收尾（DRAMA 起点后第一个行首的 `];`）
const d = html.indexOf('const DRAMA={');
if (d < 0) { console.log('DRAMA not found'); process.exit(1); }
const close = html.indexOf('\r\n];', d);
if (close < 0) { console.log('DRAMA close not found'); process.exit(1); }
// 3) 前一个 NPC 的 `  }}` 改为 `  }},`，随后插入文戏
let head = html.slice(0, close);
const lastBrace = head.lastIndexOf('  }}');
if (lastBrace < 0) { console.log('last brace not found'); process.exit(1); }
head = head.slice(0, lastBrace) + '  }},' + head.slice(lastBrace + 4);
html = head + '\r\n' + scenes + html.slice(close);

fs.writeFileSync(P, html, 'utf8');
// 验证：文圣应位于 DRAMA 与 TROPES 之间
const di = html.indexOf("const DRAMA={");
const wi = html.indexOf("'文圣':{\r\n    'dadao'");
const ti = html.indexOf('const TROPES=');
console.log('DRAMA at', di, '| 文圣 at', wi, '| TROPES at', ti, '| order ok:', di < wi && wi < ti);

