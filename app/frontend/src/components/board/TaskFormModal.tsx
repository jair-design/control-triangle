import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import {
  API_ERROR_TEXT,
  TASK_FORM_FIELDS,
  TASK_FORM_LIMITS,
  TASK_FORM_TEXT,
  type BoardColumnConfig,
} from '../../constants'
import { useRootStore } from '../../stores/useRootStore'
import {
  EMPTY_TASK_FORM,
  toNewTaskInput,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormField,
  type TaskFormValues,
} from '../../utils/taskForm'
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
  column: BoardColumnConfig
  onClose: () => void
}

export function TaskFormModal({ column, onClose }: TaskFormModalProps) {
  const { board, toast } = useRootStore()
  const baseId = useId()
  const titleId = `${baseId}-heading`
  const fieldId = (field: TaskFormField) => `${baseId}-${field}`

  const [values, setValues] = useState<TaskFormValues>(EMPTY_TASK_FORM)
  const [errors, setErrors] = useState<TaskFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
      await board.createTask(toNewTaskInput(values, column.status))
      toast.show(TASK_FORM_TEXT.created(column.label))
      onClose()
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      const serverFields = (apiError?.fieldErrors ?? {}) as TaskFormErrors
      const known = TASK_FORM_FIELDS.filter((field) => serverFields[field])
      setErrors(Object.fromEntries(known.map((field) => [field, serverFields[field]])))
      setFormError(apiError?.message ?? API_ERROR_TEXT.createTask)
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal labelledBy={titleId} busy={submitting} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-ink-950">
              {TASK_FORM_TEXT.title}
            </h2>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
              <span className={`size-2.5 rounded-full ${column.styles.accent}`} aria-hidden="true" />
              {TASK_FORM_TEXT.subtitle(column.label)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={TASK_FORM_TEXT.close}
            className="-mr-2 rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CloseIcon />
          </button>
        </header>

        <fieldset disabled={submitting} className="min-w-0 space-y-4 px-6 py-5">
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

        <footer className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`${BUTTON_BASE} border border-line text-ink-800 hover:bg-canvas`}
          >
            {TASK_FORM_TEXT.cancel}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`${BUTTON_BASE} bg-brand-500 text-ink-950 hover:bg-brand-400`}
          >
            {submitting ? TASK_FORM_TEXT.submitting : TASK_FORM_TEXT.submit}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
