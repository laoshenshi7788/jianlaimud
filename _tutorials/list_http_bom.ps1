[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
$html=[System.IO.File]::ReadAllText('E:\1\mud\2\JianLai mud\index.html')
[regex]::Matches($html,'http://[^"''\s>)]{0,80}') | ForEach-Object { Write-Host $_.Value }
