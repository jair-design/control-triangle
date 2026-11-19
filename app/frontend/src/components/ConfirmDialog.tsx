import { useId } from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  busyLabel: string
  cancelLabel: string
  // Mientras es true se bloquean los botones y no se puede cerrar (Esc, clic fuera).
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

const BUTTON_BASE =
  'rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

/** Diálogo de confirmación para acciones destructivas. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const headingId = useId()

  return (
    <Modal labelledBy={headingId} busy={busy} onClose={onCancel}>
      <div className="px-6 py-5">
        <h2 id={headingId} className="text-lg font-bold text-ink-950">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
      </div>
      <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={`${BUTTON_BASE} border border-line text-ink-800 hover:bg-canvas focus-visible:outline-brand-600`}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`${BUTTON_BASE} bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600`}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
