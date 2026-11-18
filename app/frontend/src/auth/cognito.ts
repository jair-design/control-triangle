import { cognitoConfig } from './config'
import { createCodeChallenge, generateRandomString } from './pkce'

const VERIFIER_KEY = 'webi-todo.pkce_verifier'
const STATE_KEY = 'webi-todo.pkce_state'

export interface Tokens {
  idToken: string
  accessToken: string
  refreshToken: string
}

/** Genera PKCE y state, los guarda para el regreso y devuelve la URL del Hosted UI. */
export async function buildLoginUrl(): Promise<string> {
  const verifier = generateRandomString()
  const state = generateRandomString()
  const challenge = await createCodeChallenge(verifier)

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    response_type: 'code',
    scope: cognitoConfig.scopes,
    redirect_uri: cognitoConfig.redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  return `${cognitoConfig.domain}/oauth2/authorize?${params}`
}

// El code es de un solo uso. En desarrollo, StrictMode ejecuta los efectos dos veces:
// reutilizamos la misma petición en curso para no canjear el code dos veces.
let inFlight: { code: string; promise: Promise<Tokens> } | null = null

export function exchangeCode(code: string, state: string): Promise<Tokens> {
  if (inFlight?.code === code) return inFlight.promise
  const promise = requestTokens(code, state)
  inFlight = { code, promise }
  return promise
}

async function requestTokens(code: string, state: string): Promise<Tokens> {
  const expectedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  // Son de un solo uso: se descartan siempre, haya éxito o error.
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)

  if (!expectedState || state !== expectedState) {
    throw new Error('La respuesta de inicio de sesión no es válida (state distinto).')
  }
  if (!verifier) {
    throw new Error('No se encontró el code_verifier del inicio de sesión.')
  }

  const response = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cognitoConfig.clientId,
      code,
      redirect_uri: cognitoConfig.redirectUri,
      code_verifier: verifier,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      `No se pudo completar el inicio de sesión (${body.error ?? response.status}).`,
    )
  }

  return {
    idToken: body.id_token,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
  }
}

/**
 * Renueva el id_token y el access_token con el refresh token.
 * Cognito no devuelve un refresh token nuevo: se conserva el actual.
 */
export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  const response = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: cognitoConfig.clientId,
      refresh_token: refreshToken,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      `No se pudo renovar la sesión (${body.error ?? response.status}).`,
    )
  }
  if (typeof body.id_token !== 'string' || typeof body.access_token !== 'string') {
    throw new Error('La respuesta de renovación no trae los tokens esperados.')
  }

  return {
    idToken: body.id_token,
    accessToken: body.access_token,
    refreshToken,
  }
}
