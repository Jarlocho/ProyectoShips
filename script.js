// ════════════════════════════════════════════════════════════
//  Viva el Amor — lógica del juego
//  (los nombres, textos y el arte se cambian en config.js)
// ════════════════════════════════════════════════════════════

// ── Elementos ──
const $ = (id) => document.getElementById(id);

const inicio       = $('inicio');
const charA        = $('charA');
const capasA       = $('charACapas');
const cuerpoA      = $('cuerpoA');
const ojosA        = $('ojosA');
const charB        = $('charB');
const imgB         = $('imgB');
const bubble       = $('bubble');
const bubbleText   = $('bubbleText');
const btnSi        = $('btnSi');
const btnNo        = $('btnNo');
const cuadroJuntar = $('cuadroJuntar');
const final        = $('final');
const imgFinal     = $('imgFinal');
const btnPC        = $('btnPantallaCompleta');

const T    = CONFIG.textos;
const ARTE = CONFIG.arte;

// ── Aplicar textos y colores de config.js ──
document.title = T.titulo;
$('inicioTitulo').textContent = T.titulo;
$('inicioTexto').textContent  = T.cargando;
$('juntarText').textContent   = T.juntar;
$('btnJuntarSi').textContent  = T.si;
$('btnJuntarNo').textContent  = T.no;
$('mensajeFinal').textContent = T.mensajeFinal || '';
$('btnOtraVez').textContent   = T.jugarOtraVez;
document.documentElement.style.setProperty('--fondo',  CONFIG.colores.fondo);
document.documentElement.style.setProperty('--acento', CONFIG.colores.acento);

cuerpoA.alt = CONFIG.centro;
imgB.alt    = CONFIG.movible;
imgFinal.alt = `${CONFIG.centro} y ${CONFIG.movible}`;
imgFinal.src = ARTE.final;

// ── Distancias, en múltiplos del tamaño del personaje ──
// Así se sienten igual en celular y en compu.
const K_CERCA  = 1.3; // a esta distancia (centro a centro) Vic se pone tímida
const K_MEDIA  = 2.0; // a esta distancia Vic se confunde
const K_LLORAR = 2.0; // si se aleja esto MÁS que al inicio, Gojo llora
const K_MARGEN_JUNTAR = 0.2; // perímetro invisible alrededor de Gojo para "juntar"

// ── Velocidad a partir de la cual Vic se molesta ──
const K_VELOCIDAD_MOLESTA = 0.0085; // tamaños de personaje por milisegundo
const TIEMPO_MOLESTA = 180;         // ms seguidos a esa velocidad

// ── Estado ──
let estadoA = 'normal';   // normal | llorando | abandonado
let estadoB = 'normal';   // normal | confundida | timida | molesta
let distanciaInicial = null;
let terminado = false;

// ════════════════════════════════════════════════════════════
//  Carga del arte y pantalla de inicio
// ════════════════════════════════════════════════════════════

function todasLasImagenes() {
  return [
    ...Object.values(ARTE.centro),
    ...Object.values(ARTE.movible),
    ARTE.final
  ];
}

function precargar(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload  = () => ok(true);
    img.onerror = () => { console.warn('No se encontró la imagen:', src); ok(false); };
    img.src = src;
  });
}

Promise.all(todasLasImagenes().map(precargar)).then(() => {
  inicio.classList.remove('cargando');
  $('inicioTexto').textContent = T.tocaParaEmpezar;
  inicio.addEventListener('click', empezar, { once: true });
});

function empezar() {
  pedirPantallaCompleta();
  inicio.classList.add('oculto');
  reiniciar();
}

// ════════════════════════════════════════════════════════════
//  Pantalla completa
// ════════════════════════════════════════════════════════════

const puedePantallaCompleta =
  !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

function enPantallaCompleta() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement) ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function pedirPantallaCompleta() {
  if (enPantallaCompleta()) return;
  const el = document.documentElement;
  try {
    const p = el.requestFullscreen
      ? el.requestFullscreen({ navigationUI: 'hide' })
      : el.webkitRequestFullscreen && el.webkitRequestFullscreen();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* el navegador no lo permite; no pasa nada */ }
}

function actualizarBotonPC() {
  const mostrar = puedePantallaCompleta && !enPantallaCompleta() && inicio.classList.contains('oculto');
  btnPC.classList.toggle('visible', mostrar);
}

btnPC.addEventListener('click', pedirPantallaCompleta);
document.addEventListener('fullscreenchange', actualizarBotonPC);
document.addEventListener('webkitfullscreenchange', actualizarBotonPC);

// ════════════════════════════════════════════════════════════
//  Flujo del juego
// ════════════════════════════════════════════════════════════

