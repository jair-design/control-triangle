import { decodeJwtClaims } from './jwt'

export interface UserProfile {
  name: string
  email: string | null
  avatarUrl: string | null
}

const FALLBACK_NAME = 'Usuario'

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

// El claim viene de un token: solo se aceptan URLs http(s) para el avatar.
function readHttpUrl(value: unknown): string | null {
  const raw = readString(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

/** Datos del usuario a partir del ID token. El avatar sale del claim estándar `picture`. */
export function readUserProfile(idToken: string): UserProfile | null {
  const claims = decodeJwtClaims(idToken)
  if (!claims) return null

  const email = readString(claims.email)
  const name =
    readString(claims.name) ??
    email ??
    readString(claims['cognito:username']) ??
    FALLBACK_NAME

  return { name, email, avatarUrl: readHttpUrl(claims.picture) }
}
