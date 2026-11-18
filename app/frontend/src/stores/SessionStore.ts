import { makeAutoObservable, runInAction } from 'mobx'
import { refreshTokens, type Tokens } from '../auth/cognito'
import { sessionConfig } from '../auth/config'
import { getTokenExpiryMs } from '../auth/jwt'
import { readUserProfile, type UserProfile } from '../auth/profile'

const STORAGE_KEY = 'webi-todo.session'
// setTimeout no admite más de ~24,8 días; al disparar se vuelve a evaluar.
const MAX_TIMEOUT_MS = 2_147_483_647

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
  // true mientras se restaura una sesión cuyo token ya venció (antes de decidir login o shell).
  restoring = false
  // true si la sesión se cerró porque falló la renovación.
  sessionExpired = false

  private active = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private refreshPromise: Promise<void> | null = null

  constructor() {
    makeAutoObservable<SessionStore, 'active' | 'timer' | 'refreshPromise'>(this, {
      active: false,
      timer: false,
      refreshPromise: false,
    })
    // Solo lectura: los temporizadores y las peticiones arrancan en start().
    this.restore()
  }

  get isAuthenticated(): boolean {
    return this.tokens !== null
  }

  /** Datos del usuario leídos del ID token (nombre, email y avatar si existen). */
  get user(): UserProfile | null {
    return this.tokens ? readUserProfile(this.tokens.idToken) : null
  }

  /** Carga la sesión guardada y marca si hay que renovarla antes de mostrar la app. */
  restore() {
    this.loadFromStorage()
    this.restoring = this.tokens !== null && this.msUntilRefresh() <= 0
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
    this.sessionExpired = false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
    this.schedule()
  }

  /** Borra la sesión (memoria y localStorage) y cancela cualquier renovación pendiente. */
  clear() {
    this.cancelTimer()
    this.tokens = null
    this.restoring = false
    localStorage.removeItem(STORAGE_KEY)
  }

  /** Activa el ciclo de renovación. Idempotente: se puede llamar de nuevo sin duplicar nada. */
  start() {
    this.active = true
    this.schedule()
  }

  stop() {
    this.active = false
    this.cancelTimer()
  }

  /** Milisegundos hasta el momento de renovar (exp - margen). Si no se puede leer el exp, ya toca. */
  private msUntilRefresh(): number {
    if (!this.tokens) return Infinity
    const expiry = getTokenExpiryMs(this.tokens.accessToken)
    if (expiry === null) return 0
    return expiry - sessionConfig.refreshMarginMs - Date.now()
  }

  private cancelTimer() {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }

  private schedule() {
    this.cancelTimer()
    if (!this.active || !this.tokens) return

    const ms = this.msUntilRefresh()
    if (ms <= 0) {
      void this.refresh()
      return
    }
    this.timer = setTimeout(() => this.schedule(), Math.min(ms, MAX_TIMEOUT_MS))
  }

  /** Renueva los tokens. Si falla por cualquier motivo, cierra la sesión. */
  private refresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise
    const current = this.tokens
    if (!current) return Promise.resolve()

    this.refreshPromise = refreshTokens(current.refreshToken)
      .then((tokens) => {
        runInAction(() => {
          this.setTokens(tokens)
          this.restoring = false
        })
      })
      .catch(() => {
        runInAction(() => {
          this.clear()
          this.sessionExpired = true
        })
      })
      .finally(() => {
        this.refreshPromise = null
      })
    return this.refreshPromise
  }
}
