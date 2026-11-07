// Lógica pura de ABYSS (sin DOM): normalizar respuestas, puntuar y elegir la inmersión del día.

export const PROFUNDIDAD_FONDO = 1000;
export const PREGUNTAS_POR_DIA = 7;
export const SEGUNDOS_POR_PREGUNTA = 25;

// Zonas de menos a más profundas. La última es la perla: «One in an Abyss».
// 7 perlas × 143 m = 1001 m, pero el fondo está a 1000 m: solo se toca fondo con las 7 perlas
// (el máximo sin ellas es 6 × 143 + 120 = 978 m).
export const ZONAS = [
  { id: 'soleada', nombre: 'Zona Soleada', metros: 15, emoji: '🫧', desc: 'respuestas muy comunes' },
  { id: 'crepuscular', nombre: 'Zona Crepuscular', metros: 45, emoji: '🐠', desc: 'respuestas habituales' },
  { id: 'medianoche', nombre: 'Zona de Medianoche', metros: 85, emoji: '🦑', desc: 'respuestas poco comunes' },
  { id: 'abisal', nombre: 'Zona Abisal', metros: 120, emoji: '🐙', desc: 'respuestas rarísimas' },
  { id: 'perla', nombre: 'One in an Abyss', metros: 143, emoji: '💎', desc: 'la única respuesta perfecta' },
];
// Profundidad total de una lista de resultados (el fondo marino no deja bajar más).
export function profundidad(resultados) {
  return Math.min(PROFUNDIDAD_FONDO, resultados.reduce((s, r) => s + r.metros, 0));
}

export const FALLO = { id: 'fallo', nombre: 'Sin respuesta', metros: 0, emoji: '⬛' };

// Fecha de la primera inmersión (inmersión nº 1).
const INICIO = Date.UTC(2026, 10, 7);
const ARTICULOS = /^(el|la|los|las|un|una|unos|unas|lo)\s+/;

export function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(ARTICULOS, '');
}

function variantes(lista) {
  return lista.split(',').map((s) => s.trim()).filter(Boolean).map((r) => r.split('|').map((v) => v.trim()));
}

// Formas singular/plural a probar para una palabra normalizada.
function formas(w) {
  const f = [w, w + 's', w + 'es'];
  if (w.endsWith('es')) f.push(w.slice(0, -2));
  if (w.endsWith('s')) f.push(w.slice(0, -1));
  if (w.endsWith('ces')) f.push(w.slice(0, -3) + 'z');
  if (w.endsWith('z')) f.push(w.slice(0, -1) + 'ces');
  return f;
}

function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// Prepara una pregunta: índice de respuestas válidas → { zona, texto mostrado }.
export function prepararPregunta(p) {
  const indice = new Map();
  const add = (grupo, zona) => {
    const mostrado = grupo[0];
    for (const v of grupo) indice.set(normalizar(v), { zona, texto: mostrado });
  };
  p.z.forEach((lista, i) => variantes(lista).forEach((g) => add(g, i)));
  add(p.perla.split('|').map((v) => v.trim()), 4);
  return { q: p.q, perla: p.perla.split('|')[0], indice };
}

// Puntúa una respuesta. Devuelve { zona, texto } o null si no está en el registro.
export function puntuar(pregunta, respuesta) {
  const w = normalizar(respuesta);
  if (!w) return null;
  for (const f of formas(w)) {
    const hit = pregunta.indice.get(f);
    if (hit) return hit;
  }
  // Tolerancia a una errata en palabras largas (solo si hay una única coincidencia).
  if (w.length >= 5) {
    const cand = new Map();
    for (const [k, v] of pregunta.indice) {
      if (k.length >= 5 && distancia(w, k) === 1) cand.set(v.texto, v);
    }
    if (cand.size === 1) return [...cand.values()][0];
  }
  return null;
}

// --- Inmersión diaria ---

export function claveDia(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function numeroInmersion(clave) {
  const [y, m, d] = clave.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - INICIO) / 86400000) + 1;
}

function semilla(texto) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function aleatorio(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar(n, rnd) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

// Índices de las preguntas de una clave (todos los jugadores reciben las mismas el mismo día).
// Recorre el banco en ciclos barajados para no repetir preguntas hasta haberlas usado todas.
export function preguntasDelDia(clave, total) {
  const n = Math.max(1, numeroInmersion(clave));
  const porCiclo = Math.floor(total / PREGUNTAS_POR_DIA);
  const ciclo = Math.floor((n - 1) / porCiclo);
  const pos = (n - 1) % porCiclo;
  const orden = barajar(total, aleatorio(semilla('abismo-' + ciclo)));
  return orden.slice(pos * PREGUNTAS_POR_DIA, (pos + 1) * PREGUNTAS_POR_DIA);
}

export function preguntasAleatorias(total) {
  return barajar(total, Math.random).slice(0, PREGUNTAS_POR_DIA);
}

export function textoCompartir(numero, resultados) {
  const total = profundidad(resultados);
  const fila = resultados.map((r) => r.emoji).join('');
  const perlas = resultados.filter((r) => r.zona === 4).length;
  const titulo = total >= PROFUNDIDAD_FONDO ? '¡Tocó fondo! 🏆' : `${total} m de profundidad`;
  return `🤿 ABYSS #${numero} · ${titulo}\n${fila}\n💎 ${perlas}/${resultados.length} perlas`;
}
