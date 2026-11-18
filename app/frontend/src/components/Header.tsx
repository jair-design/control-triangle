import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useRootStore } from '../stores/useRootStore'
import { Logo } from './Logo'

function UserAvatar({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  // Si la imagen no carga, no se muestra nada (sin avatar de relleno).
  if (failed) return null
  return (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-8 rounded-full object-cover ring-2 ring-brand-500"
    />
  )
}

const Header = observer(function Header() {
  const { session } = useRootStore()
  const user = session.user

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
          {user && (
            <div className="flex items-center gap-2">
              {user.avatarUrl && <UserAvatar url={user.avatarUrl} />}
              <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                <span className="truncate text-sm font-medium text-slate-100">
                  {user.name}
                </span>
                {user.email && user.email !== user.name && (
                  <span className="truncate text-xs text-slate-400">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          )}
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
})

export default Header
