let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let musicBus: GainNode | null = null;
let noise: AudioBuffer | null = null;
let lastFoot = 0;
let musicTimer: number | null = null;
let musicStarted = false;
let musicSources: AudioScheduledSourceNode[] = [];
let ambientTimer: number | null = null;
let ambientSpirit = false;
let ambientRiver = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    musicBus = ctx.createGain();
    master.gain.value = 1.0;
    sfx.gain.value = 1.08;
    musicBus.gain.value = 0.27;
    sfx.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);

    const n = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noise = n;
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  startMusic();
  startAmbient();
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function envGain(c: AudioContext, t: number, a: number, d: number, peak = 1, destination = sfx): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(destination!);
  return g;
}

function note(freq: number, delay: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const c = ac();
  if (!c || !musicBus) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.setValueAtTime((Math.random() - 0.5) * 5, t);
  const g = envGain(c, t, 0.06, duration, volume, musicBus);
  o.connect(g);
  o.start(t);
  o.stop(t + duration + 0.12);
  musicSources.push(o);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
    musicSources = musicSources.filter((source) => source !== o);
  };
}

function scheduleMusicBar() {
  if (!musicStarted) return;
  const melody = [196, 233, 261, 311, 349, 311, 261, 233];
  melody.forEach((freq, i) => {
    note(freq, i * 0.78, 1.15, 0.16, i % 3 === 0 ? "triangle" : "sine");
    if (i === 0 || i === 4) note(freq / 2, i * 0.78, 1.4, 0.1, "sine");
  });
  musicTimer = window.setTimeout(scheduleMusicBar, melody.length * 780);
}

export function startMusic() {
  const c = ac();
  if (!c || !musicBus || musicStarted) return;
  musicStarted = true;
  const now = c.currentTime;
  const pad = c.createOscillator();
  const pad2 = c.createOscillator();
  const padFilter = c.createBiquadFilter();
  const padGain = c.createGain();
  pad.type = "sine";
  pad2.type = "triangle";
  pad.frequency.value = 98;
  pad2.frequency.value = 147;
  pad.detune.value = -5;
  pad2.detune.value = 7;
  padFilter.type = "lowpass";
  padFilter.frequency.value = 620;
  padGain.gain.value = 0.055;
  pad.connect(padFilter);
  pad2.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(musicBus);
  pad.start(now);
  pad2.start(now);
  musicSources.push(pad, pad2);

  if (noise) {
    const wind = c.createBufferSource();
    const windFilter = c.createBiquadFilter();
    const windGain = c.createGain();
    wind.buffer = noise;
    wind.loop = true;
    wind.playbackRate.value = 0.22;
    windFilter.type = "bandpass";
    windFilter.frequency.value = 520;
    windFilter.Q.value = 0.35;
    windGain.gain.value = 0.018;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(musicBus);
    wind.start(now);
    musicSources.push(wind);
  }
  scheduleMusicBar();
}

export function stopMusic() {
  if (!ctx || !musicStarted) return;
  musicStarted = false;
  if (musicTimer !== null) {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
  const sources = [...musicSources];
  musicSources = [];
  for (const source of sources) {
    try {
      source.stop(ctx.currentTime + 0.05);
    } catch {
      // Already stopped.
    }
    try {
      source.disconnect();
    } catch {
      // Already disconnected.
    }
  }
}

function noiseBurst(filterType: BiquadFilterType, frequency: number, duration: number, volume: number, rate = 1) {
  const c = ac();
  if (!c || !noise || !sfx) return;
  const src = c.createBufferSource(); const filter = c.createBiquadFilter();
  const g = envGain(c, c.currentTime, 0.04, duration, volume);
  src.buffer = noise; src.playbackRate.value = rate; filter.type = filterType; filter.frequency.value = frequency; filter.Q.value = 0.5;
  src.connect(filter); filter.connect(g); src.start(); src.stop(c.currentTime + duration + 0.05);
}

function cricket() {
  const c = ac(); if (!c || !sfx) return; const t = c.currentTime;
  for (let i = 0; i < 3; i++) { const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 3900 + Math.random() * 500; const g = envGain(c, t + i * 0.07, 0.004, 0.045, 0.035); o.connect(g); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.06); }
}

function bird() {
  const c = ac(); if (!c || !sfx) return; const t = c.currentTime; const o = c.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(900 + Math.random() * 260, t); o.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 500, t + 0.18);
  const g = envGain(c, t, 0.015, 0.24, 0.07); o.connect(g); o.start(t); o.stop(t + 0.3);
}

export function startAmbient() {
  if (ambientTimer !== null) return;
  ambientTimer = window.setInterval(() => { noiseBurst("lowpass", ambientRiver ? 520 : 760, ambientRiver ? 1.8 : 1.1, ambientRiver ? 0.06 : 0.028, ambientRiver ? 0.7 : 0.38); if (Math.random() < 0.72) cricket(); if (ambientSpirit && Math.random() < 0.3) bird(); if (ambientSpirit && Math.random() < 0.12) noiseBurst("bandpass", 180, 0.35, 0.045, 0.8); }, 1700);
}

export function setAmbientScene(spirit: boolean, river: boolean) { ambientSpirit = spirit; ambientRiver = river; }

export function footstep(strength = 1) {
  const c = ac();
  if (!c || !noise || !sfx) return;
  const t = c.currentTime;
  if (t - lastFoot < 0.22) return;
  lastFoot = t;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.7 + Math.random() * 0.35;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 180 + Math.random() * 90;
  bp.Q.value = 0.7;
  const g = envGain(c, t, 0.008, 0.11, 0.32 * strength);
  src.connect(bp);
  bp.connect(g);
  src.start(t);
  src.stop(t + 0.14);
  src.onended = () => {
    src.disconnect();
    bp.disconnect();
    g.disconnect();
  };
}

export function rustle() {
  const c = ac();
  if (!c || !noise || !sfx) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 1.4;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 900;
  const g = envGain(c, t, 0.004, 0.08, 0.2);
  src.connect(f);
  f.connect(g);
  src.start(t);
  src.stop(t + 0.1);
}

export function chime() {
  const c = ac();
  if (!c || !sfx) return;
  const t = c.currentTime;
  for (const [freq, delay, dur] of [
    [784, 0, 0.28],
    [1175, 0.05, 0.32],
    [1568, 0.1, 0.42],
  ] as const) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = envGain(c, t + delay, 0.01, dur, 0.14);
    o.connect(g);
    o.start(t + delay);
    o.stop(t + delay + dur + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
}

export function peekTone() {
  const c = ac();
  if (!c || !sfx) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(392, t);
  o.frequency.exponentialRampToValueAtTime(523, t + 0.18);
  const g = envGain(c, t, 0.02, 0.22, 0.1);
  o.connect(g);
  o.start(t);
  o.stop(t + 0.28);
}

export function scareSting() {
  const c = ac();
  if (!c || !sfx || !noise) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = envGain(c, t, 0.008, 0.72, 0.22);
  o.type = "sawtooth";
  o.frequency.setValueAtTime(92, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.62);
  o.connect(g);
  o.start(t);
  o.stop(t + 0.8);
  noiseBurst("bandpass", 940, 0.34, 0.12, 1.5);
}

export function winFanfare() {
  stopMusic();
  const c = ac();
  if (!c || !sfx) return;
  const t = c.currentTime;
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = envGain(c, t + i * 0.12, 0.02, 0.45, 0.14);
    o.connect(g);
    o.start(t + i * 0.12);
    o.stop(t + i * 0.12 + 0.5);
  });
}
