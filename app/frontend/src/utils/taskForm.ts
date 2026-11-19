import {
  TASK_FORM_ERRORS,
  TASK_FORM_LIMITS,
  TASK_FORM_TEXT,
} from '../constants'
import type { NewTaskInput, TaskStatus } from '../types/board'

export interface TaskFormValues {
  title: string
  description: string
  assignee: string
  dueDate: string
}

export type TaskFormField = keyof TaskFormValues
export type TaskFormErrors = Partial<Record<TaskFormField, string>>

export const EMPTY_TASK_FORM: TaskFormValues = {
  title: '',
  description: '',
  assignee: '',
  dueDate: '',
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function isRealDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/** Reglas del formulario: solo el título es obligatorio; el resto es opcional. */
export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {}
  const title = values.title.trim()

  if (title === '') {
    errors.title = TASK_FORM_ERRORS.titleRequired
  } else if (title.length > TASK_FORM_LIMITS.title) {
    errors.title = TASK_FORM_ERRORS.tooLong(TASK_FORM_TEXT.labels.title, TASK_FORM_LIMITS.title)
  }

  if (values.description.trim().length > TASK_FORM_LIMITS.description) {
    errors.description = TASK_FORM_ERRORS.tooLong(
      TASK_FORM_TEXT.labels.description,
      TASK_FORM_LIMITS.description,
    )
  }

  if (values.assignee.trim().length > TASK_FORM_LIMITS.assignee) {
    errors.assignee = TASK_FORM_ERRORS.tooLong(
      TASK_FORM_TEXT.labels.assignee,
      TASK_FORM_LIMITS.assignee,
    )
  }

  if (values.dueDate !== '' && !isRealDate(values.dueDate)) {
    errors.dueDate = TASK_FORM_ERRORS.dueDateInvalid
  }

  return errors
}

/** Convierte lo capturado en lo que espera la API: sin espacios sobrantes y opcionales vacíos = null. */
export function toNewTaskInput(values: TaskFormValues, status: TaskStatus): NewTaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    assignee: values.assignee.trim() || null,
    dueDate: values.dueDate || null,
    status,
  }
}
