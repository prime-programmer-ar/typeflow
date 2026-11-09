// Typing sound engine — synthesized clicks via Web Audio API (no assets needed).

let ctx: AudioContext | null = null;
let lastPlay = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Short, soft mechanical click. */
export function playClick(volumePercent: number): void {
  const c = getCtx();
  if (!c) return;
  // avoid machine-gun stacking at sub-15ms intervals
  const now = performance.now();
  if (now - lastPlay < 14) return;
  lastPlay = now;

  const vol = Math.max(0, Math.min(100, volumePercent)) / 100;
  const t = c.currentTime;

  // body: quick pitched blip
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(520 + Math.random() * 120, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

  // noise transient for the "thock"
  const bufferSize = Math.floor(c.sampleRate * 0.02);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) ** 2;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.06 * vol;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;

  osc.connect(gain).connect(c.destination);
  noise.connect(hp).connect(noiseGain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.06);
  noise.start(t);
}

/** Lower, duller thud for errors. */
export function playError(volumePercent: number): void {
  const c = getCtx();
  if (!c) return;
  const vol = Math.max(0, Math.min(100, volumePercent)) / 100;
  const t = c.currentTime;

  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.12 * vol, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.11);
}
