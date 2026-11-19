import { observer } from 'mobx-react-lite'
import { BOARD_COLUMNS, BOARD_TEXT } from '../../constants'
import { useRootStore } from '../../stores/useRootStore'
import BoardColumn from './BoardColumn'

const Board = observer(function Board() {
  const { board } = useRootStore()

  return (
    <div
      role="region"
      aria-label={BOARD_TEXT.boardLabel}
      className="grid grid-cols-1 gap-4 md:h-full md:grid-cols-3"
    >
      {BOARD_COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          column={column}
          tasks={board.tasksByStatus[column.status]}
        />
      ))}
    </div>
  )
})

export default Board
