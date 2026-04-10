// iPhone-style notification sound using Web Audio API
export const playIPhoneDing = () => {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Main tone (tri-tone style)
    const notes = [1175, 1397, 1760]; // D6, F#6, A6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.35, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  } catch {}
};
