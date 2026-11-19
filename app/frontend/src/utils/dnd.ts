import { arrayMove } from '@dnd-kit/sortable'
import { BOARD_COLUMNS } from '../constants'
import type { TaskStatus } from '../types/board'

/** Ids de las tarjetas de cada columna, en orden. */
export type ColumnItems = Record<TaskStatus, string[]>

export interface DropResult {
  items: ColumnItems
  status: TaskStatus
  // Lugar de la tarjeta en su columna de destino: 0 = al inicio.
  index: number
}

/** Columna a la que pertenece un id. El id puede ser el de una tarjeta o el de una columna. */
export function findColumn(items: ColumnItems, id: string): TaskStatus | null {
  const found = BOARD_COLUMNS.find(
    ({ status }) => status === id || items[status].includes(id),
  )
  return found ? found.status : null
}

/**
 * Mientras se arrastra, pasa la tarjeta a la columna sobre la que está (vista previa).
 * Si "over" es otra tarjeta, se coloca antes o después según el lado por el que se pasa;
 * si es la propia columna (p. ej. vacía), va al final.
 */
export function moveAcross(
  items: ColumnItems,
  activeId: string,
  overId: string,
  isBelowOver: boolean,
): ColumnItems {
  const from = findColumn(items, activeId)
  const to = findColumn(items, overId)
  if (!from || !to || from === to) return items

  const target = items[to]
  const index =
    overId === to ? target.length : target.indexOf(overId) + (isBelowOver ? 1 : 0)

  return {
    ...items,
    [from]: items[from].filter((id) => id !== activeId),
    [to]: [...target.slice(0, index), activeId, ...target.slice(index)],
  }
}

/** Al soltar: orden final de las columnas y dónde quedó la tarjeta. null = se cancela. */
export function settleDrop(
  items: ColumnItems,
  activeId: string,
  overId: string | null,
): DropResult | null {
  const column = findColumn(items, activeId)
  const overColumn = overId ? findColumn(items, overId) : null
  if (!column || !overId || !overColumn) return null

  if (overColumn !== column) {
    const next = moveAcross(items, activeId, overId, false)
    return { items: next, status: overColumn, index: next[overColumn].indexOf(activeId) }
  }

  const from = items[column].indexOf(activeId)
  const to = overId === column ? items[column].length - 1 : items[column].indexOf(overId)
  const next =
    from === to ? items : { ...items, [column]: arrayMove(items[column], from, to) }
  return { items: next, status: column, index: next[column].indexOf(activeId) }
}
