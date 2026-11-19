// Límite del cuerpo JSON de las peticiones.
export const JSON_BODY_LIMIT = '16kb'

// Cabecera Authorization: "Bearer <access token>".
export const BEARER_PATTERN = /^Bearer\s+(.+)$/i

export const HTTP_STATUS = {
  created: 201,
  noContent: 204,
  ok: 200,
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  conflict: 409,
  payloadTooLarge: 413,
  serverError: 500,
} as const

// Mensajes de error de la API (en español, igual que el frontend).
export const API_MESSAGES = {
  unauthorized: 'No autorizado',
  notFound: 'No encontrado',
  validation: 'Datos no válidos',
  taskNotFound: 'La tarea no existe',
  nothingToUpdate: 'Indica al menos un campo para actualizar',
  invalidJson: 'El cuerpo de la petición no es un JSON válido',
  bodyTooLarge: 'El cuerpo de la petición es demasiado grande',
  positionConflict:
    'No se pudo asignar la posición de la tarea. Inténtalo de nuevo.',
  serverError: 'No se pudo completar la operación',
} as const
