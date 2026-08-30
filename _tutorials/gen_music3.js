/*
 * 剑来 MUD · 配乐合成器 v2（温润不吓人版）
 * 原则：预创作乐句（有解决、有起收）、纯协和和声（根/五/八度）、谐和钟、稳定节奏、无风啸、无非谐金属分音。
 * 生成 7 场景 × 6 首 = 42 首，覆盖 assets/music/{scene}_01..06.wav
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'music');
const SR = 44100;

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function scaleFreq(rootHz, deg, minorMode){
  const steps = minorMode ? [0,3,5,7,10] : [0,2,4,7,9];
  const d = ((deg % 5) + 5) % 5;
  const oct = Math.floor(deg / 5);
  return rootHz * Math.pow(2, (steps[d] + 12 * oct) / 12);
}

// 单音写缓冲：纯协和音色
function note(L, R, startS, freq, dur, o){
  o = o || {};
  const gain = o.gain != null ? o.gain : 0.3, pan = o.pan || 0, type = o.type || 'pluck';
  const rng = o.rng || Math.random;
  const s0 = Math.floor(startS * SR), n = Math.floor(dur * SR);
  const gl = gain * (1 - Math.max(0, pan)), gr = gain * (1 + Math.min(0, pan));
  for (let i = 0; i < n; i++) {
    const idx = s0 + i; if (idx >= L.length) break;
    const t = i / SR; let v = 0;
    if (type === 'pluck') {            // 古琴/扬琴：和泛音簇，柔衰减
      const env = Math.exp(-t * (o.decay || 2.4));
      v = Math.sin(2*Math.PI*freq*t) + 0.35*Math.sin(2*Math.PI*freq*2*t) + 0.12*Math.sin(2*Math.PI*freq*3*t);
      v *= env * (0.85 + 0.15 * Math.exp(-t * 40));
    } else if (type === 'flute') {     // 箫：软起收 + 轻颤
      const atk = Math.min(1, t / 0.10), rel = Math.min(1, Math.max(0, dur - t) / 0.22);
      const vib = 1 + 0.0035 * Math.sin(2*Math.PI*4.6*t);
      v = (Math.sin(2*Math.PI*freq*vib*t) + 0.18*Math.sin(2*Math.PI*freq*2*t)) * atk * rel * 0.85;
    } else if (type === 'bell') {      // 磬：谐和分音(1,2,3,4)，短促温润
      const env = Math.exp(-t * (o.decay || 1.5));
      v = (Math.sin(2*Math.PI*freq*t) + 0.4*Math.sin(2*Math.PI*freq*2*t) + 0.15*Math.sin(2*Math.PI*freq*3*t) + 0.05*Math.sin(2*Math.PI*freq*4.02*t)) * env * 0.6;
    } else if (type === 'drum') {      // 鼓：音高下滑，干净
      const f = freq * (1 + 1.1 * Math.exp(-t * 30));
      v = Math.sin(2*Math.PI*f*t) * Math.exp(-t * (o.decay || 8)) * 1.05 + (rng()*2-1) * Math.exp(-t*70) * 0.28;
    } else if (type === 'pad') {       // 铺底：单音+纯八度，无 detune 拍频
      const atk = Math.min(1, t / (o.atk || 1.5)), rel = Math.min(1, Math.max(0, dur - t) / 1.2);
      v = (Math.sin(2*Math.PI*freq*t) + 0.4*Math.sin(2*Math.PI*freq*2*t) + 0.25*Math.sin(2*Math.PI*freq*1.5*t)) * atk * rel * 0.28;
    }
    L[idx] += v * gl; R[idx] += v * gr;
  }
}
function addRain(L, R, dur, rng, level){ // 仅隐地细雨，极轻
  let lp = 0; const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const x = rng() * 2 - 1; lp += 0.1 * (x - lp);
    const v = (x - lp) * level * (0.75 + 0.25 * Math.sin(2*Math.PI*0.045*i/SR));
    L[i] += v; R[i] += v * 0.92;
  }
}
function finalize(L, R, peak){
  const n = L.length; let mx = 1e-9;
  for (let i = 0; i < n; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (a > mx) mx = a; if (b > mx) mx = b; }
  const k = (peak || 0.8) / mx, fi = Math.floor(1.0 * SR), fo = Math.floor(2.5 * SR);
  for (let i = 0; i < n; i++) {
    let g = k;
    if (i < fi) g *= i / fi;
    if (i > n - fo) g *= Math.max(0, (n - i) / fo);
    L[i] *= g; R[i] *= g;
  }
}
function writeWav(file, L, R){
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n*4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR*4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n*4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i]*32767))), 44 + i*4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i]*32767))), 46 + i*4);
  }
  fs.writeFileSync(file, buf);
}

// —— 预创作乐句（度数：0=宫 1=商 2=角 3=徵 4=羽，可跨八度；-1 表休止） ——
// 每句收在 0（宫）或 3/4（徵/羽）→ 有解决感
const PHRASES_MAJ = [
  [[0,1],[1,1],[2,1],[4,1],[3,1],[2,1],[1,1],[0,2]],            // 起承转合·落宫
  [[4,1],[3,1],[2,1],[3,1],[2,1],[1,1],[0,2],[-1,1]],           // 回身·落宫
  [[0,0.5],[0,0.5],[2,1],[3,1],[4,1.5],[3,0.5],[2,1],[0,2]],    // 齐奏·落宫
  [[2,1],[3,1],[4,1.5],[4,0.5],[3,1],[2,1],[1,1],[0,2]],        // 远山·落宫
  [[4,0.5],[3,0.5],[4,1],[2,1],[1,1.5],[2,0.5],[1,1],[0,2]]     // 归鞘·落宫
];
const PHRASES_MIN = [
  [[0,1],[2,1],[3,1],[4,1],[3,1],[2,1],[0,1.5],[-1,0.5]],       // 羽调·落宫(低)
  [[4,1],[3,1],[4,1],[2,1],[1,1],[0,2],[-1,1]],
  [[0,0.5],[0,0.5],[3,1],[4,1],[2,1.5],[1,0.5],[0,2]],
  [[2,1],[4,1],[3,1],[2,1],[1,1],[3,1],[0,2]]
];

// —— 编曲器 ——
function arrange(opts){
  // opts: {scene,durSec,bpm,minor,lead,root,melodyGain,accGain,padGain,bellEvery,drumPat,rainLevel,leadOct}
  const D = opts.durSec, n = Math.floor(D * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const rng = mulberry32(opts.seed);
  const beat = 60 / opts.bpm;
  const minor = !!opts.minor;
  const phrases = minor ? PHRASES_MIN : PHRASES_MAJ;
  // 旋律：乐句循环，句间气口
  let t = 0.4, pi = Math.floor(rng() * phrases.length), bar = 0;
  const leadOct = opts.leadOct || 2;
  while (t < D - 4) {
    const ph = phrases[(pi + (bar % 2 === 1 ? Math.floor(rng()*2) : 0)) % phrases.length];
    let pt = t;
    for (const [deg, beats] of ph) {
      const dur = beats * beat;
      if (deg >= 0) {
        note(L, R, pt, scaleFreq(opts.root, deg + 5 * (leadOct - 1), minor), dur * 1.05,
          { type: opts.lead, gain: opts.melodyGain, pan: -0.12, rng, decay: opts.lead === 'pluck' ? 2.6 : undefined, atk: opts.lead === 'pad' ? 0.8 : undefined });
      }
      pt += dur;
    }
    t = pt + (opts.breath != null ? opts.breath : 0.3) * beat;
    // 句尾磬（谐和、轻）
    if (opts.bellEvery && (bar + 1) % opts.bellEvery === 0) {
      note(L, R, t - beat * 0.5, scaleFreq(opts.root, 0, minor) * 2, 2.6, { type: 'bell', gain: 0.075, rng });
    }
    bar++;
  }
  // 伴奏：低音根/五交替（八分音符的稳定脉动）
  if (opts.accGain) {
    const step = (opts.accDiv || 1) * beat;
    let k = 0;
    for (let tt = 0.4; tt < D - 2; tt += step) {
      const deg = (k % 4 === 0) ? 0 : ((k % 4 === 2) ? 3 : (k % 2 === 0 ? 0 : 4));
      note(L, R, tt, scaleFreq(opts.root, deg, minor), step * 0.95, { type: 'pluck', gain: opts.accGain, decay: 3.0, pan: 0.28, rng });
      k++;
    }
  }
  // 铺底：根+五（纯协和）
  if (opts.padGain) {
    note(L, R, 0, scaleFreq(opts.root, 0, minor), D - 1, { type: 'pad', gain: opts.padGain, atk: 2.2, rng });
    note(L, R, 0, scaleFreq(opts.root, 3, minor), D - 1, { type: 'pad', gain: opts.padGain * 0.6, atk: 2.8, rng });
  }
  // 鼓（战/险）：稳定节拍网格
  if (opts.drumPat) {
    const step = beat / 2; // 八分网格
    let k = 0;
    for (let tt = 0; tt < D - 2; tt += step) {
      const v = opts.drumPat[k % opts.drumPat.length];
      if (v > 0) note(L, R, tt, v >= 1 ? opts.root / 2 : opts.root / 2.14, v >= 1 ? 0.8 : 0.45, { type: 'drum', gain: (opts.drumGain != null ? opts.drumGain : 0.2) * (v >= 1 ? 1 : 0.55), decay: v >= 1 ? 7 : 10, pan: (rng() - 0.5) * 0.3, rng });
      k++;
    }
  }
  if (opts.rainLevel) addRain(L, R, D, rng, opts.rainLevel);
  finalize(L, R, 0.8);
  return { L, R };
}

// —— 42 首曲目配置 ——
const ROOT = { C:261.63, D:293.66, E:164.81, G:196.0, A:220.0 };
const GEN = [];
function T(scene, idx, cfg){ GEN.push({ file: path.join(OUT, scene + '_0' + idx + '.wav'), cfg }); }

// title（6）：古琴/箫交替，慢板，温暖
T('title',1,{seed:11,bpm:50,root:ROOT.C,lead:'pluck',leadOct:2,melodyGain:0.30,accGain:0.07,padGain:0.07,bellEvery:2,breath:0.6});
T('title',2,{seed:12,bpm:54,root:ROOT.D,lead:'flute',leadOct:2,melodyGain:0.20,accGain:0.06,padGain:0.08,bellEvery:3,breath:0.5});
T('title',3,{seed:13,bpm:48,root:ROOT.A,minor:false,lead:'pluck',leadOct:2,melodyGain:0.27,accGain:0.06,padGain:0.08,bellEvery:2,breath:0.8});
T('title',4,{seed:14,bpm:52,root:ROOT.G,lead:'flute',leadOct:2,melodyGain:0.19,accGain:0.07,padGain:0.07,bellEvery:4,breath:0.6});
T('title',5,{seed:15,bpm:50,root:ROOT.C,lead:'pluck',leadOct:2,melodyGain:0.29,accGain:0.05,padGain:0.09,bellEvery:3,breath:0.7});
T('title',6,{seed:16,bpm:56,root:ROOT.F||174.61,lead:'flute',leadOct:2,melodyGain:0.20,accGain:0.06,padGain:0.08,bellEvery:2,breath:0.5});
// town（6）：明快
T('town',1,{seed:21,bpm:74,root:ROOT.C,lead:'flute',leadOct:2,melodyGain:0.19,accGain:0.09,accDiv:0.5,padGain:0.06,breath:0.25});
T('town',2,{seed:22,bpm:80,root:ROOT.G,lead:'pluck',leadOct:2,melodyGain:0.24,accGain:0.10,accDiv:0.5,padGain:0.05,breath:0.2});
T('town',3,{seed:23,bpm:70,root:ROOT.D,lead:'flute',leadOct:2,melodyGain:0.18,accGain:0.09,accDiv:0.5,padGain:0.06,breath:0.3});
T('town',4,{seed:24,bpm:76,root:ROOT.C,lead:'pluck',leadOct:2,melodyGain:0.25,accGain:0.09,accDiv:0.5,padGain:0.05,bellEvery:4,breath:0.25});
T('town',5,{seed:25,bpm:72,root:ROOT.A,minor:false,lead:'flute',leadOct:2,melodyGain:0.18,accGain:0.09,accDiv:0.5,padGain:0.06,breath:0.3});
T('town',6,{seed:26,bpm:68,root:ROOT.G,lead:'flute',leadOct:2,melodyGain:0.19,accGain:0.08,accDiv:1,padGain:0.07,breath:0.4});
// capital（6）：编钟庄重
T('capital',1,{seed:31,bpm:56,root:ROOT.C,lead:'bell',leadOct:2,melodyGain:0.17,accGain:0.05,padGain:0.09,bellEvery:0,breath:0.6});
T('capital',2,{seed:32,bpm:52,root:ROOT.D,lead:'pluck',leadOct:1,melodyGain:0.20,accGain:0.07,padGain:0.09,bellEvery:2,breath:0.7});
T('capital',3,{seed:33,bpm:58,root:ROOT.G,lead:'bell',leadOct:2,melodyGain:0.16,accGain:0.06,padGain:0.08,bellEvery:0,breath:0.6});
T('capital',4,{seed:34,bpm:54,root:ROOT.C,lead:'flute',leadOct:2,melodyGain:0.17,accGain:0.07,padGain:0.09,bellEvery:2,breath:0.7});
T('capital',5,{seed:35,bpm:50,root:ROOT.A,minor:false,lead:'pluck',leadOct:1,melodyGain:0.19,accGain:0.06,padGain:0.09,bellEvery:3,breath:0.8});
T('capital',6,{seed:36,bpm:56,root:ROOT.D,lead:'bell',leadOct:2,melodyGain:0.17,accGain:0.05,padGain:0.08,bellEvery:0,breath:0.6});
// sect（6）：清修
T('sect',1,{seed:41,bpm:48,root:ROOT.C,lead:'pluck',leadOct:2,melodyGain:0.24,accGain:0.05,padGain:0.09,bellEvery:2,breath:1.0});
T('sect',2,{seed:42,bpm:44,root:ROOT.A,minor:false,lead:'bell',leadOct:2,melodyGain:0.13,accGain:0.04,padGain:0.10,bellEvery:0,breath:1.2});
T('sect',3,{seed:43,bpm:50,root:ROOT.G,lead:'flute',leadOct:2,melodyGain:0.17,accGain:0.05,padGain:0.09,bellEvery:3,breath:0.9});
T('sect',4,{seed:44,bpm:46,root:ROOT.D,lead:'pluck',leadOct:2,melodyGain:0.23,accGain:0.05,padGain:0.09,bellEvery:2,breath:1.0});
T('sect',5,{seed:45,bpm:48,root:ROOT.C,lead:'bell',leadOct:2,melodyGain:0.13,accGain:0.05,padGain:0.10,bellEvery:0,breath:1.1});
T('sect',6,{seed:46,bpm:52,root:ROOT.G,lead:'pluck',leadOct:2,melodyGain:0.24,accGain:0.06,padGain:0.08,bellEvery:3,breath:0.8});
// hidden（6）：空灵（隐 1/5 带极轻雨）
T('hidden',1,{seed:51,bpm:54,root:ROOT.A,minor:false,lead:'flute',leadOct:2,melodyGain:0.17,accGain:0.04,padGain:0.09,bellEvery:3,breath:0.9});
T('hidden',2,{seed:52,bpm:50,root:ROOT.D,lead:'pluck',leadOct:2,melodyGain:0.22,accGain:0.04,padGain:0.09,bellEvery:2,breath:1.0});
T('hidden',3,{seed:53,bpm:56,root:ROOT.G,lead:'flute',leadOct:2,melodyGain:0.17,accGain:0.05,padGain:0.08,bellEvery:3,breath:0.8});
T('hidden',4,{seed:54,bpm:52,root:ROOT.C,lead:'pluck',leadOct:2,melodyGain:0.22,accGain:0.04,padGain:0.09,bellEvery:2,breath:1.0});
T('hidden',5,{seed:55,bpm:48,root:ROOT.A,minor:false,lead:'bell',leadOct:2,melodyGain:0.11,accGain:0.04,padGain:0.10,bellEvery:0,breath:1.3});
T('hidden',6,{seed:56,bpm:54,root:ROOT.D,lead:'flute',leadOct:2,melodyGain:0.18,accGain:0.04,padGain:0.09,bellEvery:2,breath:0.9});
// danger（6）：紧张但守拍
T('danger',1,{seed:61,bpm:92,root:ROOT.A,minor:false,lead:'pluck',leadOct:2,melodyGain:0.20,accGain:0.06,accDiv:0.5,padGain:0.07,drumPat:[1,0,0,0.5,0,0,0.6,0],drumGain:0,breath:0.2});
T('danger',2,{seed:62,bpm:96,root:ROOT.E,minor:false,lead:'pluck',leadOct:2,melodyGain:0.19,accGain:0.06,accDiv:0.5,padGain:0.07,drumPat:[1,0,0.5,0,1,0,0.6,0.6],drumGain:0,breath:0.15});
T('danger',3,{seed:63,bpm:88,root:ROOT.A,minor:false,lead:'flute',leadOct:1,melodyGain:0.14,accGain:0.06,accDiv:0.5,padGain:0.08,drumPat:[1,0,0,0,0.6,0,0.5,0],drumGain:0,breath:0.3});
T('danger',4,{seed:64,bpm:94,root:ROOT.D,minor:false,lead:'pluck',leadOct:2,melodyGain:0.20,accGain:0.05,accDiv:1,padGain:0.07,drumPat:[1,0,0.6,0,0,0.5,0,0],drumGain:0,breath:0.25});
T('danger',5,{seed:65,bpm:90,root:ROOT.E,minor:false,lead:'pluck',leadOct:2,melodyGain:0.18,accGain:0.06,accDiv:0.5,padGain:0.07,drumPat:[1,0,0,0.6,1,0,0.5,0],drumGain:0,breath:0.2});
T('danger',6,{seed:66,bpm:84,root:ROOT.A,minor:false,lead:'flute',leadOct:1,melodyGain:0.13,accGain:0.05,accDiv:1,padGain:0.08,drumPat:[1,0,0,0,1,0,0,0],drumGain:0,breath:0.4});
// battle（6）：激昂战鼓
T('battle',1,{seed:71,bpm:112,root:ROOT.D,minor:false,lead:'pluck',leadOct:2,melodyGain:0.22,accGain:0.07,accDiv:0.5,padGain:0.06,drumPat:[1,0,0.6,0.5,1,0,0.6,0],drumGain:0.16,breath:0.1});
T('battle',2,{seed:72,bpm:120,root:ROOT.A,minor:false,lead:'pluck',leadOct:2,melodyGain:0.21,accGain:0.08,accDiv:0.5,padGain:0.05,drumPat:[1,0.5,0,0.6,1,0,0.6,0.6],drumGain:0.16,breath:0.08});
T('battle',3,{seed:73,bpm:116,root:ROOT.D,minor:false,lead:'pluck',leadOct:2,melodyGain:0.22,accGain:0.07,accDiv:0.5,padGain:0.06,drumPat:[1,0,0,0.5,0,0.6,1,0],drumGain:0.16,breath:0.1});
T('battle',4,{seed:74,bpm:108,root:ROOT.E,minor:false,lead:'pluck',leadOct:2,melodyGain:0.21,accGain:0.07,accDiv:0.5,padGain:0.06,drumPat:[1,0,0.6,0,1,0.5,0,0],drumGain:0.16,breath:0.12});
T('battle',5,{seed:75,bpm:124,root:ROOT.A,minor:false,lead:'pluck',leadOct:2,melodyGain:0.20,accGain:0.08,accDiv:0.5,padGain:0.05,drumPat:[1,0.5,0.6,0.5,1,0,0.6,0.5],drumGain:0.16,breath:0.08});
T('battle',6,{seed:76,bpm:112,root:ROOT.D,minor:false,lead:'flute',leadOct:1,melodyGain:0.15,accGain:0.07,accDiv:0.5,padGain:0.06,drumPat:[1,0,0.6,0,1,0,0.6,0.5],drumGain:0.16,breath:0.15});

const only = process.argv[2] || '';
for (const g of GEN) {
  if (only && g.file.indexOf(only) === -1) continue;
  const D = 30;
  const { L, R } = arrange(Object.assign({ durSec: D }, g.cfg));
  writeWav(g.file, L, R);
  console.log('OK', path.basename(g.file), (fs.statSync(g.file).size / 1048576).toFixed(1) + 'MB');
}
console.log('done');
