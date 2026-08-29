// 剑来 MUD 本地服务器：node server.js  （端口 8399）
require('http').createServer(function (req, res) {
  var fs = require('fs');
  var p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  var f = '.' + p;
  fs.readFile(f, function (e, d) {
    if (e) { res.writeHead(404); res.end('404'); return; }
    var ext = f.split('.').pop().toLowerCase();
    var m = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg', wav: 'audio/wav', svg: 'image/svg+xml', json: 'application/json' };
    res.writeHead(200, { 'Content-Type': m[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(d);
  });
}).listen(8399, function () { console.log('剑来MUD 服务器已启动: http://localhost:8399'); });
