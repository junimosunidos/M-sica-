import { PREGUNTAS } from './preguntas.js';
import { EXTRAS } from './extras.js';
import {
  ZONAS, FALLO, PROFUNDIDAD_FONDO, PREGUNTAS_POR_DIA, SEGUNDOS_POR_PREGUNTA,
  prepararPregunta, puntuar, profundidad, claveDia, numeroInmersion, preguntasDelDia, ordenAleatorio, textoCompartir,
} from './motor.js';

const $ = (id) => document.getElementById(id);
const CLAVE_STORAGE = 'abyss:v2'; // v2: fondo a 1000 m (las partidas de v1 eran a 700 m)
const BOMBONAS = 3;
// El script de build pone esto a true en la versión de un solo archivo para artefactos de Claude.
const EN_ARTEFACTO = false;

// ---------- almacenamiento ----------
function cargar() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(CLAVE_STORAGE)); } catch { /* sin almacenamiento */ }
  d = d && typeof d === 'object' ? d : {};
  d.dias ||= {};
  d.ilimitado ||= { partidas: 0, record: 0, maxPreguntas: 0 };
  return d;
}
function guardar() {
  try { localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos)); } catch { /* sin almacenamiento */ }
}
const datos = cargar();

// ---------- estado ----------
const hoy = claveDia();
const numero = numeroInmersion(hoy);
// partida: { modo: 'diaria' | 'ilimitado', ids, preguntas, res, bombonas }
let partida = null;
let temporizador = null;
let limite = 0;
let respondida = false;

const esIlimitado = () => partida?.modo === 'ilimitado';
const sumaMetros = (res) => res.reduce((s, r) => s + r.metros, 0);
// En la diaria el fondo frena en 1000 m; en el modo ilimitado no hay fondo.
const metrosPartida = () => (esIlimitado() ? sumaMetros(partida.res) : profundidad(partida.res));

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

