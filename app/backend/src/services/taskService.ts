import type { Types } from 'mongoose'
import {
  API_MESSAGES,
  HTTP_STATUS,
  MONGO_DUPLICATE_KEY_CODE,
  TASK_ID_PATTERN,
  TASK_CREATE_MAX_ATTEMPTS,
  TASK_MOVE_MAX_ATTEMPTS,
  TASK_STATUSES,
  type TaskStatus,
} from '../constants/index.js'
import { HttpError } from '../errors.js'
import { Task } from '../models/index.js'
import type { CreateTaskInput, MoveTaskInput, UpdateTaskInput } from '../validation/taskInput.js'

const isDuplicateKeyError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  const { code, writeErrors } = error as { code?: unknown; writeErrors?: unknown }
  if (code === MONGO_DUPLICATE_KEY_CODE) return true
  // Las escrituras en lote (bulkWrite) reportan el detalle en writeErrors.
  return (
    Array.isArray(writeErrors) &&
    writeErrors.some((e) => (e as { code?: unknown }).code === MONGO_DUPLICATE_KEY_CODE)
  )
}

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

const taskNotFound = () => new HttpError(HTTP_STATUS.notFound, API_MESSAGES.taskNotFound)

/**
 * Edita una tarea por su id (el _id de MongoDB). Si cambia de estado, pasa al final de la
 * columna de destino (máximo + 1); si no, conserva su posición.
 */
export async function updateTask(id: string, input: UpdateTaskInput) {
  if (!TASK_ID_PATTERN.test(id)) throw taskNotFound()

  for (let attempt = 1; attempt <= TASK_CREATE_MAX_ATTEMPTS; attempt++) {
    const task = await Task.findById(id)
    if (!task) throw taskNotFound()

    const { status, ...fields } = input
    task.set(fields)
    if (status !== undefined && status !== task.status) {
      task.status = status
      task.position = await nextPosition(status)
    }

    try {
      // save() aplica las validaciones del esquema y actualiza updatedAt.
      return await task.save()
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
    }
  }
  throw new HttpError(HTTP_STATUS.conflict, API_MESSAGES.positionConflict)
}

/** Elimina una tarea por su id (el _id de MongoDB). Las demás conservan su posición. */
export async function deleteTask(id: string): Promise<void> {
  if (!TASK_ID_PATTERN.test(id)) throw taskNotFound()
  const deleted = await Task.findByIdAndDelete(id)
  if (!deleted) throw taskNotFound()
}

// Una tarea dentro del orden de una columna. position es la que tiene hoy en esa columna;
// null si todavía pertenece a otra (se está mudando a esta).
interface ColumnSlot {
  id: Types.ObjectId
  position: number | null
}

/**
 * Deja la columna con exactamente este orden (posiciones 0, 1, 2…) escribiendo solo las
 * tareas que cambian. Con el índice único {status, position} no se puede mover una a una
 * (dos compartirían posición un instante), así que se hace en dos pasos:
 *   1. las que cambian pasan a posiciones temporales por encima de todas las actuales,
 *      conservando el orden entre ellas;
 *   2. se les asigna su posición final, en orden ascendente.
 * Ninguno de los dos pasos colisiona con otra tarea. Si el proceso se interrumpe entre ambos,
 * el orden sigue siendo el correcto (solo quedan posiciones altas) y el siguiente movimiento
 * lo normaliza. MongoDB sin conjunto de réplicas no ofrece transacciones.
 */
async function writeColumnOrder(
  status: TaskStatus,
  ordered: ColumnSlot[],
  movedId?: Types.ObjectId,
): Promise<void> {
  const changed = ordered
    .map((slot, index) => ({ ...slot, index }))
    .filter((slot) => slot.position !== slot.index)
  if (changed.length === 0) return

  const base = Math.max(-1, ...ordered.map((slot) => slot.position ?? -1)) + 1
  const now = new Date()

  // Solo la tarea que se mueve puede cambiar de columna. Para las demás se exige que sigan en
  // esta columna: si otra petición las movió mientras tanto, no se tocan (y no se les revierte
  // el estado).
  const filterFor = (id: Types.ObjectId) =>
    movedId && id.equals(movedId) ? { _id: id } : { _id: id, status }

  await Task.bulkWrite(
    changed.map((slot, k) => ({
      updateOne: {
        filter: filterFor(slot.id),
        update: {
          $set: { position: base + k, ...(movedId && slot.id.equals(movedId) && { status }) },
        },
      },
    })),
    { ordered: true, timestamps: false },
  )
  await Task.bulkWrite(
    changed.map((slot) => ({
      updateOne: {
        filter: filterFor(slot.id),
        update: {
          $set: {
            position: slot.index,
            // Solo la tarea movida cambia de "versión"; las demás solo se renumeran.
            ...(movedId && slot.id.equals(movedId) && { updatedAt: now }),
          },
        },
      },
    })),
    { ordered: true, timestamps: false },
  )
}

/**
 * Mueve una tarea a la columna `status` en el lugar `index` (0 = al inicio, n = al final).
 * Recalcula las posiciones de la columna de destino (y compacta la de origen si cambió de
 * columna). Un índice mayor que la cantidad de tarjetas equivale a "al final".
 */
export async function moveTask(id: string, { status, index }: MoveTaskInput) {
  if (!TASK_ID_PATTERN.test(id)) throw taskNotFound()

  for (let attempt = 1; attempt <= TASK_MOVE_MAX_ATTEMPTS; attempt++) {
    const task = await Task.findById(id).select('status position')
    if (!task) throw taskNotFound()
    const sourceStatus = task.status as TaskStatus

    // Columna de destino en su orden actual, sin la tarea que se mueve.
    const inDestination = await Task.find({ status }).sort({ position: 1 }).select('position').lean()
    const ordered: ColumnSlot[] = inDestination
      .filter((doc) => !doc._id.equals(task._id))
      .map((doc) => ({ id: doc._id, position: doc.position }))
    ordered.splice(Math.min(index, ordered.length), 0, {
      id: task._id,
      position: sourceStatus === status ? task.position : null,
    })

    try {
      await writeColumnOrder(status, ordered, task._id)

      if (sourceStatus !== status) {
        const rest = await Task.find({ status: sourceStatus })
          .sort({ position: 1 })
          .select('position')
          .lean()
        await writeColumnOrder(
          sourceStatus,
          rest.map((doc) => ({ id: doc._id, position: doc.position })),
        )
      }
      return await Task.findById(id)
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error
    }
  }
  throw new HttpError(HTTP_STATUS.conflict, API_MESSAGES.positionConflict)
}
