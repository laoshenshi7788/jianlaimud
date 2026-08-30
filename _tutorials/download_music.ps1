# 下载 Pixabay 曲目（Pixabay Content License：可商用、免署名）
$ErrorActionPreference = 'Continue'
$dir = "E:\1\mud\2\JianLai mud\assets\music\wuxia"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'

$tracks = @{
  'wx_title_01.mp3' = 'https://cdn.pixabay.com/download/audio/2025/06/02/audio_bf62d2ab24.mp3?filename=kaazoom-moonlit-whispers.mp3'
  'wx_title_02.mp3' = 'https://cdn.pixabay.com/download/audio/2025/05/26/audio_a4dc9cb5b2.mp3?filename=kaazoom-moonlit-blossoms.mp3'
  'wx_title_03.mp3' = 'https://cdn.pixabay.com/download/audio/2025/09/25/audio_ad1c44bc6a.mp3?filename=kaazoom-mountain-spring.mp3'
  'wx_title_04.mp3' = 'https://cdn.pixabay.com/download/audio/2025/11/11/audio_c32e8f6a8a.mp3?filename=kaazoom-journey-of-the-heart.mp3'
  'wx_title_05.mp3' = 'https://cdn.pixabay.com/download/audio/2025/11/11/audio_255d96a3c5.mp3?filename=kaazoom-where-the-cranes-go.mp3'
  'wx_title_06.mp3' = 'https://cdn.pixabay.com/download/audio/2025/11/11/audio_aadd2548f6.mp3?filename=kaazoom-in-the-bamboo-grove.mp3'
  'wx_town_01.mp3'  = 'https://cdn.pixabay.com/download/audio/2025/05/21/audio_bde0da46b7.mp3?filename=kaazoom-among-the-paper-lanterns.mp3'
  'wx_town_02.mp3'  = 'https://cdn.pixabay.com/download/audio/2025/06/04/audio_897bfabc48.mp3?filename=kaazoom-here-giant-pandas-live.mp3'
  'wx_town_03.mp3'  = 'https://cdn.pixabay.com/download/audio/2021/12/17/audio_8a31f4ec17.mp3?filename=antipodeanwriter-chinese-traditional-tune.mp3'
  'wx_town_04.mp3'  = 'https://cdn.pixabay.com/download/audio/2026/02/18/audio_3ee52b1293.mp3?filename=surprising_media-chinese-traditional-song.mp3'
  'wx_town_05.mp3'  = 'https://cdn.pixabay.com/download/audio/2025/02/02/audio_d15650e3f1.mp3?filename=kulakovka-chinese.mp3'
  'wx_town_06.mp3'  = 'https://cdn.pixabay.com/download/audio/2023/11/10/audio_cf726d35f1.mp3?filename=soundgallerydt-chinese-china-music.mp3'
  'wx_capital_01.mp3' = 'https://cdn.pixabay.com/download/audio/2026/07/18/audio_03d94a22af.mp3?filename=solarflex-china-chinese-asian-music.mp3'
  'wx_capital_02.mp3' = 'https://cdn.pixabay.com/download/audio/2026/07/08/audio_19f1c2e1ee.mp3?filename=apalonbeats-china-chinese-asian-music.mp3'
  'wx_capital_03.mp3' = 'https://cdn.pixabay.com/download/audio/2025/06/06/audio_fee149d9d5.mp3?filename=tunetank-china-chinese-asian-music.mp3'
  'wx_sect_01.mp3'  = 'https://cdn.pixabay.com/download/audio/2025/10/15/audio_615c25524e.mp3?filename=rainstreetcat-guqin-reflection.mp3'
  'wx_sect_02.mp3'  = 'https://cdn.pixabay.com/download/audio/2025/10/15/audio_4819e4feba.mp3?filename=rainstreetcat-guqin-reflection-1.mp3'
  'wx_sect_03.mp3'  = 'https://cdn.pixabay.com/download/audio/2026/07/09/audio_504f7c41ef.mp3?filename=lunarboommusic-guqin-melody.mp3'
  'wx_hidden_01.mp3' = 'https://cdn.pixabay.com/download/audio/2025/10/30/audio_16f3769a2d.mp3?filename=rainstreetcat-whisper-of-empty-mountains.mp3'
  'wx_hidden_02.mp3' = 'https://cdn.pixabay.com/download/audio/2025/10/30/audio_765e277125.mp3?filename=rainstreetcat-whisper-of-empty-mountains-1.mp3'
  'wx_hidden_03.mp3' = 'https://cdn.pixabay.com/download/audio/2025/10/31/audio_2239400fac.mp3?filename=u_akuzvxib8r-la-voie-du-silence.mp3'
  'wx_danger_01.mp3' = 'https://cdn.pixabay.com/download/audio/2025/09/30/audio_d8c9f957b3.mp3?filename=pojeng-sad-epic-documentary.mp3'
  'wx_danger_02.mp3' = 'https://cdn.pixabay.com/download/audio/2025/06/13/audio_dfa433af2b.mp3?filename=tunetank-adventure-china.mp3'
  'wx_danger_03.mp3' = 'https://cdn.pixabay.com/download/audio/2026/07/16/audio_da2d292162.mp3?filename=joyvideo123-the-eternal-ascension.mp3'
  'wx_battle_01.mp3' = 'https://cdn.pixabay.com/download/audio/2025/06/13/audio_f2d5aaa684.mp3?filename=tunetank-china-chinese-epic-music.mp3'
  'wx_battle_02.mp3' = 'https://cdn.pixabay.com/download/audio/2025/06/13/audio_acd7218be2.mp3?filename=tunetank-china-epic-background-music.mp3'
  'wx_battle_03.mp3' = 'https://cdn.pixabay.com/download/audio/2024/12/26/audio_4782e72dd3.mp3?filename=fassounds-lunar-new-year-chinese-epic-cinematic.mp3'
}

$ok = 0; $fail = 0
foreach ($k in $tracks.Keys) {
  $out = Join-Path $dir $k
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 300000)) { $ok++; continue }
  try {
    Invoke-WebRequest -Uri $tracks[$k] -OutFile $out -UserAgent $UA -TimeoutSec 120
    $size = (Get-Item $out).Length
    if ($size -lt 100000) { $fail++; Write-Output ("SMALL $k " + $size) } else { $ok++; Write-Output ("OK $k " + [Math]::Round($size/1MB,1) + "MB") }
  } catch {
    $fail++; Write-Output ("FAIL $k : " + $_.Exception.Message)
  }
}
Write-Output "done ok=$ok fail=$fail"
