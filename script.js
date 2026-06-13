// ── Referencias a elementos ──
const charA        = document.getElementById('charA');
const charB        = document.getElementById('charB');
const bubble       = document.getElementById('bubble');
const cuadroJuntar = document.getElementById('cuadroJuntar');
const abrazoFinal  = document.getElementById('abrazoFinal');

const imgA    = document.getElementById('cuerpoA');
const pupilasA = document.getElementById('pupilasA');
const imgB    = charB.querySelector('img');

// ── Rutas de imágenes ──
const IMGS_A = {
  normal:              'personajeA/cuerpo.png',
  llorando:            'personajeA/manzanaLlorando.png',
  llorandoPorAbandono: 'personajeA/llorandoPorAbandono.png'
};

const IMGS_B = {
  normal:       'personajeB/naranjaNormal.png',
  sacadaDePedo: 'personajeB/naranjaSacadaDePedo.png',
  timida:       'personajeB/naranjaTimida.png',
  molesta:      'personajeB/naranjaMolesta.png'
};

// ── Distancias como porcentaje del gameArea (0.0 a 1.0) ──
// Así funcionan igual sin importar el tamaño de pantalla
// Fracciones de la diagonal de la ventana (calibradas en 1920×1080),
// así las distancias se sienten igual en celular y en laptop
const DIAG_REF = Math.hypot(1920, 1080);
const F_LLORAR = 350 / DIAG_REF;
const F_MEDIA  = 300 / DIAG_REF;
const F_CERCA  = 200 / DIAG_REF;

// Diagonal actual de la ventana (se recalcula siempre, soporta resize/rotación)
function diag() {
  return Math.hypot(window.innerWidth, window.innerHeight);
}

// ── Perímetro invisible alrededor de manzana para "juntar" ──
const F_MARGEN_JUNTAR = 0.2; // fracción del tamaño del personaje

// ── Velocidad a partir de la cual naranja se molesta ──
const F_VELOCIDAD_MOLESTA = 1.5 / DIAG_REF; // proporcional a la pantalla
const TIEMPO_MOLESTA = 150; // ms seguidos a esa velocidad para molestarse

// ── Estados actuales ──
let estadoA = 'normal';
let estadoB = 'normal';

// ── Distancia inicial entre A y B (se guarda cuando aparece naranja) ──
let distanciaInicial = null;

// ── Variables para calcular velocidad de naranja ──
let posAnteriorX = null;
let posAnteriorY = null;
let tiempoAnterior = null;
let tiempoRapido = 0; // ms acumulados moviéndose rápido
let timeoutMolesta = null;

// ── Botones del globo ──
function onSi() {
  bubble.style.display = 'none';
  charB.classList.add('visible');

  // Guardar la distancia inicial justo cuando naranja aparece
  distanciaInicial = getDistancia();
}

function onNo() {
  bubble.style.display = 'none';
  imgA.src = IMGS_A.llorandoPorAbandono;
}

// ── Botones del cuadro de juntar ──
function onJuntarSi() {
  // Ocultar ambos personajes y mostrar el abrazo
  charA.style.display        = 'none';
  charB.style.display        = 'none';
  cuadroJuntar.style.display = 'none';
  abrazoFinal.classList.add('visible');
}

function onJuntarNo() {
  // Cerrar el cuadro y dejar que sigan jugando
  cuadroJuntar.classList.remove('visible');
}

// ── Variables del drag ──
let dragging = false;
let offX = 0;
let offY = 0;

// ── Drag con mouse ──
charB.addEventListener('mousedown', (e) => {
  dragging = true;
  const rect = charB.getBoundingClientRect();
  offX = e.clientX - rect.left - rect.width / 2;
  offY = e.clientY - rect.top  - rect.height / 2;
  charB.style.cursor = 'grabbing';
  posAnteriorX = e.clientX;
  posAnteriorY = e.clientY;
  tiempoAnterior = performance.now();
  tiempoRapido = 0;
});

