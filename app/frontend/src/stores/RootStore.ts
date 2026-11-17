import { configure } from 'mobx'
import { SessionStore } from './SessionStore'

// Los cambios de estado solo pueden hacerse dentro de acciones.
configure({ enforceActions: 'always' })

export class RootStore {
  session = new SessionStore()
  // Se añadirá: boardStore (Slice 03).
}
