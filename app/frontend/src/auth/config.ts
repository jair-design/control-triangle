const domain = import.meta.env.VITE_COGNITO_DOMAIN
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID

if (!domain || !clientId) {
  throw new Error(
    'Faltan VITE_COGNITO_DOMAIN o VITE_COGNITO_CLIENT_ID. Copia .env.example como .env y completa los valores.',
  )
}

export const CALLBACK_PATH = '/callback'

export const cognitoConfig = {
  domain,
  clientId,
  redirectUri: `${window.location.origin}${CALLBACK_PATH}`,
  scopes: 'openid email profile',
}
