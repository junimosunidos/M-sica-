// Reproductor unificado: una cola con pistas de cualquier fuente y un "adaptador" por fuente.
import { store } from './storage.js';
import { deezer } from './providers/deezer.js';
import { local } from './providers/local.js';
import { api, getToken } from './providers/spotify.js';

function loadScript(src) {
  const s = document.createElement('script');
  s.src = src;
  document.head.appendChild(s);
}

/* ---------- Audius, Mis archivos y Deezer: <audio> HTML5 ---------- */
class AudioAdapter {
  constructor() {
    this.a = new Audio();
    this.a.preload = 'auto';
    this.a.addEventListener('ended', () => this.onEnded?.());
    this.a.addEventListener('error', () => {
      if (this.a.getAttribute('src')) this.onError?.(new Error('No se pudo reproducir el audio'));
    });
  }
  async load(track) {
    const src = track.provider === 'deezer' ? await deezer.resolve(track)
      : track.provider === 'local' ? await local.url(track)
      : track.src;
    if (!src) throw new Error('Esta canción no se puede reproducir');
    this.a.src = src;
    await this.a.play();
  }
  play() { return this.a.play().catch(() => {}); }
  pause() { this.a.pause(); }
  stop() { this.a.pause(); }
  seek(sec) { this.a.currentTime = sec; }
  setVolume(v) { this.a.volume = v; }
  async getState() {
    const d = this.a.duration;
    return { position: this.a.currentTime || 0, duration: Number.isFinite(d) ? d : 0, paused: this.a.paused };
  }
}

/* ---------- YouTube: IFrame Player API ---------- */
let ytApi;
function loadYouTube() {
  ytApi ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = resolve;
    loadScript('https://www.youtube.com/iframe_api');
  });
  return ytApi;
}

class YouTubeAdapter {
  constructor() { this.vol = 0.8; this.wrap = document.getElementById('ytWrap'); }
  ensure() {
    this._init ??= loadYouTube().then(() => new Promise((resolve) => {
      this.p = new YT.Player('ytPlayer', {
        width: '320',
        height: '180',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: resolve,
          onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) this.onEnded?.(); },
          onError: (e) => this.onError?.(new Error(
            e.data === 101 || e.data === 150
              ? 'El autor no permite reproducir este vídeo fuera de YouTube'
              : 'YouTube no pudo reproducir este vídeo')),
        },
      });
    }));
    return this._init;
  }
  async load(track) {
    this.wrap.hidden = false;
    await this.ensure();
    this.p.setVolume(this.vol * 100);
    this.p.loadVideoById(track.videoId);
  }
  play() { this.p?.playVideo(); }
  pause() { this.p?.pauseVideo(); }
  stop() { this.p?.stopVideo?.(); this.wrap.hidden = true; }
  seek(sec) { this.p?.seekTo(sec, true); }
  setVolume(v) { this.vol = v; this.p?.setVolume?.(v * 100); }
  async getState() {
    if (!this.p?.getPlayerState) return { position: 0, duration: 0, paused: true };
    const st = this.p.getPlayerState();
    return {
      position: this.p.getCurrentTime() || 0,
      duration: this.p.getDuration() || 0,
      paused: st !== YT.PlayerState.PLAYING && st !== YT.PlayerState.BUFFERING,
    };
  }
}

/* ---------- Spotify: Web Playback SDK ---------- */
let spApi;
function loadSpotify() {
  spApi ??= new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = resolve;
    loadScript('https://sdk.scdn.co/spotify-player.js');
  });
  return spApi;
}

class SpotifyAdapter {
  constructor() { this.vol = 0.8; }
  ensure() {
    this._init ??= (async () => {
      await loadSpotify();
      this.p = new Spotify.Player({
        name: 'Música Web',
        getOAuthToken: (cb) => getToken().then(cb),
        volume: this.vol,
      });
      this.p.addListener('player_state_changed', (s) => this._onState(s));
      for (const ev of ['initialization_error', 'authentication_error', 'account_error', 'playback_error']) {
        this.p.addListener(ev, ({ message }) => this.onError?.(new Error(
          ev === 'account_error' ? 'Spotify requiere una cuenta Premium para reproducir' : 'Spotify: ' + message)));
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Spotify tardó demasiado en conectar')), 15000);
        this.p.addListener('ready', ({ device_id }) => { clearTimeout(timer); this.deviceId = device_id; resolve(); });
        this.p.connect().then((ok) => { if (!ok) { clearTimeout(timer); reject(new Error('No se pudo conectar con Spotify')); } });
      });
    })().catch((e) => { this._init = null; throw e; });
    return this._init;
  }
  async load(track) {
    await this.ensure();
    this.cur = track;
    this.ended = false;
    this.hadProgress = false;
    this.p.activateElement?.();
    await api('/me/player/play?device_id=' + this.deviceId, {
      method: 'PUT',
      body: JSON.stringify({ uris: [track.uri] }),
    });
  }
  _onState(s) {
    if (!s || !this.cur || this.ended) return;
    if (s.position > 1000) this.hadProgress = true;
    const finished = s.paused && s.position === 0 && this.hadProgress && (
      s.track_window.previous_tracks.some((t) => t.id === this.cur.spotifyId) ||
      s.restrictions?.disallow_resuming_reasons?.[0] === 'not_paused');
    if (finished) { this.ended = true; this.onEnded?.(); }
  }
  play() { this.p?.resume(); }
  pause() { this.p?.pause(); }
  stop() { this.p?.pause(); this.cur = null; }
  seek(sec) { this.p?.seek(Math.round(sec * 1000)); }
  setVolume(v) { this.vol = v; this.p?.setVolume(v); }
  async getState() {
    const s = await this.p?.getCurrentState();
    if (!s) return { position: 0, duration: this.cur?.duration || 0, paused: true };
    if (s.position > 1000) this.hadProgress = true;
    return { position: s.position / 1000, duration: s.duration / 1000, paused: s.paused };
  }
}

