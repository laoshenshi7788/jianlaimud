// 探查开局自定义相关代码：renderStartupPage / REALMS / 三道 / TRAITS / 加点
const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split(/\r?\n/);
const pats = [
  [/function renderStartupPage/, 'RENDER_STARTUP'],
  [/const REALMS/, 'REALMS_ARR'],
  [/function realmIndexByLevel|function realmIndex|function realmName/, 'REALM_FN'],
  [/daoPath|dao1|daoMain|正道一脉/, 'DAO'],
  [/function autoAllocateAttrs/, 'AUTO_ALLOC'],
  [/function ensureOrigin/, 'ORIGIN'],
  [/player\.traits|TRAIT_KEY|chosenTrait|game\.trait/, 'TRAIT_USE'],
  [/attrPts/, 'ATTRPTS'],
  [/资质走向|散修/, 'BUILD_UI'],
  [/ss-body/, 'SS_BODY'],
];
const hits = {};
lines.forEach((l, i) => {
  pats.forEach(([re, tag]) => { if (re.test(l)) (hits[tag] = hits[tag] || []).push(i + 1); });
});
Object.keys(hits).forEach(k => {
  const v = hits[k];
  console.log(k + '  ' + v.length + ' hits: ' + v.slice(0, 16).join(',') + (v.length > 16 ? ' ...' : ''));
});
