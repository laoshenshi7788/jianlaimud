/*
 * 剑来 MUD · 配乐合成器
 * 为 7 个场景各合成 3 首新曲目（_04~_06），音色：古琴(KS拨弦)/箫(软笛)/编钟/战鼓/风垫/雨声
 * 全部五声音阶（宫调/羽调），44100Hz 立体声 16bit WAV。
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'music');
const SR = 44100;

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// —— 音名 → 频率（五声音阶） ——
// degrees: 0..4 = 宫商角徵羽；octave 相对位移
function pentFreq(base, deg, oct){
  const steps=[0,2,4,7,9]; // 大调五声半音
  const minor=[0,3,5,7,10]; // 小调五声（羽调）
  return base; // placeholder, real scale handled by scaleFreq
}
function scaleFreq(rootHz, deg, oct, minorMode){
  const steps = minorMode ? [0,3,5,7,10] : [0,2,4,7,9];
  const semis = steps[((deg % 5) + 5) % 5] + 12 * oct;
  return rootHz * Math.pow(2, semis / 12);
}

// —— 合成器：全部写入 L/R Float32 ——
function mixNote(L, R, startS, freq, dur, opts){
  const o = opts || {};
  const gain = o.gain != null ? o.gain : 0.4;
  const pan = o.pan != null ? o.pan : 0;
  const type = o.type || 'pluck';
  const rng = o.rng || Math.random;
  const s0 = Math.floor(startS * SR);
  const n = Math.floor(dur * SR);
  const gl = gain * (1 - Math.max(0, pan)) , gr = gain * (1 + Math.min(0, pan));
  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx >= L.length) break;
    const t = i / SR;
    let v = 0;
    if (type === 'pluck') {
      // 古琴/古筝：多泛音指数衰减 + 轻微走音
      const env = Math.exp(-t * (o.decay || 2.2));
      const vib = 1 + 0.0015 * Math.sin(2 * Math.PI * 4.5 * t);
      v = (Math.sin(2 * Math.PI * freq * vib * t)
        + 0.45 * Math.sin(2 * Math.PI * freq * 2 * t)
        + 0.22 * Math.sin(2 * Math.PI * freq * 3.01 * t)
        + 0.08 * Math.sin(2 * Math.PI * freq * 4.98 * t)) * env;
      v *= (0.8 + 0.2 * Math.exp(-t * 30)); // 拨弦起音
    } else if (type === 'harm') {
      // 泛音（古琴泛音）：更空灵，高倍频
      const env = Math.exp(-t * (o.decay || 1.6));
      v = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)) * env;
    } else if (type === 'flute') {
      // 箫：软起音 + 颤音 + 气声
      const atk = Math.min(1, t / 0.12);
      const rel = Math.min(1, (dur - t) / 0.25);
      const env = atk * Math.max(0, Math.min(1, rel)) * (o.sus != null ? o.sus : 1);
      const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 4.8 * t + 1);
      v = (Math.sin(2 * Math.PI * freq * vib * t)
        + 0.25 * Math.sin(2 * Math.PI * freq * 2 * vib * t)
        + 0.07 * Math.sin(2 * Math.PI * freq * 3 * t)) * env * 0.8;
      v += (rng() * 2 - 1) * 0.018 * env; // 气声
    } else if (type === 'bell') {
      // 磬/编钟：非谐分音
      const ps = [[1, 1], [2.76, 0.5], [5.4, 0.22], [8.93, 0.08]];
      for (const [m, a] of ps) v += a * Math.sin(2 * Math.PI * freq * m * t) * Math.exp(-t * (o.decay || 0.9) * (0.6 + m * 0.35));
      v *= 0.5;
    } else if (type === 'drum') {
      // 太鼓：音高下滑 + 皮噪
      const f = freq * (1 + 1.4 * Math.exp(-t * 28));
      const env = Math.exp(-t * (o.decay || 7));
      v = Math.sin(2 * Math.PI * f * t) * env * 1.1;
      v += (rng() * 2 - 1) * Math.exp(-t * 55) * 0.5;
    } else if (type === 'pad') {
      // 弦垫：detune 正弦叠置，慢起
      const atk = Math.min(1, t / (o.atk || 1.2));
      const rel = Math.min(1, Math.max(0, (dur - t)) / 1.0);
      const lfo = 1 + 0.06 * Math.sin(2 * Math.PI * 0.13 * t);
      v = (Math.sin(2 * Math.PI * freq * 0.997 * t) + Math.sin(2 * Math.PI * freq * 1.004 * t)
        + 0.5 * Math.sin(2 * Math.PI * freq * 1.5 * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2 * t)) * atk * rel * lfo * 0.3;
    }
    L[idx] += v * gl; R[idx] += v * gr;
  }
}

function addWind(L, R, dur, rng, level){
  // 风：低通噪声 + 慢LFO 起伏
  let lp = 0, cut = 0.045;
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const gust = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.07 * t + rng() * 0.02) * Math.sin(2 * Math.PI * 0.031 * t);
    const x = rng() * 2 - 1;
    lp += cut * (x - lp);
    const v = lp * level * gust;
    L[i] += v; R[i] += v * 0.96;
  }
}

function addRain(L, R, dur, rng, level){
  // 细雨：高频轻噪声（一阶高通近似：噪声-低通）
  let lp = 0;
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const x = rng() * 2 - 1;
    lp += 0.12 * (x - lp);
    const hp = x - lp;
    const v = hp * level * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.05 * i / SR));
    L[i] += v; R[i] += v * 0.9;
  }
}

function finalize(L, R, fadeIn, fadeOut, peak){
  const n = L.length;
  let maxv = 1e-9;
  for (let i = 0; i < n; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > maxv) maxv = a; if (b > maxv) maxv = b; }
  const k = (peak || 0.82) / maxv;
  const fi = Math.floor((fadeIn || 1.2) * SR), fo = Math.floor((fadeOut || 2.5) * SR);
  for (let i = 0; i < n; i++) {
    let g = k;
    if (i < fi) g *= i / fi;
    if (i > n - fo) g *= Math.max(0, (n - i) / fo);
    L[i] *= g; R[i] *= g;
  }
}

function writeWav(file, L, R){
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

// —— 乐句生成：五声音阶随机游走 ——
function melody(rng, len, minorMode, rootHz){
  const seq = [];
  let deg = Math.floor(rng() * 5), oct = 0;
  for (let i = 0; i < len; i++) {
    seq.push({ deg, oct });
    const mv = rng();
    if (mv < 0.34) deg = (deg + 1) % 5;
    else if (mv < 0.62) deg = (deg + 4) % 5;
    else if (mv < 0.72) deg = (deg + 2) % 5;
    else if (mv < 0.80) oct = Math.max(-1, oct - 1);
    else if (mv < 0.88) oct = Math.min(1, oct + 1);
  }
  return seq.map(d => scaleFreq(rootHz, d.deg, d.oct, minorMode));
}

// —— 曲目配方 ——
// 每首：{name, durSec, build(L,R,rng)}
const TRACKS = [];
function T(scene, idx, desc, build){ TRACKS.push({ file: path.join(OUT, scene + '_0' + idx + '.wav'), desc, build }); }

const ROOT_C = 261.63, ROOT_A = 220.0, ROOT_G = 196.0, ROOT_D = 293.66, ROOT_E = 164.81;

/* —— title：古琴 / 箫 / 磬，慢板空灵 —— */
T('title', 4, '古琴独奏·羽调慢板', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.05);
  const mel = melody(rng, 18, true, ROOT_A * 2);
  let t = 0.8;
  for (const f of mel) {
    const dur = 1.6 + rng() * 1.6;
    mixNote(L, R, t, f, dur * 2.2, { type: 'pluck', gain: 0.30, decay: 1.1, pan: (rng() - 0.5) * 0.5, rng });
    if (rng() < 0.3) mixNote(L, R, t + 0.06, f * 1.5, dur * 1.6, { type: 'harm', gain: 0.12, decay: 1.4, rng });
    t += dur;
    if (rng() < 0.22) t += 0.8 + rng();
    if (t > D - 4) break;
  }
  for (let b = 4; b < D - 6; b += 9 + rng() * 4) mixNote(L, R, b, ROOT_A / 2, 4, { type: 'bell', gain: 0.10, decay: 0.5, rng });
});
T('title', 5, '箫与琴·宫调', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.04);
  const mel = melody(rng, 22, false, ROOT_D * 1.5);
  let t = 0.5;
  for (let i = 0; i < mel.length; i++) {
    const dur = 1.1 + rng() * 1.1;
    mixNote(L, R, t, mel[i], dur + 0.9, { type: 'flute', gain: 0.20, pan: -0.25, rng });
    if (i % 3 === 0) mixNote(L, R, t, mel[i] / 2, dur + 1.6, { type: 'pluck', gain: 0.16, decay: 1.3, pan: 0.3, rng });
    t += dur;
    if (t > D - 3) break;
  }
});
T('title', 6, '琴与磬·夜空', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.06);
  for (let b = 1; b < D - 5; b += 7 + rng() * 5) mixNote(L, R, b, ROOT_E * 2, 3.5, { type: 'bell', gain: 0.12, decay: 0.7, pan: (rng() - 0.5) * 0.6, rng });
  const mel = melody(rng, 16, true, ROOT_E * 2);
  let t = 2.2;
  for (const f of mel) {
    const dur = 1.8 + rng() * 1.4;
    mixNote(L, R, t, f, dur * 2, { type: 'pluck', gain: 0.24, decay: 1.0, pan: (rng() - 0.5) * 0.4, rng });
    t += dur + (rng() < 0.3 ? 1.0 : 0);
    if (t > D - 4) break;
  }
});

