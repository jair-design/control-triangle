import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { BOARD_TEXT, TASK_FORM_TEXT, type BoardColumnConfig } from '../../constants'
import type { Task } from '../../types/board'
import { TaskFormModal } from './TaskFormModal'
import TaskCard from './TaskCard'

function PlusIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

interface BoardColumnProps {
  column: BoardColumnConfig
  tasks: Task[]
  loading: boolean
  onEdit: (task: Task) => void
}

const BoardColumn = observer(function BoardColumn({
  column,
  tasks,
  loading,
  onEdit,
}: BoardColumnProps) {
  const headingId = `column-${column.status}`
  const [creating, setCreating] = useState(false)

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col rounded-2xl border border-t-4 border-line p-3 md:min-h-0 ${column.styles.panel}`}
    >
      <header className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${column.styles.accent}`}
            aria-hidden="true"
          />
          <h2 id={headingId} className="text-sm font-bold text-ink-900">
            {column.label}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold shadow-sm ${column.styles.badge}`}
            aria-label={BOARD_TEXT.cardCount(tasks.length)}
          >
            {tasks.length}
          </span>
          <button
            type="button"
            onClick={() => setCreating(true)}
            aria-label={TASK_FORM_TEXT.addTask(column.label)}
            title={TASK_FORM_TEXT.addTask(column.label)}
            className="grid size-7 place-items-center rounded-lg bg-surface text-ink-800 shadow-sm transition-colors hover:bg-ink-900 hover:text-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <PlusIcon />
          </button>
        </div>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
          {loading ? BOARD_TEXT.loadingColumn : BOARD_TEXT.emptyColumn}
        </p>
      ) : (
        <ul className="flex flex-1 flex-col gap-3 pr-1 md:min-h-0 md:overflow-y-auto">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} styles={column.styles} onEdit={onEdit} />
          ))}
        </ul>
      )}
      {creating && (
        <TaskFormModal column={column} onClose={() => setCreating(false)} />
      )}
    </section>
  )
})

export default BoardColumn
