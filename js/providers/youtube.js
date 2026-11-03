// YouTube Data API v3 (búsqueda) + reproductor IFrame (reproducción completa).
// YouTube Music no tiene API pública oficial; se usa la categoría "Música" de YouTube.
import { store } from '../storage.js';

const API = 'https://www.googleapis.com/youtube/v3';

function decode(html) {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

function isoToSeconds(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}

function region() {
  const r = (navigator.language || '').split('-')[1];
  return r && r.length === 2 ? r.toUpperCase() : 'US';
}

async function get(path, params) {
  const key = store.get('ytKey', '');
  if (!key) throw new Error('Añade tu API key de YouTube en Ajustes');
  const url = new URL(API + path);
  for (const [k, v] of Object.entries({ ...params, key })) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message || 'Error de YouTube (' + res.status + ')');
  return json;
}

function map(v) {
  let title = decode(v.snippet.title);
  let artist = decode(v.snippet.channelTitle).replace(/ - Topic$/, '');
  // "Artista - Canción (Official Video)" → separar artista y título
  const parts = title.split(' - ');
  if (parts.length >= 2 && !v.snippet.channelTitle.endsWith(' - Topic')) {
    artist = parts.shift().trim();
    title = parts.join(' - ').trim();
  }
  const th = v.snippet.thumbnails || {};
  return {
    id: 'yt:' + v.id,
    provider: 'youtube',
    videoId: v.id,
    title,
    artist,
    album: '',
    cover: (th.medium || th.high || th.default || {}).url || '',
    duration: isoToSeconds(v.contentDetails?.duration),
  };
}

export const youtube = {
  id: 'youtube',
  name: 'YouTube',
  note: 'canción completa',
  isReady: () => !!store.get('ytKey', ''),
  setupHint: 'Para usar YouTube añade una API key de YouTube Data API v3 en ⚙ Ajustes.',

  async top() {
    const d = await get('/videos', {
      part: 'snippet,contentDetails',
      chart: 'mostPopular',
      videoCategoryId: '10',
      regionCode: region(),
      maxResults: '50',
    });
    return (d.items || []).map(map);
  },

  async search(q) {
    const s = await get('/search', {
      part: 'id',
      type: 'video',
      videoCategoryId: '10',
      videoEmbeddable: 'true',
      maxResults: '25',
      q,
    });
    const ids = (s.items || []).map((i) => i.id.videoId).filter(Boolean);
    if (!ids.length) return [];
    const d = await get('/videos', { part: 'snippet,contentDetails', id: ids.join(',') });
    return (d.items || []).map(map);
  },
};