function reiniciar() {
  terminado = false;
  estadoA = 'normal';
  estadoB = 'normal';
  distanciaInicial = null;

  cuerpoA.src = ARTE.centro.cuerpo;
  ojosA.src   = ARTE.centro.ojos;
  ojosA.style.display = 'block';
  ojosA.style.transform = '';
  imgB.src = ARTE.movible.normal;

  charA.style.display = '';
  charB.style.display = '';
  charB.classList.remove('visible');
  charB.style.left = '';
  charB.style.top  = '';

  final.classList.remove('visible');
  cuadroJuntar.classList.remove('visible');

  mostrarPregunta(T.pregunta, true);
  actualizarBotonPC();
}

function mostrarPregunta(texto, conNo) {
  bubbleText.textContent = texto;
  btnSi.textContent = conNo ? T.si : T.siOtraVez;
  btnNo.textContent = T.no;
  btnNo.hidden = !conNo;
  bubble.classList.add('visible');
}

btnSi.addEventListener('click', () => {
  bubble.classList.remove('visible');

  // Si estaba abandonado, vuelve a la normalidad
  estadoA = 'normal';
  cuerpoA.src = ARTE.centro.cuerpo;
  ojosA.style.display = 'block';

  charB.classList.add('visible');
  limitarDentroDePantalla();
  distanciaInicial = getDistancia();
  moverOjos();
});

btnNo.addEventListener('click', () => {
  bubble.classList.remove('visible');
  estadoA = 'abandonado';
  cuerpoA.src = ARTE.centro.abandonado;
  ojosA.style.display = 'none';

  // Después de un ratito, le da otra oportunidad
  setTimeout(() => {
    if (estadoA === 'abandonado') mostrarPregunta(T.otraOportunidad, false);
  }, 2500);
});

$('btnJuntarSi').addEventListener('click', () => {
  terminado = true;
  charA.style.display = 'none';
  charB.style.display = 'none';
  cuadroJuntar.classList.remove('visible');
  final.classList.add('visible');
});

$('btnJuntarNo').addEventListener('click', () => {
  cuadroJuntar.classList.remove('visible');
});

$('btnOtraVez').addEventListener('click', reiniciar);

// ════════════════════════════════════════════════════════════
//  Arrastrar (mouse y dedo, con Pointer Events)
// ════════════════════════════════════════════════════════════

let dragging = false;
let offX = 0, offY = 0;
let posAnteriorX = null, posAnteriorY = null, tiempoAnterior = null;
let tiempoRapido = 0;
let timeoutMolesta = null;

function tam() {
  return capasA.getBoundingClientRect().width;
}

charB.addEventListener('pointerdown', (e) => {
  if (terminado) return;
  e.preventDefault();
  dragging = true;
  charB.setPointerCapture(e.pointerId);
  charB.classList.add('agarrada');

  const r = charB.getBoundingClientRect();
  offX = e.clientX - (r.left + r.width / 2);
  offY = e.clientY - (r.top  + r.height / 2);

  posAnteriorX = e.clientX;
  posAnteriorY = e.clientY;
  tiempoAnterior = performance.now();
  tiempoRapido = 0;
  if (timeoutMolesta) clearTimeout(timeoutMolesta);
});

charB.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  e.preventDefault();
  colocarB(e.clientX - offX, e.clientY - offY);
  revisarVelocidad(e.clientX, e.clientY);
  revisarDistancia();
  moverOjos();
});

function soltar() {
  if (!dragging) return;
  dragging = false;
  charB.classList.remove('agarrada');
  posAnteriorX = posAnteriorY = tiempoAnterior = null;
  tiempoRapido = 0;

  // Al soltar, espera 1 segundo y vuelve a la emoción por distancia
  timeoutMolesta = setTimeout(() => {
    if (estadoB === 'molesta') ponerB('normal');
    revisarDistancia();
  }, 1000);
}

charB.addEventListener('pointerup', soltar);
charB.addEventListener('pointercancel', soltar);
charB.addEventListener('lostpointercapture', soltar);

// Coloca a Vic en (x, y) sin dejar que se salga de la pantalla
function colocarB(x, y) {
  if (!window.innerWidth || !window.innerHeight) return; // ventana aún sin tamaño
  const medio = tam() / 2;
  x = Math.min(Math.max(x, medio), window.innerWidth  - medio);
  y = Math.min(Math.max(y, medio), window.innerHeight - medio);
  charB.style.left = x + 'px';
  charB.style.top  = y + 'px';
}

function limitarDentroDePantalla() {
  if (!charB.classList.contains('visible')) return;
  const r = charB.getBoundingClientRect();
  colocarB(r.left + r.width / 2, r.top + r.height / 2);
}

