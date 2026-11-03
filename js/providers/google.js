// Inicio de sesión con Google (Google Identity Services, modelo de token).
// Permiso de solo lectura sobre YouTube: listas, "me gusta" y búsqueda.
import { store } from '../storage.js';

const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
let gis;

function loadGis() {
  gis ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    s.onerror = () => { gis = null; reject(new Error('No se pudo cargar el inicio de sesión de Google')); };
    document.head.appendChild(s);
  });
  return gis;
}

export const isGoogleConnected = () => !!store.get('gConnected', false);

/** Abre la ventana de Google para conceder (o renovar) el acceso. */
export async function googleConnect() {
  const clientId = store.get('gClientId', '');
  if (!clientId) throw new Error('Primero escribe tu Client ID de Google en ⚙ Ajustes');
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error) return reject(new Error('Google: ' + (r.error_description || r.error)));
        store.set('gToken', { access: r.access_token, expires: Date.now() + r.expires_in * 1000 });
        store.set('gConnected', true);
        resolve();
      },
      error_callback: (e) => reject(new Error(
        e.type === 'popup_closed' ? 'Se cerró la ventana de Google'
          : e.type === 'popup_failed_to_open' ? 'El navegador bloqueó la ventana de Google: permite las ventanas emergentes'
            : 'No se pudo iniciar sesión con Google')),
    });
    client.requestAccessToken({ prompt: isGoogleConnected() ? '' : 'consent' });
  });
}

export function googleDisconnect() {
  const t = store.get('gToken');
  if (t?.access && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(t.access, () => {});
  store.del('gToken');
  store.del('gConnected');
}

/** Token válido, renovándolo si caducó (abre la ventana de Google un instante). */
export async function googleToken() {
  if (!isGoogleConnected()) return null;
  const t = store.get('gToken');
  if (t && Date.now() < t.expires - 60_000) return t.access;
  await googleConnect();
  return store.get('gToken').access;
}
