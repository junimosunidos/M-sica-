import { store } from './storage.js';
import { Player } from './player.js';
import { audius } from './providers/audius.js';
import { local } from './providers/local.js';
import { deezer } from './providers/deezer.js';
import { youtube } from './providers/youtube.js';
import { spotify, login, logout, handleRedirect, redirectUri } from './providers/spotify.js';
import { googleConnect, googleDisconnect, isGoogleConnected } from './providers/google.js';
import { LIKED, ALL, myPlaylists, getTracks, buildMix, describe, shuffled, clearLibraryCache, genreEs } from './library.js';
import { createShake } from './shake.js';

const providers = { audius, local, youtube, spotify, deezer };
const $ = (s) => document.querySelector(s);
const player = new Player();

let providerId = providers[store.get('provider')] ? store.get('provider') : 'audius';
let view = 'home';
let shown = [];          // pistas mostradas en la lista actual
let lastQuery = '';
let favorites = store.get('favorites', []);
let seeking = false;

/* ---------- utilidades ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmt(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
}

function notice(msg, withButton = false) {
  const el = $('#notice');
  el.hidden = !msg;
  el.innerHTML = msg ? esc(msg) + (withButton ? ' <button type="button" class="link-btn" data-open-settings>Abrir ajustes</button>' : '') : '';
}

const isFav = (t) => favorites.some((f) => f.id === t.id);

function toggleFav(t) {
  favorites = isFav(t) ? favorites.filter((f) => f.id !== t.id) : [t, ...favorites];
  store.set('favorites', favorites);
  if (view === 'favorites') renderList(favorites);
  else markRows();
  updateNowFav();
}

/* ---------- fuentes ---------- */
function renderProviders() {
  $('#providers').innerHTML = Object.values(providers).map((p) => `
    <button class="provider ${p.id === providerId ? 'active' : ''}" data-provider="${p.id}">
      <span class="dot ${p.isReady() ? 'ok' : ''}"></span>
      <span class="p-name">${esc(p.name)}</span>
      <small>${esc(p.note)}</small>
    </button>`).join('');
}

function selectProvider(id) {
  providerId = id;
  store.set('provider', id);
  renderProviders();
  if (lastQuery) search(lastQuery); else showView('home');
}

/* ---------- vistas ---------- */
function setNav(v) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
}

function renderToolbar() {
  $('#localBar').hidden = !(providerId === 'local' && (view === 'home' || view === 'search'));
  if (view !== 'library' && view !== 'playlist') $('#viewActions').hidden = true;
}

async function loadInto(title, fetcher) {
  const p = providers[providerId];
  $('#viewTitle').textContent = title;
  renderToolbar();
  if (!p.isReady()) {
    notice(p.setupHint, true);
    renderList([]);
    return;
  }
  notice('');
  $('#list').innerHTML = '<div class="empty">Cargando…</div>';
  const token = Symbol();
  loadInto.token = token;
  try {
    const tracks = await fetcher(p);
    if (loadInto.token !== token) return;
    renderList(tracks, {
      empty: providerId === 'local' && view === 'home'
        ? 'Tu biblioteca está vacía. Pulsa «Añadir canciones» o arrastra aquí tus archivos de audio.'
        : 'No se encontraron canciones.',
    });
  } catch (e) {
    if (loadInto.token !== token) return;
    renderList([]);
    notice(e.message, /key|Ajustes|Client|token|autentic/i.test(e.message));
  }
}

function showView(v) {
  view = v;
  tokens.view = null;
  setNav(v);
  loadInto.token = null;
  if (v === 'home') {
    lastQuery = '';
    $('#searchInput').value = '';
    loadInto(`Lo más escuchado · ${providers[providerId].name}`, (p) => p.top());
  } else if (v === 'library') {
    showLibrary();
  } else if (v === 'favorites') {
    notice('');
    renderToolbar();
    $('#viewTitle').textContent = 'Favoritos';
    renderList(favorites, { empty: 'Aún no tienes favoritos. Pulsa ♡ en cualquier canción.' });
  } else if (v === 'queue') {
    notice('');
    renderToolbar();
    $('#viewTitle').textContent = 'Cola de reproducción';
    renderList(player.queue, { queue: true, empty: 'La cola está vacía.' });
  }
}

