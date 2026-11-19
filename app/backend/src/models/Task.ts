import { model, Schema, type InferSchemaType } from 'mongoose'
import {
  DEFAULT_TASK_STATUS,
  TASK_ASSIGNEE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_MIN_POSITION,
  TASK_MODEL_NAME,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from '../constants/index.js'
import { isValidIsoDate } from '../utils/date.js'

// Refleja el tipo Task del frontend (src/types/board.ts).
const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: [1, 'El título no puede estar vacío'],
      maxlength: [
        TASK_TITLE_MAX_LENGTH,
        `El título no puede superar los ${TASK_TITLE_MAX_LENGTH} caracteres`,
      ],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [
        TASK_DESCRIPTION_MAX_LENGTH,
        `La descripción no puede superar los ${TASK_DESCRIPTION_MAX_LENGTH} caracteres`,
      ],
    },
    // Fecha de vencimiento AAAA-MM-DD, opcional. Se guarda como texto para que no cambie
    // de día por la zona horaria (el frontend la maneja igual).
    dueDate: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) => value === null || isValidIsoDate(value),
        message: 'La fecha de vencimiento debe tener el formato AAAA-MM-DD y ser válida',
      },
    },
    // Persona asignada: texto abierto, la solución aún no define usuarios.
    assignee: {
      type: String,
      default: null,
      trim: true,
      maxlength: [
        TASK_ASSIGNEE_MAX_LENGTH,
        `La persona asignada no puede superar los ${TASK_ASSIGNEE_MAX_LENGTH} caracteres`,
      ],
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      required: true,
      default: DEFAULT_TASK_STATUS,
    },
    // Orden dentro de la columna (menor = más arriba). Hoy se asigna "al final" al crear;
    // el reordenamiento por arrastre (Slice 04) solo cambia este valor.
    position: {
      type: Number,
      required: [true, 'La posición es obligatoria'],
      min: [TASK_MIN_POSITION, 'La posición no puede ser negativa'],
      validate: {
        validator: Number.isInteger,
        message: 'La posición debe ser un número entero',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      // La API expone "id" (como el frontend) y oculta "_id".
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        return ret
      },
    },
  },
)

// Consulta principal del tablero (las tareas de una columna, ordenadas) y garantía de que
// no haya dos tarjetas con la misma posición en una columna, aunque se creen a la vez.
taskSchema.index({ status: 1, position: 1 }, { unique: true })

export type TaskDocument = InferSchemaType<typeof taskSchema>
export const Task = model(TASK_MODEL_NAME, taskSchema)
