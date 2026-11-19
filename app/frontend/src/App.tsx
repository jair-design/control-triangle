import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { exchangeCode } from './auth/cognito'
import { CALLBACK_PATH, LOGOUT_PATH } from './auth/config'
import { AppShell } from './components/AppShell'
import Board from './components/board/Board'
import { LoginScreen } from './components/LoginScreen'
import { RestoringScreen } from './components/RestoringScreen'
import { useRootStore } from './stores/useRootStore'

const BUSY_LOGIN_MESSAGE = 'Iniciando sesión…'
const BUSY_LOGOUT_MESSAGE = 'Cerrando sesión…'
const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.'

type CallbackParams = { code: string; state: string } | { error: string } | null

// Enrutamiento simple: la única ruta especial es el callback de Cognito.
function readCallbackParams(): CallbackParams {
  if (window.location.pathname !== CALLBACK_PATH) return null
  const params = new URLSearchParams(window.location.search)
  const error = params.get('error_description') ?? params.get('error')
  const code = params.get('code')
  const state = params.get('state')
  if (error) return { error }
  if (!code || !state) {
    return { error: 'La respuesta de inicio de sesión está incompleta.' }
  }
  return { code, state }
}

const App = observer(function App() {
  const { session } = useRootStore()
  const [callback] = useState(readCallbackParams)
  const [error, setError] = useState<string | null>(() =>
    callback && 'error' in callback ? callback.error : null,
  )
  const [exchanging, setExchanging] = useState(
    () => callback !== null && 'code' in callback,
  )

  useEffect(() => {
    if (!callback) return
    // Se limpia la URL: el code no debe quedar en la barra de direcciones.
    window.history.replaceState(null, '', '/')
    if (!('code' in callback)) return

    exchangeCode(callback.code, callback.state)
      .then((tokens) => session.setTokens(tokens))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.'),
      )
      .finally(() => setExchanging(false))
  }, [callback, session])

  // Cognito devuelve aquí al usuario tras cerrar su sesión: no debe quedar ninguna sesión local.
  const [onLogoutRoute, setOnLogoutRoute] = useState(
    () => window.location.pathname === LOGOUT_PATH,
  )

  // Va antes que el efecto de start(): así una sesión rehidratada no llega a validarse.
  useEffect(() => {
    if (!onLogoutRoute) return
    session.clear()
    window.history.replaceState(null, '', '/')
    setOnLogoutRoute(false)
  }, [onLogoutRoute, session])

  useEffect(() => {
    session.start()
    return () => session.stop()
  }, [session])

  if (onLogoutRoute) {
    return <LoginScreen error={null} busyMessage={null} />
  }

  if (session.signingOut) {
    return <LoginScreen error={null} busyMessage={BUSY_LOGOUT_MESSAGE} />
  }

  if (session.restoring) {
    return <RestoringScreen message={BUSY_LOGIN_MESSAGE} />
  }

  if (session.isAuthenticated) {
    return (
      <AppShell>
        <Board />
      </AppShell>
    )
  }

  return <LoginScreen
      error={error ?? (session.sessionExpired ? SESSION_EXPIRED_MESSAGE : null)}
      busyMessage={exchanging ? BUSY_LOGIN_MESSAGE : null}
    />
})

export default App
