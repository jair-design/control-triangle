import { Router } from 'express'
import type { AppConfig } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import { healthRouter } from './health.js'
import { tasksRouter } from './tasks.js'

/** Todas las rutas de la API (se montan bajo /api). El health es público; el resto exige token. */
export function createApiRouter(config: AppConfig): Router {
  const router = Router()
  router.use(healthRouter)
  router.use(
    '/tasks',
    requireAuth({
      userPoolId: config.cognitoUserPoolId,
      clientId: config.cognitoClientId,
    }),
    tasksRouter,
  )
  return router
}
