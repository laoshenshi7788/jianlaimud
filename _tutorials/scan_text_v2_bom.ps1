$ErrorActionPreference='Stop'
# ================================================================
# scan_text_v2.ps1 —— 中文文本病句深度扫描（游戏文案专用）
# 规则依据：高考病句六大类型 + 文案常见毛病
#   1 语序不当   2 搭配不当   3 成分残缺/赘余
#   4 结构混乱   5 表意不明   6 不合逻辑
#   + 游戏文案特有：中英混杂、标点异常、重复字词、残句
# 输出：text_issues.txt（带行号与上下文），供人工复核修正
# ================================================================
$f='E:\1\mud\2\JianLai mud\index.html'
$lines=[System.IO.File]::ReadAllLines($f)
$out=New-Object System.Collections.Generic.List[string]
$out.Add('=== 剑来MUD 文案病句扫描报告 ===')
$out.Add(('生成时间: '+(Get-Date)))
$out.Add('')

# 规则表：名称 + 正则 + 严重度（高=必须改，中=建议改，低=提示）
$rules=@(
  @{n='赘余-的了连用';        re='的了';                                   sev='高'},
  @{n='赘余-的的';            re='的的';                                   sev='高'},
  @{n='赘余-是是';            re='是是';                                   sev='高'},
  @{n='赘余-在在';            re='在在';                                   sev='中'},
  @{n='赘余-和和';            re='和和';                                   sev='高'},
  @{n='赘余-地地';            re='地地';                                   sev='高'},
  @{n='赘余-得得';            re='得得';                                   sev='高'},
  @{n='赘余-们们';            re='们们';                                   sev='高'},
  @{n='三连字';               re='([\u4e00-\u9fa5])\1\1';                  sev='中'},
  @{n='中英混杂';             re='[\u4e00-\u9fa5]{2,}[a-zA-Z]{2,}[\u4e00-\u9fa5]{2,}', sev='高'},
  @{n='病句式杂糅-围绕着…为中心'; re='围绕着?.{0,12}为中心';                  sev='高'},
  @{n='病句式杂糅-原因是…造成的'; re='原因是.{0,16}造成的';                   sev='高'},
  @{n='病句式杂糅-本着…为原则';   re='本着.{0,12}为原则';                     sev='高'},
  @{n='病句杂糅-由于…下';     re='由于.{0,12}下，';                        sev='中'},
  @{n='病句不合逻辑-避免不受'; re='避免(不|免)受';                          sev='高'},
  @{n='病句不合逻辑-防止不再'; re='防止不再';                               sev='高'},
  @{n='病句否定不当-不辜负不要'; re='不辜负.{0,6}不要';                     sev='中'},
  @{n='病句一面两面-是否…能'; re='是否.{0,10}能[够]?'',                    sev='低'},
  @{n='残句-中文逗号结尾';    re='[\u4e00-\u9fa5]，''\)|$';                sev='中'},
  @{n='标点异常-句号在逗号前'; re='。，';                                   sev='中'},
  @{n='标点异常-问号连用';    re='？？';                                   sev='低'},
  @{n='标点异常-省略号错式';  re='\.\.\.(?!\.)';                           sev='低'},
  @{n='全角半角混用-逗号';    re='[\u4e00-\u9fa5],[\u4e00-\u9fa5]';        sev='中'},
  @{n='指代不明-其其';        re='其其';                                   sev='高'},
  @{n='重复词-然后然后';      re='然后然后';                               sev='高'},
  @{n='重复词-但是但是';      re='但是但是';                               sev='高'},
  @{n='重复词-可以可以';      re='可以可以';                               sev='高'},
  @{n='搭配可疑-看着听着同句'; re='看着.{0,14}听着';                        sev='低'}
)

$ln=0
foreach($line in $lines){
  $ln++
  # 只扫描含中文的行
  if($line -notmatch '[\u4e00-\u9fa5]'){ continue }
  # 跳过代码性强的行（JS 关键字密集行）
  if(($line -match 'function |var |let |const |return |if\(|for\(') -and ($line -notmatch '“|”|「|」|『|』')){ continue }
  foreach($r in $rules){
    $ms=[regex]::Matches($line,$r.re)
    foreach($m in $ms){
      $st=[Math]::Max(0,$m.Index-24)
      $len=[Math]::Min(64,$line.Length-$st)
      $ctx=$line.Substring($st,$len)
      $out.Add(('['+$r.sev+']['+$r.n+'] 行'+$ln+' …'+$ctx+'…'))
    }
  }
}
$out.Add('')
$out.Add(('=== 扫描完成，共 '+($out.Count-4)+' 条疑似问题 ==='))
[System.IO.File]::WriteAllLines('E:\1\mud\2\JianLai mud\_tutorials\text_issues.txt',$out,(New-Object System.Text.UTF8Encoding($true)))
Write-Host ('扫描完成: '+($out.Count-4)+' 条疑似问题 → text_issues.txt')
