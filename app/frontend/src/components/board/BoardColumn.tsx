import { observer } from 'mobx-react-lite'
import { BOARD_TEXT, type BoardColumnConfig } from '../../constants'
import type { Task } from '../../types/board'
import TaskCard from './TaskCard'

interface BoardColumnProps {
  column: BoardColumnConfig
  tasks: Task[]
}

const BoardColumn = observer(function BoardColumn({
  column,
  tasks,
}: BoardColumnProps) {
  const headingId = `column-${column.status}`

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
        <span
          className={`rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold shadow-sm ${column.styles.badge}`}
          aria-label={BOARD_TEXT.cardCount(tasks.length)}
        >
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
          {BOARD_TEXT.emptyColumn}
        </p>
      ) : (
        <ul className="flex flex-1 flex-col gap-3 pr-1 md:min-h-0 md:overflow-y-auto">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} styles={column.styles} />
          ))}
        </ul>
      )}
    </section>
  )
})

export default BoardColumn
