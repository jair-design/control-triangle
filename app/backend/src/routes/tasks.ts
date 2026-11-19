import { Router } from 'express'
import { HTTP_STATUS } from '../constants/index.js'
import { createTask, deleteTask, listTasksByStatus, moveTask, updateTask } from '../services/taskService.js'
import { parseCreateTaskInput, parseMoveTaskInput, parseUpdateTaskInput } from '../validation/taskInput.js'

export const tasksRouter = Router()

// POST /api/tasks: crea una tarea al final de la columna indicada por "status".
// Express 5 envía al errorHandler los errores de las funciones async.
tasksRouter.post('/', async (req, res) => {
  const input = parseCreateTaskInput(req.body)
  const task = await createTask(input)
  res.status(HTTP_STATUS.created).json(task)
})

// GET /api/tasks: todas las tareas agrupadas por columna y ordenadas por posición:
// { todo: [...], in_progress: [...], done: [...] }
tasksRouter.get('/', async (_req, res) => {
  res.json(await listTasksByStatus())
})

// PATCH /api/tasks/:id: edita los campos indicados de la tarea con ese id (el _id de MongoDB).
// Cambiar "status" la mueve al final de la otra columna.
tasksRouter.patch('/:id', async (req, res) => {
  const input = parseUpdateTaskInput(req.body)
  res.status(HTTP_STATUS.ok).json(await updateTask(req.params.id, input))
})

// DELETE /api/tasks/:id: elimina la tarea con ese id. Responde 204 sin cuerpo.
tasksRouter.delete('/:id', async (req, res) => {
  await deleteTask(req.params.id)
  res.status(HTTP_STATUS.noContent).end()
})

// POST /api/tasks/:id/move: mueve la tarea a una columna y a un lugar concreto de ella.
// Body: { status, index }. Recalcula las posiciones de la(s) columna(s) afectada(s).
tasksRouter.post('/:id/move', async (req, res) => {
  const input = parseMoveTaskInput(req.body)
  res.status(HTTP_STATUS.ok).json(await moveTask(req.params.id, input))
})
