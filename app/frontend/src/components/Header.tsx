import { Logo } from './Logo'

export function Header() {
  return (
    <header className="border-b-[3px] border-brand-500 bg-ink-900 px-6 py-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xl font-bold tracking-tight">
            Webi <span className="text-brand-400">Todo</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-full bg-brand-500 text-xs font-bold text-ink-950"
              aria-hidden="true"
            >
              AP
            </span>
            <span className="hidden text-sm text-slate-200 sm:inline">
              Ana Pérez
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}
