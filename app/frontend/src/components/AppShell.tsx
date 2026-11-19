import type { ReactNode } from 'react'
import Header from './Header'

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto p-6 md:overflow-hidden">{children}</main>
    </div>
  )
}
