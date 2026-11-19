export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  // Fecha de vencimiento en formato AAAA-MM-DD, opcional.
  dueDate: string | null
  // Persona asignada: texto abierto, la solución aún no define usuarios.
  assignee: string | null
  status: TaskStatus
  // Orden dentro de la columna (menor = más arriba).
  position: number
}

// Lo que captura el formulario de creación. La posición la decide el servidor.
export interface NewTaskInput {
  title: string
  description: string
  assignee: string | null
  dueDate: string | null
  status: TaskStatus
}