function search(q) {
  tokens.view = null;
  lastQuery = q;
  view = 'search';
  setNav(null);
  loadInto(`Resultados para “${q}” · ${providers[providerId].name}`, (p) => p.search(q));
}

/* ---------- lista de canciones ---------- */
const badge = { audius: 'AU', local: 'MP3', deezer: 'DZ', youtube: 'YT', spotify: 'SP' };

function renderList(tracks, opts = {}) {
  shown = tracks;
  const list = $('#list');
  list.dataset.queue = opts.queue ? '1' : '';
  if (!tracks.length) {
    list.innerHTML = opts.empty ? `<div class="empty">${esc(opts.empty)}</div>` : '';
    return;
  }
  list.innerHTML = tracks.map((t, i) => `
    <div class="row" data-i="${i}" data-id="${esc(t.id)}">
      <span class="num">${i + 1}</span>
      ${t.cover ? `<img class="cover" src="${esc(t.cover)}" alt="" loading="lazy">` : '<span class="cover"></span>'}
      <div class="meta">
        <div class="title">${esc(t.title)}${t.isNew ? '<span class="new-tag">nueva</span>' : ''}</div>
        <div class="artist">${esc(t.artist)}</div>
      </div>
      <div class="album">${esc(t.album)}</div>
      <span class="badge ${t.provider}" title="${esc(providers[t.provider].name)}">${badge[t.provider]}</span>
      <button class="icon-btn fav" data-act="fav" title="Favorito">♡</button>
      <button class="icon-btn" data-act="${opts.queue ? 'remove' : 'enqueue'}" title="${opts.queue ? 'Quitar de la cola' : 'Añadir a la cola'}">${opts.queue ? '✕' : '+'}</button>
      <span class="dur">${t.duration ? fmt(t.duration) : ''}</span>
    </div>`).join('');
  markRows();
}

function markRows() {
  const cur = player.track;
  const inQueue = $('#list').dataset.queue === '1';
  document.querySelectorAll('#list .row').forEach((row) => {
    const t = shown[+row.dataset.i];
    if (!t) return;
    const playing = inQueue ? +row.dataset.i === player.index : cur?.id === t.id;
    row.classList.toggle('playing', playing);
    const fav = row.querySelector('.fav');
    fav.textContent = isFav(t) ? '♥' : '♡';
    fav.classList.toggle('on', isFav(t));
  });
}

$('#list').addEventListener('click', async (e) => {
  if (await onLibraryClick(e)) return;
  const row = e.target.closest('.row');
  if (!row) return;
  const i = +row.dataset.i;
  const t = shown[i];
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'fav') return toggleFav(t);
  if (act === 'enqueue') { player.enqueue(t); return toast('Añadida a la cola: ' + t.title); }
  if (act === 'remove') { player.removeAt(i); return; }
  if ($('#list').dataset.queue === '1') player.jumpTo(i);
  else player.playList(shown, i);
});

/* ---------- barra del reproductor ---------- */
function updateNowFav() {
  const t = player.track;
  const btn = $('#npFav');
  btn.hidden = !t;
  if (t) { btn.textContent = isFav(t) ? '♥' : '♡'; btn.classList.toggle('on', isFav(t)); }
}

player.on('track', (t) => {
  $('#npTitle').textContent = t.title;
  $('#npArtist').textContent = t.artist + (t.provider === 'deezer' ? ' · vista previa' : '');
  const img = $('#npCover');
  img.hidden = !t.cover;
  if (t.cover) img.src = t.cover;
  document.title = `${t.title} · ${t.artist}`;
  updateNowFav();
  markRows();

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title, artist: t.artist, album: t.album,
      artwork: t.cover ? [{ src: t.cover, sizes: '300x300' }] : [],
    });
  }
});

player.on('queue', () => { if (view === 'queue') showView('queue'); });

player.on('state', (s) => {
  $('#playBtn').innerHTML = s.paused ? '▶&#xFE0E;' : '⏸&#xFE0E;';
  $('#curTime').textContent = fmt(s.position);
  $('#durTime').textContent = fmt(s.duration);
  if (!seeking) $('#seek').value = s.duration ? Math.round((s.position / s.duration) * 1000) : 0;
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = s.paused ? 'paused' : 'playing';
});

