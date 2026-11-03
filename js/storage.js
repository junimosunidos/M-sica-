const PREFIX = 'musica:';

export const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
  },
  del(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* sin almacenamiento */ }
  },
};
