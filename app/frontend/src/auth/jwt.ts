/**
 * Lee los claims (payload) de un JWT. No verifica la firma: solo sirve para
 * que la SPA lea datos del usuario y la expiración. La validación real la hace el backend.
 */
export function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    // atob entrega bytes; se decodifican como UTF-8 para conservar tildes y ñ.
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
    const claims: unknown = JSON.parse(new TextDecoder().decode(bytes))
    return typeof claims === 'object' && claims !== null
      ? (claims as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** Instante de expiración (ms desde epoch) según el claim `exp`, o null si no se puede leer. */
export function getTokenExpiryMs(token: string): number | null {
  const exp = decodeJwtClaims(token)?.exp
  return typeof exp === 'number' ? exp * 1000 : null
}
