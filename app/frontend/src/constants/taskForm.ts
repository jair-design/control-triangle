// Mismos límites que valida el backend (app/backend/src/constants/task.ts).
export const TASK_FORM_LIMITS = {
  title: 120,
  description: 2000,
  assignee: 80,
} as const

// Orden de los campos: el primero con error recibe el foco.
export const TASK_FORM_FIELDS = ['title', 'description', 'status', 'assignee', 'dueDate'] as const

export const TASK_FORM_TEXT = {
  addTask: (columnLabel: string) => `Añadir tarea en ${columnLabel}`,
  editTask: (title: string) => `Editar la tarea «${title}»`,
  title: 'Nueva tarea',
  subtitle: (columnLabel: string) => `Se creará en «${columnLabel}»`,
  close: 'Cerrar',
  optional: 'opcional',
  labels: {
    title: 'Título',
    description: 'Descripción',
    status: 'Estado',
    assignee: 'Persona asignada',
    dueDate: 'Fecha de vencimiento',
  },
  placeholders: {
    title: 'Ej. Revisar el diseño del tablero',
    description: 'Detalles de la tarea',
    assignee: 'Nombre de la persona',
  },
  cancel: 'Cancelar',
  submit: 'Aceptar',
  submitting: 'Creando…',
  created: (columnLabel: string) => `Tarea creada en «${columnLabel}»`,
  editTitle: 'Editar tarea',
  editSubtitle: (columnLabel: string) => `Ahora está en «${columnLabel}»`,
  moveHint: (columnLabel: string) => `Pasará al final de «${columnLabel}»`,
  save: 'Guardar',
  saving: 'Guardando…',
  updated: 'Tarea actualizada',
  delete: 'Eliminar',
  deleting: 'Eliminando…',
  deleted: 'Tarea eliminada',
  deleteConfirmTitle: 'Eliminar tarea',
  deleteConfirmMessage: (title: string) =>
    `¿Seguro que quieres eliminar «${title}»? Esta acción no se puede deshacer.`,
} as const

export const TASK_FORM_ERRORS = {
  titleRequired: 'El título es obligatorio',
  tooLong: (label: string, max: number) => `${label} no puede superar los ${max} caracteres`,
  dueDateInvalid: 'La fecha de vencimiento no es válida',
} as const

// Cuánto tiempo se muestra la confirmación antes de cerrarse sola.
export const TOAST_DURATION_MS = 3500