document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  charB.style.left      = (e.clientX - offX) + 'px';
  charB.style.top       = (e.clientY - offY) + 'px';
  charB.style.transform = 'translate(-50%, -50%)';
  revisarVelocidad(e.clientX, e.clientY);
  revisarDistancia();
  moverPupilas();
});

document.addEventListener('mouseup', () => {
  dragging = false;
  charB.style.cursor = 'grab';
  posAnteriorX = null;
  posAnteriorY = null;
  tiempoAnterior = null;
  tiempoRapido = 0;
  // Al soltar, espera 1 segundo y vuelve a la emoción por distancia
  timeoutMolesta = setTimeout(() => {
    if (estadoB === 'molesta') {
      estadoB = 'normal';
      imgB.src = IMGS_B.normal; // resetea la imagen por si la distancia ya es "normal"
    }
    revisarDistancia();
  }, 1000);
});

// ── Drag con touch (celular) ──
charB.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  const rect = charB.getBoundingClientRect();
  offX = t.clientX - rect.left - rect.width / 2;
  offY = t.clientY - rect.top  - rect.height / 2;
  dragging = true;
  posAnteriorX = t.clientX;
  posAnteriorY = t.clientY;
  tiempoAnterior = performance.now();
  tiempoRapido = 0;
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!dragging) return;
  e.preventDefault();
  const t = e.touches[0];
  charB.style.left      = (t.clientX - offX) + 'px';
  charB.style.top       = (t.clientY - offY) + 'px';
  charB.style.transform = 'translate(-50%, -50%)';
  revisarVelocidad(t.clientX, t.clientY);
  revisarDistancia();
  moverPupilas();
}, { passive: false });

document.addEventListener('touchend', () => {
  dragging = false;
  posAnteriorX = null;
  posAnteriorY = null;
  tiempoAnterior = null;
  tiempoRapido = 0;
  timeoutMolesta = setTimeout(() => {
    if (estadoB === 'molesta') {
      estadoB = 'normal';
      imgB.src = IMGS_B.normal;
    }
    revisarDistancia();
  }, 1000);
});

// ── Distancia máxima posible en la dirección actual de naranja ──
// (del centro de manzana hasta el borde de la ventana, pasando por naranja)
function getDistanciaMaxima() {
  const rA = charA.getBoundingClientRect();
  const rB = charB.getBoundingClientRect();

  const ax = rA.left + rA.width  / 2;
  const ay = rA.top  + rA.height / 2;
  const dx = (rB.left + rB.width  / 2) - ax;
  const dy = (rB.top  + rB.height / 2) - ay;

  const dist = Math.hypot(dx, dy);
  if (dist === 0) return Infinity;

  // ¿cuántas veces puedo extender el vector (dx,dy) antes de tocar un borde?
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (window.innerWidth  - ax) / dx);
  if (dx < 0) t = Math.min(t, -ax / dx);
  if (dy > 0) t = Math.min(t, (window.innerHeight - ay) / dy);
  if (dy < 0) t = Math.min(t, -ay / dy);

  return dist * t;
}

// ── Calcular distancia entre A y B ──
function getDistancia() {
  const rA = charA.getBoundingClientRect();
  const rB = charB.getBoundingClientRect();

  const ax = rA.left + rA.width  / 2;
  const ay = rA.top  + rA.height / 2;
  const bx = rB.left + rB.width  / 2;
  const by = rB.top  + rB.height / 2;

  return Math.hypot(bx - ax, by - ay);
}

// ── Revisar velocidad y poner naranja molesta si va muy rápido ──
function revisarVelocidad(x, y) {
  const ahora = performance.now();

  if (posAnteriorX === null || tiempoAnterior === null) {
    posAnteriorX = x;
    posAnteriorY = y;
    tiempoAnterior = ahora;
    return;
  }

  const dt = ahora - tiempoAnterior;
  if (dt <= 0) return;

  // Velocidad real en px/ms (independiente de la frecuencia de eventos)
  const velocidad = Math.hypot(x - posAnteriorX, y - posAnteriorY) / dt;
  posAnteriorX = x;
  posAnteriorY = y;
  tiempoAnterior = ahora;

  // Solo se molesta si el movimiento rápido se mantiene un rato
  if (velocidad > F_VELOCIDAD_MOLESTA * diag()) {
    tiempoRapido += dt;
  } else {
    tiempoRapido = 0;
  }

  if (tiempoRapido >= TIEMPO_MOLESTA) {
    if (timeoutMolesta) clearTimeout(timeoutMolesta);

    if (estadoB !== 'molesta') {
      estadoB = 'molesta';
      imgB.src = IMGS_B.molesta;
    }
  }
}

