import { PREGUNTAS } from './preguntas.js';
import {
  ZONAS, FALLO, PROFUNDIDAD_FONDO, PREGUNTAS_POR_DIA, SEGUNDOS_POR_PREGUNTA,
  prepararPregunta, puntuar, claveDia, numeroInmersion, preguntasDelDia, preguntasAleatorias, textoCompartir,
} from './motor.js';

const $ = (id) => document.getElementById(id);
const CLAVE_STORAGE = 'abismo:v1';

// ---------- almacenamiento ----------
function cargar() {
  try { return JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || { dias: {} }; } catch { return { dias: {} }; }
}
function guardar() {
  try { localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos)); } catch { /* sin almacenamiento */ }
}
const datos = cargar();

// ---------- estado ----------
const hoy = claveDia();
const numero = numeroInmersion(hoy);
let partida = null; // { libre, ids, preguntas, res: [], actual }
let temporizador = null;
let limite = 0;
let respondida = false;

// ---------- utilidades de interfaz ----------
function mostrar(vista) {
  for (const v of ['vistaInicio', 'vistaJuego', 'vistaFinal']) $(v).hidden = v !== vista;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.hidden = true; }, 2200);
}

function tablaZonas(el) {
  el.innerHTML = ZONAS.map((z) => `<li class="z-${z.id}"><span>${z.emoji}</span><b>${z.nombre}</b><small>${z.desc}</small><em>${z.metros} m</em></li>`).join('');
}

function marcas() {
  let html = '';
  for (let m = 0; m <= PROFUNDIDAD_FONDO; m += 100) {
    html += `<div class="marca" style="top:${(m / PROFUNDIDAD_FONDO) * 100}%"><span>${m}</span></div>`;
  }
  $('marcas').innerHTML = html;
}

// Mezcla de colores del agua: más oscura cuanto más profundo.
const COLORES = [[18, 132, 190], [10, 74, 122], [6, 34, 70], [3, 14, 34], [1, 4, 12]];
function colorAgua(t) {
  const x = Math.min(0.9999, Math.max(0, t)) * (COLORES.length - 1);
  const i = Math.floor(x), f = x - i;
  const c = COLORES[i].map((v, k) => Math.round(v + (COLORES[i + 1][k] - v) * f));
  return `rgb(${c.join(',')})`;
}

