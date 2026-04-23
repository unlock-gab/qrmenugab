"use client";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const times = [0, 0.15, 0.3];
    times.forEach((startTime) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + startTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + startTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.12);

      oscillator.start(ctx.currentTime + startTime);
      oscillator.stop(ctx.currentTime + startTime + 0.12);
    });
  } catch {
    // ignore audio errors
  }
}

export function unlockAudioContext() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    // ignore
  }
}
