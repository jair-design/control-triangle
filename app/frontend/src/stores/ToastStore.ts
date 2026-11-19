import { makeAutoObservable } from 'mobx'
import { TOAST_DURATION_MS } from '../constants'

/** Confirmación breve que se cierra sola. */
export class ToastStore {
  message: string | null = null
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    makeAutoObservable<ToastStore, 'timer'>(this, { timer: false })
  }

  show(message: string) {
    this.clearTimer()
    this.message = message
    this.timer = setTimeout(() => this.hide(), TOAST_DURATION_MS)
  }

  hide() {
    this.clearTimer()
    this.message = null
  }

  private clearTimer() {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }
}