let profundidadMostrada = 0;
function fijarProfundidad(metros, animar = true) {
  const t = metros / PROFUNDIDAD_FONDO;
  document.documentElement.style.setProperty('--agua', colorAgua(t));
  document.documentElement.style.setProperty('--agua-2', colorAgua(Math.min(1, t + 0.18)));
  $('buzo').style.top = `${Math.min(100, t * 100)}%`;
  const desde = profundidadMostrada;
  profundidadMostrada = metros;
  if (!animar || desde === metros) { $('profundidad').textContent = metros; return; }
  const inicio = performance.now();
  const paso = (ahora) => {
    const p = Math.min(1, (ahora - inicio) / 900);
    $('profundidad').textContent = Math.round(desde + (metros - desde) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

const total = (res) => res.reduce((s, r) => s + r.metros, 0);

// ---------- partida ----------
function nuevaPartida(libre) {
  const ids = libre ? preguntasAleatorias(PREGUNTAS.length) : preguntasDelDia(hoy, PREGUNTAS.length);
  const guardada = libre ? null : datos.dias[hoy];
  partida = {
    libre,
    ids,
    preguntas: ids.map((i) => prepararPregunta(PREGUNTAS[i])),
    res: guardada ? guardada.res : [],
  };
  if (!libre && !guardada) { datos.dias[hoy] = { res: partida.res, fin: false }; guardar(); }
}

function empezar(libre) {
  nuevaPartida(libre);
  $('modo').hidden = !libre;
  fijarProfundidad(total(partida.res), false);
  mostrar('vistaJuego');
  siguientePregunta();
}

function siguientePregunta() {
  const i = partida.res.length;
  if (i >= PREGUNTAS_POR_DIA) return terminar();
  const p = partida.preguntas[i];
  respondida = false;
  $('numPregunta').textContent = `Pregunta ${i + 1}/${PREGUNTAS_POR_DIA}`;
  $('pregunta').textContent = p.q;
  $('resultado').hidden = true;
  $('formRespuesta').hidden = false;
  $('aviso').textContent = '';
  $('entrada').value = '';
  $('entrada').disabled = false;
  $('entrada').focus();
  limite = performance.now() + SEGUNDOS_POR_PREGUNTA * 1000;
  clearInterval(temporizador);
  temporizador = setInterval(tic, 100);
  tic();
}

function tic() {
  const resta = Math.max(0, limite - performance.now());
  const s = Math.ceil(resta / 1000);
  $('segundos').textContent = s;
  $('barraTiempo').style.transform = `scaleX(${resta / (SEGUNDOS_POR_PREGUNTA * 1000)})`;
  $('barraTiempo').classList.toggle('urgente', s <= 5);
  if (resta <= 0) {
    clearInterval(temporizador);
    // Si al acabarse el tiempo hay algo válido escrito, cuenta.
    const hit = puntuar(partida.preguntas[partida.res.length], $('entrada').value);
    registrar(hit, $('entrada').value, true);
  }
}

function registrar(hit, escrito, porTiempo = false) {
  if (respondida) return;
  respondida = true;
  clearInterval(temporizador);
  const zona = hit ? ZONAS[hit.zona] : FALLO;
  const r = { resp: hit ? hit.texto : (escrito.trim() || '—'), zona: hit ? hit.zona : -1, metros: zona.metros, emoji: zona.emoji };
  partida.res.push(r);
  if (!partida.libre) guardar();

  $('formRespuesta').hidden = true;
  $('entrada').disabled = true;
  $('aviso').textContent = '';
  const res = $('resultado');
  res.className = `resultado z-${zona.id}`;
  $('resEmoji').textContent = zona.emoji;
  $('resZona').textContent = hit ? zona.nombre : (porTiempo ? '¡Se acabó el aire!' : zona.nombre);
  $('resDetalle').textContent = hit
    ? (hit.zona === 4 ? `«${hit.texto}» es la respuesta perfecta` : `«${hit.texto}»`)
    : 'Te quedaste en el mismo sitio';
  $('resMetros').textContent = `+${zona.metros} m`;
  $('btnSiguiente').textContent = partida.res.length >= PREGUNTAS_POR_DIA ? 'Ver resultado' : 'Seguir bajando ↓';
  res.hidden = false;
  if (hit?.zona === 4) res.classList.add('brillo');
  fijarProfundidad(total(partida.res));
  setTimeout(() => $('btnSiguiente').focus(), 50);
}

function responder(e) {
  e.preventDefault();
  if (respondida) return;
  const escrito = $('entrada').value;
  if (!escrito.trim()) return;
  const hit = puntuar(partida.preguntas[partida.res.length], escrito);
  if (!hit) {
    $('aviso').textContent = `«${escrito.trim()}» no está en el registro. Prueba otra.`;
    $('formRespuesta').classList.remove('sacudir');
    void $('formRespuesta').offsetWidth;
    $('formRespuesta').classList.add('sacudir');
    $('entrada').select();
    return;
  }
  registrar(hit, escrito);
}

function terminar() {
  clearInterval(temporizador);
  if (!partida.libre) { datos.dias[hoy].fin = true; guardar(); }
  pintarFinal();
}

function pintarFinal() {
  const metros = total(partida.res);
  const perlas = partida.res.filter((r) => r.zona === 4).length;
  fijarProfundidad(metros, false);
  $('finSub').textContent = partida.libre ? 'Inmersión libre' : `Inmersión #${numero}`;
  $('finTitulo').textContent = metros >= PROFUNDIDAD_FONDO ? '¡Tocaste el fondo! 🏆' : `${metros} m de profundidad`;
  $('finTexto').textContent = mensajeFinal(metros) + ` · ${perlas} ${perlas === 1 ? 'perla' : 'perlas'} 💎`;
  $('resumen').innerHTML = partida.preguntas.map((p, i) => {
    const r = partida.res[i];
    const z = r.zona >= 0 ? ZONAS[r.zona] : FALLO;
    return `<li class="z-${z.id}">
      <div class="r-preg">${esc(p.q)}</div>
      <div class="r-resp"><span>${z.emoji}</span> ${esc(r.resp)} <em>+${r.metros} m</em></div>
      <div class="r-perla">💎 ${esc(p.perla)}</div>
    </li>`;
  }).join('');
  $('btnCompartir').hidden = partida.libre;
  $('btnLibre').textContent = partida.libre ? 'Otra inmersión libre' : 'Inmersión libre';
  mostrar('vistaFinal');
  cuentaAtras();
}

function mensajeFinal(m) {
  if (m >= 700) return 'Alcanzaste el fondo marino con siete perlas perfectas';
  if (m >= 550) return 'Ya ves el lecho marino desde aquí';
  if (m >= 400) return 'Las criaturas abisales te saludan';
  if (m >= 250) return 'Ya no llega la luz del sol';
  if (m >= 120) return 'Bajaste un buen trecho';
  return 'Aún se ve la superficie';
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

let intervaloProxima = null;
function cuentaAtras() {
  clearInterval(intervaloProxima);
  const pintar = () => {
    const ahora = new Date();
    const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
    const s = Math.max(0, Math.floor((manana - ahora) / 1000));
    if (s === 0 && claveDia() !== hoy) { location.reload(); return; }
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    $('proxima').textContent = `Próxima inmersión en ${hh}:${mm}:${ss}`;
  };
  pintar();
  intervaloProxima = setInterval(pintar, 1000);
}

async function compartir() {
  const texto = textoCompartir(numero, partida.res) + '\n' + location.href.split('#')[0];
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text: texto }); return; }
    await navigator.clipboard.writeText(texto);
    toast('Resultado copiado 📋');
  } catch (e) {
    if (e?.name !== 'AbortError') toast('No se pudo copiar');
  }
}

