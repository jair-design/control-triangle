const domain = import.meta.env.VITE_COGNITO_DOMAIN
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID

if (!domain || !clientId) {
  throw new Error(
    'Faltan VITE_COGNITO_DOMAIN o VITE_COGNITO_CLIENT_ID. Copia .env.example como .env y completa los valores.',
  )
}

export const CALLBACK_PATH = '/callback'
export const LOGOUT_PATH = '/logout'

export const cognitoConfig = {
  domain,
  clientId,
  redirectUri: `${window.location.origin}${CALLBACK_PATH}`,
  logoutUri: `${window.location.origin}${LOGOUT_PATH}`,
  scopes: 'openid email profile',
}

const DEFAULT_REFRESH_MARGIN_MINUTES = 5
const MS_PER_MINUTE = 60_000

function readMinutes(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback
  const minutes = Number(raw)
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : fallback
}

export const sessionConfig = {
  // Cuánto antes de que venza el access token se renueva la sesión.
  refreshMarginMs:
    readMinutes(
      import.meta.env.VITE_TOKEN_REFRESH_MARGIN_MINUTES,
      DEFAULT_REFRESH_MARGIN_MINUTES,
    ) * MS_PER_MINUTE,
}
