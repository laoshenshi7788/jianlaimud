$ErrorActionPreference='Stop'
$f='E:\1\mud\2\JianLai mud\index.html'
$html=[System.IO.File]::ReadAllText($f).Replace("`r`n","`n")
# 提取所有中文字符串字面量做病句扫描
$patterns=@(
  @{n='重复的「的了」'; re='的了'},
  @{n='重复的「地地」'; re='地地'},
  @{n='重复的「得得」'; re='得得'},
  @{n='三个连续相同字'; re='([\u4e00-\u9fa5])\1\1'},
  @{n='的的'; re='的的'},
  @{n='是是'; re='是是'},
  @{n='在在'; re='在在'},
  @{n='和和'; re='和和'},
  @{n='半截话（以，结尾的字符串）'; re='[\u4e00-\u9fa5]，'''},
  @{n='中英混杂（字母夹中文）'; re='[\u4e00-\u9fa5]{2,}[a-zA-Z]{2,}[\u4e00-\u9fa5]{2,}'}
)
$out=@()
foreach($p in $patterns){
  $ms=[regex]::Matches($html,$p.re)
  foreach($m in $ms){
    $start=[Math]::Max(0,$m.Index-30)
    $ctx=$html.Substring($start,[Math]::Min(80,$html.Length-$start)).Replace("`n",' ')
    $out+=('['+$p.n+'] …'+$ctx+'…')
  }
}
$out | Select-Object -First 60 | Out-File 'E:\1\mud\2\JianLai mud\_tutorials\text_issues.txt' -Encoding utf8
Write-Host ('发现疑似问题 '+$out.Count+' 处，已写入 text_issues.txt')