/* —— town：笛/筝，人间烟火 —— */
T('town', 4, '笛与筝·市井晨光', (L, R, rng, D) => {
  const mel = melody(rng, 34, false, ROOT_C * 2);
  let t = 0.4;
  for (let i = 0; i < mel.length; i++) {
    const dur = 0.55 + rng() * 0.5;
    mixNote(L, R, t, mel[i], dur + 0.5, { type: 'flute', gain: 0.17, pan: -0.2, rng });
    if (i % 2 === 0) mixNote(L, R, t, mel[(i + 2) % mel.length] / 2, 1.4, { type: 'pluck', gain: 0.12, decay: 2.6, pan: 0.35, rng });
    t += dur;
    if (t > D - 2.5) break;
  }
});
T('town', 5, '扬琴轻拨·晴日', (L, R, rng, D) => {
  const mel = melody(rng, 42, false, ROOT_G * 2);
  let t = 0.3;
  for (let i = 0; i < mel.length; i++) {
    const dur = 0.4 + rng() * 0.35;
    mixNote(L, R, t, mel[i], 1.5, { type: 'pluck', gain: 0.20, decay: 3.2, pan: (rng() - 0.5) * 0.7, rng });
    t += dur;
    if (t > D - 2) break;
  }
  mixNote(L, R, 0, ROOT_G, D - 2, { type: 'pad', gain: 0.06, atk: 2.5, rng });
});
T('town', 6, '箫声细雨·黄昏', (L, R, rng, D) => {
  addRain(L, R, D, rng, 0.05);
  const mel = melody(rng, 16, true, ROOT_A * 1.5);
  let t = 1.0;
  for (const f of mel) {
    const dur = 1.4 + rng() * 1.0;
    mixNote(L, R, t, f, dur + 0.8, { type: 'flute', gain: 0.19, sus: 0.8, pan: 0.2, rng });
    t += dur;
    if (rng() < 0.25) t += 0.9;
    if (t > D - 3) break;
  }
});

