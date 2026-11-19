import { makeAutoObservable, runInAction } from 'mobx'
import {
  refreshTokens,
  signOut,
  validateAccessToken,
  type Tokens,
} from '../auth/cognito'
import { sessionConfig } from '../auth/config'
import { describeTokenExpiry, getTokenExpiryMs } from '../auth/jwt'
import { authLog } from '../auth/log'
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
  // true mientras se valida con Cognito una sesión recuperada de localStorage (antes de decidir login o shell).
  restoring = false
  // true mientras se cierra la sesión en Cognito (revocación y redirección).
  signingOut = false
  // true si la sesión se cerró porque falló la renovación.
  sessionExpired = false

  private active = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private refreshPromise: Promise<void> | null = null
  private restorePromise: Promise<void> | null = null

  constructor() {
    makeAutoObservable<
      SessionStore,
      'active' | 'timer' | 'refreshPromise' | 'restorePromise'
    >(this, {
      active: false,
      timer: false,
      refreshPromise: false,
      restorePromise: false,
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

  /** Carga la sesión guardada. Si existe, queda pendiente de validar con Cognito antes de mostrar la app. */
  restore() {
    this.loadFromStorage()
    this.restoring = this.tokens !== null
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
    // Tokens recién emitidos por Cognito: no necesitan validarse.
    this.restoring = false
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

  /**
   * Cierra la sesión: limpia lo local de inmediato, revoca el refresh token en
   * Cognito y navega a su endpoint /logout para cerrar también su sesión.
   */
  logout() {
    const refreshToken = this.tokens?.refreshToken ?? null
    this.clear()
    this.signingOut = true
    void signOut(refreshToken)
  }

  /** Renueva ya los tokens (p. ej. tras un 401 de la API). Devuelve false si la sesión se cerró. */
  async renew(): Promise<boolean> {
    await this.refresh()
    return this.tokens !== null
  }

  /**
   * Activa el ciclo de la sesión. Si hay una sesión recuperada de localStorage,
   * primero la valida contra Cognito. Idempotente: se puede llamar de nuevo sin duplicar nada.
   */
  start() {
    this.active = true
    if (this.restoring) {
      void this.validateOnLoad()
      return
    }
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

  private validateOnLoad(): Promise<void> {
    if (this.restorePromise) return this.restorePromise
    const current = this.tokens
    if (!current) {
      this.restoring = false
      return Promise.resolve()
    }
    this.restorePromise = this.runValidation(current).finally(() => {
      this.restorePromise = null
    })
    return this.restorePromise
  }

  private async runValidation(current: Tokens) {
    const expiry = describeTokenExpiry(current.accessToken)

    // Vencido o dentro del margen: la renovación ya valida el refresh token contra Cognito.
    if (this.msUntilRefresh() <= 0) {
      authLog.info(`access token ${expiry}: se renueva con el refresh token (sin consultar userInfo)`)
      await this.refresh()
      return
    }

    authLog.info(`validando el access token contra Cognito (userInfo)… ${expiry}`)
    const result = await validateAccessToken(current.accessToken)

    if (this.tokens !== current) {
      authLog.info('la sesión cambió mientras se validaba; se ignora el resultado')
      return
    }

    if (result === 'valid') {
      authLog.info('✅ validación exitosa: Cognito confirma que el token es válido (userInfo 200)')
    } else if (result === 'unreachable') {
      authLog.warn('⚠️ no se pudo validar (sin respuesta concluyente de Cognito); se mantiene la sesión')
    } else {
      authLog.warn('❌ validación fallida: Cognito rechaza el token (userInfo 401); se intenta renovar')
      await this.refresh()
      return
    }

    runInAction(() => {
      this.restoring = false
      this.schedule()
    })
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
          // Si la sesión terminó mientras se renovaba (logout), no se reactiva.
          if (this.tokens !== current) return
          this.setTokens(tokens)
          authLog.info('✅ sesión renovada con el refresh token')
        })
      })
      .catch((error: unknown) => {
        runInAction(() => {
          if (this.tokens !== current) return
          authLog.warn(
            '❌ no se pudo renovar la sesión; se cierra:',
            error instanceof Error ? error.message : error,
          )
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