player.on('error', (e) => toast(e.message));
player.on('modes', () => paintModes());

$('#playBtn').onclick = () => player.toggle();
$('#nextBtn').onclick = () => player.next();
$('#prevBtn').onclick = () => player.prev();
$('#npFav').onclick = () => player.track && toggleFav(player.track);

function paintModes() {
  $('#shuffleBtn').classList.toggle('on', player.shuffle);
  const r = $('#repeatBtn');
  r.classList.toggle('on', player.repeat !== 'off');
  r.textContent = player.repeat === 'one' ? '↻¹' : '↻';
  r.title = { off: 'Repetir: no', all: 'Repetir: todo', one: 'Repetir: una' }[player.repeat];
}
$('#shuffleBtn').onclick = () => { player.toggleShuffle(); paintModes(); };
$('#repeatBtn').onclick = () => { player.cycleRepeat(); paintModes(); };
paintModes();

const seekEl = $('#seek');
seekEl.addEventListener('input', () => {
  seeking = true;
  $('#curTime').textContent = fmt((seekEl.value / 1000) * player.state.duration);
});
seekEl.addEventListener('change', () => {
  seeking = false;
  if (player.state.duration) player.seek((seekEl.value / 1000) * player.state.duration);
});

const volEl = $('#volume');
volEl.value = Math.round(player.volume * 100);
volEl.addEventListener('input', () => player.setVolume(volEl.value / 100));

if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', () => player.state.paused && player.toggle());
  ms.setActionHandler('pause', () => !player.state.paused && player.toggle());
  ms.setActionHandler('nexttrack', () => player.next());
  ms.setActionHandler('previoustrack', () => player.prev());
}

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, dialog')) return;
  if (e.code === 'Space') { e.preventDefault(); player.toggle(); }
  else if (e.code === 'ArrowRight' && e.shiftKey) player.next();
  else if (e.code === 'ArrowLeft' && e.shiftKey) player.prev();
});

/* ---------- navegación y búsqueda ---------- */
document.querySelectorAll('.nav-item').forEach((b) => { b.onclick = () => showView(b.dataset.view); });
$('#providers').addEventListener('click', (e) => {
  const b = e.target.closest('[data-provider]');
  if (b) selectProvider(b.dataset.provider);
});
$('#searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  if (q) search(q); else showView('home');
});

/* ---------- mis archivos ---------- */
async function addFiles(files) {
  if (!files?.length) return;
  toast('Guardando canciones…');
  const n = await local.add([...files]);
  toast(n ? `${n} canción${n === 1 ? '' : 'es'} añadida${n === 1 ? '' : 's'}` : 'No se encontraron archivos de audio');
  if (providerId !== 'local') selectProvider('local'); else showView('home');
}

$('#addFilesBtn').onclick = () => $('#fileInput').click();
$('#fileInput').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
$('#clearLocalBtn').onclick = async () => {
  if (!confirm('¿Borrar todas tus canciones de esta app? (Los archivos originales no se tocan)')) return;
  await local.clear();
  favorites = favorites.filter((f) => f.provider !== 'local');
  store.set('favorites', favorites);
  showView('home');
};
document.addEventListener('dragover', (e) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); });
document.addEventListener('drop', (e) => {
  if (!e.dataTransfer?.files.length) return;
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});

/* ---------- biblioteca de YouTube Music ---------- */
// Cada operación lleva un "token": si el usuario cambia de pantalla o lanza otra, la anterior se descarta.
const tokens = { view: null, play: null };
const busy = (fn, kind = 'view') => async (...args) => {
  const t = { kind };
  tokens[kind] = t;
  try { await fn(t, ...args); } catch (e) { if (tokens[kind] === t) toast(e.message); }
};
const stale = (t) => tokens[t.kind] !== t;

function actions(html) {
  const el = $('#viewActions');
  el.innerHTML = html;
  el.hidden = !html;
}

