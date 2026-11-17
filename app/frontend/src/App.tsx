import { AppShell } from './components/AppShell'

function App() {
  return (
    <AppShell>
      <div className="grid h-full min-h-96 place-items-center rounded-xl border border-dashed border-line bg-surface text-center">
        <div>
          <p className="text-base font-medium text-muted">Área de contenido</p>
          <p className="text-sm text-muted/80">Aquí irá el tablero</p>
        </div>
      </div>
    </AppShell>
  )
}

export default App
