// Spotify Web API con OAuth "Authorization Code + PKCE" (sin servidor ni client secret).
// La reproducción usa el Web Playback SDK, que requiere cuenta Premium.
import { store } from '../storage.js';

const AUTH = 'https://accounts.spotify.com';
const API = 'https://api.spotify.com/v1';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-top-read',
].join(' ');

export const redirectUri = () => location.origin + location.pathname;

function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(len = 64) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return b64url(a).slice(0, len);
}

export async function login() {
  const clientId = store.get('spClientId', '');
  if (!clientId) throw new Error('Primero escribe tu Client ID de Spotify y guarda');
  const verifier = randomString(64);
  const state = randomString(16);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  store.set('spVerifier', verifier);
  store.set('spState', state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });
  location.href = `${AUTH}/authorize?${params}`;
}

export function logout() {
  store.del('spToken');
}

async function tokenRequest(body) {
  const res = await fetch(`${AUTH}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (body.grant_type === 'refresh_token') logout();
    throw new Error(j.error_description || j.error || 'Error de autenticación con Spotify');
  }
  const old = store.get('spToken', {});
  store.set('spToken', {
    access: j.access_token,
    refresh: j.refresh_token || old.refresh,
    expires: Date.now() + j.expires_in * 1000,
  });
}

/** Procesa la vuelta desde Spotify (?code=…). Devuelve true si se conectó. */
export async function handleRedirect() {
  const p = new URLSearchParams(location.search);
  if (!p.has('code') && !p.has('error')) return false;
  history.replaceState(null, '', redirectUri());
  if (p.get('error')) throw new Error('Spotify: ' + p.get('error'));
  if (p.get('state') !== store.get('spState')) throw new Error('Respuesta de Spotify no válida (state)');
  await tokenRequest({
    grant_type: 'authorization_code',
    code: p.get('code'),
    redirect_uri: redirectUri(),
    client_id: store.get('spClientId', ''),
    code_verifier: store.get('spVerifier', ''),
  });
  store.del('spVerifier');
  store.del('spState');
  return true;
}

export async function getToken() {
  const t = store.get('spToken');
  if (!t) return null;
  if (Date.now() < t.expires - 60_000) return t.access;
  await tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: t.refresh,
    client_id: store.get('spClientId', ''),
  });
  return store.get('spToken').access;
}

export async function api(path, opts = {}) {
  const token = await getToken();
  if (!token) throw new Error('Conecta tu cuenta de Spotify en Ajustes');
  const res = await fetch(API + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...opts.headers },
  });
  if (res.status === 204 || res.status === 202) return null;
  const j = await res.json().catch(() => null);
  if (!res.ok) throw new Error(j?.error?.message || 'Spotify respondió ' + res.status);
  return j;
}

function map(t) {
  const imgs = t.album?.images || [];
  return {
    id: 'sp:' + t.id,
    provider: 'spotify',
    spotifyId: t.id,
    uri: t.uri,
    title: t.name,
    artist: (t.artists || []).map((a) => a.name).join(', '),
    album: t.album?.name ?? '',
    cover: (imgs[1] || imgs[0] || {}).url || '',
    duration: Math.round((t.duration_ms || 0) / 1000),
  };
}

async function searchTracks(q) {
  const run = (limit) => api(`/search?type=track&limit=${limit}&q=${encodeURIComponent(q)}`);
  let d;
  try { d = await run(30); } catch { d = await run(10); } // algunas apps en modo desarrollo tienen límites menores
  return (d?.tracks?.items || []).filter(Boolean).map(map);
}

export const spotify = {
  id: 'spotify',
  name: 'Spotify',
  note: 'requiere Premium',
  isReady: () => !!store.get('spToken'),
  setupHint: 'Para usar Spotify añade tu Client ID y conecta tu cuenta en ⚙ Ajustes.',

  async top() {
    try {
      const d = await api('/me/top/tracks?limit=50&time_range=short_term');
      if (d?.items?.length) return d.items.map(map);
    } catch { /* sin historial o sin permiso: buscar novedades */ }
    return searchTracks('year:' + new Date().getFullYear());
  },

  search: searchTracks,
};
