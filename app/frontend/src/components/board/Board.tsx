import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  API_ERROR_TEXT,
  BOARD_COLUMNS,
  BOARD_TEXT,
  DND_TEXT,
  DRAG_MOUSE_DISTANCE_PX,
  DROP_ANIMATION_MS,
  DRAG_TOUCH_DELAY_MS,
  DRAG_TOUCH_TOLERANCE_PX,
} from '../../constants'
import { useRootStore } from '../../stores/useRootStore'
import type { Task, TaskStatus } from '../../types/board'
import { findColumn, moveAcross, settleDrop, type ColumnItems } from '../../utils/dnd'
import BoardColumn from './BoardColumn'
import { TaskCardView } from './TaskCard'
import { TaskFormModal } from './TaskFormModal'

const Board = observer(function Board() {
  const { board, toast } = useRootStore()
  // La tarea que se está editando. El modal vive aquí y no en la tarjeta, porque al guardar
  // la tarjeta puede cambiar de columna (y desmontarse) mientras el modal termina de cerrarse.
  const [editing, setEditing] = useState<Task | null>(null)
  const editingColumn = editing && BOARD_COLUMNS.find((c) => c.status === editing.status)

  // Orden de las columnas MIENTRAS se arrastra (vista previa). null cuando no se arrastra.
  const [dragItems, setDragItems] = useState<ColumnItems | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  // Dónde estaba la tarjeta al levantarla: si la sueltas ahí mismo, no se envía nada.
  const origin = useRef<{ status: TaskStatus; index: number } | null>(null)

  // Carga el tablero al mostrarse y lo vacía al desmontarse (cierre de sesión).
  useEffect(() => {
    void board.loadTasks()
    return () => board.reset()
  }, [board])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: DRAG_MOUSE_DISTANCE_PX } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: DRAG_TOUCH_DELAY_MS, tolerance: DRAG_TOUCH_TOLERANCE_PX },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loading = board.loadState === 'idle' || board.loadState === 'loading'
  const tasksById = useMemo(() => new Map(board.tasks.map((t) => [t.id, t])), [board.tasks])
  const columnLabel = (status: TaskStatus | null) =>
    BOARD_COLUMNS.find((c) => c.status === status)?.label ?? ''

  const tasksOf = (status: TaskStatus): Task[] =>
    dragItems
      ? dragItems[status].flatMap((id) => tasksById.get(id) ?? [])
      : board.tasksByStatus[status]

  const activeTask = activeId ? (tasksById.get(activeId) ?? null) : null
  const activeColumn = activeId && dragItems ? findColumn(dragItems, activeId) : null
  const activeStyles = BOARD_COLUMNS.find((c) => c.status === activeColumn)?.styles

  function handleDragStart({ active }: DragStartEvent) {
    const items = Object.fromEntries(
      BOARD_COLUMNS.map(({ status }) => [status, board.tasksByStatus[status].map((t) => t.id)]),
    ) as ColumnItems
    const id = String(active.id)
    const status = findColumn(items, id)
    origin.current = status ? { status, index: items[status].indexOf(id) } : null
    setActiveId(id)
    setDragItems(items)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const translated = active.rect.current.translated
    // ¿El centro de la tarjeta pasó de la mitad de la tarjeta sobre la que está?
    const isBelow = translated
      ? translated.top + translated.height / 2 > over.rect.top + over.rect.height / 2
      : false
    setDragItems((current) =>
      current ? moveAcross(current, String(active.id), String(over.id), isBelow) : current,
    )
  }

  function finishDrag() {
    setActiveId(null)
    setDragItems(null)
    origin.current = null
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id)
    const result = dragItems ? settleDrop(dragItems, id, over ? String(over.id) : null) : null
    const from = origin.current
    finishDrag()
    if (!result) return
    if (from && from.status === result.status && from.index === result.index) return

    // moveTask actualiza el tablero al instante (antes de que se quite la vista previa)
    // y lo guarda en el backend; si falla, restaura el tablero y avisa.
    board.moveTask(id, result.status, result.index).catch((error: unknown) => {
      toast.show(error instanceof ApiError ? error.message : API_ERROR_TEXT.moveTask, 'error')
    })
  }

  const titleOf = (id: string | number) => tasksById.get(String(id))?.title ?? ''
  const positionOf = (id: string | number) =>
    dragItems ? (dragItems[findColumn(dragItems, String(id)) ?? 'todo'].indexOf(String(id)) + 1) : 0
  const columnOf = (id: string | number) =>
    columnLabel(dragItems ? findColumn(dragItems, String(id)) : null)

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        // Las columnas se redimensionan al entrar y salir tarjetas: se vuelven a medir siempre.
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={finishDrag}
        accessibility={{
          screenReaderInstructions: { draggable: DND_TEXT.instructions },
          announcements: {
            onDragStart: ({ active }) => DND_TEXT.picked(titleOf(active.id)),
            onDragOver: ({ active }) =>
              DND_TEXT.over(titleOf(active.id), columnOf(active.id), positionOf(active.id)),
            onDragEnd: ({ active }) =>
              DND_TEXT.dropped(titleOf(active.id), columnOf(active.id), positionOf(active.id)),
            onDragCancel: ({ active }) => DND_TEXT.cancelled(titleOf(active.id)),
          },
        }}
      >
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
              tasks={tasksOf(column.status)}
              loading={loading}
              highlighted={activeColumn === column.status}
              onEdit={setEditing}
            />
          ))}
        </div>

        {/* La copia que acompaña al puntero. La tarjeta original queda como hueco punteado. */}
        <DragOverlay dropAnimation={{ duration: DROP_ANIMATION_MS }}>
          {activeTask && activeStyles ? (
            <TaskCardView task={activeTask} styles={activeStyles} floating />
          ) : null}
        </DragOverlay>
      </DndContext>

      {editing && editingColumn && (
        <TaskFormModal
          key={editing.id}
          column={editingColumn}
          task={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
})

export default Board
