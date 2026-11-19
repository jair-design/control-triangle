import mongoose from 'mongoose'
import { DB_CONNECT_TIMEOUT_MS, DB_PING_TIMEOUT_MS } from './constants/index.js'
import { Task } from './models/index.js'

// Todos los modelos registrados: al conectar se sincronizan su colección e índices.
const models = [Task]

/** Conecta a MongoDB (se autentica) y deja listas las colecciones. Lanza si no puede. */
export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: DB_CONNECT_TIMEOUT_MS })
  await Promise.all(models.map((model) => model.syncIndexes()))
}

/** Comprueba con un ping real que la base responde ahora mismo. */
export async function pingDb(): Promise<boolean> {
  const db = mongoose.connection.db
  if (!db) return false

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), DB_PING_TIMEOUT_MS)
  })
  const ping = db
    .admin()
    .ping()
    .then(() => true as const)
    .catch(() => false as const)

  try {
    return await Promise.race([ping, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function closeDb(): Promise<void> {
  await mongoose.disconnect()
}
