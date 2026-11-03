// Tu biblioteca de YouTube Music (listas y "me gusta") + aleatorio de todo + mix por géneros.
import { ytGet, videosByIds, mapVideo, region } from './providers/youtube.js';

export const LIKED = 'LIKED';
export const ALL = 'ALL';

const trackCache = new Map();
let playlistCache = null;

export function clearLibraryCache() {
  trackCache.clear();
  playlistCache = null;
}

export function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const dedupe = (tracks) => {
  const seen = new Set();
  return tracks.filter((t) => !seen.has(t.videoId) && seen.add(t.videoId));
};

/* ---------- lectura de la biblioteca ---------- */
export async function myPlaylists() {
  if (playlistCache) return playlistCache;
  const out = [];
  let pageToken;
  do {
    const d = await ytGet('/playlists', { part: 'snippet,contentDetails', mine: 'true', maxResults: '50', pageToken });
    for (const p of d.items || []) {
      const th = p.snippet.thumbnails || {};
      out.push({
        id: p.id,
        title: p.snippet.title,
        count: p.contentDetails?.itemCount ?? 0,
        cover: (th.medium || th.high || th.default || {}).url || '',
      });
    }
    pageToken = d.nextPageToken;
  } while (pageToken);
  playlistCache = out;
  return out;
}

async function playlistTracks(id) {
  const ids = [];
  let pageToken;
  do {
    const d = await ytGet('/playlistItems', { part: 'contentDetails', playlistId: id, maxResults: '50', pageToken });
    ids.push(...(d.items || []).map((i) => i.contentDetails?.videoId).filter(Boolean));
    pageToken = d.nextPageToken;
  } while (pageToken && ids.length < 2000);
  return videosByIds(ids); // descarta vídeos borrados, privados o no reproducibles fuera de YouTube
}

async function likedTracks() {
  const out = [];
  let pageToken;
  let pages = 0;
  do {
    const d = await ytGet('/videos', {
      part: 'snippet,contentDetails,topicDetails,status',
      myRating: 'like',
      maxResults: '50',
      pageToken,
    });
    for (const v of d.items || []) {
      if (v.status?.embeddable === false) continue;
      out.push(v);
    }
    pageToken = d.nextPageToken;
  } while (pageToken && ++pages < 40);
  // Los "me gusta" son compartidos con YouTube: se quedan solo los que son música.
  return out.map(mapVideo).filter((t) => t.music);
}

/** Canciones de una lista, de "me gusta" (LIKED) o de todo junto (ALL). */
export async function getTracks(id, onProgress = () => {}) {
  if (trackCache.has(id)) return trackCache.get(id);
  let tracks;
  if (id === LIKED) {
    tracks = await likedTracks();
  } else if (id === ALL) {
    const lists = await myPlaylists();
    onProgress('Cargando tus «me gusta»…');
    const all = [...(await getTracks(LIKED))];
    for (let i = 0; i < lists.length; i++) {
      onProgress(`Cargando listas ${i + 1}/${lists.length}…`);
      all.push(...(await getTracks(lists[i].id)));
    }
    tracks = dedupe(all);
  } else {
    tracks = await playlistTracks(id);
  }
  trackCache.set(id, tracks);
  return tracks;
}

/* ---------- mix: tu lista + canciones nuevas de los mismos géneros ---------- */

// Temas musicales oficiales de YouTube (sirven para filtrar la búsqueda por género).
const TOPIC_IDS = {
  'Pop music': '/m/064t9',
  'Rock music': '/m/06by7',
  'Hip hop music': '/m/0glt670',
  'Electronic music': '/m/02lkt',
  'Music of Latin America': '/m/0g293',
  'Rhythm and blues': '/m/06j6l',
  'Reggae': '/m/06cqb',
  'Jazz': '/m/03_d0',
  'Country music': '/m/01lyv',
  'Classical music': '/m/0ggq0m',
  'Soul music': '/m/0gywn',
  'Independent music': '/m/05rwpb',
  'Christian music': '/m/02mscn',
  'Music of Asia': '/m/028sqc',
};

