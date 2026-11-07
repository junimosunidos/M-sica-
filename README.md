# 🎵 Música

Reproductor de música web que se conecta a **Audius**, **YouTube**, **Spotify** y **Deezer** a través de sus APIs oficiales,
y que también reproduce tus propios archivos de música.
No necesita servidor ni compilación: es HTML + CSS + JavaScript puro.

## Funciones

**Con tu cuenta de YouTube Music** (sección *Biblioteca*):
- Ver tus listas y tus «me gusta»
- **Aleatorio de todo**: todas las canciones de todas tus listas + «me gusta», sin repetidas y sin repetir hasta que suenen todas
- **Mix**: tus canciones intercaladas con canciones nuevas de los mismos géneros (2 tuyas → 1 nueva, marcada como «nueva»)
- **Agitar para saltar**: agita el móvil dos veces seguidas para pasar a la siguiente canción

**Generales:**

- Búsqueda de canciones y artistas en la fuente elegida
- «Lo más escuchado» de cada fuente (listas de éxitos / tus canciones más escuchadas en Spotify)
- Reproductor con cola, anterior/siguiente, aleatorio, repetir (todo / una), barra de progreso y volumen
- Cola mixta: puedes mezclar canciones de distintas fuentes
- Favoritos guardados en el navegador
- Controles desde el teclado (Espacio, Shift + ←/→) y desde la pantalla de bloqueo (Media Session)
- Diseño adaptado a móvil

## Fuentes

| Fuente  | Configuración | Qué se reproduce |
|---------|---------------|------------------|
| Audius  | Ninguna | Canción completa (artistas independientes) |
| Mis archivos | Ninguna | Tus propios MP3/M4A/FLAC…, guardados en el navegador |
| Deezer  | Ninguna | Vistas previas de 30 s (la API pública no permite más) |
| YouTube | API key gratuita | Canción completa (reproductor oficial de YouTube) |
| Spotify | Client ID + cuenta **Premium** | Canción completa (Web Playback SDK) |

> YouTube Music no tiene API pública oficial, por eso se usa la categoría «Música» de YouTube.

## 🤿 Juego: ABYSS

En [`abyss/`](abyss/) hay un juego diario de palabras (enlace «🤿 Abyss» en el menú). Eres un buzo y el fondo del mar está a **1000 m**.
Cada día hay **7 preguntas**, iguales para todos, con **25 segundos** para cada una. Gana la respuesta **más rara**, no la más popular:

| Zona | Metros |
|------|--------|
| 🫧 Zona Soleada (muy común) | 15 |
| 🐠 Zona Crepuscular | 45 |
| 🦑 Zona de Medianoche | 85 |
| 🐙 Zona Abisal (rarísima) | 120 |
| 💎 **One in an Abyss** (la única respuesta perfecta) | 143 |

Solo acertando las 7 perlas se toca el fondo: 7 × 143 = 1001 m, y el fondo te frena en 1000
(sin las 7, el máximo es 978 m). Incluye resultado para compartir con emojis, racha y estadísticas (guardadas en el navegador).

**Modo ilimitado ♾️**: aparte de la inmersión del día, puedes jugar todas las veces que quieras. Las preguntas no se acaban
y no hay fondo; tienes 3 bombonas de oxígeno y cada pregunta sin respuesta gasta una. Guarda tu récord de profundidad.

**Como artefacto de Claude**: `abyss/dist/abyss-artifact.html` es el juego entero en un solo archivo, listo para publicarlo
como artefacto. Si cambias algo en `abyss/`, regenéralo con `python3 abyss/build.py`.
Las preguntas están en `abyss/js/preguntas.js`: para añadir más, copia una entrada y reparte las respuestas por zonas.

## Cómo ejecutarla

Los módulos JavaScript necesitan servirse por HTTP (no abrir el archivo directamente):

```bash
python3 -m http.server 8000
```

Abre **http://127.0.0.1:8000/** (usa `127.0.0.1`, no `localhost`: Spotify solo acepta esa dirección local).

También se puede publicar gratis con **GitHub Pages** (Settings → Pages → rama y carpeta raíz).

## Conectar tu cuenta de YouTube Music

YouTube Music no tiene API pública, pero tus listas y «me gusta» de YouTube Music se guardan en tu cuenta de YouTube,
así que se leen con la YouTube Data API (permiso de **solo lectura**). Se hace una vez:

1. Entra en [Google Cloud Console](https://console.cloud.google.com/) y crea un proyecto.
2. *APIs y servicios → Biblioteca* → activa **YouTube Data API v3**.
3. *APIs y servicios → Pantalla de consentimiento de OAuth* → tipo **Externo**, pon un nombre a la app y tu correo.
   En **Usuarios de prueba** añade tu propia cuenta de Google.
4. *APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth* → tipo **Aplicación web**.
   En **Orígenes de JavaScript autorizados** añade la dirección que aparece en ⚙ Ajustes
   (por ejemplo `http://127.0.0.1:8000` y, si la publicas, `https://tuusuario.github.io`).
5. Copia el **ID de cliente**, pégalo en ⚙ Ajustes y pulsa **Conectar con Google**.

Google mostrará un aviso de «app no verificada» porque la app es tuya y está en pruebas: pulsa *Continuar*.

**A tener en cuenta**
- La cuota gratuita de la API es de 10.000 unidades/día. Leer tu biblioteca gasta muy poco; cada **mix** gasta unas
  300–400 (hace 3–4 búsquedas), así que da para ~25 mixes al día.
- La música suena con el reproductor oficial de YouTube, que debe verse en pantalla. El plan *YouTube Music Premium*
  normalmente no quita los anuncios de YouTube (eso lo hace *YouTube Premium*).
- En el móvil la música se para si bloqueas la pantalla o cambias de app (limitación de YouTube).
- «Agitar para saltar» necesita que la app esté abierta por **HTTPS** (por ejemplo con GitHub Pages) para funcionar en el móvil.

Alternativa sin cuenta: en ⚙ Ajustes puedes poner solo una API key de YouTube Data API v3 (búsqueda, sin biblioteca).

## Configurar Spotify

1. Entra en el [Dashboard de Spotify for Developers](https://developer.spotify.com/dashboard) y crea una app
   (marca *Web API* y *Web Playback SDK*).
2. En **Redirect URIs** añade exactamente la dirección que aparece en ⚙ Ajustes
   (por ejemplo `http://127.0.0.1:8000/` o `https://tuusuario.github.io/M-sica-/`).
3. Copia el **Client ID**, pégalo en ⚙ Ajustes y pulsa **Conectar con Spotify**.

Se usa OAuth con PKCE, así que no hace falta (ni se debe) poner el *client secret* en la web.
Mientras la app esté en «modo desarrollo», añade en el dashboard (User Management) las cuentas que vayan a usarla.

## Estructura

```
index.html              Interfaz
css/styles.css          Estilos
js/app.js               Lógica de la interfaz (vistas, lista, ajustes)
js/player.js            Reproductor unificado + adaptadores (audio, YouTube, Spotify)
js/library.js           Biblioteca de YouTube Music, aleatorio de todo y mix por géneros
js/shake.js             Agitar para saltar
js/providers/google.js  Inicio de sesión con Google
js/storage.js           Guardado en localStorage
js/providers/audius.js  API de Audius
js/providers/local.js   Mis archivos (IndexedDB)
js/providers/deezer.js  API de Deezer (JSONP)
js/providers/youtube.js API de YouTube Data v3
js/providers/spotify.js OAuth PKCE + Web API de Spotify
```

Las claves y tokens se guardan solo en el `localStorage` de tu navegador.
