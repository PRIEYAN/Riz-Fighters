// All SFX synthesized via Web Audio so we never depend on remote files.
let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}
function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, sweepTo?: number) {
  try {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(); const g = a.createGain();
    o.type = type; o.frequency.value = freq;
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, a.currentTime + dur);
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch {}
}
export const sfx = {
  punch: () => tone(180, 0.12, "square", 0.18, 60),
  kick: () => tone(120, 0.18, "sawtooth", 0.2, 40),
  block: () => tone(300, 0.05, "square", 0.1),
  hit: () => tone(90, 0.2, "sawtooth", 0.22, 30),
  ko: () => { tone(220, 0.5, "square", 0.25, 60); setTimeout(() => tone(110, 0.6, "sawtooth", 0.25, 40), 120); },
  beep: () => tone(660, 0.1, "sine", 0.15),
  fight: () => { tone(440, 0.15, "square", 0.2); setTimeout(() => tone(880, 0.25, "square", 0.22, 440), 150); },
};