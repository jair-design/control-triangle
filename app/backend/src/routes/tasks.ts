import { Router } from 'express'
import { HTTP_STATUS } from '../constants/index.js'
import { createTask, listTasksByStatus } from '../services/taskService.js'
import { parseCreateTaskInput } from '../validation/taskInput.js'

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
