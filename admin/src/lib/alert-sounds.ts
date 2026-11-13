/** Soft Web Audio chimes — no asset files required. */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gain = 0.045
) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(
    0.0001,
    ac.currentTime + start + duration
  );
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

/** New order — bright two-note ping */
export function playOrderSound() {
  tone(880, 0, 0.14, "triangle", 0.05);
  tone(1174.66, 0.12, 0.18, "triangle", 0.04);
}

/** New query / customer message — lower soft chime */
export function playQuerySound() {
  tone(523.25, 0, 0.16, "sine", 0.05);
  tone(659.25, 0.14, 0.2, "sine", 0.045);
  tone(783.99, 0.3, 0.22, "sine", 0.035);
}