/* —— capital：编钟/庄重 —— */
T('capital', 4, '编钟雅乐·朝仪', (L, R, rng, D) => {
  const root = ROOT_C;
  const seq = [0, 2, 4, 2, 0, 3, 1, 0];
  let t = 0.5;
  let k = 0;
  while (t < D - 5) {
    const deg = seq[k % seq.length]; k++;
    const f = scaleFreq(root * 2, deg, 0, false);
    mixNote(L, R, t, f, 3.2, { type: 'bell', gain: 0.24, decay: 0.7, pan: (k % 2 ? 0.3 : -0.3), rng });
    if (k % 4 === 1) mixNote(L, R, t, f / 2, 4.5, { type: 'pad', gain: 0.09, atk: 1.0, rng });
    t += 1.6 + rng() * 0.6;
  }
});
T('capital', 5, '钟鼓朝晖·大气', (L, R, rng, D) => {
  const root = ROOT_D;
  for (let b = 0.4; b < D - 4; b += 4) {
    mixNote(L, R, b, root, 2.4, { type: 'drum', gain: 0.16, decay: 5, rng });
    if (rng() < 0.5) mixNote(L, R, b + 2, scaleFreq(root * 2, [0, 2, 4][Math.floor(rng() * 3)], 0, false), 3, { type: 'bell', gain: 0.15, decay: 0.8, rng });
  }
  const mel = melody(rng, 12, false, root * 2);
  let t = 2.0;
  for (const f of mel) { mixNote(L, R, t, f, 3.5, { type: 'flute', gain: 0.13, pan: 0.25, rng }); t += 2.6; if (t > D - 4) break; }
});
T('capital', 6, '庙堂弦歌·沉稳', (L, R, rng, D) => {
  const root = ROOT_C;
  const chords = [[0, 2, 4], [3, 0, 2], [4, 1, 3], [0, 2, 4]];
  let t = 0.3, ci = 0;
  while (t < D - 4) {
    const ch = chords[ci % chords.length]; ci++;
    for (let j = 0; j < ch.length; j++) {
      mixNote(L, R, t, scaleFreq(root, ch[j], 0, false), 4.4, { type: 'pluck', gain: 0.13, decay: 0.9, pan: (j - 1) * 0.4, rng });
      mixNote(L, R, t, scaleFreq(root * 2, ch[j], 0, false), 4.2, { type: 'pluck', gain: 0.09, decay: 1.4, pan: (1 - j) * 0.3, rng });
    }
    t += 3.4;
  }
});

