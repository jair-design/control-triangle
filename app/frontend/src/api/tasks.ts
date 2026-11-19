import { API_ERROR_TEXT, TASKS_PATH } from '../constants'
import type { NewTaskInput, Task } from '../types/board'
import { apiRequest } from './client'

/** POST /api/tasks: crea la tarea al final de su columna y devuelve la tarea guardada. */
export async function createTaskRequest(
  input: NewTaskInput,
  accessToken: string,
): Promise<Task> {
  const created = await apiRequest<Task>(TASKS_PATH, {
    method: 'POST',
    accessToken,
    body: input,
    failureMessage: API_ERROR_TEXT.createTask,
  })
  // Solo los campos que usa el tablero (la respuesta trae además createdAt y updatedAt).
  return {
    id: created.id,
    title: created.title,
    description: created.description,
    dueDate: created.dueDate,
    assignee: created.assignee,
    status: created.status,
    position: created.position,
  }
}
