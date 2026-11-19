import { DEFAULT_PORT, ENV_MONGODB_URI } from './constants/index.js'

export interface AppConfig {
  port: number
  mongodbUri: string
}

/** Lee y valida las variables de entorno. Falla con un mensaje claro si falta alguna. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const mongodbUri = env[ENV_MONGODB_URI]?.trim()
  if (!mongodbUri) {
    throw new Error(
      `Falta la variable ${ENV_MONGODB_URI}. Defínela en app/backend/.env (ver .env.example).`,
    )
  }

  const port = env.PORT ? Number(env.PORT) : DEFAULT_PORT
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT no es válido: "${env.PORT}".`)
  }

  return { port, mongodbUri }
}
