import { configure } from 'mobx'
import { BoardStore } from './BoardStore'
import { SessionStore } from './SessionStore'
import { ToastStore } from './ToastStore'

// Los cambios de estado solo pueden hacerse dentro de acciones.
configure({ enforceActions: 'always' })

export class RootStore {
  session = new SessionStore()
  board = new BoardStore(this.session)
  toast = new ToastStore()
}
