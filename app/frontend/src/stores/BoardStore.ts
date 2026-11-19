import { makeAutoObservable } from 'mobx'
import { BOARD_COLUMNS } from '../constants'
import type { Task, TaskStatus } from '../types/board'
import { SEED_TASKS } from './boardSeed'

export class BoardStore {
  // Por ahora son datos de prueba; luego se cargarán desde el backend.
  tasks: Task[] = SEED_TASKS.map((task) => ({ ...task }))

  constructor() {
    makeAutoObservable(this)
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
}
