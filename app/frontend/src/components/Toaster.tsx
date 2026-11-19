import { observer } from 'mobx-react-lite'
import { useRootStore } from '../stores/useRootStore'

function CheckIcon() {
  return (
    <svg
      className="size-5 shrink-0 text-brand-400"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8" />
      <path d="M6.5 10.5l2.5 2.5 4.5-5" />
    </svg>
  )
}

/** Confirmación breve. El contenedor siempre existe para que los lectores de pantalla anuncien el mensaje. */
const Toaster = observer(function Toaster() {
  const { toast } = useRootStore()

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {toast.message && (
        <p className="flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckIcon />
          {toast.message}
        </p>
      )}
    </div>
  )
})

export default Toaster
