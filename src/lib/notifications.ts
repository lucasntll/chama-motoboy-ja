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

// Intense siren alarm for establishment new orders - 5 cycles with rising pitch
export const playLoudAlarm = () => {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Layer 1: Rising siren sweep (5 cycles)
    for (let rep = 0; rep < 5; rep++) {
      const offset = rep * 0.6;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now + offset);
      osc.frequency.linearRampToValueAtTime(1400, now + offset + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + offset + 0.55);
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.7, now + offset + 0.05);
      gain.gain.setValueAtTime(0.7, now + offset + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.58);
      osc.start(now + offset);
      osc.stop(now + offset + 0.6);
    }

    // Layer 2: Sharp staccato beeps on top
    const beepFreqs = [1200, 1500, 1200, 1500, 1800];
    beepFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = freq;
      const t = now + i * 0.6 + 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
      gain.gain.setValueAtTime(0.5, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.16);
    });

    // Prolonged vibration pattern: long-short-long-short-long-long
    if (navigator.vibrate) {
      navigator.vibrate([500, 150, 500, 150, 500, 200, 800, 200, 500, 150, 500, 150, 800]);
    }
  } catch {}
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

// Show browser notification
export const showBrowserNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: true,
      tag: "new-order",
    });
  } catch {}
};
