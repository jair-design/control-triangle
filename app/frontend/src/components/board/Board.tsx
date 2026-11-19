import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { BOARD_COLUMNS, BOARD_TEXT } from '../../constants'
import { useRootStore } from '../../stores/useRootStore'
import BoardColumn from './BoardColumn'

const Board = observer(function Board() {
  const { board } = useRootStore()

  // Carga el tablero al mostrarse y lo vacía al desmontarse (cierre de sesión).
  useEffect(() => {
    void board.loadTasks()
    return () => board.reset()
  }, [board])

  const loading = board.loadState === 'idle' || board.loadState === 'loading'

  return (
    <div className="flex flex-col gap-4 md:h-full">
      {board.loadError && (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{board.loadError}</span>
          <button
            type="button"
            onClick={() => void board.loadTasks()}
            className="rounded-lg border border-red-300 px-3 py-1 font-semibold text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            {BOARD_TEXT.retry}
          </button>
        </div>
      )}

      <div
        role="region"
        aria-label={BOARD_TEXT.boardLabel}
        aria-busy={loading}
        className="grid grid-cols-1 gap-4 md:min-h-0 md:flex-1 md:grid-cols-3"
      >
        {BOARD_COLUMNS.map((column) => (
          <BoardColumn
            key={column.status}
            column={column}
            tasks={board.tasksByStatus[column.status]}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
})

export default Board
