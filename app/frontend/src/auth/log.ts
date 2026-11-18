const PREFIX = '[auth]'

// Trazas de la sesión para poder seguirla desde la consola. Nunca incluyen tokens.
export const authLog = {
  info: (...args: unknown[]) => console.info(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
}