/* ---------- Controlador ---------- */
export class Player {
  constructor() {
    this.queue = [];
    this.index = -1;
    this.shuffle = store.get('shuffle', false);
    this.repeat = store.get('repeat', 'off'); // off | all | one
    this.volume = store.get('volume', 0.8);
    this.state = { position: 0, duration: 0, paused: true };
    this.current = null;
    this.handlers = {};
    this.errors = 0;

    const audio = new AudioAdapter();
    this.adapters = { audius: audio, local: audio, deezer: audio, youtube: new YouTubeAdapter(), spotify: new SpotifyAdapter() };
    for (const ad of new Set(Object.values(this.adapters))) {
      ad.onEnded = () => { if (ad === this.current) this._ended(); };
      ad.onError = (e) => { if (ad === this.current) this._failed(e); };
    }
    setInterval(() => this._tick(), 500);
  }

  on(ev, fn) { (this.handlers[ev] ??= []).push(fn); }
  emit(ev, data) { (this.handlers[ev] || []).forEach((fn) => fn(data)); }

  get track() { return this.queue[this.index] || null; }

  playList(tracks, i) {
    this.queue = [...tracks];
    this.index = i;
    this.emit('queue');
    return this._load();
  }

  jumpTo(i) { this.index = i; return this._load(); }

  enqueue(track) {
    this.queue.push(track);
    this.emit('queue');
    if (this.index < 0) { this.index = 0; this._load(); }
  }

  removeAt(i) {
    if (i === this.index) return;
    this.queue.splice(i, 1);
    if (i < this.index) this.index--;
    this.emit('queue');
  }

  async _load() {
    const t = this.track;
    if (!t) return;
    const ad = this.adapters[t.provider];
    if (this.current && this.current !== ad) this.current.stop();
    this.current = ad;
    ad.setVolume(this.volume);
    this.state = { position: 0, duration: t.duration || 0, paused: false };
    this.emit('track', t);
    this.emit('state', this.state);
    try {
      await ad.load(t);
      if (this.track === t) this.errors = 0;
    } catch (e) {
      if (this.track === t) this._failed(e);
    }
  }

  _failed(err) {
    this.emit('error', err);
    this.errors++;
    if (this.errors < 3 && this.queue.length > 1) setTimeout(() => this.next(true), 1200);
  }

  toggle() {
    if (!this.current) {
      if (this.queue.length) { this.index = Math.max(0, this.index); this._load(); }
      return;
    }
    if (this.state.paused) this.current.play(); else this.current.pause();
    this.state = { ...this.state, paused: !this.state.paused };
    this.emit('state', this.state);
  }

  next(auto = false) {
    const n = this.queue.length;
    if (!n) return;
    if (this.shuffle && n > 1) {
      let r;
      do r = Math.floor(Math.random() * n); while (r === this.index);
      this.index = r;
    } else if (this.index < n - 1) {
      this.index++;
    } else if (!auto || this.repeat === 'all') {
      this.index = 0;
    } else {
      return;
    }
    this._load();
  }

  prev() {
    if (this.state.position > 3) return this.seek(0);
    if (this.index > 0) { this.index--; this._load(); } else this.seek(0);
  }

  _ended() {
    if (this.repeat === 'one') {
      this._load();
      return;
    }
    const atEnd = this.index >= this.queue.length - 1;
    if (atEnd && !this.shuffle && this.repeat === 'off') {
      this.state = { ...this.state, paused: true };
      this.emit('state', this.state);
      return;
    }
    this.next(true);
  }

  seek(sec) { this.current?.seek(sec); this.state = { ...this.state, position: sec }; this.emit('state', this.state); }

  setVolume(v) {
    this.volume = v;
    store.set('volume', v);
    this.current?.setVolume(v);
  }

  toggleShuffle() { this.shuffle = !this.shuffle; store.set('shuffle', this.shuffle); return this.shuffle; }

  cycleRepeat() {
    this.repeat = { off: 'all', all: 'one', one: 'off' }[this.repeat];
    store.set('repeat', this.repeat);
    return this.repeat;
  }

  async _tick() {
    if (!this.current) return;
    try {
      this.state = await this.current.getState();
      this.emit('state', this.state);
    } catch { /* adaptador aún no listo */ }
  }
}
