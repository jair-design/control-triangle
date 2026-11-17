import { makeAutoObservable } from 'mobx'
import type { Tokens } from '../auth/cognito'

const STORAGE_KEY = 'webi-todo.session'

function isTokens(value: unknown): value is Tokens {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.idToken === 'string' &&
    typeof v.accessToken === 'string' &&
    typeof v.refreshToken === 'string'
  )
}

export class SessionStore {
  tokens: Tokens | null = null

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  get isAuthenticated(): boolean {
    return this.tokens !== null
  }

  /** Recupera la sesión guardada, si existe y es válida. */
  loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isTokens(parsed)) {
        this.tokens = parsed
        return
      }
    } catch {
      // JSON corrupto: se descarta abajo.
    }
    localStorage.removeItem(STORAGE_KEY)
  }

  setTokens(tokens: Tokens) {
    this.tokens = tokens
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  }
}