// ── Mover pupilas hacia naranja ──
const F_PUPILA = 10 / 150; // movimiento máximo como fracción del tamaño del personaje

function moverPupilas() {
  // Si manzana está llorando o abandonada, ocultar pupilas
  if (estadoA !== 'normal') {
    pupilasA.style.display = 'none';
    return;
  }
  pupilasA.style.display = 'block';

  const rA = document.getElementById('charACapas').getBoundingClientRect();
  const rB = charB.getBoundingClientRect();

  const ax = rA.left + rA.width  / 2;
  const ay = rA.top  + rA.height / 2;
  const bx = rB.left + rB.width  / 2;
  const by = rB.top  + rB.height / 2;

  // Ángulo hacia naranja
  const angulo = Math.atan2(by - ay, bx - ax);

  // Mover pupilas en esa dirección dentro del radio máximo
  // (proporcional al tamaño actual del personaje)
  const maxPupila = rA.width * F_PUPILA;
  const dx = Math.cos(angulo) * maxPupila;
  const dy = Math.sin(angulo) * maxPupila;

  pupilasA.style.transform = `translate(${dx}px, ${dy}px)`;
}

// ── Revisar distancia y cambiar imágenes si hace falta ──
function revisarDistancia() {
  if (distanciaInicial === null) return;

  const dist = getDistancia();

  // Distancias de hoy según el tamaño actual de la ventana
  const dLlorar = F_LLORAR * diag();
  const dMedia  = F_MEDIA  * diag();
  const dCerca  = F_CERCA  * diag();

  // ── Cuadro de juntar: perímetro invisible alrededor de manzana ──
  // Se activa cuando los BORDES de ambos están cerca,
  // sin importar de qué lado llegue naranja
  const a = document.getElementById('charACapas').getBoundingClientRect();
  const b = charB.getBoundingClientRect();
  const margen = a.width * F_MARGEN_JUNTAR; // proporcional al personaje
  const cerca = !(b.left   > a.right  + margen ||
                  b.right  < a.left   - margen ||
                  b.top    > a.bottom + margen ||
                  b.bottom < a.top    - margen);

  if (cerca) {
    cuadroJuntar.classList.add('visible');
  } else {
    cuadroJuntar.classList.remove('visible');
  }

  // ── Manzana (A) ──
  // Umbral: el fijo de siempre, pero nunca mayor al 80% del espacio
  // disponible en esa dirección (si no, en vertical nunca se alcanza)
  const umbralLlorar = Math.min(
    distanciaInicial + dLlorar,
    getDistanciaMaxima() * 0.8
  );

  if (dist > umbralLlorar && estadoA !== 'llorando') {
    estadoA = 'llorando';
    imgA.src = IMGS_A.llorando;
  } else if (dist <= umbralLlorar && estadoA !== 'normal') {
    estadoA = 'normal';
    imgA.src = IMGS_A.normal;
  }

  // ── Naranja (B) — solo si no está molesta ──
  if (estadoB === 'molesta') return;

  if (dist <= dCerca && estadoB !== 'timida') {
    estadoB = 'timida';
    imgB.src = IMGS_B.timida;
  } else if (dist > dCerca && dist <= dMedia && estadoB !== 'sacadaDePedo') {
    estadoB = 'sacadaDePedo';
    imgB.src = IMGS_B.sacadaDePedo;
  } else if (dist > dMedia && estadoB !== 'normal') {
    estadoB = 'normal';
    imgB.src = IMGS_B.normal;
  }
}