import { makeAutoObservable, runInAction } from 'mobx'
import { ApiError } from '../api/client'
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasksRequest,
  updateTaskRequest,
} from '../api/tasks'
import { API_ERROR_TEXT, BOARD_COLUMNS, HTTP_STATUS } from '../constants'
import type { NewTaskInput, Task, TaskStatus } from '../types/board'
import type { SessionStore } from './SessionStore'

// idle: sin cargar · loading: primera carga · ready: con datos · error: la última carga falló
export type BoardLoadState = 'idle' | 'loading' | 'ready' | 'error'

export class BoardStore {
  tasks: Task[] = []
  loadState: BoardLoadState = 'idle'
  loadError: string | null = null
  // Última tarea creada o editada: su tarjeta se desplaza hasta quedar visible.
  lastChangedId: string | null = null

  private readonly session: SessionStore
  // Cada carga recibe un número; solo la más reciente puede actualizar el tablero.
  private loadSeq = 0

  constructor(session: SessionStore) {
    makeAutoObservable<BoardStore, 'session' | 'loadSeq'>(this, {
      session: false,
      loadSeq: false,
    })
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

  /**
   * Recarga todas las columnas con una sola petición. No lanza: si falla, deja el error
   * en loadError (y conserva lo que ya estaba en pantalla).
   */
  async loadTasks(): Promise<void> {
    const seq = ++this.loadSeq
    if (this.loadState !== 'ready') this.loadState = 'loading'
    this.loadError = null

    try {
      const grouped = await this.withAccessToken((token) => fetchTasksRequest(token))
      if (seq !== this.loadSeq) return
      runInAction(() => {
        this.tasks = BOARD_COLUMNS.flatMap(({ status }) => grouped[status])
        this.loadState = 'ready'
      })
    } catch (error) {
      if (seq !== this.loadSeq) return
      runInAction(() => {
        this.loadError = error instanceof Error ? error.message : API_ERROR_TEXT.loadTasks
        this.loadState = this.tasks.length > 0 ? 'ready' : 'error'
      })
    }
  }

  /** Crea la tarea en el backend y recarga el tablero para reflejar el estado real de la base. */
  async createTask(input: NewTaskInput): Promise<Task> {
    const created = await this.withAccessToken((token) => createTaskRequest(input, token))
    runInAction(() => {
      this.lastChangedId = created.id
    })
    await this.loadTasks()
    return created
  }

  /** Edita la tarea en el backend (por su id) y recarga el tablero con los datos actualizados. */
  async updateTask(id: string, input: NewTaskInput): Promise<Task> {
    try {
      const updated = await this.withAccessToken((token) => updateTaskRequest(id, input, token))
      runInAction(() => {
        this.lastChangedId = updated.id
      })
      await this.loadTasks()
      return updated
    } catch (error) {
      // Si la tarea ya no existe (p. ej. la borraron en otro lado), el tablero se pone al día.
      if (error instanceof ApiError && error.status === HTTP_STATUS.notFound) {
        void this.loadTasks()
      }
      throw error
    }
  }

  /** Elimina la tarea en el backend (por su id) y recarga el tablero. */
  async deleteTask(id: string): Promise<void> {
    try {
      await this.withAccessToken((token) => deleteTaskRequest(id, token))
      await this.loadTasks()
    } catch (error) {
      // Si la tarea ya no existe, el tablero se pone al día.
      if (error instanceof ApiError && error.status === HTTP_STATUS.notFound) {
        void this.loadTasks()
      }
      throw error
    }
  }

  /** Vacía el tablero (al cerrar sesión) e ignora cualquier carga en curso. */
  reset() {
    this.loadSeq++
    this.tasks = []
    this.loadState = 'idle'
    this.loadError = null
    this.lastChangedId = null
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