/* —— sect：清修禅意 —— */
T('sect', 4, '晨钟古刹·清修', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.04);
  for (let b = 0.5; b < D - 5; b += 8 + rng() * 4) mixNote(L, R, b, ROOT_C / 2, 5, { type: 'bell', gain: 0.16, decay: 0.45, rng });
  const mel = melody(rng, 12, false, ROOT_C * 2);
  let t = 3.0;
  for (const f of mel) { mixNote(L, R, t, f, 4.5, { type: 'pluck', gain: 0.16, decay: 0.8, pan: (rng() - 0.5) * 0.5, rng }); t += 2.6 + rng(); if (t > D - 4) break; }
});
T('sect', 5, '磬与垫·入定', (L, R, rng, D) => {
  mixNote(L, R, 0, ROOT_A, D - 2, { type: 'pad', gain: 0.10, atk: 3.0, rng });
  mixNote(L, R, 0, ROOT_A * 1.5, D - 2, { type: 'pad', gain: 0.06, atk: 4.0, rng });
  for (let b = 2; b < D - 4; b += 6 + rng() * 3) mixNote(L, R, b, ROOT_A * 4, 3, { type: 'bell', gain: 0.10, decay: 1.0, pan: (rng() - 0.5) * 0.7, rng });
});
T('sect', 6, '山门笛声·讲经', (L, R, rng, D) => {
  const mel = melody(rng, 20, false, ROOT_G * 2);
  let t = 0.8;
  for (let i = 0; i < mel.length; i++) {
    const dur = 1.0 + rng() * 0.8;
    mixNote(L, R, t, mel[i], dur + 0.7, { type: 'flute', gain: 0.16, pan: -0.15, rng });
    if (i % 4 === 2) mixNote(L, R, t + 0.1, mel[i] / 2, 2.6, { type: 'pluck', gain: 0.10, decay: 1.2, pan: 0.3, rng });
    t += dur;
    if (t > D - 3) break;
  }
});

