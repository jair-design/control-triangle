import { useEffect, useState } from 'react'
import { RESTORING_NOTICE_DELAY_MS } from '../constants'
import { LoginScreen } from './LoginScreen'

/**
 * Pantalla mientras se valida la sesión guardada. Al principio es solo el fondo
 * (sin parpadeos); el aviso aparece únicamente si la validación tarda.
 */
export function RestoringScreen({ message }: { message: string }) {
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowNotice(true), RESTORING_NOTICE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!showNotice) {
    return <div className="min-h-screen bg-canvas" aria-busy="true" />
  }
  return <LoginScreen error={null} busyMessage={message} />
}
