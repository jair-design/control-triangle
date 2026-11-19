// Arrastre con mouse: el movimiento mínimo antes de empezar a arrastrar, para que un clic
// simple (p. ej. en el botón de editar) no se interprete como arrastre.
export const DRAG_MOUSE_DISTANCE_PX = 6

// Arrastre táctil: hay que mantener pulsado un momento, así el dedo todavía puede desplazar la lista.
export const DRAG_TOUCH_DELAY_MS = 200
export const DRAG_TOUCH_TOLERANCE_PX = 8

// La copia que acompaña al puntero tarda esto en posarse sobre su lugar al soltarla.
export const DROP_ANIMATION_MS = 250

// Confirmación de que la tarjeta se guardó en su sitio. Empieza cuando termina de posarse
// (para no encimarse con ella) y no cambia el tamaño ni la posición de la tarjeta.
export const LANDED_ANIMATION_MS = 900
// Cuánto tiempo conserva el tablero la marca "recién soltada": el retraso más la animación.
export const LANDED_DURATION_MS = DROP_ANIMATION_MS + LANDED_ANIMATION_MS + 100

// Textos para lectores de pantalla (dnd-kit los anuncia al mover con el teclado).
export const DND_TEXT = {
  instructions:
    'Para mover la tarjeta pulsa Espacio o Enter. Con las flechas la cambias de posición o de columna; ' +
    'pulsa Espacio o Enter para soltarla, o Escape para cancelar.',
  picked: (title: string) => `Tarjeta «${title}» levantada.`,
  over: (title: string, column: string, position: number) =>
    `Tarjeta «${title}» en «${column}», posición ${position}.`,
  dropped: (title: string, column: string, position: number) =>
    `Tarjeta «${title}» soltada en «${column}», posición ${position}.`,
  cancelled: (title: string) => `Movimiento cancelado. La tarjeta «${title}» vuelve a su sitio.`,
} as const
