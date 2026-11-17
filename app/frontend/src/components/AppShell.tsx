import type { ReactNode } from 'react'
import { Header } from './Header'

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