const showLibrary = busy(async (t) => {
  view = 'library';
  setNav('library');
  notice('');
  renderToolbar();
  $('#viewTitle').textContent = 'Tu biblioteca de YouTube Music';
  shown = [];
  if (!isGoogleConnected()) {
    actions('');
    $('#list').innerHTML = `
      <div class="lib-intro">
        <strong>Conecta tu cuenta de Google</strong>
        <p>Verás aquí tus listas y tus «me gusta» de YouTube Music, y podrás escuchar todo en aleatorio
          o crear mixes con canciones nuevas de los mismos géneros. Solo se pide permiso de lectura.</p>
        <button type="button" class="link-btn" data-lib="connect">Conectar con Google</button>
      </div>`;
    return;
  }
  actions(`
    <button type="button" class="primary" data-lib="shuffle" data-pl="${ALL}">🔀 Aleatorio de todo</button>
    <button type="button" data-lib="mix" data-pl="${ALL}">✨ Mix de todo</button>
    <button type="button" data-lib="refresh">↻ Actualizar</button>`);
  $('#list').innerHTML = '<div class="empty">Cargando tus listas…</div>';
  const lists = await myPlaylists();
  if (stale(t)) return;
  const card = (id, title, sub, cover) => `
    <div class="pl-card">
      ${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : '<span class="pl-ph">♥</span>'}
      <div style="min-width:0">
        <div class="pl-name" data-lib="open" data-pl="${esc(id)}" data-title="${esc(title)}">${esc(title)}</div>
        <small>${esc(sub)}</small>
      </div>
      <div class="pl-actions">
        <button type="button" class="primary" data-lib="play" data-pl="${esc(id)}">▶ Reproducir</button>
        <button type="button" data-lib="shuffle" data-pl="${esc(id)}">🔀 Aleatorio</button>
        <button type="button" data-lib="mix" data-pl="${esc(id)}">✨ Mix</button>
      </div>
    </div>`;
  $('#list').innerHTML = `<div class="pl-grid">
    ${card(LIKED, 'Me gusta', 'Tus canciones favoritas', '')}
    ${lists.map((p) => card(p.id, p.title, `${p.count} canciones`, p.cover)).join('')}
  </div>` + (lists.length ? '' : '<div class="empty">No se encontraron listas creadas por ti.</div>');
});

const openPlaylist = busy(async (t, id, title) => {
  view = 'playlist';
  setNav('library');
  notice('');
  $('#viewTitle').textContent = title;
  actions(`
    <button type="button" data-lib="back">← Biblioteca</button>
    <button type="button" class="primary" data-lib="play" data-pl="${esc(id)}">▶ Reproducir</button>
    <button type="button" data-lib="shuffle" data-pl="${esc(id)}">🔀 Aleatorio</button>
    <button type="button" data-lib="mix" data-pl="${esc(id)}">✨ Mix</button>`);
  $('#list').innerHTML = '<div class="empty">Cargando canciones…</div>';
  const tracks = await getTracks(id, toast);
  if (stale(t)) return;
  const { genres } = describe(tracks);
  renderList(tracks, { empty: 'Esta lista no tiene canciones que se puedan reproducir aquí.' });
  if (genres.length) $('#list').insertAdjacentHTML('afterbegin', `<div class="genres">Géneros: ${esc(genres.map(genreEs).join(' · '))}</div>`);
});

const playFrom = busy(async (t, id, mode) => {
  toast(id === ALL ? 'Juntando todas tus canciones…' : 'Cargando canciones…');
  const tracks = await getTracks(id, toast);
  if (stale(t)) return;
  if (!tracks.length) throw new Error('No hay canciones que se puedan reproducir');
  if (mode === 'play') {
    player.playList(tracks, 0, { shuffle: false });
  } else if (mode === 'shuffle') {
    player.playList(shuffled(tracks), 0, { shuffle: true });
    toast(`🔀 Aleatorio de ${tracks.length} canciones`);
  } else {
    const mix = await buildMix(tracks, { onProgress: toast });
    if (stale(t)) return;
    player.playList(mix, 0, { shuffle: false });
    const n = mix.filter((x) => x.isNew).length;
    toast(`✨ Mix listo: ${tracks.length} tuyas + ${n} nuevas`);
    showView('queue');
  }
}, 'play');

