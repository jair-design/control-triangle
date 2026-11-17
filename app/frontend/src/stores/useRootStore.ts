import { use } from 'react'
import { StoreContext } from './StoreContext'

export function useRootStore() {
  const store = use(StoreContext)
  if (!store) {
    throw new Error('useRootStore debe usarse dentro de <StoreProvider>')
  }
  return store
}