// Escala del medidor: 1000 m en la diaria; en el ilimitado crece de 1000 en 1000.
let escala = 0;
function fijarEscala(metros) {
  const nueva = esIlimitado() ? Math.max(PROFUNDIDAD_FONDO, Math.ceil((metros + 1) / 1000) * 1000) : PROFUNDIDAD_FONDO;
  document.querySelector('.columna').classList.toggle('sin-fondo', esIlimitado());
  if (nueva === escala) return;
  escala = nueva;
  let html = '';
  for (let i = 0; i <= 10; i++) {
    html += `<div class="marca" style="top:${i * 10}%"><span>${(escala / 10) * i}</span></div>`;
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
  fijarEscala(metros);
  const t = metros / PROFUNDIDAD_FONDO;
  document.documentElement.style.setProperty('--agua', colorAgua(t));
  document.documentElement.style.setProperty('--agua-2', colorAgua(Math.min(1, t + 0.18)));
  $('buzo').style.top = `${Math.min(100, (metros / escala) * 100)}%`;
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

function pintarOxigeno() {
  const llenas = '●'.repeat(partida.bombonas);
  const vacias = '●'.repeat(BOMBONAS - partida.bombonas);
  $('oxigeno').innerHTML = `O₂ ${llenas}<span class="vacia">${vacias}</span>`;
  $('oxigeno').title = `${partida.bombonas} de ${BOMBONAS} bombonas de oxígeno`;
}

// ---------- partida ----------
const preparar = (i) => prepararPregunta(PREGUNTAS[i], EXTRAS[PREGUNTAS[i].q]);

function nuevaDiaria() {
  const ids = preguntasDelDia(hoy, PREGUNTAS.length);
  const guardada = datos.dias[hoy];
  partida = {
    modo: 'diaria',
    ids,
    preguntas: ids.map((i) => preparar(i)),
    res: guardada ? guardada.res : [],
  };
  if (!guardada) { datos.dias[hoy] = { res: partida.res, fin: false }; guardar(); }
}

function nuevaIlimitada() {
  partida = { modo: 'ilimitado', ids: [], preguntas: [], res: [], bombonas: BOMBONAS };
}

// En el modo ilimitado las preguntas se generan según hacen falta, en tandas barajadas.
function pregunta(i) {
  if (esIlimitado()) {
    while (partida.ids.length <= i) {
      let tanda = ordenAleatorio(PREGUNTAS.length);
      // Evita repetir la última pregunta al empezar una tanda nueva.
      if (tanda[0] === partida.ids[partida.ids.length - 1]) tanda = [...tanda.slice(1), tanda[0]];
      partida.ids.push(...tanda);
    }
    partida.preguntas[i] ||= preparar(partida.ids[i]);
  }
  return partida.preguntas[i];
}

function empezar(modo) {
  if (modo === 'ilimitado') nuevaIlimitada(); else nuevaDiaria();
  if (modo === 'diaria' && datos.dias[hoy]?.fin) return pintarFinal();
  $('modo').hidden = !esIlimitado();
  $('oxigeno').hidden = !esIlimitado();
  $('btnTerminar').hidden = !esIlimitado();
  if (esIlimitado()) pintarOxigeno();
  fijarProfundidad(metrosPartida(), false);
  mostrar('vistaJuego');
  siguientePregunta();
}

function terminada() {
  return esIlimitado() ? partida.bombonas <= 0 : partida.res.length >= PREGUNTAS_POR_DIA;
}

function siguientePregunta() {
  if (terminada()) return terminar();
  const i = partida.res.length;
  const p = pregunta(i);
  respondida = false;
  $('numPregunta').textContent = esIlimitado() ? `Pregunta ${i + 1}` : `Pregunta ${i + 1}/${PREGUNTAS_POR_DIA}`;
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
    const hit = puntuar(pregunta(partida.res.length), $('entrada').value);
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
  if (!hit && esIlimitado()) { partida.bombonas--; pintarOxigeno(); }
  if (!esIlimitado()) guardar();

  $('formRespuesta').hidden = true;
  $('entrada').disabled = true;
  $('aviso').textContent = '';
  const res = $('resultado');
  res.className = `resultado z-${zona.id}`;
  $('resEmoji').textContent = zona.emoji;
  $('resZona').textContent = hit ? zona.nombre : (porTiempo ? '¡Se acabó el tiempo!' : zona.nombre);
  let detalle = hit
    ? (hit.zona === 4 ? `«${hit.texto}» es la respuesta perfecta` : `«${hit.texto}»`)
    : 'Te quedaste en el mismo sitio';
  if (!hit && esIlimitado()) {
    detalle = partida.bombonas > 0
      ? `Gastaste una bombona: te ${partida.bombonas === 1 ? 'queda 1' : `quedan ${partida.bombonas}`}`
      : 'Te quedaste sin oxígeno';
  }
  $('resDetalle').textContent = detalle;
  $('resMetros').textContent = `+${zona.metros} m`;
  $('btnSiguiente').textContent = terminada() ? 'Ver resultado' : 'Seguir bajando ↓';
  res.hidden = false;
  if (hit?.zona === 4) res.classList.add('brillo');
  fijarProfundidad(metrosPartida());
  setTimeout(() => $('btnSiguiente').focus(), 50);
}

function responder(e) {
  e.preventDefault();
  if (respondida) return;
  const escrito = $('entrada').value;
  if (!escrito.trim()) return;
  const hit = puntuar(pregunta(partida.res.length), escrito);
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

let nuevoRecord = false;
function terminar() {
  clearInterval(temporizador);
  nuevoRecord = false;
  if (esIlimitado()) {
    // Si sale a la superficie a mitad de pregunta, esa pregunta no cuenta.
    const s = datos.ilimitado;
    const metros = metrosPartida();
    s.partidas++;
    if (metros > s.record) { s.record = metros; nuevoRecord = metros > 0; }
    s.maxPreguntas = Math.max(s.maxPreguntas, partida.res.length);
  } else {
    datos.dias[hoy].fin = true;
  }
  guardar();
  pintarFinal();
}

function pintarFinal() {
  const ilimitado = esIlimitado();
  const metros = metrosPartida();
  const perlas = partida.res.filter((r) => r.zona === 4).length;
  fijarProfundidad(metros, false);
  const textoPerlas = `${perlas} ${perlas === 1 ? 'perla' : 'perlas'} 💎`;
  if (ilimitado) {
    const n = partida.res.length;
    $('finSub').textContent = 'Modo ilimitado ♾️';
    $('finTitulo').textContent = nuevoRecord ? `¡Nuevo récord! ${metros} m 🏆` : `${metros} m de profundidad`;
    $('finTexto').textContent = `${n} ${n === 1 ? 'pregunta' : 'preguntas'} · ${textoPerlas} · Récord: ${datos.ilimitado.record} m`;
  } else {
    $('finSub').textContent = `Inmersión #${numero}`;
    $('finTitulo').textContent = metros >= PROFUNDIDAD_FONDO ? '¡Tocaste el fondo! 🏆' : `${metros} m de profundidad`;
    $('finTexto').textContent = `${mensajeFinal(metros)} · ${textoPerlas}`;
  }
  $('resumen').innerHTML = partida.res.map((r, i) => {
    const p = pregunta(i);
    const z = r.zona >= 0 ? ZONAS[r.zona] : FALLO;
    return `<li class="z-${z.id}">
      <div class="r-preg">${esc(p.q)}</div>
      <div class="r-resp"><span>${z.emoji}</span> ${esc(r.resp)} <em>+${r.metros} m</em></div>
      <div class="r-perla">💎 ${esc(p.perla)}</div>
    </li>`;
  }).join('');
  $('btnCompartir').hidden = false;
  $('btnIlimitadoFin').textContent = ilimitado ? 'Jugar otra vez ♾️' : 'Modo ilimitado ♾️';
  $('btnDiaria').hidden = !ilimitado;
  $('btnDiaria').textContent = datos.dias[hoy]?.fin ? 'Ver la del día' : 'Inmersión del día';
  mostrar('vistaFinal');
  cuentaAtras();
}

function mensajeFinal(m) {
  if (m >= 1000) return 'Alcanzaste el fondo marino con siete perlas perfectas';
  if (m >= 800) return 'Ya ves el lecho marino desde aquí';
  if (m >= 570) return 'Las criaturas abisales te saludan';
  if (m >= 360) return 'Ya no llega la luz del sol';
  if (m >= 170) return 'Bajaste un buen trecho';
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
    $('proxima').textContent = datos.dias[hoy]?.fin
      ? `Próxima inmersión del día en ${hh}:${mm}:${ss}`
      : 'La inmersión de hoy aún te espera';
  };
  pintar();
  intervaloProxima = setInterval(pintar, 1000);
}

function textoResultado() {
  if (esIlimitado()) {
    const fila = partida.res.map((r) => r.emoji).join('');
    return `🤿 ABYSS ♾️ · ${metrosPartida()} m en ${partida.res.length} preguntas\n${fila}`;
  }
  return textoCompartir(numero, partida.res);
}

async function compartir() {
  const enlace = EN_ARTEFACTO ? '' : '\n' + location.href.split('#')[0];
  const texto = textoResultado() + enlace;
  if (!EN_ARTEFACTO && navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ text: texto }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(texto);
    toast('Resultado copiado 📋');
  } catch {
    // Sin portapapeles (p. ej. dentro de un artefacto): se muestra para copiarlo a mano.
    $('textoCompartir').value = texto;
    $('dlgCompartir').showModal();
    $('textoCompartir').select();
  }
}

// ---------- estadísticas ----------
function estadisticas() {
  const dias = Object.entries(datos.dias).filter(([, d]) => d.fin).map(([k, d]) => [k, profundidad(d.res), d.res]);
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
  const il = datos.ilimitado;
  const celda = (v, t) => `<div><strong>${v}</strong><span>${t}</span></div>`;
  $('stats').innerHTML = '<h3>Inmersión del día</h3>'
    + celda(jugadas, 'inmersiones') + celda(racha, 'racha') + celda(`${mejor} m`, 'récord')
    + celda(`${media} m`, 'media') + celda(perlas, 'perlas 💎') + celda(fondos, 'fondos 🏆')
    + '<h3>Modo ilimitado ♾️</h3>'
    + celda(il.partidas, 'partidas') + celda(`${il.record} m`, 'récord') + celda(il.maxPreguntas, 'máx. preguntas');
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
tablaZonas($('tablaZonas'));
tablaZonas($('tablaZonas2'));
burbujas();
$('numInmersion').textContent = `Inmersión #${numero}`;
fijarProfundidad(0, false);

$('btnEmpezar').addEventListener('click', () => empezar('diaria'));
$('btnIlimitado').addEventListener('click', () => empezar('ilimitado'));
$('btnIlimitadoFin').addEventListener('click', () => empezar('ilimitado'));
$('btnDiaria').addEventListener('click', () => empezar('diaria'));
$('btnTerminar').addEventListener('click', terminar);
$('formRespuesta').addEventListener('submit', responder);
$('btnSiguiente').addEventListener('click', siguientePregunta);
$('btnCompartir').addEventListener('click', compartir);
$('btnAyuda').addEventListener('click', () => $('dlgAyuda').showModal());
$('btnStats').addEventListener('click', estadisticas);

const deHoy = datos.dias[hoy];
if (deHoy?.fin) {
  $('btnEmpezar').textContent = 'Ver la inmersión de hoy ✅';
} else if (deHoy && deHoy.res.length) {
  // Partida a medias: se retoma en la siguiente pregunta.
  $('btnEmpezar').textContent = `Continuar la del día (pregunta ${deHoy.res.length + 1}/7) 🤿`;
}
mostrar('vistaInicio');
if (!deHoy && !Object.keys(datos.dias).length && !datos.ilimitado.partidas) $('dlgAyuda').showModal();
