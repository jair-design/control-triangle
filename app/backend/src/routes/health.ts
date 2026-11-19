import { Router } from 'express'
import { pingDb } from '../db.js'

export const healthRouter = Router()

healthRouter.get('/health', async (_req, res) => {
  const connected = await pingDb()
  if (connected) {
    res.json({ status: 'ok', database: 'connected' })
    return
  }
  // 503: el servidor está vivo pero no puede cumplir su función sin la base.
  res.status(503).json({ status: 'error', database: 'disconnected' })
})
