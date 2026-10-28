// ════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DEL JUEGO
//  Todo lo que quieras personalizar está aquí: nombres, textos,
//  colores y rutas del arte. No hace falta tocar script.js.
//
//  Para cambiar el arte: reemplaza los archivos dentro de arte/
//  con los chibis del artista, usando EXACTAMENTE los mismos
//  nombres de archivo. No hay que editar nada más.
// ════════════════════════════════════════════════════════════

var CONFIG = {

  // Nombres de los personajes
  centro:  'Gojo', // el que se queda fijo en medio
  movible: 'Vic',  // la que se arrastra

  // Textos que aparecen en pantalla
  textos: {
    titulo:       'Viva el Amor',
    tocaParaEmpezar: 'Toca para empezar',
    cargando:     'Cargando…',
    pregunta:     '¿Llevar a Vic con Gojo?',
    si:           'Sí',
    no:           'No',
    otraOportunidad: '¿Le das otra oportunidad?',
    siOtraVez:    'Sí 🥺',
    juntar:       '¿Juntar a Gojo y Vic?',
    // Mensaje opcional que sale debajo del dibujo final.
    // Déjalo vacío ('') si no quieres mensaje.
    mensajeFinal: '',
    jugarOtraVez: 'Jugar otra vez'
  },

  // Colores
  colores: {
    fondo:  '#eef3ff', // fondo de la pantalla
    acento: '#4f7cff'  // botones
  },

  // Rutas del arte (todas son PNG de 1000×1000 con fondo transparente,
  // excepto el final que es de 1200×1200)
  arte: {
    centro: {
      cuerpo:     'arte/gojo/cuerpo.png',     // normal, con los ojos huecos (transparentes)
      ojos:       'arte/gojo/ojos.png',       // capa de ojos que va DETRÁS del cuerpo y sigue a Vic
      llorando:   'arte/gojo/llorando.png',   // cuando Vic se aleja mucho
      abandonado: 'arte/gojo/abandonado.png'  // cuando le pican "No"
    },
    movible: {
      normal:     'arte/vic/normal.png',      // lejos de Gojo
      confundida: 'arte/vic/confundida.png',  // a media distancia
      timida:     'arte/vic/timida.png',      // muy cerca de Gojo
      molesta:    'arte/vic/molesta.png'      // cuando la arrastran muy rápido
    },
    final: 'arte/final/juntos.png'            // Gojo y Vic juntos (final)
  },

  // Cuánto se mueven los ojos de Gojo para seguir a Vic,
  // como fracción del ancho del dibujo (0.03 = 3% = 30 px en 1000 px)
  movimientoOjos: 0.03
};
