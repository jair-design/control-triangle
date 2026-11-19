import {
  API_MESSAGES,
  HTTP_STATUS,
  MONGO_DUPLICATE_KEY_CODE,
  TASK_CREATE_MAX_ATTEMPTS,
  TASK_STATUSES,
  type TaskStatus,
} from '../constants/index.js'
import { HttpError } from '../errors.js'
import { Task } from '../models/index.js'
import type { CreateTaskInput } from '../validation/taskInput.js'

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY_CODE

/** Posición libre al final de la columna: la máxima actual + 1 (0 si la columna está vacía). */
async function nextPosition(status: TaskStatus): Promise<number> {
  // Usa el índice {status, position}: toma el último de la columna sin recorrerla.
  const last = await Task.findOne({ status }).sort({ position: -1 }).select('position').lean()
  return last ? last.position + 1 : 0
}

/**
 * Crea la tarea al final de su columna. Si dos peticiones calculan la misma posición a la vez,
 * el índice único {status, position} rechaza la segunda y se recalcula.
 */
export async function createTask(input: CreateTaskInput) {
  for (let attempt = 1; attempt <= TASK_CREATE_MAX_ATTEMPTS; attempt++) {
    const position = await nextPosition(input.status)
    try {
      return await Task.create({ ...input, position })
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
    }
  }
  throw new HttpError(HTTP_STATUS.conflict, API_MESSAGES.positionConflict)
}

/**
 * Todas las tareas de la base, agrupadas por columna y ordenadas por posición.
 * Siempre incluye las tres columnas, aunque alguna esté vacía.
 */
export async function listTasksByStatus() {
  // Ordenar por {status, position} aprovecha el índice único: no hace falta ordenar en memoria.
  const tasks = await Task.find().sort({ status: 1, position: 1 })

  const grouped = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, [] as typeof tasks]),
  ) as Record<TaskStatus, typeof tasks>
  for (const task of tasks) grouped[task.status as TaskStatus].push(task)
  return grouped
}
