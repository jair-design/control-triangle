/**
 * Lee el instante de expiración (ms desde epoch) del campo `exp` de un JWT.
 * No verifica la firma: solo se usa para programar la renovación en la SPA.
 */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const claims: unknown = JSON.parse(atob(padded))
    const exp = (claims as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}