async function onLibraryClick(e) {
  const b = e.target.closest('[data-lib]');
  if (!b) return false;
  const { lib, pl, title } = b.dataset;
  if (lib === 'connect') {
    if (!store.get('gClientId', '')) { toast('Primero pega tu Client ID de Google'); openSettings(); return true; }
    try { await googleConnect(); clearLibraryCache(); renderProviders(); showLibrary(); } catch (err) { toast(err.message); }
  } else if (lib === 'refresh') { clearLibraryCache(); showLibrary(); }
  else if (lib === 'back') showLibrary();
  else if (lib === 'open') openPlaylist(pl, title);
  else playFrom(pl, lib);
  return true;
}
$('#viewActions').addEventListener('click', onLibraryClick);

/* ---------- agitar para saltar ---------- */
const shake = createShake(() => {
  if (!player.track) return;
  navigator.vibrate?.(60);
  player.next();
  toast('⏭ Canción saltada');
});
shake.setSensitivity(store.get('shakeLevel', 'media'));
if (store.get('shakeOn', false) && shake.supported) {
  if (shake.needsPermission) document.addEventListener('click', () => shake.enable().catch(() => {}), { once: true });
  else shake.enable();
}

/* ---------- ajustes ---------- */
const dlg = $('#settings');

function paintSpotifyStatus() {
  $('#spStatus').textContent = spotify.isReady() ? '✓ Conectado' : 'No conectado';
}

function paintGoogleStatus() {
  $('#gStatus').textContent = isGoogleConnected() ? '✓ Conectado' : 'No conectado';
}

function openSettings() {
  $('#ytKey').value = store.get('ytKey', '');
  $('#gClientId').value = store.get('gClientId', '');
  $('#gOrigin').textContent = location.origin;
  paintGoogleStatus();
  $('#shakeOn').checked = shake.active || store.get('shakeOn', false);
  $('#shakeOn').disabled = !shake.supported;
  $('#shakeLevel').value = store.get('shakeLevel', 'media');
  $('#spClientId').value = store.get('spClientId', '');
  $('#redirectUri').textContent = redirectUri();
  paintSpotifyStatus();
  dlg.showModal();
}

function saveSettings() {
  store.set('ytKey', $('#ytKey').value.trim());
  const gid = $('#gClientId').value.trim();
  if (gid !== store.get('gClientId', '')) { googleDisconnect(); clearLibraryCache(); }
  store.set('gClientId', gid);
  store.set('shakeLevel', $('#shakeLevel').value);
  shake.setSensitivity($('#shakeLevel').value);
  const id = $('#spClientId').value.trim();
  if (id !== store.get('spClientId', '')) logout();
  store.set('spClientId', id);
  renderProviders();
}

$('#settingsBtn').onclick = openSettings;
document.addEventListener('click', (e) => { if (e.target.closest('[data-open-settings]')) openSettings(); });
dlg.addEventListener('close', () => {
  if (dlg.returnValue === 'save') {
    saveSettings();
    if (lastQuery) search(lastQuery);
    else if (view === 'library' || view === 'playlist') showLibrary();
    else if (view !== 'favorites' && view !== 'queue') showView('home');
  }
});
$('#spLogin').onclick = async () => {
  saveSettings();
  try { await login(); } catch (e) { toast(e.message); }
};
$('#gLogin').onclick = async () => {
  saveSettings();
  try {
    await googleConnect();
    clearLibraryCache();
    paintGoogleStatus();
    renderProviders();
    toast('Cuenta de Google conectada');
  } catch (e) { toast(e.message); }
};
$('#gLogout').onclick = () => { googleDisconnect(); clearLibraryCache(); paintGoogleStatus(); renderProviders(); };
$('#shakeOn').addEventListener('change', async (e) => {
  try {
    if (e.target.checked) {
      await shake.enable();
      toast('Agita el móvil dos veces seguidas para saltar');
    } else shake.disable();
    store.set('shakeOn', e.target.checked);
  } catch (err) {
    e.target.checked = false;
    toast(err.message);
  }
});
$('#spLogout').onclick = () => { logout(); paintSpotifyStatus(); renderProviders(); };

/* ---------- inicio ---------- */
(async () => {
  try {
    if (await handleRedirect()) {
      providerId = 'spotify';
      store.set('provider', 'spotify');
      toast('Spotify conectado');
    }
  } catch (e) {
    toast(e.message);
  }
  renderProviders();
  showView('home');
})();
