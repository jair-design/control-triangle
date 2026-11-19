import { API_MESSAGES, HTTP_STATUS, TASK_STATUSES, type TaskStatus } from '../constants/index.js'
import { HttpError } from '../errors.js'

export interface CreateTaskInput {
  title: string
  description: string
  assignee: string | null
  dueDate: string | null
  status: TaskStatus
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Toma del cuerpo SOLO los campos permitidos y comprueba sus tipos.
 * Las reglas de contenido (longitudes, formato de fecha) las aplica el esquema de Mongoose.
 * Se ignoran id, position, createdAt y cualquier otro campo: no los decide el cliente.
 */
export function parseCreateTaskInput(body: unknown): CreateTaskInput {
  const errors: Record<string, string> = {}
  const source = isPlainObject(body) ? body : {}

  const text = (field: string, label: string, required: boolean): string | null => {
    const value = source[field]
    if (value === undefined || value === null) {
      if (required) errors[field] = `${label} es obligatorio`
      return null
    }
    if (typeof value !== 'string') {
      errors[field] = `${label} debe ser un texto`
      return null
    }
    const trimmed = value.trim()
    if (trimmed === '' && required) errors[field] = `${label} es obligatorio`
    return trimmed
  }

  const title = text('title', 'El título', true)
  const description = text('description', 'La descripción', false)
  const assignee = text('assignee', 'La persona asignada', false)
  const dueDate = text('dueDate', 'La fecha de vencimiento', false)

  const status = source.status
  if (status === undefined || status === null || status === '') {
    errors.status = 'El estado es obligatorio'
  } else if (!TASK_STATUSES.includes(status as TaskStatus)) {
    errors.status = `El estado debe ser uno de: ${TASK_STATUSES.join(', ')}`
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(HTTP_STATUS.badRequest, API_MESSAGES.validation, errors)
  }

  return {
    title: title as string,
    description: description ?? '',
    // Vacío = sin valor: el formulario puede enviar cadenas vacías en los opcionales.
    assignee: assignee || null,
    dueDate: dueDate || null,
    status: status as TaskStatus,
  }
}
