import { API_ERROR_TEXT, BOARD_COLUMNS, TASKS_PATH } from '../constants'
import type { NewTaskInput, Task, TaskStatus } from '../types/board'
import { apiRequest } from './client'

export type TasksByStatus = Record<TaskStatus, Task[]>

// Solo los campos que usa el tablero (la API devuelve además createdAt y updatedAt).
function toTask(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    assignee: task.assignee,
    status: task.status,
    position: task.position,
  }
}

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
  return toTask(created)
}

/** PATCH /api/tasks/:id: edita la tarea. Si cambia de estado, pasa al final de la otra columna. */
export async function updateTaskRequest(
  id: string,
  input: NewTaskInput,
  accessToken: string,
): Promise<Task> {
  const updated = await apiRequest<Task>(`${TASKS_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    accessToken,
    body: input,
    failureMessage: API_ERROR_TEXT.updateTask,
  })
  return toTask(updated)
}

/** DELETE /api/tasks/:id: elimina la tarea (el backend responde 204 sin cuerpo). */
export async function deleteTaskRequest(id: string, accessToken: string): Promise<void> {
  await apiRequest<null>(`${TASKS_PATH}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    accessToken,
    failureMessage: API_ERROR_TEXT.deleteTask,
  })
}

/** GET /api/tasks: todas las tareas, agrupadas por columna y ya ordenadas por posición. */
export async function fetchTasksRequest(accessToken: string): Promise<TasksByStatus> {
  const data = await apiRequest<Partial<TasksByStatus>>(TASKS_PATH, {
    method: 'GET',
    accessToken,
    failureMessage: API_ERROR_TEXT.loadTasks,
  })
  return Object.fromEntries(
    BOARD_COLUMNS.map(({ status }) => [status, (data[status] ?? []).map(toTask)]),
  ) as TasksByStatus
}