// ---------- estadísticas ----------
function estadisticas() {
  const dias = Object.entries(datos.dias).filter(([, d]) => d.fin).map(([k, d]) => [k, total(d.res), d.res]);
  const jugadas = dias.length;
  const mejor = Math.max(0, ...dias.map((d) => d[1]));
  const media = jugadas ? Math.round(dias.reduce((s, d) => s + d[1], 0) / jugadas) : 0;
  const perlas = dias.reduce((s, d) => s + d[2].filter((r) => r.zona === 4).length, 0);
  const fondos = dias.filter((d) => d[1] >= PROFUNDIDAD_FONDO).length;
  // Racha: días seguidos jugados hasta hoy (o hasta ayer si hoy aún no se jugó).
  const hechos = new Set(dias.map((d) => d[0]));
  let racha = 0;
  const f = new Date();
  if (!hechos.has(claveDia(f))) f.setDate(f.getDate() - 1);
  while (hechos.has(claveDia(f))) { racha++; f.setDate(f.getDate() - 1); }
  const celda = (v, t) => `<div><strong>${v}</strong><span>${t}</span></div>`;
  $('stats').innerHTML = celda(jugadas, 'inmersiones') + celda(racha, 'racha') + celda(`${mejor} m`, 'récord')
    + celda(`${media} m`, 'media') + celda(perlas, 'perlas 💎') + celda(fondos, 'fondos 🏆');
  $('dlgStats').showModal();
}

// ---------- burbujas decorativas ----------
function burbujas() {
  const cont = document.querySelector('.burbujas');
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('i');
    const t = 4 + Math.random() * 8;
    b.style.cssText = `left:${Math.random() * 100}%;width:${t}px;height:${t}px;animation-duration:${8 + Math.random() * 10}s;animation-delay:-${Math.random() * 18}s`;
    cont.appendChild(b);
  }
}

// ---------- arranque ----------
marcas();
tablaZonas($('tablaZonas'));
tablaZonas($('tablaZonas2'));
burbujas();
$('numInmersion').textContent = `Inmersión #${numero}`;
fijarProfundidad(0, false);

$('btnEmpezar').addEventListener('click', () => empezar(false));
$('formRespuesta').addEventListener('submit', responder);
$('btnSiguiente').addEventListener('click', siguientePregunta);
$('btnCompartir').addEventListener('click', compartir);
$('btnLibre').addEventListener('click', () => empezar(true));
$('btnAyuda').addEventListener('click', () => $('dlgAyuda').showModal());
$('btnStats').addEventListener('click', estadisticas);

const deHoy = datos.dias[hoy];
if (deHoy?.fin) {
  nuevaPartida(false);
  pintarFinal();
} else if (deHoy && deHoy.res.length) {
  // Partida a medias: se retoma en la siguiente pregunta.
  $('btnEmpezar').textContent = `Continuar (pregunta ${deHoy.res.length + 1}/7) 🤿`;
  fijarProfundidad(total(deHoy.res), false);
  mostrar('vistaInicio');
} else {
  mostrar('vistaInicio');
  if (!Object.keys(datos.dias).length) $('dlgAyuda').showModal();
}
