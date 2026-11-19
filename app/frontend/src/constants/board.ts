import type { TaskStatus } from '../types/board'

export interface BoardColumnConfig {
  status: TaskStatus
  label: string
  // Clases de Tailwind escritas completas para que el compilador las detecte.
  styles: {
    // Punto del encabezado y barra lateral de las tarjetas.
    accent: string
    // Contenedor de la columna: borde superior y fondo tenue.
    panel: string
    // Contador de tarjetas.
    badge: string
  }
}

// Orden de izquierda a derecha. Los colores salen de los tokens status-* del tema (index.css).
export const BOARD_COLUMNS: readonly BoardColumnConfig[] = [
  {
    status: 'todo',
    label: 'To Do',
    styles: {
      accent: 'bg-status-todo-500',
      panel: 'border-t-status-todo-500 bg-status-todo-50/60',
      badge: 'text-status-todo-700',
    },
  },
  {
    status: 'in_progress',
    label: 'En progreso',
    styles: {
      accent: 'bg-status-progress-500',
      panel: 'border-t-status-progress-500 bg-status-progress-50/60',
      badge: 'text-status-progress-700',
    },
  },
  {
    status: 'done',
    label: 'Completado',
    styles: {
      accent: 'bg-status-done-500',
      panel: 'border-t-status-done-500 bg-status-done-50/60',
      badge: 'text-status-done-700',
    },
  },
]

export const BOARD_TEXT = {
  boardLabel: 'Tablero de tareas',
  emptyColumn: 'Sin tarjetas',
  loadingColumn: 'Cargando tareas…',
  retry: 'Reintentar',
  unassigned: 'Sin asignar',
  cardCount: (count: number) => (count === 1 ? '1 tarjeta' : `${count} tarjetas`),
} as const

// Formato de la fecha de vencimiento en la tarjeta (p. ej. "12 nov").
export const DATE_LOCALE = 'es'
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
}

// Letras que se muestran en el avatar de la persona asignada.
export const MAX_AVATAR_INITIALS = 2
