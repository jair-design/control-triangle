import { cognitoConfig } from './config'
import { authLog } from './log'
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

export type TokenValidation = 'valid' | 'invalid' | 'unreachable'

/**
 * Pregunta a Cognito (userInfo) si el access token sigue siendo válido.
 * 'invalid' = Cognito lo rechaza (revocado, usuario deshabilitado...).
 * 'unreachable' = no hubo respuesta concluyente (red caída, error del servidor).
 */
export async function validateAccessToken(
  accessToken: string,
): Promise<TokenValidation> {
  try {
    const response = await fetch(`${cognitoConfig.domain}/oauth2/userInfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (response.ok) return 'valid'
    if (response.status === 401 || response.status === 403) return 'invalid'
    return 'unreachable'
  } catch {
    return 'unreachable'
  }
}

const REVOKE_TIMEOUT_MS = 3000

async function revokeToken(refreshToken: string): Promise<void> {
  const response = await fetch(`${cognitoConfig.domain}/oauth2/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token: refreshToken,
      client_id: cognitoConfig.clientId,
    }),
    signal: AbortSignal.timeout(REVOKE_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`revoke respondió ${response.status}`)
}

export function buildLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.logoutUri,
  })
  return `${cognitoConfig.domain}/logout?${params}`
}

/**
 * Cierra la sesión en Cognito: revoca el refresh token (invalida también los
 * access tokens derivados) y navega al endpoint /logout, que borra la cookie
 * de la Hosted UI. Si la revocación falla, el cierre continúa igualmente.
 */
export async function signOut(refreshToken: string | null): Promise<void> {
  if (refreshToken) {
    try {
      await revokeToken(refreshToken)
      authLog.info('✅ tokens revocados en Cognito')
    } catch {
      authLog.warn('⚠️ no se pudo revocar el token; se continúa con el cierre de sesión')
    }
  }
  window.location.assign(buildLogoutUrl())
}
