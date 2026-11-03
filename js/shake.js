// "Agitar para saltar": detecta dos sacudidas fuertes seguidas con el acelerómetro del móvil.
const THRESHOLDS = { baja: 38, media: 28, alta: 20 };

export function createShake(onShake) {
  let prev = null;
  let peaks = [];
  let lastShake = 0;
  let threshold = THRESHOLDS.media;
  let active = false;

  function onMotion(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a || a.x == null) return;
    if (prev) {
      const delta = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
      const now = Date.now();
      if (delta > threshold && now - lastShake > 1500) {
        peaks = peaks.filter((t) => now - t < 800);
        peaks.push(now);
        if (peaks.length >= 2) {
          peaks = [];
          lastShake = now;
          onShake();
        }
      }
    }
    prev = { x: a.x, y: a.y, z: a.z };
  }

  return {
    supported: typeof window.DeviceMotionEvent !== 'undefined',
    /** En iPhone hay que pedir permiso; llámalo desde un toque del usuario. */
    needsPermission: typeof window.DeviceMotionEvent?.requestPermission === 'function',
    get active() { return active; },
    setSensitivity(level) { threshold = THRESHOLDS[level] || THRESHOLDS.media; },
    async enable() {
      if (active) return;
      if (this.needsPermission) {
        const r = await DeviceMotionEvent.requestPermission();
        if (r !== 'granted') throw new Error('No se dio permiso para usar el movimiento del móvil');
      }
      window.addEventListener('devicemotion', onMotion);
      active = true;
    },
    disable() {
      window.removeEventListener('devicemotion', onMotion);
      active = false;
      prev = null;
    },
  };
}
