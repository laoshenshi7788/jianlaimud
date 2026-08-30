$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
$html=[System.IO.File]::ReadAllText('E:\1\mud\2\JianLai mud\index.html')
foreach($z in @('老桃山密林','野猪林','披云山山道','黑松峡','古沙场','乱葬岗','倒马河谷','落枫谷','荒废窑址')){
  $i=$html.IndexOf("key:'"+$z+"'")
  $seg=$html.Substring($i,200)
  $m=[regex]::Match($seg,"hook:'([^']+)'")
  Write-Host ($z+' → hook='+$m.Groups[1].Value)
}
Write-Host ('白雁滩涂 hook='+[regex]::Match($html.Substring($html.IndexOf("key:'白雁滩涂'"),200),"hook:'([^']+)'").Groups[1].Value)