const GENRES_ES = {
  'Pop music': 'Pop', 'Rock music': 'Rock', 'Hip hop music': 'Hip hop', 'Electronic music': 'Electrónica',
  'Music of Latin America': 'Música latina', 'Rhythm and blues': 'R&B', 'Reggae': 'Reggae', 'Jazz': 'Jazz',
  'Country music': 'Country', 'Classical music': 'Clásica', 'Soul music': 'Soul', 'Independent music': 'Indie',
  'Christian music': 'Cristiana', 'Music of Asia': 'Música asiática', 'Reggaeton': 'Reguetón',
  'Heavy metal': 'Heavy metal', 'Electronic dance music': 'Electrónica de baile', 'Flamenco': 'Flamenco',
};
export const genreEs = (g) => GENRES_ES[g] || g;

const JUNK = /\b(mix|playlist|compilation|full album|[aá]lbum completo|1 hour|1 hora|non ?stop|megamix|enganchado|top \d+|lyrics? compilation)\b/i;
const norm = (s) => s.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

function topCounts(values, n) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v);
}

/** Géneros y artistas principales de una lista (para mostrarlos y para el mix). */
export function describe(tracks) {
  return {
    genres: topCounts(tracks.flatMap((t) => t.genres || []), 3),
    artists: topCounts(tracks.map((t) => t.artist).filter(Boolean), 5),
  };
}

async function findNew(own, onProgress) {
  const { genres, artists } = describe(own);
  const queries = [];
  genres.forEach((g, i) => {
    queries.push({ q: g, topicId: TOPIC_IDS[g] });
    if (i === 0 && artists[0]) queries.push({ q: `${g} ${artists[Math.floor(Math.random() * Math.min(3, artists.length))]}`, topicId: TOPIC_IDS[g] });
  });
  if (!queries.length) artists.slice(0, 3).forEach((a) => queries.push({ q: a })); // lista sin géneros detectados

  const ownIds = new Set(own.map((t) => t.videoId));
  const ownKeys = new Set(own.map((t) => norm(t.title)));
  const ids = new Set();
  for (let i = 0; i < queries.length; i++) {
    onProgress(`Buscando canciones nuevas (${i + 1}/${queries.length})…`);
    const { q, topicId } = queries[i];
    const d = await ytGet('/search', {
      part: 'id', type: 'video', videoCategoryId: '10', videoEmbeddable: 'true',
      maxResults: '25', regionCode: region(), q, topicId,
    });
    (d.items || []).forEach((it) => it.id.videoId && !ownIds.has(it.id.videoId) && ids.add(it.id.videoId));
  }

  const perArtist = new Map();
  const seenTitles = new Set();
  return shuffled(await videosByIds([...ids])).filter((t) => {
    const key = norm(t.title);
    if (ownKeys.has(key) || seenTitles.has(key)) return false;
    if (t.duration < 90 || t.duration > 600 || JUNK.test(t.title)) return false;
    const n = perArtist.get(t.artist) || 0;
    if (n >= 2) return false; // variedad: máximo 2 por artista
    perArtist.set(t.artist, n + 1);
    seenTitles.add(key);
    return true;
  });
}

/**
 * Mezcla tus canciones (en orden aleatorio) con canciones nuevas de sus géneros:
 * cada `every` canciones tuyas suena una nueva.
 */
export async function buildMix(own, { every = 2, onProgress = () => {} } = {}) {
  if (!own.length) throw new Error('Esta lista no tiene canciones reproducibles');
  const fresh = await findNew(own, onProgress);
  const mine = shuffled(own);
  const out = [];
  let k = 0;
  mine.forEach((t, i) => {
    out.push(t);
    if ((i + 1) % every === 0 && k < fresh.length) out.push({ ...fresh[k++], isNew: true });
  });
  return out;
}
