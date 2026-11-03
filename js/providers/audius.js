// Audius: plataforma de música abierta. Canciones completas, sin clave ni cuenta.
// https://docs.audius.org/
const APP = 'MusicaWeb';
const GATEWAY = 'https://api.audius.co/v1';
let base = null;

async function pickHost() {
  if (base) return base;
  try {
    const r = await fetch('https://api.audius.co');
    const j = await r.json();
    const hosts = (j.data || []).filter((h) => typeof h === 'string' && h.startsWith('https://'));
    base = hosts.length ? hosts[Math.floor(Math.random() * hosts.length)] + '/v1' : GATEWAY;
  } catch {
    base = GATEWAY;
  }
  return base;
}

async function get(path) {
  const sep = path.includes('?') ? '&' : '?';
  const attempt = async (b) => {
    const r = await fetch(`${b}${path}${sep}app_name=${APP}`);
    if (!r.ok) throw new Error('Audius respondió ' + r.status);
    return r.json();
  };
  const b = await pickHost();
  try {
    return await attempt(b);
  } catch (e) {
    if (b === GATEWAY) throw new Error('No se pudo conectar con Audius');
    base = GATEWAY; // el nodo elegido falló: usar la pasarela principal
    return attempt(GATEWAY).catch(() => { throw new Error('No se pudo conectar con Audius'); });
  }
}

function map(t) {
  const art = t.artwork || {};
  return {
    id: 'au:' + t.id,
    provider: 'audius',
    title: t.title,
    artist: t.user?.name ?? '',
    album: t.genre || '',
    cover: art['480x480'] || art['150x150'] || art['1000x1000'] || '',
    duration: t.duration || 0,
    src: `${base || GATEWAY}/tracks/${encodeURIComponent(t.id)}/stream?app_name=${APP}`,
  };
}

const playable = (t) => t && t.is_streamable !== false && !t.stream_conditions;

export const audius = {
  id: 'audius',
  name: 'Audius',
  note: 'completa · sin cuenta',
  isReady: () => true,
  setupHint: '',

  async top() {
    const d = await get('/tracks/trending?time=week');
    return (d.data || []).filter(playable).map(map);
  },

  async search(q) {
    const d = await get('/tracks/search?query=' + encodeURIComponent(q));
    return (d.data || []).filter(playable).map(map);
  },
};
