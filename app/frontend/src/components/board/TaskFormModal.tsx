import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import {
  API_ERROR_TEXT,
  BOARD_COLUMNS,
  TASK_FORM_FIELDS,
  TASK_FORM_LIMITS,
  TASK_FORM_TEXT,
  type BoardColumnConfig,
} from '../../constants'
import { useRootStore } from '../../stores/useRootStore'
import type { Task, TaskStatus } from '../../types/board'
import {
  emptyTaskForm,
  taskToFormValues,
  toNewTaskInput,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormField,
  type TaskFormValues,
} from '../../utils/taskForm'
import { ConfirmDialog } from '../ConfirmDialog'
import { Modal } from '../Modal'

const INPUT_CLASS =
  'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink-950 placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600 disabled:bg-canvas disabled:text-muted'
const BUTTON_BASE =
  'rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60'

function CloseIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}

interface FieldProps {
  id: string
  label: string
  optional?: boolean
  error?: string
  children: (props: { id: string; className: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

function Field({ id, label, optional, error, children }: FieldProps) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink-900">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted">({TASK_FORM_TEXT.optional})</span>
        )}
      </label>
      {children({
        id,
        className: `${INPUT_CLASS} ${error ? 'border-red-500' : 'border-line'}`,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

interface TaskFormModalProps {
  // Crear: la columna donde se pulsó "+". Editar: la columna donde está la tarea ahora.
  column: BoardColumnConfig
  // Si viene, el modal edita esa tarea; si no, crea una nueva.
  task?: Task
  onClose: () => void
}

export function TaskFormModal({ column, task, onClose }: TaskFormModalProps) {
  const editing = task !== undefined
  const { board, toast } = useRootStore()
  const baseId = useId()
  const titleId = `${baseId}-heading`
  const fieldId = (field: TaskFormField) => `${baseId}-${field}`

  const [values, setValues] = useState<TaskFormValues>(() =>
    task ? taskToFormValues(task) : emptyTaskForm(column.status),
  )
  const [errors, setErrors] = useState<TaskFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Cualquier operación en curso (guardar o eliminar) bloquea el formulario.
  const busy = submitting || deleting
  // Evita un segundo envío aunque el estado de React aún no se haya actualizado.
  const submittingRef = useRef(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Corre después del efecto del Modal (que abre el diálogo): el foco empieza en el título.
  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  const update = (field: TaskFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const focusFirstInvalid = (found: TaskFormErrors) => {
    const first = TASK_FORM_FIELDS.find((field) => found[field])
    if (first) document.getElementById(fieldId(first))?.focus()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return

    const found = validateTaskForm(values)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const input = toNewTaskInput(values)
      if (task) {
        await board.updateTask(task.id, input)
        toast.show(TASK_FORM_TEXT.updated)
      } else {
        await board.createTask(input)
        toast.show(TASK_FORM_TEXT.created(column.label))
      }
      onClose()
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      const serverFields = (apiError?.fieldErrors ?? {}) as TaskFormErrors
      const known = TASK_FORM_FIELDS.filter((field) => serverFields[field])
      setErrors(Object.fromEntries(known.map((field) => [field, serverFields[field]])))
      setFormError(
        apiError?.message ?? (editing ? API_ERROR_TEXT.updateTask : API_ERROR_TEXT.createTask),
      )
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!task || submittingRef.current) return
    submittingRef.current = true
    setDeleting(true)
    setFormError(null)
    try {
      await board.deleteTask(task.id)
      toast.show(TASK_FORM_TEXT.deleted)
      onClose()
    } catch (error) {
      // Mismo manejo de errores que al guardar: mensaje general arriba del formulario.
      setFormError(error instanceof ApiError ? error.message : API_ERROR_TEXT.deleteTask)
      setConfirmingDelete(false)
      submittingRef.current = false
      setDeleting(false)
    }
  }

  return (
    <Modal labelledBy={titleId} busy={busy} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate aria-busy={busy}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink-950">
              {editing ? TASK_FORM_TEXT.editTitle : TASK_FORM_TEXT.title}
            </h2>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
              <span className={`size-2.5 rounded-full ${column.styles.accent}`} aria-hidden="true" />
              {editing
                ? TASK_FORM_TEXT.editSubtitle(column.label)
                : TASK_FORM_TEXT.subtitle(column.label)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={TASK_FORM_TEXT.close}
            className="-mr-2 rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CloseIcon />
          </button>
        </header>

        <fieldset disabled={busy} className="min-w-0 space-y-4 px-6 py-5">
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Field id={fieldId('title')} label={TASK_FORM_TEXT.labels.title} error={errors.title}>
            {(props) => (
              <input
                {...props}
                ref={titleInputRef}
                type="text"
                required
                maxLength={TASK_FORM_LIMITS.title}
                placeholder={TASK_FORM_TEXT.placeholders.title}
                value={values.title}
                onChange={(event) => update('title', event.target.value)}
              />
            )}
          </Field>

          <Field
            id={fieldId('description')}
            label={TASK_FORM_TEXT.labels.description}
            optional
            error={errors.description}
          >
            {(props) => (
              <textarea
                {...props}
                rows={3}
                maxLength={TASK_FORM_LIMITS.description}
                placeholder={TASK_FORM_TEXT.placeholders.description}
                value={values.description}
                onChange={(event) => update('description', event.target.value)}
              />
            )}
          </Field>

          {editing && (
            <Field id={fieldId('status')} label={TASK_FORM_TEXT.labels.status} error={errors.status}>
              {(props) => (
                <>
                  <select
                    {...props}
                    value={values.status}
                    onChange={(event) => update('status', event.target.value as TaskStatus)}
                  >
                    {BOARD_COLUMNS.map((option) => (
                      <option key={option.status} value={option.status}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {task && values.status !== task.status && (
                    <p className="mt-1 text-sm text-muted">
                      {TASK_FORM_TEXT.moveHint(
                        BOARD_COLUMNS.find((c) => c.status === values.status)?.label ?? '',
                      )}
                    </p>
                  )}
                </>
              )}
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={fieldId('assignee')}
              label={TASK_FORM_TEXT.labels.assignee}
              optional
              error={errors.assignee}
            >
              {(props) => (
                <input
                  {...props}
                  type="text"
                  maxLength={TASK_FORM_LIMITS.assignee}
                  placeholder={TASK_FORM_TEXT.placeholders.assignee}
                  value={values.assignee}
                  onChange={(event) => update('assignee', event.target.value)}
                />
              )}
            </Field>

            <Field
              id={fieldId('dueDate')}
              label={TASK_FORM_TEXT.labels.dueDate}
              optional
              error={errors.dueDate}
            >
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={values.dueDate}
                  onChange={(event) => update('dueDate', event.target.value)}
                />
              )}
            </Field>
          </div>
        </fieldset>

        <footer className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          {editing && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              className={`${BUTTON_BASE} border border-red-300 text-red-700 hover:bg-red-50 focus-visible:outline-red-600`}
            >
              {TASK_FORM_TEXT.delete}
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={`${BUTTON_BASE} border border-line text-ink-800 hover:bg-canvas`}
            >
              {TASK_FORM_TEXT.cancel}
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`${BUTTON_BASE} bg-brand-500 text-ink-950 hover:bg-brand-400`}
            >
              {submitting
                ? editing
                  ? TASK_FORM_TEXT.saving
                  : TASK_FORM_TEXT.submitting
                : editing
                  ? TASK_FORM_TEXT.save
                  : TASK_FORM_TEXT.submit}
            </button>
          </div>
        </footer>
      </form>

      {confirmingDelete && task && (
        <ConfirmDialog
          title={TASK_FORM_TEXT.deleteConfirmTitle}
          message={TASK_FORM_TEXT.deleteConfirmMessage(task.title)}
          confirmLabel={TASK_FORM_TEXT.delete}
          busyLabel={TASK_FORM_TEXT.deleting}
          cancelLabel={TASK_FORM_TEXT.cancel}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  )
}
