import { makeAutoObservable, runInAction } from 'mobx'
import { ApiError } from '../api/client'
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasksRequest,
  moveTaskRequest,
  updateTaskRequest,
} from '../api/tasks'
import { API_ERROR_TEXT, BOARD_COLUMNS, HTTP_STATUS, LANDED_DURATION_MS } from '../constants'
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
  // Tarjeta que acaba de guardarse en su nuevo lugar: muestra la animación de confirmación.
  landedId: string | null = null

  private readonly session: SessionStore
  // Cada carga recibe un número; solo la más reciente puede actualizar el tablero.
  private loadSeq = 0
  // Movimientos enviados al backend que aún no terminaron.
  private pendingMoves = 0
  private landedTimer: ReturnType<typeof setTimeout> | null = null

  constructor(session: SessionStore) {
    makeAutoObservable<
      BoardStore,
      'session' | 'loadSeq' | 'pendingMoves' | 'landedTimer'
    >(this, {
      session: false,
      loadSeq: false,
      pendingMoves: false,
      landedTimer: false,
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

  /**
   * Mueve la tarjeta a la columna `status` en el lugar `index` (0 = al inicio). El tablero se
   * actualiza al instante y el movimiento se guarda en el backend; luego se recarga con lo que
   * quedó guardado. Si falla, se restaura el tablero y se lanza el error.
   */
  async moveTask(id: string, status: TaskStatus, index: number): Promise<void> {
    this.applyMove(id, status, index)
    this.pendingMoves++
    try {
      await this.withAccessToken((token) => moveTaskRequest(id, { status, index }, token))
    } catch (error) {
      this.pendingMoves--
      await this.loadTasks()
      throw error
    }
    this.pendingMoves--
    // Con varios movimientos seguidos, solo se recarga al terminar el último.
    if (this.pendingMoves === 0) await this.loadTasks()
    this.markLanded(id)
  }

  // Reordena en memoria igual que lo hará el servidor: inserta en el lugar indicado y
  // renumera 0..n-1 las columnas afectadas.
  private applyMove(id: string, status: TaskStatus, index: number) {
    const task = this.tasks.find((t) => t.id === id)
    if (!task) return
    const grouped = this.tasksByStatus
    const source = task.status

    const destination = grouped[status].filter((t) => t.id !== id)
    destination.splice(Math.min(index, destination.length), 0, task)
    destination.forEach((t, position) => {
      t.status = status
      t.position = position
    })
    if (source !== status) {
      grouped[source]
        .filter((t) => t.id !== id)
        .forEach((t, position) => {
          t.position = position
        })
    }
  }

  private markLanded(id: string) {
    if (this.landedTimer !== null) clearTimeout(this.landedTimer)
    this.landedId = id
    this.landedTimer = setTimeout(() => this.clearLanded(), LANDED_DURATION_MS)
  }

  private clearLanded() {
    this.landedId = null
    this.landedTimer = null
  }

  /** Vacía el tablero (al cerrar sesión) e ignora cualquier carga en curso. */
  reset() {
    this.loadSeq++
    this.tasks = []
    this.loadState = 'idle'
    this.loadError = null
    this.lastChangedId = null
    this.landedId = null
    this.pendingMoves = 0
    if (this.landedTimer !== null) clearTimeout(this.landedTimer)
    this.landedTimer = null
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
