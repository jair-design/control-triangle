import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { BOARD_TEXT, type BoardColumnConfig } from '../../constants'
import { useRootStore } from '../../stores/useRootStore'
import type { Task } from '../../types/board'
import { formatShortDate, getInitials } from '../../utils/format'

function CalendarIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="14" height="12" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" />
    </svg>
  )
}

interface TaskCardProps {
  task: Task
  styles: BoardColumnConfig['styles']
}

const TaskCard = observer(function TaskCard({ task, styles }: TaskCardProps) {
  const { board } = useRootStore()
  const dueDate = task.dueDate ? formatShortDate(task.dueDate) : null
  const articleRef = useRef<HTMLElement>(null)
  const isNew = board.lastAddedId === task.id

  // La tarjeta recién creada queda al final de la columna: se desplaza hasta mostrarla.
  useEffect(() => {
    if (isNew) articleRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [isNew])

  return (
    <li>
      <article
        ref={articleRef}
        className="relative overflow-hidden rounded-xl border border-line bg-surface py-3.5 pr-3.5 pl-5 shadow-card transition-shadow hover:shadow-md"
      >
        <span
          className={`absolute inset-y-0 left-0 w-1.5 ${styles.accent}`}
          aria-hidden="true"
        />

        <h3 className="text-sm font-semibold text-ink-950">{task.title}</h3>
        {task.description && (
          <p className="mt-1 line-clamp-3 text-sm text-muted">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            {task.assignee ? (
              <>
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[0.625rem] font-bold text-brand-400"
                  aria-hidden="true"
                >
                  {getInitials(task.assignee)}
                </span>
                <span className="truncate font-medium text-ink-800">
                  {task.assignee}
                </span>
              </>
            ) : (
              <span className="text-muted">{BOARD_TEXT.unassigned}</span>
            )}
          </div>

          {dueDate && (
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-canvas px-2 py-1 font-medium text-muted">
              <CalendarIcon />
              {dueDate}
            </span>
          )}
        </div>
      </article>
    </li>
  )
})

export default TaskCard
