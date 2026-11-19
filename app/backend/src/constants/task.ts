// Mismos estados que el tipo TaskStatus del frontend.
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const DEFAULT_TASK_STATUS: TaskStatus = 'todo'

export const TASK_TITLE_MAX_LENGTH = 120
export const TASK_DESCRIPTION_MAX_LENGTH = 2000
export const TASK_ASSIGNEE_MAX_LENGTH = 80

// La primera posición de una columna. El orden dentro de la columna es ascendente.
export const TASK_MIN_POSITION = 0

// Nombre de la colección en MongoDB (Mongoose lo pluraliza a partir del modelo).
export const TASK_MODEL_NAME = 'Task'
