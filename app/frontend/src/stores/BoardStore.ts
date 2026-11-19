import { makeAutoObservable, runInAction } from 'mobx'
import { ApiError } from '../api/client'
import { createTaskRequest } from '../api/tasks'
import { API_ERROR_TEXT, BOARD_COLUMNS, HTTP_STATUS } from '../constants'
import type { NewTaskInput, Task, TaskStatus } from '../types/board'
import { SEED_TASKS } from './boardSeed'
import type { SessionStore } from './SessionStore'

export class BoardStore {
  // Por ahora son datos de prueba; luego se cargarán desde el backend (listado).
  tasks: Task[] = SEED_TASKS.map((task) => ({ ...task }))
  // Última tarea creada: la tarjeta correspondiente se desplaza hasta quedar visible.
  lastAddedId: string | null = null

  private readonly session: SessionStore

  constructor(session: SessionStore) {
    makeAutoObservable<BoardStore, 'session'>(this, { session: false })
    this.session = session
  }

  /** Tareas de cada estado, ordenadas por su posición en la columna. */
  get tasksByStatus(): Record<TaskStatus, Task[]> {
    const grouped = Object.fromEntries(
      BOARD_COLUMNS.map(({ status }) => [status, [] as Task[]]),
    ) as Record<TaskStatus, Task[]>
    for (const task of this.tasks) grouped[task.status].push(task)
    for (const list of Object.values(grouped)) {
      list.sort((a, b) => a.position - b.position)
    }
    return grouped
  }

  /** Crea la tarea en el backend y, si sale bien, la añade al final de su columna. */
  async createTask(input: NewTaskInput): Promise<Task> {
    const created = await this.withAccessToken((token) => createTaskRequest(input, token))
    runInAction(() => this.addTask(created))
    return created
  }

  private addTask(task: Task) {
    // Mientras el tablero mezcle datos de prueba con lo guardado en la base, las posiciones del
    // servidor no coinciden con las de las tarjetas de prueba: se coloca al final de la columna.
    // Cuando exista el listado y se retiren los datos de prueba, se usará la posición del servidor.
    const lastLocalPosition = Math.max(
      -1,
      ...this.tasks.filter((t) => t.status === task.status).map((t) => t.position),
    )
    this.tasks.push({ ...task, position: Math.max(task.position, lastLocalPosition + 1) })
    this.lastAddedId = task.id
  }

  /** Ejecuta una llamada con el access token; ante un 401 renueva la sesión y reintenta una vez. */
  private async withAccessToken<T>(call: (token: string) => Promise<T>): Promise<T> {
    const attempt = () => {
      const token = this.session.tokens?.accessToken
      if (!token) throw new ApiError(HTTP_STATUS.unauthorized, API_ERROR_TEXT.unauthorized)
      return call(token)
    }
    try {
      return await attempt()
    } catch (error) {
      const expired = error instanceof ApiError && error.status === HTTP_STATUS.unauthorized
      if (expired && (await this.session.renew())) return attempt()
      throw error
    }
  }
}
