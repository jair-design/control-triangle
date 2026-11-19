import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  // Id del elemento que titula el diálogo (para lectores de pantalla).
  labelledBy: string
  // Mientras está ocupado no se puede cerrar (Esc, clic fuera) para evitar acciones a medias.
  busy: boolean
  onClose: () => void
  children: ReactNode
}

/** Diálogo modal con el elemento nativo <dialog>: bloquea el resto de la página, atrapa el foco y cierra con Esc. */
export function Modal({ labelledBy, busy, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      // Esc: el navegador lo cierra por su cuenta; se controla para respetar el estado ocupado.
      // stopPropagation: React hace "subir" este evento por sus componentes padres, y un diálogo
      // anidado (p. ej. la confirmación dentro del formulario) cerraría también al de fuera.
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!busy) onClose()
      }}
      // Clic en el fondo oscuro (el propio <dialog>, no su contenido).
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink-950 shadow-xl backdrop:bg-ink-950/50"
    >
      {children}
    </dialog>
  )
}
