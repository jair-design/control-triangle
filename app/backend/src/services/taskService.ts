import {
  API_MESSAGES,
  HTTP_STATUS,
  MONGO_DUPLICATE_KEY_CODE,
  TASK_CREATE_MAX_ATTEMPTS,
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
