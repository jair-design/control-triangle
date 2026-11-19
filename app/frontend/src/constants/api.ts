// El proxy de Vite reenvía todo lo que empiece por /api al backend.
export const API_BASE_PATH = '/api'

export const TASKS_PATH = '/tasks'

export const HTTP_STATUS = {
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  conflict: 409,
} as const

// Estado que se usa cuando la petición ni siquiera llegó al servidor.
export const NETWORK_ERROR_STATUS = 0

export const API_ERROR_TEXT = {
  network: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  unauthorized: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  validation: 'Revisa los datos del formulario.',
  createTask: 'No se pudo crear la tarea. Inténtalo de nuevo.',
  updateTask: 'No se pudo guardar la tarea. Inténtalo de nuevo.',
  deleteTask: 'No se pudo eliminar la tarea. Inténtalo de nuevo.',
  moveTask: 'No se pudo mover la tarjeta. El tablero se restauró.',
  loadTasks: 'No se pudieron cargar las tareas.',
} as const
