import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { exchangeCode } from './auth/cognito'
import { CALLBACK_PATH } from './auth/config'
import { AppShell } from './components/AppShell'
import { LoginScreen } from './components/LoginScreen'
import { useRootStore } from './stores/useRootStore'

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

  useEffect(() => {
    session.start()
    return () => session.stop()
  }, [session])

  if (session.restoring) {
    return <LoginScreen error={null} exchanging />
  }

  if (session.isAuthenticated) {
    return (
      <AppShell>
        <div className="grid h-full min-h-96 place-items-center rounded-xl border border-dashed border-line bg-surface text-center">
          <div>
            <p className="text-base font-medium text-muted">Área de contenido</p>
            <p className="text-sm text-muted/80">Aquí irá el tablero</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return <LoginScreen
      error={error ?? (session.sessionExpired ? SESSION_EXPIRED_MESSAGE : null)}
      exchanging={exchanging}
    />
})

export default App
