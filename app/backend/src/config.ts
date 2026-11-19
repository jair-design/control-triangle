import {
  DEFAULT_PORT,
  ENV_COGNITO_CLIENT_ID,
  ENV_COGNITO_USER_POOL_ID,
  ENV_MONGODB_URI,
} from './constants/index.js'

export interface AppConfig {
  port: number
  mongodbUri: string
  cognitoUserPoolId: string
  cognitoClientId: string
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim()
  if (!value) {
    throw new Error(
      `Falta la variable ${name}. Defínela en app/backend/.env (ver .env.example).`,
    )
  }
  return value
}

/** Lee y valida las variables de entorno. Falla con un mensaje claro si falta alguna. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const mongodbUri = required(env, ENV_MONGODB_URI)
  const cognitoUserPoolId = required(env, ENV_COGNITO_USER_POOL_ID)
  const cognitoClientId = required(env, ENV_COGNITO_CLIENT_ID)

  const port = env.PORT ? Number(env.PORT) : DEFAULT_PORT
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT no es válido: "${env.PORT}".`)
  }

  return { port, mongodbUri, cognitoUserPoolId, cognitoClientId }
}
