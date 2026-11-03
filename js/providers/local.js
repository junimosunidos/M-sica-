// "Mis archivos": canciones del propio usuario guardadas en el navegador (IndexedDB).
const DB_NAME = 'musica-local';
const STORE = 'tracks';
const memory = new Map(); // respaldo si IndexedDB no está disponible (p. ej. modo privado)
const urls = new Map();
let dbPromise;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(() => null);
  return dbPromise;
}

async function run(mode, op) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = op(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('No hay espacio para guardar el archivo'));
  });
}

async function allRecords() {
  const rows = await run('readonly', (s) => s.getAll());
  return [...(rows || []), ...memory.values()];
}

function parseName(filename) {
  let name = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/^\d{1,3}\s*[-.]?\s+/, '').trim();
  const parts = name.split(' - ');
  if (parts.length >= 2) return { artist: parts.shift().trim(), title: parts.join(' - ').trim() };
  return { artist: 'Desconocido', title: name || filename };
}

function readDuration(blob) {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(blob);
    const done = (d) => { URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? Math.round(d) : 0); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    setTimeout(() => done(0), 5000);
    a.src = url;
  });
}

const toTrack = ({ blob, ...meta }) => meta;

export const local = {
  id: 'local',
  name: 'Mis archivos',
  note: 'tus canciones',
  isReady: () => true,
  setupHint: '',

  async top() {
    const rows = await allRecords();
    return rows.sort((a, b) => a.added - b.added).map(toTrack);
  },

  async search(q) {
    const needle = q.toLowerCase();
    return (await this.top()).filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(needle));
  },

  /** Guarda archivos de audio. Devuelve cuántos se añadieron. */
  async add(files) {
    let n = 0;
    for (const file of files) {
      if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(file.name)) continue;
      const { artist, title } = parseName(file.name);
      const rec = {
        id: 'lo:' + (crypto.randomUUID?.() || Date.now() + Math.random()),
        provider: 'local',
        title,
        artist,
        album: '',
        cover: '',
        duration: await readDuration(file),
        added: Date.now() + n,
        blob: file,
      };
      try {
        if ((await run('readwrite', (s) => s.put(rec))) === null) memory.set(rec.id, rec);
      } catch {
        memory.set(rec.id, rec); // sin espacio: se mantiene solo durante esta sesión
      }
      n++;
    }
    return n;
  },

  async clear() {
    memory.clear();
    for (const u of urls.values()) URL.revokeObjectURL(u);
    urls.clear();
    await run('readwrite', (s) => s.clear());
  },

  /** URL reproducible para una canción guardada. */
  async url(track) {
    if (urls.has(track.id)) return urls.get(track.id);
    const rec = memory.get(track.id) || (await run('readonly', (s) => s.get(track.id)));
    if (!rec) throw new Error('Este archivo ya no está en tu biblioteca');
    const u = URL.createObjectURL(rec.blob);
    urls.set(track.id, u);
    return u;
  },
};
