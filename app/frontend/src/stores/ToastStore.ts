import { makeAutoObservable } from 'mobx'
import { TOAST_DURATION_MS } from '../constants'

export type ToastKind = 'success' | 'error'

/** Aviso breve que se cierra solo. */
export class ToastStore {
  message: string | null = null
  kind: ToastKind = 'success'
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    makeAutoObservable<ToastStore, 'timer'>(this, { timer: false })
  }

  show(message: string, kind: ToastKind = 'success') {
    this.clearTimer()
    this.message = message
    this.kind = kind
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
