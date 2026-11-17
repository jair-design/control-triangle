import { useState, type ReactNode } from 'react'
import { RootStore } from './RootStore'
import { StoreContext } from './StoreContext'

export function StoreProvider({ children }: { children: ReactNode }) {
  // Se crea una sola vez por montaje de la app.
  const [rootStore] = useState(() => new RootStore())
  return <StoreContext value={rootStore}>{children}</StoreContext>
}