window.addEventListener('resize', () => {
  limitarDentroDePantalla();
  moverOjos();
  actualizarBotonPC();
});

// ════════════════════════════════════════════════════════════
//  Emociones
// ════════════════════════════════════════════════════════════

function ponerB(estado) {
  if (estadoB === estado) return;
  estadoB = estado;
  imgB.src = ARTE.movible[estado];
}

function ponerA(estado) {
  if (estadoA === estado) return;
  estadoA = estado;
  cuerpoA.src = estado === 'llorando' ? ARTE.centro.llorando : ARTE.centro.cuerpo;
  ojosA.style.display = estado === 'normal' ? 'block' : 'none';
}

function centro(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function getDistancia() {
  const a = centro(capasA), b = centro(charB);
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Hasta dónde puede llegar Vic en la dirección en la que está ahorita
// (del centro de Gojo hasta donde Vic topa con la orilla de la pantalla).
// En un celular vertical hay mucho menos espacio a los lados que arriba/abajo.
function getDistanciaMaxima() {
  const a = centro(capasA), b = centro(charB);
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return Infinity;

  const medio = tam() / 2;
  const minX = medio, maxX = window.innerWidth  - medio;
  const minY = medio, maxY = window.innerHeight - medio;

  let k = Infinity;
  if (dx > 0) k = Math.min(k, (maxX - a.x) / dx);
  if (dx < 0) k = Math.min(k, (minX - a.x) / dx);
  if (dy > 0) k = Math.min(k, (maxY - a.y) / dy);
  if (dy < 0) k = Math.min(k, (minY - a.y) / dy);
  return dist * Math.max(k, 0);
}

// Umbrales de las emociones para la dirección actual.
// Normalmente se usan las distancias fijas (K_*), pero si en esa dirección
// no hay espacio suficiente, se reparten proporcionalmente para que TODAS
// las emociones se puedan activar, sin importar si Vic va hacia los lados,
// hacia arriba o hacia abajo.
function umbrales() {
  const t = tam();
  const espacio = getDistanciaMaxima();
  return {
    cerca:  Math.min(K_CERCA * t, espacio * 0.40),
    media:  Math.min(K_MEDIA * t, espacio * 0.62),
    llorar: Math.min(distanciaInicial + K_LLORAR * t, espacio * 0.85),
    // margen del globo de juntar: si casi no hay espacio, se hace más chico
    margen: Math.min(K_MARGEN_JUNTAR * t, Math.max(0, (espacio - t) * 0.3))
  };
}

function revisarVelocidad(x, y) {
  const ahora = performance.now();
  if (posAnteriorX === null) {
    posAnteriorX = x; posAnteriorY = y; tiempoAnterior = ahora;
    return;
  }
  const dt = ahora - tiempoAnterior;
  if (dt <= 0) return;

  const velocidad = Math.hypot(x - posAnteriorX, y - posAnteriorY) / dt;
  posAnteriorX = x; posAnteriorY = y; tiempoAnterior = ahora;

  if (velocidad > K_VELOCIDAD_MOLESTA * tam()) tiempoRapido += dt;
  else tiempoRapido = 0;

  if (tiempoRapido >= TIEMPO_MOLESTA) ponerB('molesta');
}

function revisarDistancia() {
  if (distanciaInicial === null || terminado) return;

  const dist = getDistancia();
  const u = umbrales();

  // ── Globo de juntar: cuando los bordes están cerca ──
  const a = capasA.getBoundingClientRect();
  const b = charB.getBoundingClientRect();
  const cerca = !(b.left   > a.right  + u.margen ||
                  b.right  < a.left   - u.margen ||
                  b.top    > a.bottom + u.margen ||
                  b.bottom < a.top    - u.margen);
  cuadroJuntar.classList.toggle('visible', cerca);

  // ── Gojo llora si Vic se aleja demasiado ──
  ponerA(dist > u.llorar ? 'llorando' : 'normal');

  // ── Vic, según la distancia (si no está molesta) ──
  if (estadoB === 'molesta') return;
  if (dist <= u.cerca)      ponerB('timida');
  else if (dist <= u.media) ponerB('confundida');
  else                      ponerB('normal');
}

// ── Los ojos de Gojo siguen a Vic ──
function moverOjos() {
  if (estadoA !== 'normal' || !charB.classList.contains('visible')) {
    ojosA.style.transform = '';
    return;
  }
  const a = centro(capasA), b = centro(charB);
  const angulo = Math.atan2(b.y - a.y, b.x - a.x);
  const max = tam() * CONFIG.movimientoOjos;
  ojosA.style.transform =
    `translate(${Math.cos(angulo) * max}px, ${Math.sin(angulo) * max}px)`;
}
