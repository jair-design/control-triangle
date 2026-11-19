import express from 'express'
import type { AppConfig } from './config.js'
import { API_PREFIX, JSON_BODY_LIMIT } from './constants/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createApiRouter } from './routes/index.js'

/** Crea la aplicación Express sin abrir el puerto (index.ts se encarga de escuchar). */
export function createApp(config: AppConfig) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: JSON_BODY_LIMIT }))
  app.use(API_PREFIX, createApiRouter(config))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