/* —— hidden：洞天福地·空灵 —— */
T('hidden', 4, '水榭箫影·空谷', (L, R, rng, D) => {
  addRain(L, R, D, rng, 0.035);
  addWind(L, R, D, rng, 0.05);
  const mel = melody(rng, 14, true, ROOT_A * 2);
  let t = 1.5;
  for (const f of mel) {
    const dur = 2.0 + rng() * 1.6;
    mixNote(L, R, t, f, dur + 1.2, { type: 'flute', gain: 0.17, sus: 0.7, pan: (rng() - 0.5) * 0.6, rng });
    t += dur + 0.4;
    if (t > D - 4) break;
  }
});
T('hidden', 5, '琴泛音·莲池', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.05);
  const mel = melody(rng, 18, true, ROOT_D * 2);
  let t = 1.0;
  for (const f of mel) {
    mixNote(L, R, t, f * 2, 2.8, { type: 'harm', gain: 0.14, decay: 1.0, pan: (rng() - 0.5) * 0.6, rng });
    mixNote(L, R, t + 0.05, f, 3.4, { type: 'pluck', gain: 0.10, decay: 0.9, pan: (rng() - 0.5) * 0.5, rng });
    t += 1.9 + rng() * 1.2;
    if (t > D - 3) break;
  }
});
T('hidden', 6, '古窟钟乳·幽深', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.07);
  for (let b = 0.6; b < D - 4; b += 5 + rng() * 4) {
    mixNote(L, R, b, ROOT_E, 4.5, { type: 'bell', gain: 0.14, decay: 0.5, pan: (rng() - 0.5) * 0.8, rng });
    if (rng() < 0.4) mixNote(L, R, b + 1.2, ROOT_E * 3, 3, { type: 'bell', gain: 0.08, decay: 0.9, pan: (rng() - 0.5) * 0.8, rng });
  }
});

/* —— danger：紧张不安 —— */
T('danger', 4, '低鼓暗涌·杀机', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.05);
  const root = ROOT_A / 2;
  for (let b = 0; b < D - 3; b += 1.0) {
    if (b % 4 === 0) mixNote(L, R, b, root, 1.2, { type: 'drum', gain: 0.26, decay: 6, rng });
    else if (rng() < 0.4) mixNote(L, R, b, root, 0.8, { type: 'drum', gain: 0.12, decay: 9, rng });
  }
  mixNote(L, R, 0, ROOT_A, D - 1, { type: 'pad', gain: 0.10, atk: 2.0, rng });
  let t = 3;
  while (t < D - 4) { mixNote(L, R, t, scaleFreq(ROOT_A * 2, Math.floor(rng() * 5), 0, true), 1.6, { type: 'pluck', gain: 0.10, decay: 3.5, pan: (rng() - 0.5) * 0.8, rng }); t += 1.9 + rng(); }
});
T('danger', 5, '急弦·追蹑', (L, R, rng, D) => {
  const root = ROOT_A / 2;
  let t = 0.2;
  while (t < D - 2) {
    const f = scaleFreq(ROOT_A * 2, Math.floor(rng() * 5), 0, true);
    mixNote(L, R, t, f, 0.7, { type: 'pluck', gain: 0.17, decay: 5.5, pan: (rng() - 0.5) * 0.7, rng });
    t += 0.34 + rng() * 0.2;
  }
  for (let b = 0.5; b < D - 3; b += 2.2) mixNote(L, R, b, root * 1.5, 1.4, { type: 'drum', gain: 0.16, decay: 7, rng });
});
T('danger', 6, '风啸荒野·孤旅', (L, R, rng, D) => {
  addWind(L, R, D, rng, 0.16);
  const mel = melody(rng, 10, true, ROOT_E);
  let t = 2.0;
  for (const f of mel) { mixNote(L, R, t, f * 2, 3.4, { type: 'flute', gain: 0.12, sus: 0.6, pan: -0.3, rng }); t += 3.6; if (t > D - 5) break; }
  for (let b = 4; b < D - 3; b += 3.4) mixNote(L, R, b, ROOT_E, 1.6, { type: 'drum', gain: 0.13, decay: 5, rng });
});

