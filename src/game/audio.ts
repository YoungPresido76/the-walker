let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let noise: AudioBuffer | null = null;
let lastFoot = 0;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    master.gain.value = 0.7;
    sfx.gain.value = 0.85;
    sfx.connect(master);
    master.connect(ctx.destination);
    const n = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
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
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function envGain(c: AudioContext, t: number, a: number, d: number, peak = 1): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(sfx!);
  return g;
}

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
  const g = envGain(c, t, 0.008, 0.11, 0.22 * strength);
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
  const g = envGain(c, t, 0.004, 0.08, 0.12);
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
  ] as const) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = envGain(c, t + delay, 0.01, dur, 0.16);
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

export function winFanfare() {
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
