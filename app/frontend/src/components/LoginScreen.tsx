import { useState } from 'react'
import { buildLoginUrl } from '../auth/cognito'
import { Logo } from './Logo'

interface LoginScreenProps {
  error: string | null
  // Si hay mensaje, se muestra en lugar del botón (p. ej. "Iniciando sesión…").
  busyMessage: string | null
}

export function LoginScreen({ error, busyMessage }: LoginScreenProps) {
  const [redirecting, setRedirecting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleLogin() {
    setLocalError(null)
    setRedirecting(true)
    try {
      window.location.assign(await buildLoginUrl())
    } catch {
      setRedirecting(false)
      setLocalError('No se pudo iniciar el proceso de autenticación.')
    }
  }

  const message = localError ?? error

  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <Logo className="mx-auto size-16" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Webi <span className="text-brand-600">Todo</span>
        </h1>

        {busyMessage ? (
          <p className="mt-8 text-base font-medium text-muted" role="status">
            {busyMessage}
          </p>
        ) : (
          <>
            <p className="mt-8 text-lg font-semibold">No estás autenticado</p>
            <p className="mt-1 text-sm text-muted">
              Haz clic aquí para iniciar sesión
            </p>

            {message && (
              <p
                className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={redirecting}
              className="mt-6 w-full rounded-lg bg-brand-500 px-4 py-2.5 font-bold text-ink-950 transition-colors hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
            >
              {redirecting ? 'Redirigiendo…' : 'Iniciar sesión'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
