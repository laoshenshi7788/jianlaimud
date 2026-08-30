$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 品质自动定档：背包/物品渲染处按 atkBonus/defBonus/price 推 quality（未标注者）
# 找渲染背包物品的地方（s-inv 渲染），在标签文本后补品质 chip
$old=@'
function itemLabel(name){
'@
if($html.Contains($old)){
  $new=@'
function itemQuality(name){
  const it=ITEMS[name];
  if(!it) return '';
  if(it.quality) return it.quality;
  const score=(it.atkBonus||0)*3+(it.defBonus||0)*3+Math.log(Math.max(1,it.price||1))*2;
  if(score>=90) return '仙品';
  if(score>=60) return '绝品';
  if(score>=35) return '珍品';
  if(score>=15) return '良品';
  return '凡品';
}
function itemLabel(name){
'@
  $html=$html.Replace($old,$new)
  Write-Host 'itemQuality 已加'
}else{ throw 'itemLabel anchor missing' }
# 背包/行渲染处加品质 chip：找 addItem 渲染列表的 .lname —— 直接把 itemLabel 输出后追加品质
# 通用做法：在 .lname 渲染后附 quality —— 找 '(+itemLabel(' 拼接模式太散；改在 itemLabel 内直接返回带品质？会破坏 title 逻辑。
# 改为：背包列表渲染处（s-inv）若使用 itemLabel(x) 的行，追加 chip —— 用统一辅助：
$html=$html.Replace("function itemLabel(name){","function itemLabel(name){")
# 在 itemQuality 后补一个「品质徽标文本」辅助
$html=$html.Replace("function itemLabel(name){","function itemQualityChip(name){ const q=itemQuality(name); return q?('〔'+q+'〕'):''; }`nfunction itemLabel(name){")
$html=$html.Replace("`n","`r`n")
[System.IO.File]::WriteAllText($f,$html,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'QUALITY HELPERS DONE'
