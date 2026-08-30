const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
lines.forEach((l, i) => {
  if (/action==='upgrade'|action==='repair'|action==='reforge'|action==='nurture'|function originAction|function openOriginPanel|onOriginAct/.test(l)) {
    console.log((i + 1) + ': ' + l.trim().slice(0, 125));
  }
});
