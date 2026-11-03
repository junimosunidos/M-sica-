// Deezer API pública (sin autenticación). Se usa JSONP porque la API no envía cabeceras CORS.
const API = 'https://api.deezer.com';

function jsonp(path) {
  return new Promise((resolve, reject) => {
    const cb = 'dz_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const timer = setTimeout(() => done(new Error('Deezer no responde')), 15000);

    function done(err, data) {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
      if (err) reject(err);
      else if (data && data.error) reject(new Error(data.error.message || 'Error de Deezer'));
      else resolve(data);
    }

    window[cb] = (data) => done(null, data);
    script.onerror = () => done(new Error('No se pudo conectar con Deezer'));
    script.src = `${API}${path}${path.includes('?') ? '&' : '?'}output=jsonp&callback=${cb}`;
    document.head.appendChild(script);
  });
}

function map(t) {
  return {
    id: 'dz:' + t.id,
    provider: 'deezer',
    deezerId: t.id,
    title: t.title,
    artist: t.artist?.name ?? '',
    album: t.album?.title ?? '',
    cover: t.album?.cover_medium || t.album?.cover || '',
    duration: t.duration || 0,
    src: t.preview,
  };
}

export const deezer = {
  id: 'deezer',
  name: 'Deezer',
  note: 'vista previa 30 s',
  isReady: () => true,
  setupHint: '',

  async top() {
    const d = await jsonp('/chart/0/tracks?limit=50');
    return (d.data || []).filter((t) => t.preview).map(map);
  },

  async search(q) {
    const d = await jsonp('/search?limit=50&q=' + encodeURIComponent(q));
    return (d.data || []).filter((t) => t.preview).map(map);
  },

  // Las URLs de vista previa caducan: se pide una nueva antes de reproducir.
  async resolve(track) {
    try {
      const t = await jsonp('/track/' + track.deezerId);
      return t.preview || track.src;
    } catch {
      return track.src;
    }
  },
};
