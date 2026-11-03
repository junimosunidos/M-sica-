// YouTube Data API v3 (búsqueda, listas, "me gusta") + reproductor IFrame (reproducción completa).
// YouTube Music no tiene API pública oficial, pero sus listas y "me gusta" se guardan en tu cuenta
// de YouTube, así que se leen desde aquí con el inicio de sesión de Google.
import { store } from '../storage.js';
import { googleToken, isGoogleConnected } from './google.js';

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

export function region() {
  const r = (navigator.language || '').split('-')[1];
  return r && r.length === 2 ? r.toUpperCase() : 'US';
}

/** Petición a la API: con tu sesión de Google si está conectada; si no, con la API key. */
export async function ytGet(path, params) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  const headers = {};
  const token = await googleToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  else {
    const key = store.get('ytKey', '');
    if (!key) throw new Error('Conecta tu cuenta de Google o añade una API key de YouTube en ⚙ Ajustes');
    url.searchParams.set('key', key);
  }
  const res = await fetch(url, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = json.error?.errors?.[0]?.reason;
    if (reason === 'quotaExceeded') throw new Error('Se agotó la cuota diaria gratuita de YouTube. Vuelve a intentarlo mañana.');
    throw new Error(json.error?.message || 'Error de YouTube (' + res.status + ')');
  }
  return json;
}

/** "https://en.wikipedia.org/wiki/Pop_music" → "Pop music" */
const topicName = (url) => decodeURIComponent(url.split('/').pop()).replace(/_/g, ' ');

export function mapVideo(v) {
  const sn = v.snippet;
  let title = decode(sn.title);
  const isTopic = / - Topic$/.test(sn.channelTitle);
  let artist = decode(sn.channelTitle).replace(/ - Topic$/, '').replace(/VEVO$/, '');
  // "Artista - Canción (Official Video)" → separar artista y título
  const parts = title.split(' - ');
  if (parts.length >= 2 && !isTopic) {
    artist = parts.shift().trim();
    title = parts.join(' - ').trim();
  }
  const th = sn.thumbnails || {};
  return {
    id: 'yt:' + v.id,
    provider: 'youtube',
    videoId: v.id,
    title,
    artist,
    album: '',
    cover: (th.medium || th.high || th.default || {}).url || '',
    duration: isoToSeconds(v.contentDetails?.duration),
    genres: (v.topicDetails?.topicCategories || []).map(topicName).filter((g) => g !== 'Music'),
    music: sn.categoryId === '10',
  };
}

const playableVideo = (v) => v.status?.embeddable !== false && v.status?.privacyStatus !== 'private';

/** Detalles completos (duración, géneros, si se puede reproducir) de hasta N vídeos. */
export async function videosByIds(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const d = await ytGet('/videos', {
      part: 'snippet,contentDetails,topicDetails,status',
      id: ids.slice(i, i + 50).join(','),
      maxResults: '50',
    });
    out.push(...(d.items || []).filter(playableVideo).map(mapVideo));
  }
  return out;
}

export const youtube = {
  id: 'youtube',
  name: 'YouTube',
  note: 'canción completa',
  isReady: () => isGoogleConnected() || !!store.get('ytKey', ''),
  setupHint: 'Para usar YouTube conecta tu cuenta de Google (o añade una API key) en ⚙ Ajustes.',

  async top() {
    const d = await ytGet('/videos', {
      part: 'snippet,contentDetails,topicDetails,status',
      chart: 'mostPopular',
      videoCategoryId: '10',
      regionCode: region(),
      maxResults: '50',
    });
    return (d.items || []).filter(playableVideo).map(mapVideo);
  },

  async search(q) {
    const s = await ytGet('/search', {
      part: 'id',
      type: 'video',
      videoCategoryId: '10',
      videoEmbeddable: 'true',
      maxResults: '25',
      q,
    });
    return videosByIds((s.items || []).map((i) => i.id.videoId).filter(Boolean));
  },
};
