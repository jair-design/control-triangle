import { API_MESSAGES, HTTP_STATUS, TASK_STATUSES, type TaskStatus } from '../constants/index.js'
import { HttpError } from '../errors.js'

export interface CreateTaskInput {
  title: string
  description: string
  assignee: string | null
  dueDate: string | null
  status: TaskStatus
}

// En una edición solo llegan los campos que se quieren cambiar.
export type UpdateTaskInput = Partial<CreateTaskInput>

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Toma del cuerpo SOLO los campos permitidos y comprueba sus tipos.
 * Las reglas de contenido (longitudes, formato de fecha) las aplica el esquema de Mongoose.
 * Se ignoran id, position, createdAt y cualquier otro campo: no los decide el cliente.
 */
function parseFields(body: unknown, mode: 'create' | 'update'): UpdateTaskInput {
  const errors: Record<string, string> = {}
  const source = isPlainObject(body) ? body : {}
  const creating = mode === 'create'
  const fields: UpdateTaskInput = {}

  // Devuelve el texto recortado, o undefined si el campo no vino.
  const text = (field: string, label: string): string | undefined => {
    const value = source[field]
    if (value === undefined) return undefined
    if (value === null) return ''
    if (typeof value !== 'string') {
      errors[field] = `${label} debe ser un texto`
      return undefined
    }
    return value.trim()
  }

  const title = text('title', 'El título')
  if (title === undefined) {
    if (creating && !errors.title) errors.title = 'El título es obligatorio'
  } else if (title === '') {
    errors.title = 'El título es obligatorio'
  } else {
    fields.title = title
  }

  const description = text('description', 'La descripción')
  if (description !== undefined) fields.description = description

  // Vacío = sin valor: el formulario puede enviar cadenas vacías en los opcionales.
  const assignee = text('assignee', 'La persona asignada')
  if (assignee !== undefined) fields.assignee = assignee || null
  const dueDate = text('dueDate', 'La fecha de vencimiento')
  if (dueDate !== undefined) fields.dueDate = dueDate || null

  const status = source.status
  if (status === undefined || status === null || status === '') {
    if (creating) errors.status = 'El estado es obligatorio'
  } else if (!TASK_STATUSES.includes(status as TaskStatus)) {
    errors.status = `El estado debe ser uno de: ${TASK_STATUSES.join(', ')}`
  } else {
    fields.status = status as TaskStatus
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(HTTP_STATUS.badRequest, API_MESSAGES.validation, errors)
  }
  return fields
}

export function parseCreateTaskInput(body: unknown): CreateTaskInput {
  const fields = parseFields(body, 'create')
  return {
    title: fields.title as string,
    status: fields.status as TaskStatus,
    description: fields.description ?? '',
    assignee: fields.assignee ?? null,
    dueDate: fields.dueDate ?? null,
  }
}

export function parseUpdateTaskInput(body: unknown): UpdateTaskInput {
  const fields = parseFields(body, 'update')
  if (Object.keys(fields).length === 0) {
    throw new HttpError(HTTP_STATUS.badRequest, API_MESSAGES.nothingToUpdate)
  }
  return fields
}

export interface MoveTaskInput {
  status: TaskStatus
  // Lugar que ocupará la tarea en la columna de destino: 0 = al inicio, n = al final.
  index: number
}

/** Cuerpo de POST /tasks/:id/move: columna de destino y lugar dentro de ella. */
export function parseMoveTaskInput(body: unknown): MoveTaskInput {
  const errors: Record<string, string> = {}
  const source = isPlainObject(body) ? body : {}

  const status = source.status
  if (status === undefined || status === null || status === '') {
    errors.status = 'El estado es obligatorio'
  } else if (!TASK_STATUSES.includes(status as TaskStatus)) {
    errors.status = `El estado debe ser uno de: ${TASK_STATUSES.join(', ')}`
  }

  const index = source.index
  if (index === undefined || index === null) {
    errors.index = 'El índice es obligatorio'
  } else if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
    errors.index = 'El índice debe ser un número entero mayor o igual a 0'
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(HTTP_STATUS.badRequest, API_MESSAGES.validation, errors)
  }
  return { status: status as TaskStatus, index: index as number }
}
