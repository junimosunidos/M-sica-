# 🎵 Música

Reproductor de música web que se conecta a **Deezer**, **YouTube** y **Spotify** a través de sus APIs oficiales.
No necesita servidor ni compilación: es HTML + CSS + JavaScript puro.

## Funciones

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
| Deezer  | Ninguna | Vistas previas de 30 s (la API pública no permite más) |
| YouTube | API key gratuita | Canción completa (reproductor oficial de YouTube) |
| Spotify | Client ID + cuenta **Premium** | Canción completa (Web Playback SDK) |

> YouTube Music no tiene API pública oficial, por eso se usa la categoría «Música» de YouTube.

## Cómo ejecutarla

Los módulos JavaScript necesitan servirse por HTTP (no abrir el archivo directamente):

```bash
python3 -m http.server 8000
```

Abre **http://127.0.0.1:8000/** (usa `127.0.0.1`, no `localhost`: Spotify solo acepta esa dirección local).

También se puede publicar gratis con **GitHub Pages** (Settings → Pages → rama y carpeta raíz).

## Configurar YouTube

1. Entra en [Google Cloud Console](https://console.cloud.google.com/), crea un proyecto y activa **YouTube Data API v3**.
2. Crea una **API key** (Credenciales → Crear credenciales → Clave de API). Recomendado: restringirla a tu dominio.
3. En la app: ⚙ Ajustes → pega la clave → Guardar.

La cuota gratuita es de 10.000 unidades/día (cada búsqueda gasta ~101).

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
js/storage.js           Guardado en localStorage
js/providers/deezer.js  API de Deezer (JSONP)
js/providers/youtube.js API de YouTube Data v3
js/providers/spotify.js OAuth PKCE + Web API de Spotify
```

Las claves y tokens se guardan solo en el `localStorage` de tu navegador.