/* —— battle：战鼓激昂（无簧片，鼓+拨弦+低号垫） —— */
T('battle', 4, '战鼓擂·冲锋', (L, R, rng, D) => {
  const root = ROOT_D / 2;
  const pat = [0, 0.75, 1.5, 2, 3, 3.5];
  for (let bar = 0; bar * 4 < D - 4; bar++) {
    for (const p of pat) {
      const t = bar * 4 + p;
      if (t > D - 2) break;
      const strong = p === 0 || p === 2;
      mixNote(L, R, t, strong ? root : root * 1.06, strong ? 1.0 : 0.6, { type: 'drum', gain: strong ? 0.30 : 0.18, decay: strong ? 6 : 9, pan: (rng() - 0.5) * 0.5, rng });
    }
  }
  let t = 0.4;
  while (t < D - 2) {
    const f = scaleFreq(ROOT_D * 2, [0, 2, 4, 3][Math.floor(rng() * 4)], 0, false);
    mixNote(L, R, t, f, 0.5, { type: 'pluck', gain: 0.15, decay: 6.5, pan: (rng() - 0.5) * 0.7, rng });
    t += 0.45 + rng() * 0.25;
  }
});
T('battle', 5, '两军对垒·低号', (L, R, rng, D) => {
  const root = ROOT_E / 2;
  mixNote(L, R, 0, root, D - 2, { type: 'pad', gain: 0.14, atk: 1.2, rng });
  mixNote(L, R, 0, root * 1.5, D - 3, { type: 'pad', gain: 0.09, atk: 2.0, rng });
  for (let b = 0.3; b < D - 2; b += 1.9 + rng() * 0.4) mixNote(L, R, b, root, 0.9, { type: 'drum', gain: 0.24, decay: 7, pan: (rng() - 0.5) * 0.4, rng });
  let t = 1.0;
  while (t < D - 3) {
    mixNote(L, R, t, scaleFreq(ROOT_E * 2, [0, 2, 4][Math.floor(rng() * 3)], 0, false), 1.3, { type: 'pluck', gain: 0.15, decay: 5, pan: (rng() - 0.5) * 0.7, rng });
    t += 0.9 + rng() * 0.6;
  }
});
T('battle', 6, '短兵相接·急雨拨弦', (L, R, rng, D) => {
  const root = ROOT_A / 2;
  let t = 0.1;
  while (t < D - 1.5) {
    const f = scaleFreq(ROOT_A * 2, [0, 1, 3, 4, 2][Math.floor(rng() * 5)], 0, true);
    mixNote(L, R, t, f, 0.45, { type: 'pluck', gain: 0.16, decay: 7, pan: (rng() - 0.5) * 0.8, rng });
    t += 0.28 + rng() * 0.16;
  }
  for (let b = 0; b < D - 2; b += 2.0) mixNote(L, R, b, root, 1.1, { type: 'drum', gain: 0.22, decay: 6, rng });
});

// —— 主流程 ——
let only = process.argv[2] || '';
for (const tr of TRACKS) {
  if (only && tr.file.indexOf(only) === -1) continue;
  const D = 34; // 34 秒
  const n = Math.floor(D * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const rng = mulberry32(0x9E3779B9 ^ (tr.file.length * 7919));
  tr.build(L, R, rng, D);
  finalize(L, R, 1.2, 2.8, 0.82);
  writeWav(tr.file, L, R);
  console.log('OK', path.basename(tr.file), (fs.statSync(tr.file).size / 1048576).toFixed(1) + 'MB', '-', tr.desc);
}
console.log('done:', TRACKS.length, 'tracks');
