import { configure } from 'mobx'

// Los cambios de estado solo pueden hacerse dentro de acciones.
configure({ enforceActions: 'always' })

export class RootStore {
  // Aquí se añadirán los stores: sessionStore (Slice 02), boardStore (Slice 03).
}
